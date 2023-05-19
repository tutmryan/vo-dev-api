import { omit } from 'lodash'
import type { CommandContext } from '../../../cqrs/command-context'
import type { Contract, CreateContractInput, UpdateContractInput } from '../../../services/admin.types'
import { ContractEntity } from '../entities/contract-entity'

export async function ProvisionContractCommand(this: CommandContext, id: string) {
  const repository = this.entityManager.getRepository(ContractEntity)

  const contract = await repository.findOneByOrFail({ id })

  let provisionedContract: Contract | undefined = undefined
  if (!contract.externalId) {
    const createContractInput = toCreateContractInput(contract)
    provisionedContract = await this.services.admin.createContract(createContractInput)

    contract.markAsProvisioned({
      externalId: provisionedContract.id,
      user: this.user!.userEntity,
    })
  } else {
    const updateContractInput = toUpdateContractInput(contract)
    await this.services.admin.updateContract(contract.externalId, updateContractInput)

    contract.markAsReprovisioned(this.user!.userEntity)
  }

  return await repository.save(contract)
}

function toCreateContractInput({
  name,
  isPublic,
  validityIntervalInSeconds: validityInterval,
  credentialTypes,
  display: { card, claims, consent, locale },
}: ContractEntity): CreateContractInput {
  const { logo, ...cardRest } = card
  const { image, ...logoRest } = logo
  return {
    name: name,
    availableInVcDirectory: isPublic,
    rules: {
      validityInterval,
      vc: { type: credentialTypes },
      attestations: {
        idTokenHints: [
          {
            required: true,
            mapping: claims.map((x) => ({
              type: x.type,
              required: true,
              outputClaim: x.claim,
              inputClaim: x.claim,
              indexed: false,
            })),
          },
        ],
      },
    },
    displays: [
      {
        locale,
        consent,
        card: { ...cardRest, logo: { ...logoRest, image: image ? image.split(',')[1] : undefined } },
        claims: claims.map(({ claim, type, label, description }) => ({
          label,
          claim: `vc.credentialSubject.${claim}`,
          type,
          description,
        })),
      },
    ],
  }
}

function toUpdateContractInput(contract: ContractEntity): UpdateContractInput {
  // VID API seems to have a bug? in that you can't update the name of a contract
  return omit(toCreateContractInput(contract), 'name')
}
