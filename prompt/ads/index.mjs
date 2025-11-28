import { mergePrompt } from '../build.ts'

import { ps12exePrompt } from './ps12exe.mjs'
export async function ADPrompt(args, logical_results) {
	const result = []
	result.push(ps12exePrompt(args, logical_results))
	return mergePrompt(...result)
}
