import { dispatch } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { CreatePhotoCaptureRequestCommand } from './commands/create-photo-capture-request-command'

export const resolvers: Resolvers = {
  Mutation: {
    createPhotoCaptureRequest: async (_, { request }, context) => dispatch(context, CreatePhotoCaptureRequestCommand, request),
  },
}
