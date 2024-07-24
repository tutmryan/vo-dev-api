import { graphql } from '../../../generated'
import { AppRoles } from '../../../roles'
import { executeOperationAsApp } from '../../../test'
import { Lazy } from '../../../util/lazy'
import { createContract, getDefaultContractInput } from '../../contracts/test/create-contract'
import { createIdentity, createIdentityInput } from '../../identity/create-update-identity.test'

export const validPhotoDataUrl = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAATYAAAE2CAYAAADrvL6pAAAACXBI'
export const pngPhotoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATYAAAE2CAYAAADrvL6pAAAACXBI'

export const createPhotoCaptureRequestMutation = graphql(`
  mutation CreatePhotoCaptureRequest($request: PhotoCaptureRequest!) {
    createPhotoCaptureRequest(request: $request) {
      id
      photoCaptureUrl
      photoCaptureQrCode
    }
  }
`)

export const capturePhotoMutation = graphql(`
  mutation CapturePhoto($photoCaptureRequestId: UUID!, $photo: String!) {
    capturePhoto(photoCaptureRequestId: $photoCaptureRequestId, photo: $photo)
  }
`)

export const setupPhotoCaptureData = Lazy(async () => {
  const [contract, identity] = await Promise.all([createContract(getDefaultContractInput()), createIdentity(createIdentityInput())])
  return { contract, identity }
})

export async function createPhotoCaptureRequest() {
  const { contract, identity } = await setupPhotoCaptureData()

  return executeOperationAsApp(
    {
      query: createPhotoCaptureRequestMutation,
      variables: {
        request: {
          contractId: contract.id,
          identityId: identity.id,
        },
      },
    },
    AppRoles.issue,
  )
}
