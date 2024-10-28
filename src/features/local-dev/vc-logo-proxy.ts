import type { RequestHandler } from 'express'
import { createLogoImagesService } from '../../services'

export const vcLogoProxyTokenRoute = '/local-dev-vc-logo-proxy/:logo'

export const vcLogoProxyHandler: RequestHandler<{ logo: string }> = (req, res, next) => {
  const handler = async () => {
    const { logo } = req.params
    const logoImageService = createLogoImagesService()

    res.set('cross-origin-resource-policy', 'cross-origin')

    if (await logoImageService.exists(logo)) {
      logoImageService.downloadToBuffer(logo).then((buffer) => {
        res.contentType(`image/${logo.split('.').pop()}`)
        res.send(buffer)
      })
      return
    }

    // send a placeholder image if the logo does not exist
    res.sendFile('./local-dev/placeholders/placeholder-logo.png', { root: '.' })
  }

  handler().catch((e) => next(e))
}
