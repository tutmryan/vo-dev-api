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
    claim: 'no-default-value-number-claim',
    label: 'no-default-value-number-label',
    type: ClaimType.Number,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'no-default-value-boolean-claim',
    label: 'no-default-value-boolean-label',
    type: ClaimType.Boolean,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'no-default-value-date-claim',
    label: 'no-default-value-date-label',
    type: ClaimType.Date,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'no-default-value-datetime-claim',
    label: 'no-default-value-datetime-label',
    type: ClaimType.DateTime,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'no-default-value-email-claim',
    label: 'no-default-value-email-label',
    type: ClaimType.Email,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'no-default-value-image-claim',
    label: 'no-default-value-image-label',
    type: ClaimType.Image,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'no-default-value-phone-claim',
    label: 'no-default-value-phone-label',
    type: ClaimType.Phone,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'no-default-value-url-claim',
    label: 'no-default-value-url-label',
    type: ClaimType.Url,
    value: undefined,
    isOptional: false,
  },
  {
    claim: 'no-default-value-regex-claim',
    label: 'no-default-value-regex-label',
    type: ClaimType.Regex,
    value: undefined,
    isOptional: false,
    validation: { regex: { pattern: '^[a-zA-Z0-9]+$' } },
  },
  {
    claim: 'no-default-value-list-claim',
    label: 'no-default-value-list-label',
    type: ClaimType.List,
    value: undefined,
    isOptional: false,
    validation: { list: { values: ['Option1', 'Option2', 'Option3'] } },
  },
  {
    claim: 'optional-number-claim',
    label: 'optional-number-label',
    type: ClaimType.Number,
    value: undefined,
    isOptional: true,
  },
]

export const validAdditonalClaimsInput: Record<string, unknown> = {
  'no-default-value-number-claim': '1',
  'no-default-value-boolean-claim': 'true',
  'no-default-value-date-claim': '2023-10-28',
  'no-default-value-datetime-claim': '2023-10-28T15:45:00Z',
  'no-default-value-email-claim': 'test@example.com',
  'no-default-value-image-claim': 'data:image/jpeg;base64,ZmFjZS1jaGVjay0xMjM=',
  'no-default-value-phone-claim': '+61412345678',
  'no-default-value-url-claim': 'https://example.com',
  'no-default-value-regex-claim': 'abc123',
  'no-default-value-list-claim': 'Option1',
  'optional-number-claim': undefined,
}
