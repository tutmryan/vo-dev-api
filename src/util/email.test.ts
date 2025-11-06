import { EmailJSON } from '@sendgrid/helpers/classes/email-address'
import { email } from '../config'
import { getEmailSenderConfig } from '../features/instance-configs'
import * as emailUtil from './email'
import { extractEmails, sendEmail, sendIssuanceEmail } from './email'

jest.spyOn(emailUtil, 'sendEmail').mockImplementation(jest.fn())

function getIssuanceEmailTestData(overrides = {}) {
  return {
    to: 'recipient@example.com',
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

describe('extractEmails', () => {
  it('returns empty arrays when no emails are provided', () => {
    // Arrange

    // Act
    const result = extractEmails(undefined, 'allow', ['*@test.com'])

    // Assert
    expect(result).toEqual({ blocked: [], allowed: [] })
  })
  describe('when using allow mode', () => {
    it('correctly identifies allowed emails', () => {
      // Arrange
      const to = ['a@a.com', 'b@b.com']
      const toObjectBased = [{ email: 'a@a.com' }, { email: 'b@b.com' }] satisfies EmailJSON[]
      const allowList = ['*@a.com', 'b@b.com']

      // Act
      const result = extractEmails(to, 'allow', allowList)
      const resultObjectBased = extractEmails(toObjectBased, 'allow', allowList)

      // Assert
      expect(result).toEqual({ blocked: [], allowed: to })
      expect(resultObjectBased).toEqual({ blocked: [], allowed: toObjectBased })
    })
    it('correctly identifies blocked emails', () => {
      // Arrange
      const to = ['a@a.com', 'b@b.com']
      const toObjectBased = [{ email: 'a@a.com' }, { email: 'b@b.com' }] satisfies EmailJSON[]
      const allowList = ['*@c.com', 'c@b.com']

      // Act
      const result = extractEmails(to, 'allow', allowList)
      const resultObjectBased = extractEmails(toObjectBased, 'allow', allowList)

      // Assert
      expect(result).toEqual({ blocked: to, allowed: [] })
      expect(resultObjectBased).toEqual({ blocked: toObjectBased, allowed: [] })
    })
  })
  describe('when using block mode', () => {
    it('correctly identifies allowed emails', () => {
      // Arrange
      const to = ['a@a.com', 'b@b.com']
      const toObjectBased = [{ email: 'a@a.com' }, { email: 'b@b.com' }] satisfies EmailJSON[]
      const blockList = ['*@a.com', 'b@b.com']

      // Act
      const result = extractEmails(to, 'block', blockList)
      const resultObjectBased = extractEmails(toObjectBased, 'block', blockList)

      // Assert
      expect(result).toEqual({ blocked: to, allowed: [] })
      expect(resultObjectBased).toEqual({ blocked: toObjectBased, allowed: [] })
    })
    it('correctly identifies blocked emails', () => {
      // Arrange
      const to = ['a@a.com', 'b@b.com']
      const toObjectBased = [{ email: 'a@a.com' }, { email: 'b@b.com' }] satisfies EmailJSON[]
      const blockList = ['*@c.com', 'c@b.com']

      // Act
      const result = extractEmails(to, 'block', blockList)
      const resultObjectBased = extractEmails(toObjectBased, 'block', blockList)

      // Assert
      expect(result).toEqual({ blocked: [], allowed: to })
      expect(resultObjectBased).toEqual({ blocked: [], allowed: toObjectBased })
    })
  })
})

describe('sendIssuanceEmail from field', () => {

    it('calls with defaults sender config has not been set', async () => {
    await sendIssuanceEmail(getIssuanceEmailTestData())

    expect(sendEmail).toHaveBeenCalledWith(
      'recipient@example.com',
      expect.objectContaining({
        from: { name: email.from.name, email: email.from.email },
      }),
    )
  })
  
  it('uses emailSenderConfig if set', async () => {
    const senderConfig = getEmailSenderConfig()
    senderConfig.senderName = 'Test Sender'
    senderConfig.senderEmail = 'test@sender.com'

    await sendIssuanceEmail(getIssuanceEmailTestData())
    expect(sendEmail).toHaveBeenCalledWith(
      'recipient@example.com',
      expect.objectContaining({
        from: { name: 'Test Sender', email: 'test@sender.com' },
      }),
    )
  })
})
