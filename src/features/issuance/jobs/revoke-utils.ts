import { omit } from 'lodash'
import { In, type FindOptionsWhere } from 'typeorm'
import type { HandlerContext } from '../../../background-jobs/jobs'
import { ISOLATION_LEVEL, dataSource } from '../../../data'
import { addUserToManager } from '../../../data/user-context-helper'
import { IssuanceStatus } from '../../../generated/graphql'
import type { logger } from '../../../logger'
import type { VerifiedIdAdminService } from '../../../services/verified-id'
import { invariant } from '../../../util/invariant'
import type { ContractEntity } from '../../contracts/entities/contract-entity'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'
import type { UserEntity } from '../../users/entities/user-entity'
import { IssuanceEntity } from '../entities/issuance-entity'

/**
 * Revoke all the issuances that match the given where clause.
 * @param context
 * @param where
 * @param contract When revoking contract issuances, use this arg to optimise and avoid reloading the contract for every issuance.
 */
export const revokeIssuances = async (context: HandlerContext, where: FindOptionsWhere<IssuanceEntity>, contract?: ContractEntity) => {
  const issuances = await dataSource.getRepository(IssuanceEntity).find({ where })
  await revokeIssuanceBatch(context, issuances, contract)
}

/**
 * Revoke all issuances for identities that have presented using the specified wallet.
 * @param context
 */
export const revokeWalletIssuances = async (context: HandlerContext, walletId: string) => {
  const { logger } = context

  const raw = await dataSource
    .getRepository(PresentationEntity)
    .createQueryBuilder('presentation')
    .innerJoin('presentation_issuances', 'pi', 'pi.presentation_id = presentation.id')
    .select('DISTINCT pi.issuance_id', 'issuanceId')
    .where('LOWER(presentation.walletId) = LOWER(:walletId)', { walletId })
    .getRawMany<{ issuanceId: string }>()

  const issuanceIds = raw.map((r) => r.issuanceId)

  if (!issuanceIds.length) {
    logger.warn(`No presented issuances found for walletId: ${walletId}`)
    return
  }

  const issuances = await dataSource.getRepository(IssuanceEntity).find({
    where: { id: In(issuanceIds) },
  })

  await revokeIssuanceBatch(context, issuances)
}

const revokeIssuanceBatch = async (context: HandlerContext, issuances: IssuanceEntity[], contract?: ContractEntity) => {
  const errorMessages: string[] = []
  const {
    logger,
    services: { verifiedIdAdmin },
    user,
  } = context

  invariant(user, 'User is required in worker context for revoking issuances')

  for (let index = 0; index < issuances.length; index++) {
    const issuance = issuances[index]!
    try {
      // if the issuance has been previously revoked, we don't need to proceed further
      if (!issuance.isRevoked) {
        // start a new transaction for each issuance revocation
        await dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
          logger.info(`revoking issuance ${issuance.id}`)

          const result = await revokeIssuance(issuance, verifiedIdAdmin, user, logger, contract)
          if (result) {
            addUserToManager(entityManager, user.id)
            await entityManager.getRepository(IssuanceEntity).save(result)
            logger.audit('Issuance revoked', { issuance: omit(result, '__contract__', '__revokedBy__'), ...context.jobAuditMetadata })
          }
        })
      }
    } catch (err) {
      logger.error(`Error occurred when revoking the issuance ${issuance.id}`, err)
      errorMessages.push(`Error occurred when revoking the issuance ${issuance.id}: ${(err as Error).message}`)
    } finally {
      context.updateProgress(Math.floor(((index + 1) / issuances.length) * 100))
    }
  }
  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'))
  }
}

const revokeIssuance = async (
  issuance: IssuanceEntity,
  verifiedIdAdminService: VerifiedIdAdminService,
  user: UserEntity,
  log: typeof logger,
  contract?: ContractEntity,
) => {
  const contractExternalId = contract?.externalId ?? (await issuance.contract).externalId
  invariant(contractExternalId, 'Contract must have been provisioned for an issuance to exist')

  const credential = await verifiedIdAdminService.findCredential(contractExternalId, issuance.id)
  if (!credential && issuance.status === IssuanceStatus.Expired) {
    log.warn(`Expired credential with issuance id ${issuance.id} could not be found`)
    return null
  }

  invariant(credential, 'Credential with issuance id as an index claim could not be found')
  await verifiedIdAdminService.revokeCredential(contractExternalId, credential.id)

  issuance.markAsRevoked(user)
  return issuance
}
