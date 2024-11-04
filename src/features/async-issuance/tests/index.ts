import casual from 'casual'
import { randomUUID } from 'crypto'
import type { AsyncIssuanceContactInput, AsyncIssuanceRequestInput, ContractInput } from '../../../generated/graphql'
import { ClaimType, ContactMethod } from '../../../generated/graphql'
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

export const additonalContractClaims = [
  {
    claim: 'unfixed-integer-claim',
    label: 'unfixed-integer-label',
    type: ClaimType.Int,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'unfixed-float-claim',
    label: 'unfixed-float-label',
    type: ClaimType.Float,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'unfixed-boolean-claim',
    label: 'unfixed-boolean-label',
    type: ClaimType.Boolean,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'unfixed-date-claim',
    label: 'unfixed-date-label',
    type: ClaimType.Date,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'unfixed-datetime-claim',
    label: 'unfixed-datetime-label',
    type: ClaimType.DateTime,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'unfixed-email-claim',
    label: 'unfixed-email-label',
    type: ClaimType.Email,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'unfixed-image-claim',
    label: 'unfixed-image-label',
    type: ClaimType.Image,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'unfixed-phone-claim',
    label: 'unfixed-phone-label',
    type: ClaimType.Phone,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'unfixed-url-claim',
    label: 'unfixed-url-label',
    type: ClaimType.Url,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'unfixed-regex-claim',
    label: 'unfixed-regex-label',
    type: ClaimType.Regex,
    value: undefined,
    isOptional: false,
    validation: { regex: { pattern: '^[a-zA-Z0-9]+$' } },
  },
  {
    claim: 'unfixed-list-claim',
    label: 'unfixed-list-label',
    type: ClaimType.List,
    value: undefined,
    isOptional: false,
    validation: { list: { values: ['Option1', 'Option2', 'Option3'] } },
  },
  {
    claim: 'optional-integer-claim',
    label: 'optional-integer-label',
    type: ClaimType.Int,
    value: undefined,
    isOptional: true,
  },
]

export const validAdditonalContractClaims: Record<string, unknown> = {
  'unfixed-integer-claim': '1',
  'unfixed-float-claim': '1.1',
  'unfixed-boolean-claim': 'true',
  'unfixed-date-claim': '2023-10-28',
  'unfixed-datetime-claim': '2023-10-28T15:45:00Z',
  'unfixed-email-claim': 'test@example.com',
  'unfixed-image-claim': 'data:image/jpeg;base64,ZmFjZS1jaGVjay0xMjM=',
  'unfixed-phone-claim': '+1234567890',
  'unfixed-url-claim': 'https://example.com',
  'unfixed-regex-claim': 'abc123',
  'unfixed-list-claim': 'Option1',
  'optional-integer-claim': undefined,
}
