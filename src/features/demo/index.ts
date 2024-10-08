import bearerTokenMiddleware from '@makerx/express-bearer'
import { getClientCredentialsToken } from '@makerx/node-common'
import type { RequestHandler } from 'express'
import { bearer, limitedDemoAuth } from '../../config'
import { dispatchWithoutContext, findUpdateOrCreateUserEntity } from '../../context'
import { logger } from '../../logger'
import { User } from '../../user'
import { invariant } from '../../util/invariant'
import { AcquireLimitedAccessTokenCommand } from '../limited-access-tokens/commands/acquire-limited-access-token-command'

export const demoPresentationTokenRoute = '/demo/presentation/token'

const demoClientAuthHandler: RequestHandler = async (req, res, next) => {
  // Obtain an auth token for the demo client
  const demoClientTokenResponse = await getClientCredentialsToken(limitedDemoAuth)
  // Set the request auth header to the demo client token
  req.headers.authorization = `Bearer ${demoClientTokenResponse.access_token}`
  next()
}

const acquireLimitedAccessTokenHandler: RequestHandler = async (req, res) => {
  invariant(req.user, 'User not found')
  // Set up the demo client user
  const userEntity = await findUpdateOrCreateUserEntity(req.user)
  const userToken = req.headers.authorization?.substring(7) ?? ''
  const user = new User(req.user, userToken, userEntity)
  // Use AcquireLimitedAccessTokenCommand to get a limited access token on behalf of the demo client user
  const { token, expires } = await dispatchWithoutContext({ user }, AcquireLimitedAccessTokenCommand, {
    allowAnonymousPresentation: true,
    requestableCredentials: [{ credentialType: 'VerifiableCredential' }],
  })
  // Return the limited access token and its expiration date
  res.json({ token, expires }).end()
}

export const demoPresentationTokenHandlers: RequestHandler[] = [
  demoClientAuthHandler,
  bearerTokenMiddleware({
    config: bearer,
    logger,
  }),
  acquireLimitedAccessTokenHandler,
]
