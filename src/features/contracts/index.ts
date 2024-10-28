import { localDev } from '../../config'

export const convertLocalDevUriToMicrosoftFriendly = (url: string) => {
  if (localDev && localDev.tunnel.api) {
    return `${localDev.tunnel.api}/local-dev-vc-logo-proxy/${encodeURIComponent(url.substring(url.lastIndexOf('/') + 1))}`
  }
  return 'https://demo.verifiedorchestration.com/icons/favicon-310x310.png'
}
