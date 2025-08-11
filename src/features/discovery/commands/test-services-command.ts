import { runAndAwaitJob } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import type { BackgroundJobErrorEvent } from '../../../generated/graphql'

function isBackgroundJobErrorEvent(event: any | undefined): event is BackgroundJobErrorEvent {
  return event?.__typename === 'BackgroundJobErrorEvent'
}

export async function TestServicesCommand(this: CommandContext) {
  const testResult = await runAndAwaitJob('monitorServices', {})
  if (isBackgroundJobErrorEvent(testResult)) throw new Error(`Failed to test services, background job error: ${testResult.error}`)
}
