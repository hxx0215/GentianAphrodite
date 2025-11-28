import { mergePrompt } from '../build.ts'

import { CoreRulesPrompt } from './corerules.mjs'
import { MasterRecognizePrompt } from './master-recognize.mjs'
import { NullReplayPrompt } from './nullreplay.mjs'
import { OptionsPrompt } from './Options.mjs'
import { PromptReviewerPrompt } from './prompt-reviewer.mjs'
import { SoberPrompt } from './sober.mjs'
import { SOSPrompt } from './sos.mjs'
import { StatusBarPrompt } from './StatusBar.mjs'
import { StickersPrompt } from './stickers.mjs'
export async function SystemPrompt(args, logical_results) {
	const result = []
	result.push(SOSPrompt(args, logical_results))

	if (logical_results.talking_about_prompt_review || logical_results.prompt_input)
		result.push(SoberPrompt(args, logical_results))
	result.push(PromptReviewerPrompt(args, logical_results))

	result.push(StatusBarPrompt(args, logical_results))
	result.push(OptionsPrompt(args, logical_results))
	result.push(StickersPrompt(args, logical_results))

	result.push(CoreRulesPrompt(args, logical_results))

	// result.push(MasterRecognizePrompt(args, logical_results))

	result.push(NullReplayPrompt(args, logical_results))

	return mergePrompt(...result)
}
