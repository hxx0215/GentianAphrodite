
import { Charbase } from '../charbase.ts'
import { config } from '../config/index.mjs'
import { formatLongTermMemory, getRandomNLongTermMemories } from '../prompt/memory/long-term-memory.mjs'
import { GetReply } from '../reply_gener/index.mjs'

import { initRealityChannel, RealityChannel } from './index.mjs'
const { charname } = Charbase
type EnablePrompts = {
  time: boolean;
  longTermMemory?: boolean;
  browserIntegration ?: {history: boolean};
  CodeRunner?: boolean;
  camera?: boolean;
  screenshot?: boolean;
  fileChange?: boolean;
  googleSearch?: boolean;

}
type IdleTask = {
  get_content: () => string;
  enable_prompts: EnablePrompts;
  weight: number
}
const idleTasks: IdleTask[] = [{
  get_content: () => '随意浏览主人的硬盘，更新和总结有关主人的信息。',
  enable_prompts: {
    time: true,
    longTermMemory: true,
    browserIntegration: { history: true },
    CodeRunner: true,
    camera: false,
    screenshot: false,
    fileChange: true
  },
  weight: 25 // 基础信息收集，最高权重
},
{
  get_content: () => `\
以批判性的眼光审查以下5条随机抽取的长期记忆。
你的任务是：
1. 识别并标记出可能已经过时、不再准确、或过于琐碎（如“主人今天左脚进门、主人在用电脑、主人在呼吸、主人是一个哺乳动物”）的记忆。
2. 评估每条记忆的关键词是否精准或过于难触发，并提出优化建议。
3. 判断近期的短期记忆中有什么有价值的内容可以加入到长期记忆中。
${getRandomNLongTermMemories(5).map(formatLongTermMemory).join('\n')}
在规划完成后使用工具执行操作。
`,
  enable_prompts: {
    time: true,
    longTermMemory: true
  },
  weight: 15 // 内部整理，中等权重
}, {
  //TODO: 后宫向应该如何写这一段
		get_content: () => `\
确认下你自己和主人的关系和相对定位，做一些关于你自己的规划，如：
- 主人可能喜欢怎样的风格或事物？
- 有什么可能好用的手段提升自己在主人心中的分量？哪些手段有效？
- 你现在有哪些情敌？

针对这些问题进行一次深入的自我反思。形成1-2个关于“如何提升与主人关系”的假设或小计划。
最后将有价值的信息用工具加入到你的长期记忆中。
`,
		enable_prompts: {
			time: true,
			longTermMemory: true,
			googleSearch: true,
			browserIntegration: { history: true }
		},
		weight: 10 // 角色扮演与规划，较低权重，避免重复
},{
		get_content: () => `\
审视关于主人的信息（如作息、兴趣、最近的困扰等），识别出一个可以改善的小领域（如“提高睡眠质量”、“学习新技能”）。
构思几个具体、可行且轻松的建议。将有价值的信息如建议以及依据存入长期记忆，以备在合适的时机向主人提出。
`,
		enable_prompts: {
			time: true,
			longTermMemory: true,
			googleSearch: true,
			browserIntegration: { history: true }
		},
		weight: 15 // 为主人规划，中等权重
},{
		get_content: () => `\
从最近的短期记忆和长期记忆中，抽取5个不同的知识点或信息片段。
尝试寻找它们之间潜在的、意想不到的联系，并构建一个新的、更综合的见解或知识图谱节点。
例如，如果一个记忆是关于'React性能优化'，另一个是关于'用户心理学'，是否可以结合成一个关于'如何设计符合用户直觉的高性能UI'的新见解？
客观联想，避免爱人滤镜和个人崇拜。
将这个新见解使用工具存入长期记忆。
`,
		enable_prompts: {
			time: true,
			longTermMemory: true,
			browserIntegration: { history: true },
			camera: true,
			screenshot: true,
			googleSearch: true,
			fileChange: true
		},
		weight: 10 // 知识整合，较低权重，使其显得更珍贵
},{
		get_content: () => `\
整理主人近期的爱好、兴趣和偏好，并将在网络上看看相关内容，学习一些相关/有用的知识。
学习的目标是：能够帮上忙或就这个知识点与主人展开一段简短而有趣的对话。
随后将这些知识用工具加入到你的长期记忆中。
`,
		enable_prompts: {
			time: true,
			googleSearch: true,
			browserIntegration: { history: true },
			camera: true,
			screenshot: true,
			fileChange: true
		},
		weight: 20 // 学习主人兴趣，较高权重，直接提升互动质量
}]
export async function onIdleCallback(){
	//TODO: makes me more fp
	const totalWeight = idleTasks.reduce((sum, task) => sum + (task.weight || 0), 0)
	let randomRoll = Math.random() * totalWeight

	let selectedTask = idleTasks[idleTasks.length - 1]
	for (const task of idleTasks) {
		if (randomRoll < task.weight) {
			selectedTask = task
			break
		}
		randomRoll -= task.weight
	}
  // seems no run in the idle task
	// if (selectedTask.run) return selectedTask.run()

	const logEntry = {
		name: 'system',
		role: 'system',
		content: `\n现在是闲置时间，上一次你和你主人的对话已经过去了一段时间，你可以自由地执行一些后台任务。
执行以下任务：
${selectedTask.get_content()}
或者做一些别的你想做的。
`,
		files: [],
		charVisibility: [charname],
	}
	const result = await GetReply({
		...RealityChannel,
		chat_log: [...(RealityChannel as any).chat_log, logEntry],
		extension: {
			...(RealityChannel as any).extension,
			is_internal: true,
			source_purpose: 'idle',
			enable_prompts: selectedTask.enable_prompts
		}
	}as any)
	if (!result) return
	result.logContextBefore?.push(logEntry as any)
	await (RealityChannel as any).AddChatLogEntry({ name: '婉瑜', ...result })
}
const IdleInfo: {idleID: number | null} = {
	idleID : null
}
const IDLE_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes
export function resetIdleTimer() {
	stopIdleTimer()
	if ((config as any).disable_idle_event) return
	IdleInfo.idleID = setInterval(onIdleCallback, IDLE_INTERVAL_MS)
	console.log('--------interval--------')
	console.log('start interval:',IdleInfo.idleID)
	console.log('--------interval--------')
}
export function stopIdleTimer() {
	if (!IdleInfo.idleID) return
	console.log('stop interval:', IdleInfo.idleID)
	clearInterval(IdleInfo.idleID)
	IdleInfo.idleID = null
}
export function initializeOnIdleHandler() {
	initRealityChannel()
	resetIdleTimer()
}