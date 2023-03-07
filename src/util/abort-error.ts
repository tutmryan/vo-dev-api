/**
 * Thrown when a process is being aborted
 */
export class AbortError extends Error {
  constructor() {
    super('Process aborting')
  }
}
