import { RequestCredential } from '../generated/graphql'
import {
  redactConstraints,
  redactPresentationReceipt,
  redactValueEmail,
  redactValueInner,
  redactValueObjectUnknown,
  redactValues,
} from './redact-values'

describe('redactValues', () => {
  it('should redact values at the specified paths', () => {
    const obj = {
      name: 'John Doe',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Anytown',
      },
      sensitiveInfo: {
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
      },
    }

    const redactedObj = redactValues(obj, 'sensitiveInfo.ssn', 'address.city')

    expect(redactedObj).toEqual({
      name: 'John Doe',
      age: 30,
      address: {
        street: '123 Main St',
        city: '<redacted>',
      },
      sensitiveInfo: {
        ssn: '<redacted>',
        creditCard: '4111-1111-1111-1111',
      },
    })
  })

  it('should handle redacting within arrays of objects', () => {
    const obj = {
      users: [
        {
          id: 1,
          name: 'Alice',
          sensitiveInfo: {
            ssn: '123-45-6789',
          },
        },
        {
          id: 2,
          name: 'Bob',
          sensitiveInfo: {
            ssn: '987-65-4321',
          },
        },
      ],
    }

    const redactedObj = redactValues(obj, 'sensitiveInfo.ssn')

    expect(redactedObj).toEqual({
      users: [
        {
          id: 1,
          name: 'Alice',
          sensitiveInfo: {
            ssn: '<redacted>',
          },
        },
        {
          id: 2,
          name: 'Bob',
          sensitiveInfo: {
            ssn: '<redacted>',
          },
        },
      ],
    })
  })

  it('should not modify the original object', () => {
    const obj = {
      name: 'John Doe',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Anytown',
      },
    }

    redactValues(obj, 'address.city')

    expect(obj).toEqual({
      name: 'John Doe',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Anytown',
      },
    })
  })

  it('should handle non-existing paths gracefully', () => {
    const obj = {
      name: 'John Doe',
      age: 30,
    }

    const redactedObj = redactValues(obj, 'address.city')

    expect(redactedObj).toEqual({
      name: 'John Doe',
      age: 30,
    })
  })

  it('should handle empty object', () => {
    const obj = {}

    const redactedObj = redactValues(obj, 'address.city')

    expect(redactedObj).toEqual({})
  })

  it('should handle nested objects', () => {
    const obj = {
      a: {
        b: {
          c: 'value',
          d: 'another value',
        },
      },
    }

    const redactedObj = redactValues(obj, 'a.b.c')

    expect(redactedObj).toEqual({
      a: {
        b: {
          c: '<redacted>',
          d: 'another value',
        },
      },
    })
  })

  it('should work on this', () => {
    const data = {
      request: [
        {
          expiry: 'threeDays',
          contact: {
            notification: { method: 'email', value: 'blah@example.net' },
            verification: { method: 'sms', value: '+987654321' },
          },
          expirationDate: '2025-06-26T04:59:59.999Z',
          claims: { organization: 'Zzz', email: 'blah@example.net' },
          photoCapture: true,
        },
        {
          expiry: 'threeDays',
          contact: {
            notification: { method: 'email', value: 'blah@example.net' },
            verification: { method: 'sms', value: '+123456789' },
          },
          expirationDate: '2025-06-26T04:59:59.999Z',
          claims: { organization: 'Zzz', email: 'blah@example.net' },
          photoCapture: true,
        },
      ],
    }

    const redactedData = redactValues(data, 'notification.value', 'verification.value', 'email')
    expect(redactedData).toMatchInlineSnapshot(`
      {
        "request": [
          {
            "claims": {
              "email": "<redacted>",
              "organization": "Zzz",
            },
            "contact": {
              "notification": {
                "method": "email",
                "value": "<redacted>",
              },
              "verification": {
                "method": "sms",
                "value": "<redacted>",
              },
            },
            "expirationDate": "2025-06-26T04:59:59.999Z",
            "expiry": "threeDays",
            "photoCapture": true,
          },
          {
            "claims": {
              "email": "<redacted>",
              "organization": "Zzz",
            },
            "contact": {
              "notification": {
                "method": "email",
                "value": "<redacted>",
              },
              "verification": {
                "method": "sms",
                "value": "<redacted>",
              },
            },
            "expirationDate": "2025-06-26T04:59:59.999Z",
            "expiry": "threeDays",
            "photoCapture": true,
          },
        ],
      }
    `)
  })
})

describe('redactValueInner', () => {
  it('should redact a short string value', () => {
    const input = '1234567890'
    const result = redactValueInner(input)
    expect(result).toBe('12*<redacted>*90')
  })

  it('should redact a long string value', () => {
    const input = 'ABCD_1234567_EFGH'
    const result = redactValueInner(input)
    expect(result).toBe('ABCD*<redacted>*EFGH')
  })

  it('should return undefined for non-string values', () => {
    expect(redactValueInner(1234)).toBeUndefined()
    expect(redactValueInner(null)).toBeUndefined()
    expect(redactValueInner(undefined)).toBeUndefined()
  })

  it('should return <redacted> for short strings', () => {
    const input = '1234'
    const result = redactValueInner(input)
    expect(result).toBe('<redacted>')
  })
})

describe('redactValueEmail', () => {
  it('should redact valid email addresses with varying lengths', () => {
    const testCases = [
      { input: 'a@example.com', expected: '<redacted>@example.com' },
      { input: 'ab@example.com', expected: '<redacted>@example.com' },
      { input: 'abc@example.com', expected: '<redacted>@example.com' },
      { input: 'abcd@example.com', expected: '<redacted>@example.com' },
      { input: 'abcde@example.com', expected: '<redacted>@example.com' },
      { input: 'abcdef@example.com', expected: 'ab*<redacted>*ef@example.com' },
      { input: 'abcdefg@example.com', expected: 'ab*<redacted>*fg@example.com' },
      { input: 'abcdefgh@example.com', expected: 'ab*<redacted>*gh@example.com' },
      { input: 'abcdefghi@example.com', expected: 'ab*<redacted>*hi@example.com' },
      { input: 'abcdefghij@example.com', expected: 'ab*<redacted>*ij@example.com' },
    ]

    testCases.forEach(({ input, expected }) => {
      const result = redactValueEmail(input)
      expect(result).toBe(expected)
    })
  })

  it('should return undefined for non-string values', () => {
    expect(redactValueEmail(1234)).toBeUndefined()
    expect(redactValueEmail(null)).toBeUndefined()
    expect(redactValueEmail(undefined)).toBeUndefined()
  })

  it('should return the input if it is not a valid email', () => {
    const input = 'not-an-email'
    const result = redactValueEmail(input)
    expect(result).toBe('not-an-email')
  })

  it('should return <redacted> for short email strings', () => {
    const input = 'a@b.co'
    const result = redactValueEmail(input)
    expect(result).toBe('<redacted>@b.co')
  })
})

describe('redactValueObjectUnknown', () => {
  it('should redact sensitive keys based on fuzzy matching', () => {
    const obj = {
      email: 'user12@example.com',
      name: 'John Doe',
      firstName: 'John Doe',
      phone: '123-456-7890',
      address: '123 Main St',
      collection: [{ name: 'John Doe' }],
      presentationRequest: {
        requestedCredentials: [
          {
            type: 'VOSupportAgent',
            constraints: [{ claimName: 'email', values: ['billy-goat@abcstudios.com'] }],
          },
        ],
      },
      nested: {
        user: {
          name: 'Jane Doe',
          phone: '987-654-3210',
        },
      },
    }

    const result = redactValueObjectUnknown(obj)
    expect(result).toEqual({
      email: 'us*<redacted>*12@example.com',
      name: 'Jo*<redacted>*oe',
      firstName: 'Jo*<redacted>*oe',
      phone: '123-*<redacted>*7890',
      presentationRequest: {
        requestedCredentials: [
          {
            constraints: [
              {
                claimName: 'email',
                values: ['bill*<redacted>*.com'],
              },
            ],
            type: 'VOSupportAgent',
          },
        ],
      },
      address: '12*<redacted>*St',
      collection: [{ name: 'Jo*<redacted>*oe' }],
      nested: {
        user: {
          name: 'Ja*<redacted>*oe',
          phone: '987-*<redacted>*3210',
        },
      },
    })
  })

  it('should handle non-string and non-object values gracefully', () => {
    const obj = {
      email: 'user12@example.com',
      age: 30,
      isActive: true,
    }

    const result = redactValueObjectUnknown(obj)

    expect(result).toEqual({
      email: 'us*<redacted>*12@example.com',
      age: '<redacted>',
      isActive: true,
    })
  })
})

describe('redactConstraints', () => {
  describe('constraint redaction behavior', () => {
    it.each([
      {
        description: 'retains values for "identityId" and "issuanceId"',
        input: [
          {
            constraints: [
              { claimName: 'identityId', values: ['abc-123'] },
              { claimName: 'issuanceId', values: ['def-456'] },
            ],
          },
        ],
        expected: [
          { claimName: 'identityId', values: ['abc-123'] },
          { claimName: 'issuanceId', values: ['def-456'] },
        ],
      },
      {
        description: 'redacts "values" for non-standard claim',
        input: [
          {
            constraints: [{ claimName: 'name', values: ['Alice', 'Bob'] }],
          },
        ],
        expected: [{ claimName: 'name', values: null }],
      },
      {
        description: 'redacts "startsWith" for non-standard claim',
        input: [
          {
            constraints: [{ claimName: 'email', startsWith: 'user@' }],
          },
        ],
        expected: [{ claimName: 'email', startsWith: null }],
      },
      {
        description: 'redacts "contains" for non-standard claim',
        input: [
          {
            constraints: [{ claimName: 'name', contains: 'alice' }],
          },
        ],
        expected: [{ claimName: 'name', contains: null }],
      },
      {
        description: 'retains "startsWith" for "identityId"',
        input: [
          {
            constraints: [{ claimName: 'identityId', startsWith: 'abc' }],
          },
        ],
        expected: [{ claimName: 'identityId', startsWith: 'abc' }],
      },
      {
        description: 'preserves unknown operator (no redaction applied)',
        input: [
          {
            constraints: [{ claimName: 'unknownField' }],
          },
        ],
        expected: [{ claimName: 'unknownField' }],
      },
    ])('$description', ({ input, expected }) => {
      const result = redactConstraints(input as RequestCredential[])
      expect(result[0]?.constraints).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('returns empty array for empty constraints', () => {
      const input = [
        {
          constraints: [],
        },
      ] as unknown as RequestCredential[]

      const result = redactConstraints(input)
      expect(result[0]?.constraints).toEqual([])
    })

    it('preserves undefined if constraints is missing', () => {
      const input = [
        {
          type: 'SomeCredential',
          // no constraints
        },
      ] as RequestCredential[]

      const result = redactConstraints(input)
      expect(result[0]?.constraints).toBeUndefined()
    })
  })
})

describe('redactPresentationReceipt', () => {
  it('returns null for undefined input', () => {
    expect(redactPresentationReceipt(undefined)).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(redactPresentationReceipt('string' as unknown)).toBeNull()
  })

  it('returns null for missing id_token', () => {
    expect(redactPresentationReceipt({})).toBeNull()
  })

  it('returns id_token and faceCheck null if faceCheck is missing', () => {
    const receipt = {
      id_token: 'jwt1',
      vp_token: 'shouldBeStripped',
      state: 'shouldAlsoBeStripped',
    }

    const result = redactPresentationReceipt(receipt)
    expect(result).toBe(JSON.stringify({ id_token: 'jwt1', faceCheck: null }))
  })

  it('includes faceCheck when present as string', () => {
    const receiptWithFaceCheck = {
      id_token: 'jwt1',
      vp_token: ['shouldBeStripped'],
      state: 'shouldAlsoBeStripped',
      faceCheck: 'jwt2',
    }

    const result = redactPresentationReceipt(receiptWithFaceCheck)
    expect(result).toBe(JSON.stringify({ id_token: 'jwt1', faceCheck: 'jwt2' }))
  })
})
