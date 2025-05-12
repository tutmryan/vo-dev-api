import { redactValueEmail, redactValueInner, redactValueObjectUnknown, redactValues } from './redact-values'

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
  it('should redact a string value', () => {
    const input = '1234567890'
    const result = redactValueInner(input)
    expect(result).toBe('12*<redacted>*90')
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
  it('should redact a valid email address', () => {
    const input = 'user@example.com'
    const result = redactValueEmail(input)
    expect(result).toBe('u*<redacted>*e@example.com')
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
      email: 'user@example.com',
      name: 'John Doe',
      firstName: 'John Doe',
      phone: '123-456-7890',
      address: '123 Main St',
      collection: [{ name: 'John Doe' }],
      nested: {
        user: {
          name: 'Jane Doe',
          phone: '987-654-3210',
        },
      },
    }

    const result = redactValueObjectUnknown(obj)
    expect(result).toEqual({
      email: 'u*<redacted>*e@example.com',
      name: 'Jo*<redacted>*oe',
      firstName: 'Jo*<redacted>*oe',
      phone: '12*<redacted>*90',
      address: '12*<redacted>*St',
      collection: [{ name: 'Jo*<redacted>*oe' }],
      nested: {
        user: {
          name: 'Ja*<redacted>*oe',
          phone: '98*<redacted>*10',
        },
      },
    })
  })

  it('should handle non-string and non-object values gracefully', () => {
    const obj = {
      email: 'user@example.com',
      age: 30,
      isActive: true,
    }

    const result = redactValueObjectUnknown(obj)

    expect(result).toEqual({
      email: 'u*<redacted>*e@example.com',
      age: '<redacted>',
      isActive: true,
    })
  })
})
