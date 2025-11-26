import path from "node:path"
import {exec} from './scripts/exec.ts'
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
export const GentianAphrodite = {}
export function initCharBase(init: {username: string}) {
  Charbase.username = init.username
}