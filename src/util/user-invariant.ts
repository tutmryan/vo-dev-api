import type { User } from '@makerx/graphql-core'
import { invariant } from './invariant'

export function userInvariant(user?: User): asserts user {
  invariant(user, 'User is required')
}
