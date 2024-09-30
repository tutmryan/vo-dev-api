import casual from 'casual'
import { randomUUID } from 'crypto'
import type { AsyncIssuanceContactInput, AsyncIssuanceRequestInput, ContractInput } from '../../../generated/graphql'
import { ContactMethod } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import { executeOperationAsUser } from '../../../test'
import { randomPhoneNumber } from '../../../test/data-generators'
import { buildContractInput, createContract } from '../../contracts/test/create-contract'
import { provisionContract } from '../../contracts/test/provision-contract'
import { createAsyncIssuanceRequestMutation } from './create-async-issuance'

export const credentialType = 'async-issuance-test'
export const externalContractId = randomUUID()
export const faceCheckPhoto = 'data:image/jpeg;base64,ZmFjZS1jaGVjay0xMjM='
export const photoCapturePhoto = 'data:image/jpeg;base64,cGhvdG8tY2FwdHVyZS0xMjM='

export async function givenContract({
  faceCheckSupport,
  claims = [],
}: {
  faceCheckSupport?: ContractInput['faceCheckSupport']
  claims?: ContractInput['display']['claims']
}) {
  const contract = await createContract(
    buildContractInput({
      templateId: null,
      faceCheckSupport,
      credentialTypes: [credentialType],
      display: {
        claims: claims,
      },
    }),
  )

  await provisionContract(contract.id, externalContractId)

  return { contract }
}

export function buildContact(
  singleFactor = false,
  notificationMethod = ContactMethod.Email,
  verificationMethod = ContactMethod.Sms,
): AsyncIssuanceContactInput {
  return singleFactor
    ? {
        notification: {
          value: notificationMethod === ContactMethod.Email ? casual.email : randomPhoneNumber(),
          method: notificationMethod,
        },
      }
    : {
        notification: {
          value: notificationMethod === ContactMethod.Email ? casual.email : randomPhoneNumber(),
          method: notificationMethod,
        },
        verification: {
          value: verificationMethod === ContactMethod.Email ? casual.email : randomPhoneNumber(),
          method: verificationMethod,
        },
      }
}

export async function executeCreateAsyncIssuanceRequestAsIssuer(request: Array<AsyncIssuanceRequestInput>) {
  return await executeOperationAsUser(
    {
      query: createAsyncIssuanceRequestMutation,
      variables: {
        request,
      },
    },
    UserRoles.issuer,
  )
}
