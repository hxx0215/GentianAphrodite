import path from "node:path"
import {exec} from './scripts/exec.ts'
export const Charbase = {
  is_dist: false,
  chardir: import.meta.dirname,
  charname: '',
  charurl: '',
  charvar: '',
  username:'',
}
export const GentianAphrodite = {}
export function initCharBase(init: {username: string}) {
  Charbase.username = init.username
}
(async () => {
  const chardir = Charbase.chardir
  Charbase.charname = chardir ? path.basename(chardir) : 'wanyu'
  Charbase.charvar = await exec('git -C "." describe --tags', { cwd: chardir }).then(result => result.stdout.trim()).catch(
	() => exec('git -C "." rev-parse --short HEAD', { cwd: chardir }).then(result => result.stdout.trim()).catch(
		() => 'unknown'
	))
  Charbase.charurl = `/chars/${encodeURIComponent(Charbase.charname)}`
})()