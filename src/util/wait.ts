import { AbortError } from './abort-error'

export const wait = (timeout: number, abortController?: AbortController) =>
  new Promise<void>((resolve, reject) => {
    let timeoutRef: NodeJS.Timeout | undefined = undefined
    const onAbort = () => {
      clearTimeout(timeoutRef)
      reject(new AbortError())
    }
    abortController?.signal.addEventListener('abort', onAbort)

    timeoutRef = setTimeout(() => {
      abortController?.signal.removeEventListener('abort', onAbort)
      resolve()
    }, timeout)
  })
