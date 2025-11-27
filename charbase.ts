import path from "node:path"
import {exec} from './scripts/exec.ts'
import type { UpdateInfoType } from "./info/index.ts";
import type {Client} from 'npm:discord.js'
import type {Telegraf} from 'npm:telegraf'
import type { Prompt, Stat } from "./types/basic.ts";

const chardir = import.meta.dirname
const charname = chardir ? path.basename(chardir) : 'wanyu'
const charurl = `/chars/${encodeURIComponent(charname)}`
const charvar = await exec('git -C "." describe --tags', { cwd: chardir }).then(result => result.stdout.trim()).catch(
	() => exec('git -C "." rev-parse --short HEAD', { cwd: chardir }).then(result => result.stdout.trim()).catch(
		() => 'unknown'
	))

export const Charbase = {
  is_dist: false,
  chardir,
  charname,
  charurl,
  charvar,
  username:'',
}
type GentianAphroditeDefinition = {
  info?: UpdateInfoType;
  Load?: (stat: Stat) => void;
  Unload?: (reason: any) => Promise<void>;
  interfaces?: {
    info: {
      UpdateInfo: () => Promise<UpdateInfoType>
    };
    config:{
			GetConfigDisplayContent: () => Promise<{html: string; js: string;}>;
			GetData: () => any,
			SetData: (data: any) => Promise<void>,
    };
    chat:{
      GetGreeting:(args: object, index: number) => Promise<string>;
      GetGroupGreeting: (args: object, index: number) => Promise<string>;
      GetPrompt:(args: any) => Promise<Prompt>;
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
export const GentianAphrodite: GentianAphroditeDefinition = {}
export function initCharBase(init: Stat) {
  Charbase.username = init.username
}