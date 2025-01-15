import { omit } from 'lodash'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckSupportEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import { ClaimType, FaceCheckPhotoSupport } from '../../../generated/graphql'
import type { Contract, CreateContractInput, UpdateContractInput } from '../../../services/verified-id'
import { userInvariant } from '../../../util/user-invariant'
import {
  claimTypeImage,
  claimTypeString,
  displayClaimPrefix,
  faceCheckPhotoClaimAttestation,
  faceCheckPhotoDisplayClaim,
  standardClaimAttestations,
  standardContractDislayClaims,
} from '../claims'
import { ContractEntity } from '../entities/contract-entity'

registerFeatureCheck(ProvisionContractCommand, async (context: CommandContext, id: string) => {
  const repository = context.entityManager.getRepository(ContractEntity)

  const contract = await repository.findOneByOrFail({ id })

  isFaceCheckSupportEnabled(contract)
})

export async function ProvisionContractCommand(this: CommandContext, id: string) {
  const repository = this.entityManager.getRepository(ContractEntity)

  userInvariant(this.user)

  const contract = await repository.findOneByOrFail({ id })

  let provisionedContract: Contract | undefined = undefined
  if (!contract.externalId) {
    const createContractInput = toCreateContractInput(contract)
    provisionedContract = await this.services.verifiedIdAdmin.createContract(createContractInput)

    contract.markAsProvisioned({
      externalId: provisionedContract.id,
      user: this.user!.entity,
    })
  } else {
    if (contract.isDeprecated) throw new Error('Contract has been deprecated, it cannot be published again')

    const updateContractInput = toUpdateContractInput(contract)
    await this.services.verifiedIdAdmin.updateContract(contract.externalId, updateContractInput)

    contract.markAsReprovisioned(this.user!.entity)
  }

  return await repository.save(contract)
}

function toCreateContractInput({
  name,
  isPublic,
  validityIntervalInSeconds: validityInterval,
  credentialTypes,
  faceCheckSupport,
  display: { card, claims, consent, locale },
}: ContractEntity): CreateContractInput {
  return {
    name: name,
    availableInVcDirectory: isPublic,
    // This field was introduced in the VID Service API AFTER Issuance.expirationDate, without documentation, as a breaking change.
    // For now, using `true` here restores working use of Issuance.expirationDate as it was, prior to the breaking change.
    allowOverrideValidityIntervalOnIssuance: true,
    rules: {
      validityInterval,
      vc: { type: credentialTypes },
      attestations: {
        idTokenHints: [
          {
            required: true,
            mapping: [
              ...standardClaimAttestations,
              ...(faceCheckSupport === FaceCheckPhotoSupport.None
                ? []
                : [{ ...faceCheckPhotoClaimAttestation, required: faceCheckSupport === FaceCheckPhotoSupport.Required }]),
              ...claims.map(({ claim, isOptional, type }) => ({
                type: type === ClaimType.Image ? claimTypeImage : claimTypeString,
                required: !isOptional,
                outputClaim: claim,
                inputClaim: claim,
                indexed: false,
              })),
            ],
          },
        ],
      },
    },
    displays: [
      {
        locale,
        consent,
        card,
        claims: [
          ...claims.map(({ claim, label, description, isOptional, type }) => ({
            label,
            claim: `${displayClaimPrefix}${claim}`,
            type: type === ClaimType.Image ? claimTypeImage : claimTypeString,
            description,
            required: !isOptional,
          })),
          ...(faceCheckSupport === FaceCheckPhotoSupport.None ? [] : [faceCheckPhotoDisplayClaim]),
          ...standardContractDislayClaims,
        ],
      },
    ],
  }
}

function toUpdateContractInput(contract: ContractEntity): UpdateContractInput {
  // VID API seems to have a bug? in that you can't update the name of a contract
  return omit(toCreateContractInput(contract), 'name')
}
