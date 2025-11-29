import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import { inspect } from 'node:util'

import { compareTwoStrings as string_similarity } from 'npm:string-similarity'

import { buildPromptStruct } from '../../../../../../src/public/shells/chat/src/prompt_struct.mjs'
import { defineToolUseBlocks } from '../../../../../../src/public/shells/chat/src/stream.mjs'
import { noAISourceAvailable, OrderedAISourceCalling } from '../AISource/index.mjs'
import { chardir, is_dist } from '../charbase.mjs'
import { plugins } from '../config/index.mjs'
import { get_discord_api_plugin } from '../interfaces/discord/api.mjs'
import { get_telegram_api_plugin } from '../interfaces/telegram/api.mjs'
import { buildLogicalResults } from '../prompt/logical_results/index.mjs'
import { unlockAchievement } from '../scripts/achievements.mjs'
import { match_keys } from '../scripts/match.mjs'
import { addNotifyAbleChannel } from '../scripts/notify.mjs'
import { newCharReplay, newUserMessage, saveStatisticDatas, statisticDatas } from '../scripts/statistics.mjs'

import { handleError } from './error.mjs'
import { browserIntegration } from './functions/browserIntegration.mjs'
import { coderunner, GetCoderunnerPreviewUpdater } from './functions/coderunner.mjs'
import { deepResearch } from './functions/deep-research.mjs'
import { file_change } from './functions/file-change.mjs'
import { googlesearch } from './functions/googlesearch.mjs'
import { LongTermMemoryHandler } from './functions/long-term-memory.mjs'
import { rolesettingfilter } from './functions/rolesettingfilter.mjs'
import { ShortTermMemoryHandler } from './functions/short-term-memory.mjs'
import { timer } from './functions/timer.mjs'
import { webbrowse } from './functions/webbrowse.mjs'
import { noAIreply } from './noAI/index.mjs'

/** @typedef {import("../../../../../../src/public/shells/chat/decl/chatLog.ts").chatLogEntry_t} chatLogEntry_t */
/** @typedef {import("../../../../../../src/public/shells/chat/decl/chatLog.ts").chatReplyRequest_t} chatReplyRequest_t */
/** @typedef {import("../../../../../../src/public/shells/chat/decl/chatLog.ts").chatReply_t} chatReply_t */
/** @typedef {import("../../../../../../src/decl/prompt_struct.ts").prompt_struct_t} prompt_struct_t */

/**
 * 获取一个用于添加长时间日志的函数，同时检测并防止AI无限循环。
 * @param {chatReply_t} result - 当前的聊天回复对象，日志条目将被添加到此对象。
 * @param {prompt_struct_t} prompt_struct - Prompt结构体，其中包含角色的附加聊天日志。
 * @param {number} [max_forever_looping_num=6] - 判断为无限循环的最大相似回复次数。
 * @param {number} [warning_forever_looping_num=4] - 发出无限循环警告的相似回复次数阈值。
 * @param {number} [similarity_threshold=0.9] - 用于判断回复是否相似的阈值。
 * @returns {(entry: chatLogEntry_t) => void} 一个函数，接受一个日志条目并将其添加到长时间日志中。
 */
export function getLongTimeLogAdder(result, prompt_struct, max_forever_looping_num = 6, warning_forever_looping_num = 4, similarity_threshold = 0.9) {
	const sim_check_before = []
	let forever_looping_num = 0
	/**
	 * 将日志条目添加到角色的附加聊天日志中。
	 * 同时会检查AI是否进入无限循环，如果是，则抛出错误并结束对话。
	 * @param {chatLogEntry_t} entry - 要添加的日志条目。
	 */
	function AddLongTimeLog(entry) {
		entry.charVisibility = [prompt_struct.char_id]
		result?.logContextBefore?.push?.(entry)
		prompt_struct.char_prompt.additional_chat_log.push(entry)
		if (entry.role === 'char') {
			sim_check_before.forEach(item_before => {
				if (string_similarity(entry.content, item_before) > similarity_threshold)
					forever_looping_num++
			})
			sim_check_before.push(entry.content)
			if (forever_looping_num >= max_forever_looping_num)
				throw new Error('infinite loop by AI') // 给龙胆：别删这个，真删了到循环时你就卡死了
			else if (forever_looping_num >= warning_forever_looping_num)
				AddLongTimeLog({
					name: 'system',
					role: 'system',
					content: `\
警告：你好像陷入了无限循环，请尽快结束循环，否则系统将强制结束对话并在评估流程中扣分。
（剩余循环次数：${max_forever_looping_num - forever_looping_num}）
`
				})
		}
	}
	return AddLongTimeLog
}

/**
 * 主回复生成函数。
 * 接收聊天请求，构建prompt，调用AI，处理AI返回的函数调用，并返回最终的聊天回复。
 * @param {chatReplyRequest_t} args - 聊天回复请求的参数。
 * @returns {Promise<chatReply_t>} - 一个包含生成回复的对象。
 */
export async function GetReply(args) {
	/** @type {chatReply_t} */
	const result = {
		content: '',
		logContextBefore: [],
		logContextAfter: [],
		files: [],
		extension: {},
	}
	if (noAISourceAvailable()) return Object.assign(result, noAIreply(args))
	try {
		// 注入角色插件
		args.plugins = Object.assign({}, plugins, args.plugins)
		args.plugins.discord_api ??= await get_discord_api_plugin()
		args.plugins.telegram_api ??= await get_telegram_api_plugin()
		const prompt_struct = await buildPromptStruct(args)
		prompt_struct.alternative_charnames = [
			'Gentian', /Gentian(•|·)Aphrodite/, '龙胆', /龙胆(•|·)阿芙萝黛蒂/
		]
		const logical_results = await buildLogicalResults(args, prompt_struct, 0)
		const AddLongTimeLog = getLongTimeLogAdder(result, prompt_struct)
		const last_entry = args.chat_log.slice(-1)[0]
		if (last_entry?.name == args.UserCharname && last_entry.role == 'user') {
			newUserMessage(last_entry.content, args.extension?.platform || 'chat')
			if (await match_keys(args, ['爱你'], 'user'))
				unlockAchievement('say_it_back')

			const today = new Date()
			const isApril16 = today.getMonth() === 3 && today.getDate() === 16 // Month is 0-indexed, so April is 3
			if (isApril16 && await match_keys(args, ['生日快乐', 'happy birthday'], 'user'))
				unlockAchievement('happy_birthday')

			if (await match_keys(args, [/(花|华)(萝|箩|罗)(蘑|磨|摩)/], 'user'))
				unlockAchievement('talk_about_sister')

			if (await match_keys(args, ['兰斯', '槊'], 'user'))
				unlockAchievement('talk_about_father')

			if (await match_keys(args, ['博蒙蒂亚'], 'user'))
				unlockAchievement('talk_about_mother')

			if (await match_keys(args, ['雪球'], 'user'))
				unlockAchievement('talk_about_snowball')

			if (await match_keys(args, ['steve02081504'], 'user'))
				unlockAchievement('talk_about_author')
		}
		regen: while (true) {
			if (!is_dist && process.env.EdenOS) {
				console.log('logical_results', logical_results)
				console.log('prompt_struct', inspect(prompt_struct, { depth: 4, colors: true }))
			}
			const AItype = args.extension?.source_purpose ?? (logical_results.in_reply_to_master ?
				logical_results.in_nsfw ? 'nsfw' : logical_results.in_assist ? 'expert' : 'sfw'
				: 'from-other')
			const requestresult = await OrderedAISourceCalling(AItype, async AI => {
				const result = await AI.StructCall(prompt_struct, args.generation_options)
				if (!String(result.content).trim()) throw new Error('empty reply')
				return result
			})
			result.content = requestresult.content
			result.files = result.files.concat(requestresult.files || [])
			result.extension = { ...result.extension, ...requestresult.extension }
			if (result.content.split('\n').pop().trim() == '<-<null>->') { // AI skipped
				const lastlog = prompt_struct.chat_log.slice(-1)[0]
				lastlog.logContextAfter ??= []
				lastlog.logContextAfter.push({
					name: '龙胆',
					role: 'char',
					content: '<-<null>->',
					charVisibility: [args.char_id]
				})
				return null
			}
			const sticker = result.content.match(/<gentian-sticker>(.*?)<\/gentian-sticker>/)?.[1]
			result.content = result.content.replace(/<gentian-sticker>(.*?)<\/gentian-sticker>/, '')
			if (sticker) try {
				result.files.push({
					name: sticker + '.avif',
					buffer: Buffer.from(fs.readFileSync(chardir + '/public/imgs/stickers/' + sticker + '.avif'), 'base64'),
					mime_type: 'image/avif'
				})
			} catch {
				console.error(`Sticker ${sticker} not found`)
			}
			result.content = result.content.replace(/\s*<-<null>->\s*$/, '')
			if (args.supported_functions.add_message) addNotifyAbleChannel(args)
			if (!result.content) return null
			/** @type {(import('../../../../../../src/decl/PluginAPI.ts').ReplyHandler_t)[]} */
			const replyHandlers = [
				coderunner, LongTermMemoryHandler, ShortTermMemoryHandler,
				deepResearch, googlesearch, webbrowse, rolesettingfilter, file_change, browserIntegration,
				args.supported_functions.add_message ? timer : null,
				...Object.values(args.plugins).map(plugin => plugin.interfaces.chat?.ReplyHandler)
			].filter(Boolean)
			let continue_regen = false
			for (const replyHandler of replyHandlers)
				if (await replyHandler(result, {
					...args, AddLongTimeLog, prompt_struct, extension: {
						...args.extension,
						logical_results
					}
				}))
					continue_regen = true
			if (continue_regen) continue regen
			break
		}
		if (last_entry?.name == args.UserCharname && last_entry.role == 'user') {
			if (logical_results.in_nsfw)
				statisticDatas.userActivity.NsfwMessagesSent++
			if (logical_results.in_hypnosis && !logical_results.hypnosis_exit)
				statisticDatas.userActivity.InHypnosisMessagesSent++
			newCharReplay(result.content, args.extension?.platform || 'chat')
			if (!statisticDatas.firstInteraction.time) {
				statisticDatas.firstInteraction = {
					time: Date.now(),
					userMessageContent: last_entry.content,
					characterReplyContent: result.content,
					chat_name: args.chat_name
				}
				saveStatisticDatas()
			}
		}
		return result
	}
	catch (error) {
		console.error(`[ReplyGener] Error in GetReply for chat "${args.chat_name}":`, error)
		return handleError(error, args)
	}
}
