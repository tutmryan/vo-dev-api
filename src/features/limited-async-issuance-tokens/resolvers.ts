import { dispatch, dispatchMultiTransactional } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { AcquireAsyncIssuanceTokenCommand } from './commands/acquire-async-issuance-token-command'
import { SendAsyncIssuanceVerificationCommand } from './commands/send-async-issuance-verification-command'

export const resolvers: Resolvers = {
  Mutation: {
    sendAsyncIssuanceVerification: async (_, { asyncIssuanceRequestId }, context) =>
      dispatchMultiTransactional(context, SendAsyncIssuanceVerificationCommand, asyncIssuanceRequestId),
    acquireAsyncIssuanceToken: async (_, { asyncIssuanceRequestId, verificationCode }, context) =>
      dispatch(context, AcquireAsyncIssuanceTokenCommand, asyncIssuanceRequestId, verificationCode),
  },
}
