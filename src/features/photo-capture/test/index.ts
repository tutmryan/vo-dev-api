import { graphql } from '../../../generated'
import type { PhotoCaptureRequest } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import { executeOperationAsApp, executeOperationAsLimitedPhotoCaptureClient } from '../../../test'
import { createContract, getDefaultContractInput } from '../../contracts/test/create-contract'
import { createIdentity, createIdentityInput } from '../../identity/tests/create-identity'

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

export async function capturePhoto(request: { photo: string; photoCaptureRequestId: string; contractId: string; identityId: string }) {
  const { photo, photoCaptureRequestId, contractId, identityId } = request
  return await executeOperationAsLimitedPhotoCaptureClient(
    {
      query: capturePhotoMutation,
      variables: {
        photoCaptureRequestId,
        photo,
      },
    },
    {
      contractId,
      identityId,
      photoCaptureRequestId,
    },
  )
}

export const setupPhotoCaptureData = async () => {
  const [contract, identity] = await Promise.all([createContract(getDefaultContractInput()), createIdentity(createIdentityInput())])
  return { contract, identity }
}

export async function createPhotoCaptureRequest(request?: PhotoCaptureRequest) {
  if (!request) {
    const { contract, identity } = await setupPhotoCaptureData()
    request = {
      contractId: contract.id,
      identityId: identity.id,
    }
  }

  return executeOperationAsApp(
    {
      query: createPhotoCaptureRequestMutation,
      variables: {
        request,
      },
    },
    AppRoles.issue,
  )
}
