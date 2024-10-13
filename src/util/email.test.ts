import { EmailJSON } from '@sendgrid/helpers/classes/email-address'
import { extractAllowedEmails } from './email'

describe('extractAllowedEmails', () => {
  it('returns empty arrays when no emails are provided', () => {
    // Arrange

    // Act
    const result = extractAllowedEmails(undefined, ['*@test.com'])

    // Assert
    expect(result).toEqual({ blocked: [], allowed: [] })
  })
  it('correctly identifies allowed emails', () => {
    // Arrange
    const to = ['a@a.com', 'b@b.com']
    const toObjectBased = [{ email: 'a@a.com' }, { email: 'b@b.com' }] satisfies EmailJSON[]
    const allowList = ['*@a.com', 'b@b.com']

    // Act
    const result = extractAllowedEmails(to, allowList)
    const resultObjectBased = extractAllowedEmails(toObjectBased, allowList)

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
    const result = extractAllowedEmails(to, allowList)
    const resultObjectBased = extractAllowedEmails(toObjectBased, allowList)

    // Assert
    expect(result).toEqual({ blocked: to, allowed: [] })
    expect(resultObjectBased).toEqual({ blocked: toObjectBased, allowed: [] })
  })
})
