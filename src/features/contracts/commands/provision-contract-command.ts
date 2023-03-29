import type { CommandContext } from '../../../cqrs/command-context'
import { ContractEntity } from '../entities/contract-entity'
import type { Contract, CreateContractInput, UpdateContractInput } from '../../../services/admin.types'
import { omit, pick } from 'lodash'

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

function toCreateContractInput(contract: ContractEntity): CreateContractInput {
  return {
    name: contract.name,
    availableInVcDirectory: contract.isPublic,
    rules: {
      validityInterval: contract.validityIntervalInSeconds,
      vc: { type: contract.credentialTypes },
      attestations: {
        idTokenHints: [
          {
            required: true,
            mapping: contract.display.claims.map((x) => ({
              type: x.type,
              required: true,
              outputClaim: x.claim,
              inputClaim: `$.${x.claim}`,
              indexed: false,
            })),
          },
        ],
      },
    },
    displays: [
      {
        locale: contract.display.locale,
        consent: contract.display.consent,
        card: contract.display.card,
        claims: contract.display.claims.map((x) => pick(x, 'claim', 'type', 'label', 'description')),
      },
    ],
  }
}

function toUpdateContractInput(contract: ContractEntity): UpdateContractInput {
  return omit(toCreateContractInput(contract), 'name')
}
