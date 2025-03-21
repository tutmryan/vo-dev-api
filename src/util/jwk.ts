import type { JWK } from 'jose'
import { createHash } from 'node:crypto'

// Implementation of the `kid` calculation as per node-oidc-provider `calculateKid` function
export const calculateKid = (jwk: JWK) => {
  let components

  switch (jwk.kty) {
    case 'RSA':
      components = {
        e: jwk.e,
        kty: 'RSA',
        n: jwk.n,
      }
      break
    case 'EC':
      components = {
        crv: jwk.crv,
        kty: 'EC',
        x: jwk.x,
        y: jwk.y,
      }
      break
    case 'OKP':
      components = {
        crv: jwk.crv,
        kty: 'OKP',
        x: jwk.x,
      }
      break
    default:
      return undefined
  }

  return createHash('sha256').update(JSON.stringify(components)).digest().toString('base64url')
}
