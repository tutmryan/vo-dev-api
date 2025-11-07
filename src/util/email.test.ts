import { EmailJSON } from '@sendgrid/helpers/classes/email-address'
import { extractEmails } from './email'

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
