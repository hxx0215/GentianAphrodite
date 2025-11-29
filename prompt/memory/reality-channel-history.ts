import { RealityChannel } from '../../event_engine/index.ts'
import { createContextSnapshot } from '../../scripts/context.mjs'
import { Channel, LogicalResult, Prompt } from "../../types/basic.ts";

/** @typedef {import("../../../../../../../src/decl/prompt_struct.ts").single_part_prompt_t} single_part_prompt_t */
/** @typedef {import("../logical_results/index.mjs").logical_results_t} logical_results_t */

/**
 * 给AI提供现实频道的历史Prompt。
 * @param {logical_results_t} logical_results 逻辑分析结果
 * @returns {Promise<single_part_prompt_t>} 由近期的现实频道记录组成的提示
 */
export function RealityChannelHistoryPrompt(args: Channel, _logical_results: LogicalResult): Prompt {
	if (args.extension?.is_reality_channel) return { text: [], additional_chat_log: [] }

	const recentHistory = RealityChannel.chat_log.slice(-5)
	const historyText = createContextSnapshot(recentHistory)

	let result = ''
	if (historyText.trim())
		result = `\
<reality_channel_history>\
以下是你最近在现实频道中的活动记录：\
${historyText}\
</reality_channel_history>\
`

	return {
		text: [{ content: result, important: 0 }],
		additional_chat_log: []
	}
}
