import { mdoc } from '../../../../config'
import { logger } from '../../../../logger'
import { pemToDer } from '../../../../util/cryptography'
import { invariant } from '../../../../util/invariant'
import { fetchCert, fetchMultipleVicals } from './fetcher'
import { extractIacaCertificates } from './parser'
import type { VicalProviderConfig } from './types'

const VICAL_PROVIDERS: Record<string, VicalProviderConfig> = {
  AAMVA: {
    id: 'aamva',
    name: 'AAMVA Digital Trust Service',
    vicalUrl: 'https://vical.dts.aamva.org/currentVical',
    vicalProcessResponse: async (buffer) => {
      const html = new TextDecoder().decode(buffer)

      // Look for download link in the HTML  <a href="/vical/vc/vc-2025-09-27-1758957681255" class="btn btn-primary">Download</a>
      const downloadLinkRegex = /<a\s+href="([^"]+)"\s+class="btn btn-primary">Download<\/a>/i
      const match = html.match(downloadLinkRegex)

      invariant(match && match[1], 'Could not find VICAL download link in AAMVA currentVical page')

      const relativeUrl = match[1]
      const baseUrl = 'https://vical.dts.aamva.org'
      const vicalUrl = new URL(relativeUrl, baseUrl).toString()
      const vicalResponse = await fetch(vicalUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/cbor, application/octet-stream, */*',
        },
      })
      invariant(vicalResponse.ok, `HTTP ${vicalResponse.status}: ${vicalResponse.statusText}`)
      return new Uint8Array(await vicalResponse.arrayBuffer())
    },
    signerCertUrls: [
      'https://vical.dts.aamva.org/certificates/vicalsigner',
      'https://vical.dts.aamva.org/certificates/ca_intermediate',
      'https://vical.dts.aamva.org/certificates/ca',
    ],
  },
  // The site disappeared. Waiting for an updated URL from AUSTROADS.
  // https://austroads.gov.au/drivers-and-vehicles/digital-trust-service
  // AUSTROADS: {
  //   id: 'austroads',
  //   name: 'Austroads Digital Trust Service',
  //   vicalUrl: 'https://beta.nationaldts.com.au/api/vical',
  //   signerCertUrls: ['https://austroads-dts-pre-prd.vii.au01.mattr.global/v1/ecosystems/public/certificates/ca'],
  //   signerCertProcessResponse: (responses) => {
  //     const apiResponse = responses.get('https://austroads-dts-pre-prd.vii.au01.mattr.global/v1/ecosystems/public/certificates/ca')
  //     invariant(apiResponse, 'No response for Austroads signer cert URL')

  //     const schema = z.object({
  //       rootCertificates: z.array(
  //         z.object({
  //           certificate: z.string(),
  //         }),
  //       ),
  //     })
  //     const apiReturn = schema.parse(JSON.parse(new TextDecoder().decode(apiResponse)))

  //     return Promise.resolve(apiReturn.rootCertificates.map((c) => pemToDer(c.certificate)))
  //   },
  // },
}

const trustAnchors = [
  {
    name: 'Google Wallet ID Pass (US)',
    docType: ['org.iso.18013.5.1.ID'],
    certificateUrls: ['https://developers.google.com/wallet/identity/verify/assets/Google_IACA_Root_US.cer'],
  },
  {
    name: 'Google Wallet ID Pass (UK)',
    docType: ['org.iso.18013.5.1.ID'],
    certificateUrls: ['https://developers.google.com/wallet/identity/verify/assets/Google_IACA_Root_ROW.pem'],
  },
  {
    name: 'Google Wallet ID Pass (US Sandbox)',
    docType: ['org.iso.18013.5.1.ID'],
    certificateUrls: ['https://developers.google.com/wallet/identity/verify/assets/Google_Sandbox_IACA_Root_US.pem'],
  },
] satisfies {
  name: string
  docType: string[]
  certificateUrls: string[]
}[]

export async function fetchIacaCertificates(options?: { filterByDocType?: string[] }): Promise<Uint8Array[]> {
  const { filterByDocType } = options || {
    filterByDocType: undefined,
  }

  //const vicals = await fetchMultipleVicals([VICAL_PROVIDERS.AAMVA!, VICAL_PROVIDERS.AUSTROADS!])
  const vicals = await fetchMultipleVicals([VICAL_PROVIDERS.AAMVA!])

  const certificates: Uint8Array[] = []
  for (const parsed of vicals) {
    const certs = filterByDocType ? extractIacaCertificates(parsed.vical, filterByDocType) : extractIacaCertificates(parsed.vical)
    certificates.push(...certs)
  }

  // Filter trustAnchors by docType if specified
  const filteredAnchors = filterByDocType
    ? trustAnchors.filter((anchor) => anchor.docType.some((dt) => filterByDocType.includes(dt)))
    : trustAnchors

  for (const anchor of filteredAnchors) {
    for (const url of anchor.certificateUrls) {
      try {
        certificates.push(await fetchCert(url))
      } catch (e) {
        logger.warn(`Failed to fetch trust anchor certificate from ${url}`, { error: e })
      }
    }
  }

  if (mdoc.multipazTestCertificatesEnabled) {
    // Multipaz Test App
    // To update
    // 1. Download the source code from
    // 2. Add a log to dump the public cert in method iacaInit in file samples/testapp/src/commonMain/kotlin/org/multipaz/testapp/App.kt
    //   println("iacaCert: ${iacaCert.toPem()}")
    // 3. Run the app and copy the PEM output
    certificates.push(
      pemToDer(`-----BEGIN CERTIFICATE-----
MIICqDCCAi2gAwIBAgIQx8BcT0/ehfrMuw1NjPRuAzAKBggqhkjOPQQDAzAuMR8w
HQYDVQQDDBZPV0YgTXVsdGlwYXogVEVTVCBJQUNBMQswCQYDVQQGDAJVUzAeFw0y
NDEyMDEwMDAwMDBaFw0zNDEyMDEwMDAwMDBaMC4xHzAdBgNVBAMMFk9XRiBNdWx0
aXBheiBURVNUIElBQ0ExCzAJBgNVBAYMAlVTMHYwEAYHKoZIzj0CAQYFK4EEACID
YgAE+QDye70m2O0llPXMjVjxVZz3m5k6agT+wih+L79b7jyqUl99sbeUnpxaLD+c
mB3HK3twkA7fmVJSobBc+9CDhkh3mx6n+YoH5RulaSWThWBfMyRjsfVODkosHLCD
nbPVo4IBDjCCAQowDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAw
TAYDVR0SBEUwQ4ZBaHR0cHM6Ly9naXRodWIuY29tL29wZW53YWxsZXQtZm91bmRh
dGlvbi1sYWJzL2lkZW50aXR5LWNyZWRlbnRpYWwwVgYDVR0fBE8wTTBLoEmgR4ZF
aHR0cHM6Ly9naXRodWIuY29tL29wZW53YWxsZXQtZm91bmRhdGlvbi1sYWJzL2lk
ZW50aXR5LWNyZWRlbnRpYWwvY3JsMB0GA1UdDgQWBBSrZRvgVsKQU/Hdf2zkh75o
3mDJ9TAfBgNVHSMEGDAWgBSrZRvgVsKQU/Hdf2zkh75o3mDJ9TAKBggqhkjOPQQD
AwNpADBmAjEApicB3n7hJw627KOQ27/g88xKiv7b2dK+L5mcacbSY5S/xPbKivft
H9CPH91juhgnAjEAtMDz0we8OFKAh7SzNgoC14xHqcrFTrHnQfUYB59amga6AUD4
DaLde7n+ujB2gvsD
-----END CERTIFICATE-----`),
    )
  }

  invariant(certificates.length > 0, 'No IACA certificates found in fetched VICALs or trust anchors')

  return certificates
}
