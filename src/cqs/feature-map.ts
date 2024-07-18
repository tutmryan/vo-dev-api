import { faceCheckEnabled } from '../config'
import type { Maybe, PresentationRequestInput } from '../generated/graphql'
import { FaceCheckPhotoSupport } from '../generated/graphql'
import type { CommandContext } from './context'
import type { CommandLike } from './dispatcher'

const featureCheckMap = new Map()
export const registerFeatureCheck = <T extends CommandLike>(
  command: T,
  check: (context: CommandContext, ...args: Parameters<T>) => Promise<void>,
) => {
  featureCheckMap.set(command, check)
}

const faceCheckFeatureNotAvailableError = new Error('Face check feature is not available')

export const performFeatureCheck = async <T extends CommandLike>(context: CommandContext, command: T, args: Parameters<T>) => {
  await featureCheckMap.get(command)?.(context, ...args)
}

export const isFaceCheckSupportEnabled = ({ faceCheckSupport }: { faceCheckSupport?: Maybe<FaceCheckPhotoSupport> }) => {
  if (!faceCheckEnabled && !!faceCheckSupport && faceCheckSupport !== FaceCheckPhotoSupport.None) {
    throw faceCheckFeatureNotAvailableError
  }
}

export const isFaceCheckPhotoEnabled = ({ faceCheckPhoto }: { faceCheckPhoto?: Maybe<string> }) => {
  if (!faceCheckEnabled && !!faceCheckPhoto) {
    throw faceCheckFeatureNotAvailableError
  }
}

export const isFaceCheckPresentationEnabled = ({ requestedCredentials }: Partial<PresentationRequestInput>) => {
  const faceCheckRequested = requestedCredentials?.some((c) => !!c.configuration?.validation?.faceCheck)
  if (!faceCheckEnabled && !!faceCheckRequested) {
    throw faceCheckFeatureNotAvailableError
  }
}
