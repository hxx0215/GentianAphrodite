import { Channel, LogicalResult, MaybePromise, Prompt } from "../../types/basic.ts";
import { mergePrompt } from '../build.ts'

import { LongTermMemoryPrompt, saveLongTermMemory } from './long-term-memory.ts'
import { RealityChannelHistoryPrompt } from './reality-channel-history.ts'
import { saveShortTermMemory, ShortTermMemoryPrompt } from './short-term-memory.mjs'

/**
 */
export function MemoriesPrompt(args: Channel, logical_results: LogicalResult) {
	const result: MaybePromise<Prompt>[] = []
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
