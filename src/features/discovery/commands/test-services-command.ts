import { runDeduplicatedJob } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'

export async function TestServicesCommand(this: CommandContext) {
  await runDeduplicatedJob('monitorServices', {}, true)
}
