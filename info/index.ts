import { update as enUS } from './en-US.ts'
import { update as zhCN } from './zh-CN.ts'

export type I18NInfoType = {
  name: string;
  avatar: string;
  sfw_avatar: string;
  icon: string;
  description: string;
  sfw_description: string;
  description_markdown: string;
  sfw_description_markdown: string;
  version: string;
  author: string;
  home_page: string;
  tags: string[];
  sfw_tags: string[];
}
/**
 * 更新并返回所有支持语言的信息。
 * @returns {Promise<{[key: string]: any}>} 返回一个包含所有语言信息的对象。
 */
export type UpdateInfoType = {
  'zh-CN': I18NInfoType;
  'en-US': I18NInfoType
}
export async function UpdateInfo(): Promise<UpdateInfoType> {
	return {
		'zh-CN': await zhCN(),
		'en-US': await enUS(),
	}
}
