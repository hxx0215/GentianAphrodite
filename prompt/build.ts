
import { Channel, LogicalResult, MaybePromise, Prompt } from "../types/basic.ts";
import { ADPrompt } from './ads/index.mjs'
import { FunctionPrompt } from './functions/index.mjs'
import { MemoriesPrompt } from './memory/index.mjs'
import { RoleSettingsPrompt } from './role_settings/index.mjs'
import { SystemPrompt } from './system/index.mjs'

/**
 * 合并多个 Prompt 对象。
 */
export async function mergePrompt(...prompts: (MaybePromise<Prompt>| undefined)[]): Promise<Prompt> {
	const promptsResult = await Promise.all(prompts.filter((item): item is MaybePromise<Prompt> => item !== undefined))
	const result: Prompt = {
		text: [],
		additional_chat_log: [],
		extension: {}
	}
	for (const prompt of promptsResult) {
		result.text = result.text!.concat(prompt.text || [])
		result.additional_chat_log = result.additional_chat_log!.concat(prompt.additional_chat_log || [])
		result.extension = Object.assign(result.extension, prompt.extension)
	}
	result.text = result.text!.filter(text => text.content)
	result.additional_chat_log = result.additional_chat_log!.filter(chat_log => chat_log.content)
	return result
}

/**
 * 构建最终的 Prompt。
 */
export async function buildPrompt(args: Channel, logical_results: LogicalResult[]) {
	return mergePrompt(
		MemoriesPrompt(args, logical_results),
		RoleSettingsPrompt(args, logical_results),
		await (FunctionPrompt(args, logical_results)as Promise<Prompt>), // await 因为函数提示词可能修改enable_prompts而向SystemPrompt传递音频或图片的包含信息
		ADPrompt(args, logical_results),
		SystemPrompt(args, logical_results)
	)
}
