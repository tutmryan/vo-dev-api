import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'
import { getIssuanceSmsStatusCallbackUrl, getVerificationSmsStatusCallbackUrl } from '../features/async-issuance/sms-status-callback'
import { CommunicationEntity } from '../features/communication/entities/communication-entity'
import { CommunicationPurpose, ContactMethod } from '../generated/graphql'
import type { Logger } from '../logger'
import { sendIssuanceEmail, sendVerificationCodeEmail } from '../util/email'
import { sendSms } from '../util/sms'

export type IssuanceCommunicationData = CommunicationData & {
  contractName: string
  identityName: string
  issuer: string
  issuanceUrl: string
  expiry: string
  verificationMethod: string
}

export type VerificationCommunicationData = CommunicationData & {
  contractName: string
  identityName: string
  issuer: string
  verificationCode: string
  codeExpiryMinutes: number
}

export class CommunicationError extends Error {
  constructor(
    message: string,
    public error: Error,
    public communicationData: CommunicationData,
  ) {
    super(message)
    this.name = 'CommunicationError'
  }
}

type CommunicationData = Pick<CommunicationEntity, 'contactMethod' | 'recipientId' | 'createdById'> & {
  asyncIssuanceId: string
}

export class CommunicationsService {
  constructor(private readonly logger: Logger) {}

  async sendIssuance(
    to: string,
    {
      contactMethod,
      recipientId,
      createdById,
      asyncIssuanceId,
      issuanceUrl,
      contractName,
      identityName,
      issuer,
      expiry,
      verificationMethod,
    }: IssuanceCommunicationData,
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    return await this.trySendCommunication(
      async () => {
        if (contactMethod === ContactMethod.Email) {
          await sendIssuanceEmail({
            to,
            subjectCredentialName: contractName,
            subjectOrganisation: issuer,
            preheaderIdentityName: identityName,
            preheaderOrganisation: issuer,
            preheaderCredentialName: contractName,
            credentialName: contractName,
            verificationMethod,
            identityName,
            issuer,
            issuerContact: issuer,
            issuerTeam: issuer,
            expiry,
            issuanceUrl,
          })
        } else {
          await sendSms(
            to,
            `Dear ${identityName}, ${issuer} initiated the issuance of a ${contractName} digital credential to you.\n\nAccept it here: ${issuanceUrl}`,
            getIssuanceSmsStatusCallbackUrl(asyncIssuanceId),
          )
        }
      },
      { purpose: CommunicationPurpose.Issuance, contactMethod, recipientId, createdById, asyncIssuanceId },
      entityManager,
    )
  }

  async sendVerification(
    to: string,
    {
      contactMethod,
      recipientId,
      createdById,
      asyncIssuanceId,
      verificationCode,
      codeExpiryMinutes,
      contractName,
      identityName,
      issuer,
    }: VerificationCommunicationData,
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    return this.trySendCommunication(
      async () => {
        if (contactMethod === ContactMethod.Email) {
          await sendVerificationCodeEmail({
            to,
            code: verificationCode,
            codeLifetimeMinutes: `${codeExpiryMinutes}`,
            preheaderIdentityName: identityName,
            identityName,
            issuerContact: issuer,
            credentialName: contractName,
            issuerTeam: issuer,
          })
        } else {
          await sendSms(to, `Your issuance verification code is: ${verificationCode}`, getVerificationSmsStatusCallbackUrl(asyncIssuanceId))
        }
      },
      { purpose: CommunicationPurpose.Verification, contactMethod, recipientId, createdById, asyncIssuanceId },
      entityManager,
    )
  }

  private async trySendCommunication(
    send: () => Promise<void>,
    communicationData: CommunicationData & { purpose: CommunicationPurpose },
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    try {
      await send()
      return await this.recordCommunication(communicationData, entityManager)
    } catch (error) {
      this.logger.error(`Failed to send ${communicationData.purpose}`, error)
      throw new CommunicationError(
        `Failed to send ${communicationData.purpose} due to an error: ${error}`,
        error instanceof Error ? error : new Error(`${error}`),
        communicationData,
      )
    }
  }

  async recordCommunicationFailure(error: CommunicationError, entityManager: VerifiedOrchestrationEntityManager) {
    await this.recordCommunication(
      {
        purpose: CommunicationPurpose.Verification,
        contactMethod: error.communicationData.contactMethod,
        recipientId: error.communicationData.recipientId,
        createdById: error.communicationData.createdById,
        asyncIssuanceId: error.communicationData.asyncIssuanceId,
      },
      entityManager,
      error.error.message,
    )
  }

  private async recordCommunication(
    { contactMethod, purpose, recipientId, createdById, asyncIssuanceId }: CommunicationData & { purpose: CommunicationPurpose },
    entityManager: VerifiedOrchestrationEntityManager,
    error?: string,
  ) {
    await entityManager.getRepository(CommunicationEntity).save(
      new CommunicationEntity({
        contactMethod,
        purpose,
        recipientId,
        asyncIssuanceId,
        createdById,
        error,
      }),
    )
  }
}
