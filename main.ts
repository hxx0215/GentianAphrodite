import { addPartLocaleData } from '../../../../../src/scripts/i18n.mjs'
import { loadJsonFile } from '../../../../../src/scripts/json_loader.mjs'

import { initCharBase, Charbase, GentianAphrodite } from './charbase.ts'
import { GetData, SetData, GetConfigDisplayContent } from './config/index.mjs'
import { setConfigEndpoints } from './config/router.mjs'
import { initializeOnIdleHandler, stopIdleTimer } from './event_engine/on_idle.ts'
// import { initializeVoiceSentinel, stopVoiceSentinel } from './event_engine/voice_sentinel.mjs'
import { GetGreeting, GetGroupGreeting } from './greetings/index.mjs'
import { UpdateInfo } from './info/index.ts'
import { GetPrompt, GetPromptForOther } from './prompt/index.mjs'
import { saveMemories } from './prompt/memory/index.mjs'
import { BrowserJsCallback } from './reply_gener/functions/browserIntegration.mjs'
import { timerCallBack } from './reply_gener/functions/timer.mjs'
import { GetReply } from './reply_gener/index.mjs'
import { unlockAchievement } from './scripts/achievements.mjs'
import { saveVars } from './scripts/vars.mjs'

GentianAphrodite.info = await UpdateInfo()
GentianAphrodite.Load = stat => {
  initCharBase(stat)
  addPartLocaleData(Charbase.username, 'chars', 'GentianAphrodite', ['zh-CN', 'en-US'], (locale: any) => loadJsonFile(Charbase.chardir + `/locales/${locale}.json`))
  initializeOnIdleHandler()
  // initializeVoiceSentinel()
  setConfigEndpoints(stat.router)
  unlockAchievement('installed')
}
GentianAphrodite.Unload = async _reason => {
  stopIdleTimer()
  // stopVoiceSentinel()
  // stopClipboardListening()
  await saveMemories()
  saveVars()
}
GentianAphrodite.interfaces = {
  info: {
    UpdateInfo,
  },
  config: {
    GetConfigDisplayContent,
    GetData,
    SetData,
  },
  chat: {
    GetGreeting,
    GetGroupGreeting,
    GetPrompt,
    GetPromptForOther,
    GetReply,
  },
  discord: {
    OnceClientReady: (client, config) => import('./interfaces/discord/index.mjs').then(mod => mod.DiscordBotMain(client, config)),
    GetBotConfigTemplate: () => import('./interfaces/discord/index.mjs').then(mod => mod.GetBotConfigTemplate()),
  },
  telegram: {
    BotSetup: (bot, config) => import('./interfaces/telegram/index.mjs').then(mod => mod.TelegramBotMain(bot, config)),
    GetBotConfigTemplate: () => import('./interfaces/telegram/index.mjs').then(mod => mod.GetBotConfigTemplate()),
  },
  shellassist: {
    Assist: args => import('./interfaces/shellassist/index.mjs').then(mod => mod.shellAssistMain(args))
  },
  browserIntegration: {
    BrowserJsCallback
  },
  timers: {
    TimerCallback: (_username, _uid, callbackdata) => {
      const { type } = callbackdata
      switch (type) {
        case 'timer':
          timerCallBack(callbackdata)
          break
        default:
          throw new Error(`Unknown timer type: ${type}`)
      }
    }
  }

}

// /**
//  * 默认导出的 GentianAphrodite 对象。
//  * @returns {object} - GentianAphrodite 对象。
//  */
export default GentianAphrodite
