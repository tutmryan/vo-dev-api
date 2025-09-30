import type { GetPublicKeyOrSecret, JwtPayload, VerifyOptions } from 'jsonwebtoken'
import { verify } from 'jsonwebtoken'
import type { JwksClient } from 'jwks-rsa'

export function createGetKey(jwksClient: JwksClient): GetPublicKeyOrSecret {
  return ({ kid }, callback) => {
    jwksClient
      .getSigningKey(kid)
      .then((key) => callback(null, key.getPublicKey()))
      .catch((error) => callback(error))
  }
}

export function verifyToken(jwt: string, getKey: GetPublicKeyOrSecret, verifyOptions: VerifyOptions): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    verify(jwt, getKey, verifyOptions, (error, decoded) => {
      if (error) return reject(error)
      if (!decoded || typeof decoded === 'string') {
        return reject(new Error('Bearer token decoding failed'))
      }
      return resolve(decoded)
    })
  })
}
