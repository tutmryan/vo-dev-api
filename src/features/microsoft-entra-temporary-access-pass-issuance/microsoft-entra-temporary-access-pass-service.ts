import { AuditEvents } from '../../audit-types'
import { dataSource } from '../../data'
import { logger } from '../../logger'
import { consumeRateLimit } from '../../rate-limiter'
import { rateLimiter } from '../../redis/rate-limiter'
import { graphServiceManager } from '../../services/graph-service'
import { Lazy } from '../../util/lazy'
import type { IdentityEntity } from '../identity/entities/identity-entity'

import { MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity } from './entities/microsoft-entra-temporary-access-pass-issuance-configuration-entity'
import { MicrosoftEntraTemporaryAccessPassIssuanceEntity } from './entities/microsoft-entra-temporary-access-pass-issuance-entity'

const microsoftEntraTemporaryAccessPassIssuanceLimiter = Lazy(() =>
  rateLimiter({
    points: 5,
    duration: 1 * 60,
    keyPrefix: 'rate-limit-microsoft-entra-temporary-access-pass-issuance',
  }),
)

export class MicrosoftEntraTemporaryAccessPassService {
  async getAvailableMicrosoftEntraTemporaryAccessPassConfig(
    identity: IdentityEntity,
  ): Promise<MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity | null> {
    const qb = dataSource
      .getRepository(MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity)
      .createQueryBuilder('config')
      .innerJoinAndSelect('config.identityStore', 'store')
      .where('config.enabled = :enabled', { enabled: true })

    qb.andWhere('store.id = :storeId', { storeId: identity.identityStoreId })

    return qb.getOne()
  }

  async getAvailableSelfServiceActions(identity: IdentityEntity) {
    const config = await this.getAvailableMicrosoftEntraTemporaryAccessPassConfig(identity)

    if (!config || !config.identityStoreId) {
      return []
    }

    const service = await graphServiceManager.get(config.identityStoreId)

    let unavailableReason: string | undefined
    let enabled = true

    if (!service) {
      enabled = false
      unavailableReason = 'Service not configured for this tenant.'
    }

    return [
      {
        id: config.id,
        title: config.title,
        description: config.description ?? undefined,
        enabled,
        unavailableReason,
        identityStore: config.identityStore,
      },
    ]
  }

  async issueTemporaryAccessPass(identity: IdentityEntity) {
    await consumeRateLimit(
      await microsoftEntraTemporaryAccessPassIssuanceLimiter(),
      identity.id,
      undefined,
      'Too many Temporary Access Pass issuance attempts. Please try again later.',
    )

    const config = await this.getAvailableMicrosoftEntraTemporaryAccessPassConfig(identity)

    if (!config || !config.identityStoreId) {
      throw new Error('No Temporary Access Pass configuration found for this identity.')
    }

    const targetOid = identity.identifier
    const identityId = identity.id
    const service = await graphServiceManager.get(config.identityStoreId)

    if (!service) {
      // It might be that the store is not Entra, or not configured with secrets
      throw new Error(
        `No Graph Service configured for Identity Store ${config.identityStoreId}. Ensure it is an Entra store and properly configured.`,
      )
    }

    try {
      const tap = await service.createTemporaryAccessPass({
        userId: targetOid,
        lifetimeInMinutes: config.lifetimeMinutes ?? 10,
        isUsableOnce: config.isUsableOnce ?? true,
      })

      const issuance = new MicrosoftEntraTemporaryAccessPassIssuanceEntity()
      issuance.identityStoreId = config.identityStoreId!
      issuance.identityId = identityId
      issuance.externalId = tap.id
      issuance.createdDateTime = tap.createdDateTime ? new Date(tap.createdDateTime) : null
      issuance.startDateTime = tap.startDateTime ? new Date(tap.startDateTime) : null
      issuance.isUsableOnce = tap.isUsableOnce
      issuance.issuedAt = new Date()

      if (tap.startDateTime && tap.lifetimeInMinutes) {
        const start = new Date(tap.startDateTime)
        issuance.expirationTime = new Date(start.getTime() + tap.lifetimeInMinutes * 60000)
      }

      await dataSource.getRepository(MicrosoftEntraTemporaryAccessPassIssuanceEntity).save(issuance)

      logger.info(`Issued Temporary Access Pass for identity ${identity.id}`)

      return tap
    } catch (error: any) {
      logger.error(`Failed to issue Temporary Access Pass for identity ${identity.id}`, error)
      logger.auditEvent(AuditEvents.MICROSOFT_ENTRA_TEMPORARY_ACCESS_PASS_SELF_ISSUANCE_FAILED, {
        targetIdentityId: identity.id,
      })

      if (error?.message?.includes('Temporary Access Pass cannot be added to an external guest user')) {
        throw new Error('Cannot issue Temporary Access Pass to Guest Users. Please use a Member account.')
      }
      if (error?.message?.includes('Converged UserCredentialPolicy does not allow creating or updating')) {
        throw new Error(
          'The Temporary Access Pass policy is completely disabled or restricts this user. Please check the Authentication Methods policy in Entra ID.',
        )
      }
      throw error
    }
  }
}

export const microsoftEntraTemporaryAccessPassService = new MicrosoftEntraTemporaryAccessPassService()
