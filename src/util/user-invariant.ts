import type { User } from '@makerxstudio/graphql-core'
import { invariant } from './invariant'

export function userInvariant(user?: User): asserts user {
  invariant(user, 'User is required')
}
