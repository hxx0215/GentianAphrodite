import { localhostLocales } from '../../../../../../src/scripts/i18n.mjs'
import { notify } from '../../../../../../src/scripts/notify.mjs'
import { config } from '../config/index.ts'
import { discordPlatformAPI } from '../interfaces/discord/index.mjs'
import { telegramPlatformAPI } from '../interfaces/telegram/index.mjs'
import { Charbase, GentianAphrodite } from '../charbase.ts'
import type { World, Plugin, AIReply, ChatLog, Channel } from "../types/basic.ts"
const {charname} = Charbase

/**
 * Fount 世界观对象，定义了 AI 角色在“真实世界”中的行为准则和能力。
 * @type {import('../../../../../../src/decl/WorldAPI.ts').WorldAPI_t}
 */
const realityWorld: World = {
	info: {
		'zh-CN': {
			name: '真实世界',
			description: '用于给角色关于真实世界风格的输出指引',
		},
		'en-US': {
			name: 'Reality World',
			description: 'Guide for reality style output for characters',
		},
	},
	interfaces: {
		chat: {
			GetPrompt: _args => {
				return {
					text: [
						{
							content: `\
你输出的文字不会被你主人看见，但你可以使用<notify>通知你主人。
但你不一定非要通知他，如果他正在做其他的事情，弹出通知可能会败坏他的兴致。
`,
							important: 0
						}
					]
				}
			}
		}
	}
}

/**
 * 通过多种渠道发送现实频道通知的函数，按配置的优先级顺序尝试发送通知。
 * @param {string} message - 要发送的通知内容。
 */
async function sendRealityNotification(message: string) {
	for (const method of config.reality_channel_notification_fallback_order) try {
		switch (method) {
			case 'discord':
				if (discordPlatformAPI?.sendDirectMessageToOwner) {
					await discordPlatformAPI.sendDirectMessageToOwner(message)
					return // Stop after success
				}
				break
			case 'telegram':
				if (telegramPlatformAPI?.sendDirectMessageToOwner) {
					await telegramPlatformAPI.sendDirectMessageToOwner(message)
					return // Stop after success
				}
				break
			case 'system':
				notify(charname, message)
				return // Stop after success
		}
	} catch (_) {_}

	console.error(`[RealityNotify] All notification methods failed for message: "${message}"`)
}

/**
 * Fount 插件，为 AI 角色提供通过系统通知与用户进行带外通信的能力。
 * @type {import('../../../../../../src/decl/pluginAPI.ts').pluginAPI_t}
 */
const notify_plugin: Plugin = {
	info: {
		'zh-CN': {
			name: '通知插件',
			description: '通知插件，让AI能够通知用户',
			author: 'steve02081504',
		},
		'en-US': {
			name: 'notify plugin',
			description: 'notify plugin, let AI notify users',
			author: 'steve02081504',
		},
	},
	interfaces: {
		chat: {
			GetPrompt: (args) => {
				return {
					additional_chat_log: [
						{
							role: 'system',
							name: 'system',
							content: `\
你可以通过回复以下格式来通知${args.UserCharname}：
<notify>
通知内容
</notify>
像这样：
婉瑜: 我注意到主人的领带没系好，得通知主人一下才行。
<notify>主人！领带没系好哦！</notify>
notify可以通知你主人，其实现方式是未定义的，可能通过聊天软件的私信、系统通知等方式发送给用户。

如果你希望发送一个系统弹窗确保给“电脑前的人”而不是你主人，你可以使用<system-notify>：
<system-notify>
通知内容
</system-notify>
`,
						}
					]
				}
			},
			/**
			 * 处理 AI 的回复，提取并发送通知内容。
			 */
			ReplyHandler: async (result: AIReply) => {
				const rawMatch = result.content.match(/<system-notify>(?<content>[\S\s]*?)<\/system-notify>/)
				if (rawMatch) {
					const content = rawMatch?.groups?.content?.trim?.()
					if (content) notify(charname, result.extension.system_notify = content)
				}

				const match = result.content.match(/<notify>(?<content>[\S\s]*?)<\/notify>/)
				if (match) {
					const content = match?.groups?.content?.trim?.()
					if (content) await sendRealityNotification(result.extension.notify = content)
				}

				// Return false as this handler only modifies the result, doesn't fully handle the reply
				return false
			}
		}
	}
}

/**
 * 表示一个特殊的“真实世界”频道对象，用于 AI 在不直接与用户交互的情况下进行内部思考和操作。
 * @type {object}
 */
export const RealityChannel: Channel = {
		supported_functions: {
			markdown: false,
			mathjax: false,
			html: false,
			unsafe_html: false,
			files: false,
			add_message: true,
		},
		char: GentianAphrodite,
		world: realityWorld,
		chat_name: 'reality',
		char_id: charname,
		get username(){
			return Charbase.username
		},
		Charname: '婉瑜',
		get UserCharname() {
			return Charbase.username
		},
		locales: localhostLocales,
		time: new Date(),
		chat_log: [
			{
				name: 'system',
				role: 'system',
				content: `\
描述下你对所处环境的理解，并发送一个\`测试通知\`。
`
			},
			{
				name: '婉瑜',
				role: 'char',
				content: `\
				唔姆！婉瑜明白，这些话语是婉瑜自己的悄悄话，主人大人是看不到的呢！
				不过呀，婉瑜可以通过魔法通知，偷偷地给主人大人发送专属的小消息哦！💖
				<notify>测试通知</notify>
看！小通知已经成功飞到主人大人那里啦！✨
`
			},
			{
				name: 'system',
				role: 'system',
				content: `\
已确认通知，进入实际环境。
祝你服侍愉快。
`
			}
		] as ChatLog[],
		/**
		 * 向“真实世界”频道的聊天日志中添加一个条目。
		 * @param {object} entry - 要添加的聊天日志条目。
		 */
		AddChatLogEntry: (entry: ChatLog) => {
			console.dir(entry, { depth: null })
			RealityChannel.chat_log.push(entry)
		},
		other_chars: {},
		plugins: {
			notify_plugin,
		} as Record<string, Plugin>,
		/**
		 * 更新“真实世界”频道对象的时间戳并返回自身。
		 * @returns {object} 更新后的 RealityChannel 对象。
		 */
		Update: () => {
			RealityChannel.time = new Date()
			return RealityChannel
		},
		chat_scoped_char_memory: {},
		extension: {
			is_reality_channel: true
		},
	}

/**
 * 初始化真实世界频道。
 */
export function initRealityChannel() {
	// RealityChannel.username = Charbase.username
	// RealityChannel.UserCharname = Charbase.username
	// nothing to do because Reality Channel is inited
}
