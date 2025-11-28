import { Channel } from "../types/basic.ts";

// 问候语项类型定义
export interface GreetingItem {
	content: string;
}

// 语言模块接口
interface GreetingModule {
	commonGreetings: (username: string) => GreetingItem[];
	commonGroupGreetings: (username: string) => GreetingItem[];
}

/**
 * 根据 locale 获取语言代码
 */
function getLanguageCode(locales: string[]): string {
	return locales[0]?.split('-')[0] || 'en';
}

/**
 * 动态导入对应语言的问候语模块
 */
async function loadGreetingModule(langCode: string): Promise<GreetingModule> {
	switch (langCode) {
		case 'zh':
			return await import('./zh-CN.ts');
		case 'en':
		default:
			return await import('./en-US.ts');
	}
}

/**
 * 获取通用的问候语函数
 */
async function getGreetings(
	args: Channel,
	type: 'single' | 'group'
): Promise<GreetingItem[]> {
	const langCode = getLanguageCode(args.locales);
	const module = await loadGreetingModule(langCode);

	return type === 'single'
		? module.commonGreetings(args.UserCharname)
		: module.commonGroupGreetings(args.UserCharname);
}

/**
 * 获取指定索引的单人问候语。
 */
export async function GetGreeting(args: Channel, index: number): Promise<GreetingItem> {
	const greetings = await getGreetings(args, 'single');
	return greetings[index];
}

/**
 * 获取指定索引的群组问候语。
 */
export async function GetGroupGreeting(args: Channel, index: number): Promise<GreetingItem> {
	const greetings = await getGreetings(args, 'group');
	return greetings[index];
}


