import { redactValues } from './redact-values'

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
