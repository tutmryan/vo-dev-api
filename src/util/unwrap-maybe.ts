import type { InputMaybe } from '../generated/graphql'

export const unwrapMaybe = <T>(input: InputMaybe<T>): T | undefined => input ?? undefined
