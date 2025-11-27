import fs from 'node:fs/promises'
import path from 'node:path'
import {deepmerge} from 'jsr:@rebeccastevens/deepmerge'

import { loadPlugin } from '../../../../../../src/server/managers/plugin_manager.mjs'
import { getAISourceData, setAISourceData } from '../AISource/index.mjs'
import { resetIdleTimer } from '../event_engine/on_idle.ts'
import { checkVoiceSentinel, stopVoiceSentinel } from '../event_engine/voice_sentinel.mjs'
// import { mergeTree } from '../scripts/tools.mjs'
import { Charbase } from '../charbase.ts'
const {chardir, charname} = Charbase

export async function GetConfigDisplayContent(): Promise<{html: string, js: string}> {
	return {
		html: await fs.readFile(path.join(chardir, 'config', 'display.html'), 'utf-8'),
		js: await fs.readFile(path.join(chardir, 'config', 'display.mjs'), 'utf-8')
	}
}

/** @type {Record<string, import("../../../../../../src/decl/pluginAPI.ts").pluginAPI_t>} */
export let plugins = {}
type AIsourcesType = {
  "deep-research": string;
  "web-browse": string;
  nsfw: string;
  expert: string;
  logic: string;
  "from-other": string;
  idle: string;
  "voice-processing": string;
}
type Config = {
  AIsources?: AIsourcesType;
  plugins?: string[];
  deep_research:{
    max_planning_cycles: number;
    initial_plan_max_retries: number;
    summary_max_retries: number;
    reasoning_interval: number;
  };
  reality_channel_notification_fallback_order: string[];
  disable_idle_event?: boolean;
  disable_voice_sentinel?: boolean;
}
/**
 * 存储 Bot 的核心配置，例如深度研究参数、空闲事件和语音哨兵的禁用状态。
 * @type {object}
 */
export const config: Config = {
	deep_research: {
		max_planning_cycles: 4,
		initial_plan_max_retries: 5,
		summary_max_retries: 5,
		reasoning_interval: 3000
	},
	disable_idle_event: false,
	disable_voice_sentinel: true,
	reality_channel_notification_fallback_order: ['discord', 'telegram', 'system']
}

/**
 * 获取当前配置数据。
 * @returns {object} - 包含当前配置数据的对象。
 */
export function GetData(): Config {
	return {
		AIsources: (getAISourceData() as AIsourcesType),
		plugins: Object.keys(plugins),
		deep_research: config.deep_research,
		disable_idle_event: config.disable_idle_event,
		disable_voice_sentinel: config.disable_voice_sentinel,
		reality_channel_notification_fallback_order: config.reality_channel_notification_fallback_order
	}
}
/**
 * 设置新的配置数据。
 * @param {object} data - 包含新配置数据的对象。
 */
export async function SetData(data: Config) {
	await setAISourceData(data.AIsources || (getAISourceData() as AIsourcesType))
	if (data.plugins) plugins = Object.fromEntries(await Promise.all(data.plugins.map(async x => [x, await loadPlugin(Charbase.username, x)])))
	Object.assign(config.deep_research, data.deep_research)

	config.disable_idle_event = data.disable_idle_event
	resetIdleTimer()

	config.disable_voice_sentinel = data.disable_voice_sentinel
	if (config.disable_voice_sentinel) stopVoiceSentinel()
	else checkVoiceSentinel()

	if (data.reality_channel_notification_fallback_order)
		config.reality_channel_notification_fallback_order = data.reality_channel_notification_fallback_order
}

/**
 * 设置当前角色的配置数据。
 * @param {object} data - 包含要设置的数据的对象。
 * @returns {Promise<any>} - `setPartData` 函数的返回值。
 */
export async function setMyData(data) {
	const { setPartData } = await import('../../../../../../src/public/shells/config/src/manager.mjs')
	return setPartData(Charbase.username, 'chars', charname, deepmerge(GetData(), data))
	// return setPartData(Charbase.username, 'chars', charname, mergeTree(await GetData(), data))
}
