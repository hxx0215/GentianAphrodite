import { spawn } from 'node:child_process'
import process from 'node:process'

/**
 * 从字符串中移除 ANSI 终端序列。
 * @param str - 要处理的字符串。
 * @returns 清理后的字符串。
 */
export function removeTerminalSequences(str: string): string {
	// deno-lint-ignore no-control-regex
	return str.replace(/\x1B\[[\d;]*[Km]/g, '')
}

interface ExecOptions {
	shell: string
	cmdswitch?: string
	args?: string[]
	cwd?: string
	no_ansi_terminal_sequences?: boolean
}

interface ExecResult {
	code: number | null
	stdout: string
	stderr: string
	stdall: string
}

type ExecLeastOptions = Omit<ExecOptions, 'shell' | 'args' | 'cmdswitch'>

/**
 * 执行命令的基础函数 (最终修复版)。
 * @param code - 要执行的代码。
 * @param options - 选项。
 * @returns 执行结果。
 */
async function base_exec(code: string, options: ExecOptions): Promise<ExecResult> {
	const {
		shell,
		cmdswitch = '-c',
		args = [],
		cwd = undefined,
		no_ansi_terminal_sequences = false,
	} = options 
	return await new Promise((resolve, reject) => {
		const childProcess = spawn(shell, [...args, cmdswitch, code], {
			windowsHide: true,
			cwd,
		})
		childProcess.on('error', reject)
		let stdout = ''
		let stderr = ''
		let stdall = ''
		childProcess.stdout.on('data', data => {
			stdout += data
			stdall += data
		})
		childProcess.stderr.on('data', data => {
			stderr += data
			stdall += data
		})
		childProcess.on('close', code => {
			if (no_ansi_terminal_sequences) {
				stdout = removeTerminalSequences(stdout)
				stderr = removeTerminalSequences(stderr)
				stdall = removeTerminalSequences(stdall)
			}
			resolve({ code, stdout, stderr, stdall })
		})
	})
}
function base_sh_exec(shellpath: string, code: string, options?: Omit<ExecOptions, 'shell'>) {
	return base_exec(code, {
		shell: shellpath,
		...options
	})
}
function base_pwsh_exec(shellpath: string, code: string, options?: ExecLeastOptions) {
	code = `\
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
&{
${code}
} | Out-String -Width 65536`
	return base_exec(code, {
		shell: shellpath,
		args: ['-NoProfile', '-NoLogo', '-NonInteractive'],
		cmdswitch: '-Command',
		...options
	})
}
async function testShPaths(paths: string[]): Promise<string | undefined> {
	return await Promise.any(
		paths.map(async path => {
			await base_sh_exec(path, 'echo 1')
			return path
		})
	).catch(() => undefined)
}

async function testPwshPaths(paths: string[]): Promise<string | undefined> {
	return await Promise.any(
		paths.map(async path =>{
			await base_pwsh_exec(path, '1')
			return path
		})
	).catch(() => undefined)
}

const powershellPath = await testPwshPaths([
	'powershell.exe',
	'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
])
const shPath = await testShPaths([
	'sh',
	'sh.exe',
	'/bin/sh',
	await init_path('sh').catch(() => ''),
].filter(x => x))
const bashPath = await testShPaths([
	'bash',
	'bash.exe',
	'/bin/bash',
	'/usr/bin/bash',
	await init_path('bash').catch(() => ''),
].filter(x => x))
const pwshPath = await testPwshPaths([
	'pwsh',
	'pwsh.exe',
	await init_path('pwsh').catch(() => ''),
].filter(x => x))

async function init_path(sh: string){
	if (process.platform === 'win32'){
		const code = `Get-Command -Name ${sh} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Definition`
		const result = await base_pwsh_exec(powershellPath!, code)
		return result.stdout.trim()
	}else{
		const result = await base_sh_exec('/bin/bash', `which ${sh}`)
		return result.stdout.trim()
	}
}

export function sh_exec(code: string, options?:ExecLeastOptions){
	return base_sh_exec(shPath ?? '/bin/sh', code, options)
}

export function bash_exec(code: string, options?: ExecLeastOptions){
	return base_sh_exec(bashPath ?? '/bin/bash', code, options)
}

export function powershell_exec(code: string, options: ExecOptions){
	return base_pwsh_exec(powershellPath!, code, options)
}

export function pwsh_exec(code: string, options?: ExecLeastOptions){
	return base_pwsh_exec(pwshPath ?? powershellPath!, code, options)
}

export async function where_command(command: string){
	if (process.platform === 'win32'){
		return await pwsh_exec(`Get-Command -Name ${command} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Definition`).then(result => result.stdout.trim())
	}else{
		return await sh_exec(`which ${command}`).then(result => result.stdout.trim())
	}
}
export const available = {
	pwsh: !!pwshPath,
	powershell: !!powershellPath,
	bash: !!bashPath,
	sh: !!shPath
}

export const shell_exec_map = {
	pwsh: pwsh_exec,
	powershell: powershell_exec,
	bash: bash_exec,
	sh: sh_exec,
}
export function exec(str: string, options: ExecLeastOptions) {
	if (process.platform == 'win32') return pwsh_exec(str, options)
	else if (bashPath) return bash_exec(str, options)
	else if (shPath) return sh_exec(str, options)
	else throw new Error('No shell available')
}
