import { mergePrompt } from '../build.ts'

import { LongTermMemoryPrompt, saveLongTermMemory } from './long-term-memory.mjs'
import { RealityChannelHistoryPrompt } from './reality-channel-history.mjs'
import { saveShortTermMemory, ShortTermMemoryPrompt } from './short-term-memory.mjs'

/**
 * @param {logical_results_t} logical_results 逻辑结果
 * @returns {Promise<single_part_prompt_t>} 记忆组成的Prompt
 */
export async function MemoriesPrompt(args, logical_results) {
	const result = []
	result.push(RealityChannelHistoryPrompt(args, logical_results))
	result.push(ShortTermMemoryPrompt(args, logical_results))
	result.push(LongTermMemoryPrompt(args, logical_results))

	return mergePrompt(...result)
}

/**
 * 保存记忆
 */
export async function saveMemories() {
	await saveLongTermMemory()
	await saveShortTermMemory()
}
