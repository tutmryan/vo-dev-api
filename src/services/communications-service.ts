import type { GraphQLContext } from '../context'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'
import { CommunicationEntity } from '../features/communication/entities/communication-entity'
import { CommunicationPurpose, ContactMethod } from '../generated/graphql'
import type { Logger } from '../logger'
import { sendIssuanceEmail, sendVerificationCodeEmail } from '../util/email'
import { sendSms } from '../util/sms'

export type IssuanceCommunicationData = CommunicationData & {
  issuanceUrl: string
  contractName: string
}

export type VerificationCommunicationData = CommunicationData & {
  verificationCode: string
  codeExpiryMinutes: number
}

type CommunicationData = Pick<CommunicationEntity, 'contactMethod' | 'recipientId' | 'createdById'> & {
  asyncIssuanceId: string
}

export class CommunicationsService {
  constructor(private readonly logger: Logger) {}

  async sendIssuance(
    to: string,
    { contactMethod, recipientId, createdById, asyncIssuanceId, issuanceUrl, contractName }: IssuanceCommunicationData,
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    if (contactMethod === ContactMethod.Email) {
      await sendIssuanceEmail({
        to,
        issuanceUrl,
        preheaderCredentialName: contractName,
        credentialName: contractName,
      })
    } else {
      await sendSms(to, `You have been issued a ${contractName} credential.\n\nAccept it here: ${issuanceUrl}`)
    }

    await this.recordCommunication(
      { purpose: CommunicationPurpose.Issuance, contactMethod, recipientId, createdById, asyncIssuanceId },
      entityManager,
    )
  }

  async sendVerification(
    to: string,
    { contactMethod, recipientId, createdById, asyncIssuanceId, verificationCode, codeExpiryMinutes }: VerificationCommunicationData,
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    if (contactMethod === ContactMethod.Email) {
      await sendVerificationCodeEmail({
        to,
        code: verificationCode,
        preheader: 'Enter verification code to complete issuance',
        instruction: 'Please enter the following verification code to complete your issuance.',
        codeInstruction: `This code will be valid for ${codeExpiryMinutes} minutes.`,
      })
    } else {
      await sendSms(to, `Your issuance verification code is: ${verificationCode}`)
    }

    await this.recordCommunication(
      { purpose: CommunicationPurpose.Verification, contactMethod, recipientId, createdById, asyncIssuanceId },
      entityManager,
    )
  }

  private async recordCommunication(
    { contactMethod, purpose, recipientId, createdById, asyncIssuanceId }: CommunicationData & { purpose: CommunicationPurpose },
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    await entityManager.getRepository(CommunicationEntity).save(
      new CommunicationEntity({
        contactMethod,
        purpose,
        recipientId,
        asyncIssuanceId,
        createdById,
      }),
    )
  }
}
