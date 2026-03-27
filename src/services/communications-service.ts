import type { MailDataRequired } from '@sendgrid/mail'
import { email } from '../config'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'
import { getIssuanceEmailStatusCallbackUrl, getVerificationEmailStatusCallbackUrl } from '../features/async-issuance/email-status-callback'
import { getIssuanceSmsStatusCallbackUrl, getVerificationSmsStatusCallbackUrl } from '../features/async-issuance/sms-status-callback'
import { CommunicationEntity } from '../features/communication/entities/communication-entity'
import { getEmailSenderConfig } from '../features/instance-configs'
import { getPresentationFlowEmailStatusCallbackUrl } from '../features/presentation-flow/email-status-callback'
import { getPresentationFlowSmsStatusCallbackUrl } from '../features/presentation-flow/sms-status-callback'
import { CommunicationPurpose, CommunicationStatus, ContactMethod } from '../generated/graphql'
import type { Logger } from '../logger'
import { sendEmail } from '../util/email'
import { sendSms } from '../util/sms'

type CommunicationData = Pick<CommunicationEntity, 'contactMethod' | 'recipientId' | 'createdById'>

type AsyncIssuanceCommunicationData = CommunicationData & {
  asyncIssuanceId: string
}

export type IssuanceCommunicationData = AsyncIssuanceCommunicationData & {
  contractName: string
  identityName: string
  issuer: string
  issuanceUrl: string
  expiry: string
  verificationMethod: string
}

export type VerificationCommunicationData = AsyncIssuanceCommunicationData & {
  contractName: string
  identityName: string
  issuer: string
  verificationCode: string
  codeExpiryMinutes: number
}

export type PresentationFlowCommunicationData = CommunicationData & {
  presentationFlowId: string
  presentationFlowUrl: string
  title: string
  requestor: string
  identityName: string
}

export class CommunicationError<TData extends CommunicationData> extends Error {
  constructor(
    message: string,
    public error: Error,
    public communicationData: TData,
  ) {
    super(message)
    this.name = 'CommunicationError'
  }
}

interface IssuanceEmailTemplateData {
  subjectOrganisation: string
  subjectCredentialName: string
  preheaderIdentityName: string
  preheaderOrganisation: string
  preheaderCredentialName: string
  identityName: string
  issuer: string
  credentialName: string
  verificationMethod: string
  expiry: string
  issuerContact: string
  issuerTeam: string
  issuanceUrl: string
}

function getFromField() {
  const { senderName, senderEmail } = getEmailSenderConfig()
  return {
    name: senderName,
    email: senderEmail,
  }
}

export const sendIssuanceEmail = async ({
  to,
  asyncIssuanceId,
  ...dynamicTemplateData
}: {
  to: MailDataRequired['to']
  asyncIssuanceId: string
} & IssuanceEmailTemplateData) => {
  const from = getFromField()
  const data = {
    templateId: email.templates.issuance.id,
    asm: email.templates.issuance.asm,
    from,
    personalizations: [
      {
        to,
        dynamicTemplateData,
      },
    ],
  } as MailDataRequired
  await sendEmail(to, data, getIssuanceEmailStatusCallbackUrl(asyncIssuanceId))
}

interface VerificationCodeTemplateData {
  preheaderIdentityName: string
  identityName: string
  credentialName: string
  code: string
  codeLifetimeMinutes: string
  issuerContact: string
  issuerTeam: string
}

const sendVerificationCodeEmail = async ({
  to,
  asyncIssuanceId,
  ...dynamicTemplateData
}: {
  to: MailDataRequired['to']
  asyncIssuanceId: string
} & VerificationCodeTemplateData) => {
  const from = getFromField()
  const data = {
    templateId: email.templates.verification.id,
    asm: email.templates.verification.asm,
    from,
    personalizations: [
      {
        to,
        dynamicTemplateData,
      },
    ],
  } as MailDataRequired
  await sendEmail(to, data, getVerificationEmailStatusCallbackUrl(asyncIssuanceId))
}

interface PresentationFlowEmailTemplateData {
  subjectTitle: string
  subjectRequestor: string
  preheaderTitle: string
  preheaderRequestor: string
  identityName: string
  requestor: string
  title: string
  presentationFlowUrl: string
}

const sendPresentationFlowEmail = async ({
  to,
  presentationFlowId,
  ...dynamicTemplateData
}: {
  to: MailDataRequired['to']
  presentationFlowId: string
} & PresentationFlowEmailTemplateData) => {
  const from = getFromField()
  const data = {
    templateId: email.templates.presentationFlow.id,
    asm: email.templates.presentationFlow.asm,
    from,
    personalizations: [
      {
        to,
        dynamicTemplateData,
      },
    ],
  } as MailDataRequired
  await sendEmail(to, data, getPresentationFlowEmailStatusCallbackUrl(presentationFlowId))
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
            asyncIssuanceId,
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
            asyncIssuanceId,
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

  async sendPresentationFlow(
    to: string,
    {
      contactMethod,
      recipientId,
      createdById,
      presentationFlowId,
      presentationFlowUrl,
      title,
      requestor,
      identityName,
    }: PresentationFlowCommunicationData,
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    return await this.trySendPresentationFlowCommunication(
      async () => {
        if (contactMethod === ContactMethod.Email) {
          await sendPresentationFlowEmail({
            to,
            presentationFlowId,
            subjectTitle: title,
            preheaderTitle: title,
            title,
            subjectRequestor: requestor,
            preheaderRequestor: requestor,
            requestor,
            identityName,
            presentationFlowUrl,
          })
        } else {
          const message = `${identityName ? `Dear ${identityName}, you` : 'You'} have a pending ${title} from ${requestor}. Action it here: ${presentationFlowUrl}`
          await sendSms(to, message, getPresentationFlowSmsStatusCallbackUrl(presentationFlowId))
        }
      },
      {
        purpose: CommunicationPurpose.PresentationFlow,
        contactMethod,
        recipientId,
        createdById,
        presentationFlowId,
        presentationFlowUrl,
        title,
        requestor,
        identityName,
      },
      entityManager,
    )
  }

  private async trySendCommunication(
    send: () => Promise<void>,
    communicationData: AsyncIssuanceCommunicationData & { purpose: CommunicationPurpose },
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    try {
      await send()
      return await this.recordAsyncIssuanceCommunication(communicationData, entityManager)
    } catch (error) {
      this.logger.error(`Failed to send ${communicationData.purpose}`, error)
      throw new CommunicationError(
        `Failed to send ${communicationData.purpose} due to an error: ${error}`,
        error instanceof Error ? error : new Error(`${error}`),
        communicationData,
      )
    }
  }

  private async trySendPresentationFlowCommunication(
    send: () => Promise<void>,
    communicationData: PresentationFlowCommunicationData & { purpose: CommunicationPurpose.PresentationFlow },
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    try {
      await send()
      return await this.recordPresentationFlowCommunication(communicationData, entityManager)
    } catch (error) {
      this.logger.error(`Failed to send ${communicationData.purpose}`, error)
      throw new CommunicationError(
        `Failed to send ${communicationData.purpose} due to an error: ${error}`,
        error instanceof Error ? error : new Error(`${error}`),
        communicationData,
      )
    }
  }

  private async recordAsyncIssuanceCommunication(
    {
      contactMethod,
      purpose,
      recipientId,
      createdById,
      asyncIssuanceId,
    }: AsyncIssuanceCommunicationData & { purpose: CommunicationPurpose },
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
        status: error ? CommunicationStatus.Failed : CommunicationStatus.Sent,
        details: error,
      }),
    )
  }

  async recordAsyncIssuanceCommunicationFailure<TData extends AsyncIssuanceCommunicationData>(
    error: CommunicationError<TData>,
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    await this.recordAsyncIssuanceCommunication(
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

  private async recordPresentationFlowCommunication(
    {
      contactMethod,
      recipientId,
      createdById,
      presentationFlowId,
    }: Pick<PresentationFlowCommunicationData, 'contactMethod' | 'recipientId' | 'createdById' | 'presentationFlowId'>,
    entityManager: VerifiedOrchestrationEntityManager,
    error?: string,
  ) {
    await entityManager.getRepository(CommunicationEntity).save(
      new CommunicationEntity({
        contactMethod,
        purpose: CommunicationPurpose.PresentationFlow,
        recipientId,
        createdById,
        presentationFlowId,
        status: error ? CommunicationStatus.Failed : CommunicationStatus.Sent,
        details: error,
      }),
    )
  }

  async recordPresentationFlowCommunicationFailure(
    error: CommunicationError<PresentationFlowCommunicationData>,
    entityManager: VerifiedOrchestrationEntityManager,
  ) {
    await this.recordPresentationFlowCommunication(
      {
        contactMethod: error.communicationData.contactMethod,
        recipientId: error.communicationData.recipientId,
        createdById: error.communicationData.createdById,
        presentationFlowId: error.communicationData.presentationFlowId,
      },
      entityManager,
      error.error.message,
    )
  }
}
