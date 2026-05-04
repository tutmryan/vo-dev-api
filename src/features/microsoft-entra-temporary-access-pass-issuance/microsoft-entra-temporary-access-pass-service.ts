import { AuditEvents } from '../../audit-types'
import { dataSource } from '../../data'
import { logger } from '../../logger'
import { consumeRateLimit } from '../../rate-limiter'
import { rateLimiter } from '../../redis/rate-limiter'
import type { GraphService } from '../../services/graph-service'
import { graphServiceManager } from '../../services/graph-service'
import { Lazy } from '../../util/lazy'
import type { IdentityEntity } from '../identity/entities/identity-entity'

import { MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity } from './entities/microsoft-entra-temporary-access-pass-issuance-configuration-entity'
import { MicrosoftEntraTemporaryAccessPassIssuanceEntity } from './entities/microsoft-entra-temporary-access-pass-issuance-entity'
import { SelfServiceActionUnavailableReason } from '../../generated/graphql'

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
      // Removed config.enabled = true filter to allow returning disabled actions with reasons
      .where('store.id = :storeId', { storeId: identity.identityStoreId })

    return qb.getOne()
  }

  async getAvailableSelfServiceActions(identity: IdentityEntity) {
    try {
      await graphServiceManager.init()
      const config = await this.getAvailableMicrosoftEntraTemporaryAccessPassConfig(identity)

      if (!config || !config.identityStoreId) {
        return []
      }

      const service = await graphServiceManager.get(config.identityStoreId)
      let unavailableReason: string | undefined
      let isEligible = true
      let unavailableReasonCode: SelfServiceActionUnavailableReason | undefined

      if (!service) {
        isEligible = false
        unavailableReason = `Service not configured for identity store ${config.identityStoreId}.`
        unavailableReasonCode = SelfServiceActionUnavailableReason.ServiceNotConfigured
      } else {
        const eligibility = await this.checkEligibility(identity, service)

        if (!eligibility.eligible) {
          isEligible = false
          unavailableReason = eligibility.reason
          unavailableReasonCode = eligibility.reasonCode as SelfServiceActionUnavailableReason
        }
      }

      const enabled = config.enabled
      if (!enabled && isEligible) {
        unavailableReason = 'Self-service Temporary Access Pass issuance is currently disabled.'
        unavailableReasonCode = SelfServiceActionUnavailableReason.SelfServiceDisabled
      }

      return [
        {
          id: config.id,
          title: config.title,
          description: config.description ?? undefined,
          enabled,
          isEligible,
          unavailableReason,
          unavailableReasonCode,
          identityStore: config.identityStore,
        },
      ]
    } catch (error) {
      logger.error('Failed to check TAP eligibility', { error })
      return []
    }
  }

  private async checkEligibility(
    identity: IdentityEntity,
    service: GraphService,
  ): Promise<{ eligible: boolean; reason?: string; reasonCode?: string }> {
    const user = await service.getUserById(identity.identifier)

    if (!user) {
      return { eligible: false, reason: 'User not found in Entra ID.', reasonCode: 'USER_NOT_FOUND' }
    }

    if (user.userType && user.userType !== 'Member') {
      return {
        eligible: false,
        reason: 'Guest users are not eligible for self-service Temporary Access Pass.',
        reasonCode: 'GUEST_USER_NOT_ELIGIBLE',
      }
    }

    const eligibility = await service.checkUserTapEligibility(identity.identifier)
    if (!eligibility.isEligible) {
      let reason = 'You are not eligible for self-service Temporary Access Pass.'
      if (eligibility.reason === 'policy_disabled') {
        reason = 'Temporary Access Pass is disabled for your organisation.'
      } else if (eligibility.reason === 'user_excluded' || eligibility.reason === 'user_excluded_via_group') {
        reason = 'You are explicitly excluded from using Temporary Access Pass by policy.'
      } else if (eligibility.reason === 'user_not_included') {
        reason = "You are not authorised to use Temporary Access Pass according to your organisation's policy."
      } else if (eligibility.reason === 'missing_permissions') {
        reason = 'Missing permissions to check TAP eligibility. Please contact your administrator.'
      } else if (eligibility.reason === 'policy_not_found') {
        reason = 'Temporary Access Pass policy not found in your organisation.'
      }
      return {
        eligible: false,
        reason,
        reasonCode: eligibility.reason?.toUpperCase().replace(/_VIA_GROUP$/, '') as SelfServiceActionUnavailableReason,
      }
    }

    const activeTap = await service.getActiveUnusedTap(identity.identifier)

    if (activeTap) {
      return { eligible: false, reason: 'You already have an active Temporary Access Pass.', reasonCode: 'ALREADY_HAS_ACTIVE_TAP' }
    }

    return { eligible: true }
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

    if (!config.enabled) {
      throw new Error('Self-service Temporary Access Pass issuance is currently disabled.')
    }

    const targetOid = identity.identifier
    const identityId = identity.id
    const service = await graphServiceManager.get(config.identityStoreId)

    if (!service) {
      throw new Error(
        `No Graph Service configured for Identity Store ${config.identityStoreId}. Ensure it is an Entra store and properly configured.`,
      )
    }

    const eligibility = await this.checkEligibility(identity, service)

    if (!eligibility.eligible) {
      throw new Error(eligibility.reason)
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Failed to issue Temporary Access Pass for identity ${identity.id}`, { error: errorMessage })
      logger.auditEvent(AuditEvents.MICROSOFT_ENTRA_TEMPORARY_ACCESS_PASS_SELF_ISSUANCE_FAILED, {
        targetIdentityId: identity.id,
        identityStoreId: config.identityStoreId,
        error: errorMessage,
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
