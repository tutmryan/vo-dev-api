import { multiIssuerBearerTokenMiddleware } from '@makerx/express-bearer'
import { getClientCredentialsToken } from '@makerx/node-common'
import cors from 'cors'
import type { RequestHandler } from 'express'
import { issuerOptions, limitedDemoAuth, presentationDemoCors } from '../../config'
import { dispatchWithoutContext, findUpdateOrCreateUserEntity } from '../../context'
import { logger } from '../../logger'
import { User } from '../../user'
import { invariant } from '../../util/invariant'
import { AcquireLimitedAccessTokenCommand } from '../limited-access-tokens/commands/acquire-limited-access-token-command'

export const demoPresentationTokenRoute = '/demo/presentation/token'

const demoCors = cors(presentationDemoCors)

const demoClientAuthHandler: RequestHandler = async (req, res, next) => {
  try {
    // Obtain an auth token for the demo client
    const demoClientTokenResponse = await getClientCredentialsToken(limitedDemoAuth)
    // Set the request auth header to the demo client token
    req.headers.authorization = `Bearer ${demoClientTokenResponse.access_token}`
    next()
  } catch (error) {
    logger.error('Failed to acquire demo client token', error)
    res.status(500).end()
  }
}

const acquireLimitedAccessTokenHandler: RequestHandler = async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Failed to acquire demo limited access token', error)
    res.status(500).end()
  }
}

export const demoPresentationTokenHandlers: RequestHandler[] = [
  demoCors,
  demoClientAuthHandler,
  multiIssuerBearerTokenMiddleware({
    issuerOptions,
    logger,
    tokenIsRequired: true,
  }),
  acquireLimitedAccessTokenHandler,
]
