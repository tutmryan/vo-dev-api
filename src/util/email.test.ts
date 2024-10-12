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
    const allowList = ['*@a.com', 'b@b.com']

    // Act
    const result = extractAllowedEmails(to, allowList)

    // Assert
    expect(result).toEqual({ blocked: [], allowed: to })
  })
  it('correctly identifies blocked emails', () => {
    // Arrange
    const to = ['a@a.com', 'b@b.com']
    const allowList = ['*@c.com', 'c@b.com']

    // Act
    const result = extractAllowedEmails(to, allowList)

    // Assert
    expect(result).toEqual({ blocked: to, allowed: [] })
  })
})
