import { flatChatLog } from './match.mjs'


/**
 * 创建最近几条聊天记录的文本快照。
 * @param {number} [depth=4] - 要包含的最近聊天记录的数量。
 * @returns {string} - 一个格式化的字符串，代表了当前的聊天上下文。
 */
export function createContextSnapshot(chat_log, depth) {
	if (depth) chat_log = chat_log.slice(-depth)
	return flatChatLog(chat_log)
		.map(entry => `${entry.name || '未知发言者'}: ${entry.content || ''}${entry.files?.length ? `\n(文件: ${entry.files.map(file => file.name).join(', ')})` : ''}`)
		.join('\n')
}
