import { DomainError } from './domain-error'

export function domainInvariant(condition: any, messageOrError: string | DomainError): asserts condition {
  if (condition) {
    return
  }

  if (messageOrError instanceof DomainError) throw messageOrError
  throw new DomainError(messageOrError)
}
