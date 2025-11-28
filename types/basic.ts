
import type {Router} from 'npm:express'
import type {Client} from 'npm:discord.js'
import type {Telegraf} from 'npm:telegraf'

type MaybePromise<A> = Promise<A> | A
export type ChatLog = {
  role: string;
  name: string;
  content: string;
}
export type Prompt= {
  text?:{
    content: string;
    important: number
  }[];
  additional_chat_log?: ChatLog[];
}
export type Stat = {
  username: string;
  charname: string;
  state:{
    init_count: number;
    last_start_time_stamp: number;
    start_count: number;
  }
  router: Router;
};
export type I18NInfoType = {
  name: string;
  avatar?: string;
  sfw_avatar?: string;
  icon?: string;
  description: string;
  sfw_description?: string;
  description_markdown?: string;
  sfw_description_markdown?: string;
  version?: string;
  author?: string;
  home_page?: string;
  tags?: string[];
  sfw_tags?: string[];
}
export type InfoType = {
  'zh-CN': I18NInfoType;
  'en-US': I18NInfoType
}

type GeneralComponent = {
  info?: InfoType;
  interfaces?:{
    chat:{
      GetPrompt: (args: any) => MaybePromise<Prompt>
    }
  }
}
export type Character = GeneralComponent & {
  Load?: (stat: Stat) => void;
  Unload?: (reason: any) => Promise<void>;
  interfaces?: {
    info: {
      UpdateInfo: () => Promise<InfoType>
    };
    config:{
			GetConfigDisplayContent: () => Promise<{html: string; js: string;}>;
			GetData: () => any,
			SetData: (data: any) => Promise<void>,
    };
    chat:{
      GetGreeting:(args: object, index: number) => Promise<string>;
      GetGroupGreeting: (args: object, index: number) => Promise<string>;
      GetPromptForOther: (args: any) => Prompt;
      GetReply:(args: any) => Promise<any>;
    };
    discord:{
      OnceClientReady:(client: Client, config: any) => Promise<any>;
      GetBotConfigTemplate: () => Promise<any>;
    };
    telegram:{
      BotSetup: (bot: Telegraf, config: any) => Promise<any>;
      GetBotConfigTemplate: ()=>Promise<any>
    };
    shellassist:{
      Assist: (args: any) => Promise<any>
    },
    browserIntegration:{
      BrowserJsCallback:(args:{data: any;pageId: number;script: string}) => void
    },
    timers:{
      TimerCallback: (username:string, uid: string, callbackdata:any) => void
    }
  }
};
export type World = GeneralComponent

// make sure AIReply = ChatLog
export type AIReply = {
  content: string;
  logContextBefore?: any[];
  logContextAfter?: any[];
  files?: any[];
  extension?: any;
};
export type Plugin = GeneralComponent & {
  interfaces?:{
    chat:{
      ReplyHandler: (result: AIReply) => Promise<boolean>;
    }
  }

}

export type Channel = {
  supported_functions: {
    markdown: boolean;
    mathjax: boolean;
    html: boolean;
    unsafe_html: boolean;
    files: boolean;
    add_message: boolean;
  },
  char: Character;
  world: World;
  chat_name: string;
  char_id: string;
  readonly username: string;
  Charname: string;
  readonly UserCharname: string;
  locales: string[];
  time: Date;
  chat_log: ChatLog[];
  AddChatLogEntry: (entry: ChatLog) => void;
  other_chars: Character;
  plugins: Record<string, Plugin>;
  Update: () => Channel;
  chat_scoped_char_memory: Record<string, any>;
  extension: Record<string,boolean>;
}