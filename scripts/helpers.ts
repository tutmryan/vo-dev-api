import http from 'http'
import prompt from 'prompt-sync'

import colors from 'colors'
import { sync as spawnSync } from 'cross-spawn'
import fs from 'fs'
import https from 'https'
import path from 'path'

export function downloadFile(apiPath: string, localPath: string) {
  return new Promise<void>((resolve) => {
    https.get(apiPath, (result: http.IncomingMessage) => {
      if (!fs.existsSync(path.dirname(localPath))) {
        fs.mkdirSync(path.dirname(localPath))
      }
      const file = fs.createWriteStream(localPath)
      result.pipe(file).on('finish', resolve)
    })
  })
}

export function runChildProc(command: string, args: string[]) {
  const proc = spawnSync(command, args, {
    // forward all stdin/stdout/stderr to current handlers, with correct interleaving
    stdio: 'inherit',
  })

  if (proc.error) {
    // only happens during invocation error, not error return status
    throw proc.error
  }
  console.info(`child process  exited with code ${proc.status}`)
}

const prompter = prompt()
export const writeText = (text: string) => console.log(colors.cyan(text))
export const writeWarning = (text: string) => console.log(colors.yellow(text))
export const writeError = (text: string) => console.log(colors.red(text))
export const requestText = (text: string) => prompter(colors.cyan(text))
export const yeahNah = (question: string) => prompter(colors.cyan(question + ' (y/n): '))?.toLowerCase() === 'y'
