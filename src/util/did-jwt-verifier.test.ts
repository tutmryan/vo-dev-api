import { SIOP_V2_ISSUER, verifyDidJwt } from './did-jwt-verifier'

const jwtDidjwk =
  'eyJraWQiOiJkaWQ6andrOmV5SmpjbllpT2lKUUxUSTFOaUlzSW10cFpDSTZJbU5rTWpWaE1UazRORGxpT0RRd01tTTVabU5rWTJJek5HWmhNMlV5TW1aa0lpd2lhM1I1SWpvaVJVTWlMQ0oxYzJVaU9pSnphV2NpTENKNElqb2laUzF4UzB0Rk9FMVRiRFJ1Vm5aelUxUjFhbG8zY25oNVZqWndiRW96TWtKSlpEaDVjbEUzUTFaR1NTSXNJbmtpT2lJdFFXcFhNRFZSVEY5RE5WOHlURk00VUVjeWJtRjVXWGRhUjFNMVkzVnFTMEowVEhsbk1Ua3dTazFWSW4wIzAiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJkaWQ6andrOmV5SmpjbllpT2lKUUxUSTFOaUlzSW10cFpDSTZJbU5rTWpWaE1UazRORGxpT0RRd01tTTVabU5rWTJJek5HWmhNMlV5TW1aa0lpd2lhM1I1SWpvaVJVTWlMQ0oxYzJVaU9pSnphV2NpTENKNElqb2laUzF4UzB0Rk9FMVRiRFJ1Vm5aelUxUjFhbG8zY25oNVZqWndiRW96TWtKSlpEaDVjbEUzUTFaR1NTSXNJbmtpT2lJdFFXcFhNRFZSVEY5RE5WOHlURk00VUVjeWJtRjVXWGRhUjFNMVkzVnFTMEowVEhsbk1Ua3dTazFWSW4wIiwiYXVkIjoiZGlkOndlYjpkZXYuZGlkLnZlcmlmaWVkb3JjaGVzdHJhdGlvbi5jb20iLCJpYXQiOjE3NTE1MzYxMjgsImV4cCI6MTc1MTUzOTU4NCwiaXNzIjoiaHR0cHM6Ly9zZWxmLWlzc3VlZC5tZS92Mi9vcGVuaWQtdmMiLCJfdnBfdG9rZW4iOnsicHJlc2VudGF0aW9uX3N1Ym1pc3Npb24iOnsiaWQiOiJiZDg0MTRmOS0zZjNlLTRiYzItYmE0Ny02YjYzMDM2YjQwOTciLCJkZWZpbml0aW9uX2lkIjoiODA4YWEyZjUtNDU4ZC00ZmM3LTkxYzQtZGY1NjMxZDRkZDQ2IiwiZGVzY3JpcHRvcl9tYXAiOlt7ImlkIjoiMWExY2EyOTgtN2JmYy00Mjg4LWE2NTItNDA0YTE4MDFhMzIyIiwiZm9ybWF0Ijoiand0X3ZwIiwicGF0aCI6IiRbMF0iLCJwYXRoX25lc3RlZCI6eyJpZCI6IjFhMWNhMjk4LTdiZmMtNDI4OC1hNjUyLTQwNGExODAxYTMyMiIsImZvcm1hdCI6IkpXVF9WQyIsInBhdGgiOiIkLnZlcmlmaWFibGVDcmVkZW50aWFsWzBdIn19XX19LCJub25jZSI6IjVUS1I0RG5VdVh5QXhMazY5VUJhMHc9PSJ9.14nz3ZXuCnsAoNcwkUTq0Y9Q2Njk3CIT_oOuqBFdghR9vUZpZmiERcpRCXN2siMdIJ8HQvVZjhH5zBGk1VHZOA'
const jwtDidIon =
  'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QiLCJraWQiOiJkaWQ6aW9uOkVpQ0dwY3ozbE8zcmdpZU9TemRPYy1nV3M2bWM2d3B4eUp0VXFDTjdSWEJTeXc6ZXlKa1pXeDBZU0k2ZXlKd1lYUmphR1Z6SWpwYmV5SmhZM1JwYjI0aU9pSnlaWEJzWVdObElpd2laRzlqZFcxbGJuUWlPbnNpY0hWaWJHbGpTMlY1Y3lJNlczc2lhV1FpT2lKemFXZHVYMGM0UW5wc2JqbE5TbEFpTENKd2RXSnNhV05MWlhsS2Qyc2lPbnNpWVd4bklqb2lSVk15TlRaTElpd2lZM0oySWpvaWMyVmpjREkxTm1zeElpd2lhMlY1WDI5d2N5STZXeUoyWlhKcFpua2lYU3dpYTJsa0lqb2ljMmxuYmw5SE9FSjZiRzQ1VFVwUUlpd2lhM1I1SWpvaVJVTWlMQ0oxYzJVaU9pSnphV2NpTENKNElqb2lXVFJPVXpoYVRFRm9SblJzWkhwV2JHTndjek5vYTNOMmIzaEZaRWRUZG5wTlpUbGpVVkp4UWtkbWN5SXNJbmtpT2lKWWFtUkRabWQyY1dVNWFEaDBhVkZPVFROTmVrUTJlVzl5YUZOZlgxcFpTRU5yUm1Ga1QyRjFia0ZaSW4wc0luQjFjbkJ2YzJWeklqcGJJbUYxZEdobGJuUnBZMkYwYVc5dUlsMHNJblI1Y0dVaU9pSkZZMlJ6WVZObFkzQXlOVFpyTVZabGNtbG1hV05oZEdsdmJrdGxlVEl3TVRraWZWMHNJbk5sY25acFkyVnpJanBiWFgxOVhTd2lkWEJrWVhSbFEyOXRiV2wwYldWdWRDSTZJa1ZwUVRSWGEzbDZURTVRUjB0Q1VFNVFXSGQwVjBaTmRUVnBkMDlzWDBadmJWcEJjRloxWkZBemNtbG9aVUVpZlN3aWMzVm1abWw0UkdGMFlTSTZleUprWld4MFlVaGhjMmdpT2lKRmFVUjRiWEJwVjBWWmJWOVllbkJvZGxCTlRsaEJTalZoZURKWGEwVjJXVmRtZGpKd2RESkJZMHhsVW14Qklpd2ljbVZqYjNabGNubERiMjF0YVhSdFpXNTBJam9pUldsQlNURmpjMUZWVXpneGNraHlkbWRUUkdrMlVsUlRkbk01VVZSb1RHdG1PVGg0TFRab1NYVTJPSGhtZHlKOWZRI3NpZ25fRzhCemxuOU1KUCJ9.eyJhdWQiOiJkaWQ6d2ViOmRldi5kaWQudmVyaWZpZWRvcmNoZXN0cmF0aW9uLmNvbSIsImV4cCI6MTc1MTM2MjYzMywiX3ZwX3Rva2VuIjp7InByZXNlbnRhdGlvbl9zdWJtaXNzaW9uIjp7ImRlZmluaXRpb25faWQiOiJmM2I3OTBkOC1kMzg0LTQxM2YtOWQ0Yi01OWU1ZjdmM2QyNmUiLCJpZCI6Ijc5RkVCOTMwLUVFNjMtNEM1OC1CMUEyLTZBRjIwMkY1RDE3NyIsImRlc2NyaXB0b3JfbWFwIjpbeyJpZCI6IjUwOWU1NTVmLTllNmEtNDdjZC05NmI4LWQ0NmQ4NTg4MmUzMyIsInBhdGgiOiIkWzBdIiwicGF0aF9uZXN0ZWQiOnsiaWQiOiI1MDllNTU1Zi05ZTZhLTQ3Y2QtOTZiOC1kNDZkODU4ODJlMzMiLCJwYXRoIjoiJFswXS52ZXJpZmlhYmxlQ3JlZGVudGlhbFswXSIsImZvcm1hdCI6Imp3dF92YyJ9LCJmb3JtYXQiOiJqd3RfdnAifSx7ImlkIjoiN2E1NjNmZTgtYTY4Yy00OWE3LTg0MzMtODMyMzI4MTJhZTE4IiwicGF0aCI6IiRbMV0iLCJwYXRoX25lc3RlZCI6eyJmb3JtYXQiOiJqd3RfdmMiLCJwYXRoIjoiJFsxXS52ZXJpZmlhYmxlQ3JlZGVudGlhbFswXSIsImlkIjoiN2E1NjNmZTgtYTY4Yy00OWE3LTg0MzMtODMyMzI4MTJhZTE4In0sImZvcm1hdCI6Imp3dF92cCJ9XX19LCJzdWIiOiJkaWQ6aW9uOkVpQ0dwY3ozbE8zcmdpZU9TemRPYy1nV3M2bWM2d3B4eUp0VXFDTjdSWEJTeXc6ZXlKa1pXeDBZU0k2ZXlKd1lYUmphR1Z6SWpwYmV5SmhZM1JwYjI0aU9pSnlaWEJzWVdObElpd2laRzlqZFcxbGJuUWlPbnNpY0hWaWJHbGpTMlY1Y3lJNlczc2lhV1FpT2lKemFXZHVYMGM0UW5wc2JqbE5TbEFpTENKd2RXSnNhV05MWlhsS2Qyc2lPbnNpWVd4bklqb2lSVk15TlRaTElpd2lZM0oySWpvaWMyVmpjREkxTm1zeElpd2lhMlY1WDI5d2N5STZXeUoyWlhKcFpua2lYU3dpYTJsa0lqb2ljMmxuYmw5SE9FSjZiRzQ1VFVwUUlpd2lhM1I1SWpvaVJVTWlMQ0oxYzJVaU9pSnphV2NpTENKNElqb2lXVFJPVXpoYVRFRm9SblJzWkhwV2JHTndjek5vYTNOMmIzaEZaRWRUZG5wTlpUbGpVVkp4UWtkbWN5SXNJbmtpT2lKWWFtUkRabWQyY1dVNWFEaDBhVkZPVFROTmVrUTJlVzl5YUZOZlgxcFpTRU5yUm1Ga1QyRjFia0ZaSW4wc0luQjFjbkJ2YzJWeklqcGJJbUYxZEdobGJuUnBZMkYwYVc5dUlsMHNJblI1Y0dVaU9pSkZZMlJ6WVZObFkzQXlOVFpyTVZabGNtbG1hV05oZEdsdmJrdGxlVEl3TVRraWZWMHNJbk5sY25acFkyVnpJanBiWFgxOVhTd2lkWEJrWVhSbFEyOXRiV2wwYldWdWRDSTZJa1ZwUVRSWGEzbDZURTVRUjB0Q1VFNVFXSGQwVjBaTmRUVnBkMDlzWDBadmJWcEJjRloxWkZBemNtbG9aVUVpZlN3aWMzVm1abWw0UkdGMFlTSTZleUprWld4MFlVaGhjMmdpT2lKRmFVUjRiWEJwVjBWWmJWOVllbkJvZGxCTlRsaEJTalZoZURKWGEwVjJXVmRtZGpKd2RESkJZMHhsVW14Qklpd2ljbVZqYjNabGNubERiMjF0YVhSdFpXNTBJam9pUldsQlNURmpjMUZWVXpneGNraHlkbWRUUkdrMlVsUlRkbk01VVZSb1RHdG1PVGg0TFRab1NYVTJPSGhtZHlKOWZRIiwiaXNzIjoiaHR0cHM6XC9cL3NlbGYtaXNzdWVkLm1lXC92Mlwvb3BlbmlkLXZjIiwibm9uY2UiOiJvYTBsTUpBQWF2c01ydGdPNVdWN0hnPT0iLCJpYXQiOjE3NTEzNjIzMzN9.l2nv7FMAUuRkZ-oYxNC0S6etF-0wnS93kjNtuxGlFpYiyh07-dJmRDPJdv5HS47YZXzAxuBT8JJmsT4rF92sXw'
const jwtDidWeb =
  'eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDp3ZWI6ZGV2LmRpZC52ZXJpZmllZG9yY2hlc3RyYXRpb24uY29tI2E2Yzg3MmQ0YmJkZTQ1ODRhYmJiM2Q1ZmZiMDk0MjM5dmNTaWduaW5nS2V5LTVkYjcxIiwidHlwIjoiSldUIn0.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiTWljcm9zb2Z0RmFjZUNoZWNrUmVjZWlwdCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmYWNlQ2hlY2tSZXN1bHRzIjpbeyJzb3VyY2VWY0p0aSI6InVybjpwaWM6MzRkNjNmNjIwZTFkNGU3YWJiNGUwMDUxZjIzNGMzNjIiLCJtYXRjaENvbmZpZGVuY2VUaHJlc2hvbGQiOjcwLCJtYXRjaENvbmZpZGVuY2VTY29yZSI6OTQuMTA0NDEsInNvdXJjZVBob3RvUXVhbGl0eSI6IkhJR0gifV19fSwiaXNzIjoiZGlkOndlYjpkZXYuZGlkLnZlcmlmaWVkb3JjaGVzdHJhdGlvbi5jb20iLCJzdWIiOiJkaWQ6aW9uOkVpQ0dwY3ozbE8zcmdpZU9TemRPYy1nV3M2bWM2d3B4eUp0VXFDTjdSWEJTeXc6ZXlKa1pXeDBZU0k2ZXlKd1lYUmphR1Z6SWpwYmV5SmhZM1JwYjI0aU9pSnlaWEJzWVdObElpd2laRzlqZFcxbGJuUWlPbnNpY0hWaWJHbGpTMlY1Y3lJNlczc2lhV1FpT2lKemFXZHVYMGM0UW5wc2JqbE5TbEFpTENKd2RXSnNhV05MWlhsS2Qyc2lPbnNpWVd4bklqb2lSVk15TlRaTElpd2lZM0oySWpvaWMyVmpjREkxTm1zeElpd2lhMlY1WDI5d2N5STZXeUoyWlhKcFpua2lYU3dpYTJsa0lqb2ljMmxuYmw5SE9FSjZiRzQ1VFVwUUlpd2lhM1I1SWpvaVJVTWlMQ0oxYzJVaU9pSnphV2NpTENKNElqb2lXVFJPVXpoYVRFRm9SblJzWkhwV2JHTndjek5vYTNOMmIzaEZaRWRUZG5wTlpUbGpVVkp4UWtkbWN5SXNJbmtpT2lKWWFtUkRabWQyY1dVNWFEaDBhVkZPVFROTmVrUTJlVzl5YUZOZlgxcFpTRU5yUm1Ga1QyRjFia0ZaSW4wc0luQjFjbkJ2YzJWeklqcGJJbUYxZEdobGJuUnBZMkYwYVc5dUlsMHNJblI1Y0dVaU9pSkZZMlJ6WVZObFkzQXlOVFpyTVZabGNtbG1hV05oZEdsdmJrdGxlVEl3TVRraWZWMHNJbk5sY25acFkyVnpJanBiWFgxOVhTd2lkWEJrWVhSbFEyOXRiV2wwYldWdWRDSTZJa1ZwUVRSWGEzbDZURTVRUjB0Q1VFNVFXSGQwVjBaTmRUVnBkMDlzWDBadmJWcEJjRloxWkZBemNtbG9aVUVpZlN3aWMzVm1abWw0UkdGMFlTSTZleUprWld4MFlVaGhjMmdpT2lKRmFVUjRiWEJwVjBWWmJWOVllbkJvZGxCTlRsaEJTalZoZURKWGEwVjJXVmRtZGpKd2RESkJZMHhsVW14Qklpd2ljbVZqYjNabGNubERiMjF0YVhSdFpXNTBJam9pUldsQlNURmpjMUZWVXpneGNraHlkbWRUUkdrMlVsUlRkbk01VVZSb1RHdG1PVGg0TFRab1NYVTJPSGhtZHlKOWZRIiwianRpIjoidXJuOnBpYzo4MGZjMDBmNzFhYWE0MmM0YTBiNjc2ZjUzNzk2YTIyZSIsImlhdCI6MTc1MTM2MjMzNjIyNiwiZXhwIjoxNzUxMzYyOTM2MjI2fQ.ZElaPTb8UoeLQX6LK_errCrmIQeJ6FuHtjt_YKNWbetA-tATzb0TH8xtLF73kjFWqiC-OnFKRrZGgfPUpDhmNg'

const knownDidDoc = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    {
      '@base': 'did:web:dev.did.verifiedorchestration.com',
    },
  ],
  assertionMethod: ['#a6c872d4bbde4584abbb3d5ffb094239vcSigningKey-5db71'],
  authentication: ['#a6c872d4bbde4584abbb3d5ffb094239vcSigningKey-5db71'],
  id: 'did:web:dev.did.verifiedorchestration.com',
  service: [
    {
      id: '#linkeddomains',
      serviceEndpoint: {
        origins: ['https://dev.did.verifiedorchestration.com/'],
      },
      type: 'LinkedDomains',
    },
    {
      id: '#hub',
      serviceEndpoint: {
        instances: ['https://hub.did.msidentity.com/v1.0/5c14bb50-7602-4c0d-b785-5dee865e4665'],
      },
      type: 'IdentityHub',
    },
  ],
  verificationMethod: [
    {
      controller: 'did:web:dev.did.verifiedorchestration.com',
      id: '#a6c872d4bbde4584abbb3d5ffb094239vcSigningKey-5db71',
      publicKeyJwk: {
        crv: 'P-256',
        kty: 'EC',
        x: 'tUJsuAj6pIT--0h75UJAXX2QBYGzR07YvYVbB2Am2qU',
        y: 'dWLaJhTw4_gECv4uW5FTHTKGk0ppAA3N96KHIH-6W-A',
      },
      type: 'JsonWebKey2020',
    },
  ],
}

jest.mock('./did-web-resolver', () => ({
  resolveDidWebDocument: jest.fn(() => Promise.resolve(knownDidDoc)),
}))

describe('verifyDidJwt', () => {
  describe('valid tokens', () => {
    it.each([
      {
        description: 'validates a known-good did:jwk JWT',
        token: jwtDidjwk,
        opts: {
          presentedAt: new Date('2024-07-02T15:00:00Z'),
          issuer: SIOP_V2_ISSUER,
          audience: 'did:web:dev.did.verifiedorchestration.com',
        },
      },
      {
        description: 'validates a known-good did:ion JWT',
        token: jwtDidIon,
        opts: {
          presentedAt: new Date('2024-07-02T15:00:00Z'),
          issuer: SIOP_V2_ISSUER,
          audience: 'did:web:dev.did.verifiedorchestration.com',
        },
      },
      {
        description: 'validates a known-good did:web JWT',
        token: jwtDidWeb,
        opts: {
          presentedAt: new Date('2024-07-02T15:00:00Z'),
          issuer: 'did:web:dev.did.verifiedorchestration.com',
        },
      },
    ])('$description', async ({ token, opts }) => {
      await expect(verifyDidJwt(token, opts)).resolves.toBeUndefined()
    })
  })

  describe('error cases (invalid tokens)', () => {
    it('throws if the JWT is malformed', async () => {
      const malformedJwt = 'not.a.valid.jwt'
      await expect(
        verifyDidJwt(malformedJwt, {
          presentedAt: new Date(),
          issuer: SIOP_V2_ISSUER,
        }),
      ).rejects.toThrow(/Invalid Token or Protected Header formatting/)
    })

    it('throws if kid references an unsupported DID method', async () => {
      const fakeJwtWithUnknownKid = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDpldGM6Zm9vIzEyMzQ1NiJ9.eyJmb28iOiJiYXIifQ.signature'
      await expect(
        verifyDidJwt(fakeJwtWithUnknownKid, {
          presentedAt: new Date(),
          issuer: SIOP_V2_ISSUER,
        }),
      ).rejects.toThrow(/Unsupported DID method/)
    })

    it('throws if the token is expired for the given presentedAt', async () => {
      await expect(
        verifyDidJwt(jwtDidjwk, {
          presentedAt: new Date('2100-01-01T00:00:00Z'),
          issuer: SIOP_V2_ISSUER,
        }),
      ).rejects.toThrow(/"exp" claim timestamp check failed/)
    })

    it('throws if signature does not match', async () => {
      const tamperedJwt = `${jwtDidjwk.slice(0, -1)}`
      await expect(
        verifyDidJwt(tamperedJwt, {
          presentedAt: new Date(),
          issuer: SIOP_V2_ISSUER,
        }),
      ).rejects.toThrow(/signature|invalid/i)
    })
  })
})
