import type Provider from 'oidc-provider'
import { logger } from '../../logger'
import { deleteAccount } from './account'

export function events(provider: Provider) {
  provider.on('session.destroyed', (session) => {
    const accountId = session.accountId
    if (accountId) {
      logger.audit(`OIDC account ${accountId} logged out, deleting account`)
      deleteAccount(accountId).catch((error) => {
        logger.error(`Failed to delete OIDC account ${accountId}`, { error })
      })
    }
  })
}
