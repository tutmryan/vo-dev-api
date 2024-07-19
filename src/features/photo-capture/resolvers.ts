import { dispatch } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { CapturePhotoCommand } from './commands/capture-photo-command'
import { CreatePhotoCaptureRequestCommand } from './commands/create-photo-capture-request-command'

export const resolvers: Resolvers = {
  Mutation: {
    createPhotoCaptureRequest: async (_, { request }, context) => dispatch(context, CreatePhotoCaptureRequestCommand, request),
    capturePhoto: async (_, { photoCaptureRequestId, photo }, context) =>
      dispatch(context, CapturePhotoCommand, photoCaptureRequestId, photo),
  },
}
