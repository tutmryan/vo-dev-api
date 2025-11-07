import { email } from '../config'
import { getEmailSenderConfig } from '../features/instance-configs'
import { sendEmailMock } from '../test/mocks'
import { sendIssuanceEmail } from './communications-service'

function getIssuanceEmailTestData(overrides = {}) {
  return {
    to: 'recipient@example.com',
    asyncIssuanceId: '123',
    subjectCredentialName: 'Test Credential',
    subjectOrganisation: 'Test Org',
    preheaderIdentityName: 'Test Identity',
    preheaderOrganisation: 'Test Org',
    preheaderCredentialName: 'Test Credential',
    credentialName: 'Test Credential',
    verificationMethod: 'email',
    identityName: 'Test Identity',
    issuer: 'Test Org',
    issuerContact: 'Test Org',
    issuerTeam: 'Test Org',
    expiry: '2025-01-01T00:00:00Z',
    issuanceUrl: 'https://example.com/issuance',
    ...overrides,
  }
}

describe('sendIssuanceEmail from field', () => {
  it('calls with defaults sender config has not been set', async () => {
    await sendIssuanceEmail(getIssuanceEmailTestData())

    expect(sendEmailMock).toHaveBeenCalledWith(
      'recipient@example.com',
      expect.objectContaining({
        from: { name: email.from.name, email: email.from.email },
      }),
      'https://test.api.verifiedorchestration.com/external/callback/email/async-issuance/issuance/123',
    )
  })

  it('uses emailSenderConfig if set', async () => {
    const senderConfig = getEmailSenderConfig()
    senderConfig.senderName = 'Test Sender'
    senderConfig.senderEmail = 'test@sender.com'

    await sendIssuanceEmail(getIssuanceEmailTestData())
    expect(sendEmailMock).toHaveBeenCalledWith(
      'recipient@example.com',
      expect.objectContaining({
        from: { name: 'Test Sender', email: 'test@sender.com' },
      }),
      'https://test.api.verifiedorchestration.com/external/callback/email/async-issuance/issuance/123',
    )
  })
})
