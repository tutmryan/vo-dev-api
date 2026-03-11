type OidcConfig = {
  uid: string
  title: string
  graphqlUrl: string
  presentationAccessToken: string

  voLogoUrl: string
  logoUrl: string | null
  backgroundColor: string | null
  backgroundImageUrl: string | null
  clientName: string | null
  tosUri: string | null
  policyUri: string | null
  showDebug: boolean
  sdkUrl: string

  dbg: {
    params: string
    prompt: string
  } | null
}

function getConfig(): OidcConfig {
  const el = document.getElementById('oidc-config')
  if (!el) throw new Error('OIDC config not found')
  return JSON.parse(el.textContent || '{}')
}

const config = getConfig()

const RETRY_PRESENTATION_DELAY_MS = 5000
let retryPresentationTimeoutId: number | null = null

const clientLogo = document.getElementById('clientLogo') as HTMLImageElement | null
if (clientLogo && config.logoUrl) {
  clientLogo.src = config.logoUrl
  clientLogo.alt = config.clientName ?? 'Client logo'
}

// Set the form action to the correct login endpoint
const form = document.getElementById('loginForm') as HTMLFormElement
form.action = `/oidc/interaction/${config.uid}/login`

function applyTheme(config: OidcConfig) {
  let styleTag = document.getElementById('dynamic-style') as HTMLStyleElement | null

  // Create the style tag if it doesn't exist
  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.id = 'dynamic-style'
    document.head.appendChild(styleTag)
  }

  let css = ''

  if (config.backgroundColor) {
    css += `body { background-color: ${config.backgroundColor} !important; }`
  }

  if (config.backgroundImageUrl) {
    css += `body { background-image: url('${config.backgroundImageUrl}'); background-attachment: fixed; }`
  }

  styleTag.textContent = css
}

function wireBranding(config: OidcConfig) {
  // Logo handling (client logo with VO fallback)
  const logoImg = document.getElementById('logo-img') as HTMLImageElement | null
  if (logoImg) {
    const logoSrc = config.logoUrl || config.voLogoUrl
    if (logoSrc) {
      logoImg.src = logoSrc
      logoImg.alt = config.clientName || 'Logo'
    }
  }

  // Title handling
  const titleText = document.getElementById('title-text')
  if (titleText && config.title) {
    titleText.textContent = config.title
  }

  const clientNameEl = document.getElementById('client-name')
  if (clientNameEl && config.clientName) {
    clientNameEl.textContent = config.clientName
  }

  // Wire up cancel buttons
  const cancelLinkH = document.getElementById('cancel-link-h') as HTMLAnchorElement | null
  const cancelLinkV = document.getElementById('cancel-link-v') as HTMLAnchorElement | null
  const abortUrl = `/oidc/interaction/${config.uid}/abort`

  if (cancelLinkH) cancelLinkH.href = abortUrl
  if (cancelLinkV) cancelLinkV.href = abortUrl

  // Wire up footer links - show them if they have values
  const tosLink = document.getElementById('tos-link') as HTMLAnchorElement | null
  const policyLink = document.getElementById('policy-link') as HTMLAnchorElement | null

  if (tosLink && config.tosUri) {
    tosLink.href = config.tosUri
    tosLink.target = '_blank'
    tosLink.classList.remove('d-none')
  }

  if (policyLink && config.policyUri) {
    policyLink.href = config.policyUri
    policyLink.target = '_blank'
    policyLink.classList.remove('d-none')
  }
}

const progressText = document.getElementById('progressText')
if (progressText) progressText.textContent = 'Generating QR code...'

function loadSdk(sdkUrl: string, nonce: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    // Use Trusted Types if available
    // TypeScript-safe access to trustedTypes
    const policy = (window as any).trustedTypes?.createPolicy('default', {
      createScriptURL: (url: string) => url,
    })
    script.src = policy ? policy.createScriptURL(sdkUrl) : sdkUrl
    script.type = 'text/javascript'
    script.async = true
    script.setAttribute('nonce', nonce)
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load SDK'))
    document.head.appendChild(script)
  })
}
async function startLoginFlow(config: OidcConfig, nonce: string) {
  // Load the SDK (replace with your actual logic for ES5/ES6 if needed)
  await loadSdk(config.sdkUrl, nonce)

  // @ts-expect-error - verifiedOrchestrationClientJs is loaded dynamically
  const client = new window.verifiedOrchestrationClientJs.VerifiedOrchestrationClient({
    url: config.graphqlUrl,
    accessToken: config.presentationAccessToken,
  })

  client.createPresentationRequestForAuthn(handlePresentationEvent).then(handlePresentation).catch(displayError)
}

function hide(target: Element | NodeListOf<Element> | null) {
  if (!target) return

  const elements = target instanceof Element ? [target] : Array.from(target)

  elements.forEach((el) => {
    el.classList.add('d-none')
    el.classList.remove('d-flex')
  })
}

function show(target: Element | NodeListOf<Element> | null, displayClass: string | null = null) {
  if (!target) return

  const elements = target instanceof Element ? [target] : Array.from(target)

  elements.forEach((el) => {
    el.classList.remove('d-none')
    if (displayClass) el.classList.add(displayClass)
  })
}

function clearRetryPresentationTimeout() {
  if (retryPresentationTimeoutId !== null) {
    window.clearTimeout(retryPresentationTimeoutId)
    retryPresentationTimeoutId = null
  }
}

function setRetryVisibility(visible: boolean) {
  const retryFooter = document.getElementById('retry-btn-footer')
  if (!retryFooter) return

  if (visible) {
    retryFooter.classList.remove('d-none')
  } else {
    retryFooter.classList.add('d-none')
  }
}

function displayError(error: any) {
  hide(document.querySelectorAll('#desktop, #mobile, #progress, #finish'))

  const errorText = document.querySelector('#errorText')
  if (errorText) {
    errorText.textContent = `${error && error.message != null ? error.message : error}`
  }

  clearRetryPresentationTimeout()
  setRetryVisibility(true)

  show(document.querySelector('#error'), 'd-flex')
}

function displayProgress(progress: string, options?: { enableRetryAfterMs?: number }) {
  hide(document.querySelectorAll('#desktop, #mobile, #error, #finish'))

  const progressTextEl = document.getElementById('progressText')
  if (progressTextEl) progressTextEl.textContent = progress

  clearRetryPresentationTimeout()
  setRetryVisibility(false)

  if (options?.enableRetryAfterMs) {
    retryPresentationTimeoutId = window.setTimeout(() => {
      setRetryVisibility(true)
    }, options.enableRetryAfterMs)
  }

  show(document.querySelector('#progress'), 'd-flex')
}

function displayFinish() {
  hide(document.querySelectorAll('#progress, #desktop, #mobile, #error'))

  clearRetryPresentationTimeout()
  setRetryVisibility(false)

  show(document.querySelector('#finish'), 'd-flex')
}

function displayMobile(url: string) {
  hide(document.querySelectorAll('#progress, #desktop, #error, #finish'))

  clearRetryPresentationTimeout()
  setRetryVisibility(false)

  show(document.querySelector('#mobile'))

  const openUrl = document.getElementById('openUrl')
  if (openUrl) {
    openUrl.onclick = () => {
      window.location.href = url
    }
  }
}

function displayDesktop(qrCode: string) {
  hide(document.querySelectorAll('#progress, #mobile, #error, #finish'))

  clearRetryPresentationTimeout()
  setRetryVisibility(false)

  show(document.querySelector('#desktop'))
  displayQrCode(qrCode)
}

function displayQrCode(src: string) {
  const canvas = document.querySelector('#qrCodeCanvas') as HTMLCanvasElement

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.onload = () => {
    const maxSize = 350
    const containerWidth = canvas.parentElement?.clientWidth ?? maxSize
    const size = Math.min(maxSize, containerWidth - 40)

    canvas.width = size
    canvas.height = size

    ctx.drawImage(img, 0, 0, size, size)
  }

  img.src = src
}

function handlePresentation(response: any) {
  if ('error' in response) {
    displayError(response.error)
    return
  }
  displayPresentationResponse(response)
}

function handlePresentationEvent(data: any) {
  if (data instanceof Error) {
    displayError(data)
  } else if (data.event.requestStatus === 'presentation_error') {
    const code = data.event.error.code
    const message = data.event.error.message
    if (code === 'vcExpiredError') {
      displayError(
        'The Verifiable Credential you presented has expired. Please contact the issuer to obtain a new credential or for further assistance.',
      )
    } else {
      displayError(data.event.error ? `${code}: ${message}` : 'Presentation failed.')
    }
  } else if (data.event.requestStatus === 'request_retrieved') {
    displayProgress('Scanned, waiting for presentation...', {
      enableRetryAfterMs: RETRY_PRESENTATION_DELAY_MS,
    })
  } else {
    displayFinish()
    const form = document.querySelector('form') as HTMLFormElement
    form.submit()
  }
}

function displayPresentationResponse(response: any) {
  const { requestId, qrCode, url } = response
  const input = document.querySelector('input[name="requestId"]') as HTMLInputElement
  input.value = requestId

  const isMobile = /Android|iPhone/i.test(navigator.userAgent)
  if (isMobile) {
    openDeeplink(url)
    displayMobile(url)
  } else {
    displayDesktop(qrCode)
  }
  setTimeout(handleTimeout, 5 * 60 * 1000)
}

function openDeeplink(url: string) {
  if (!url) return
  if (!/Chrome|Chromium/i.test(navigator.userAgent)) {
    window.location.href = url
    return
  }
  const btn = document.createElement('button')
  btn.classList.add('d-none')
  btn.onclick = function () {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  document.body.appendChild(btn)
  setTimeout(() => {
    btn.click()
  }, 100)
}

function handleTimeout() {
  hide(document.querySelectorAll('#desktop, #mobile, #progress'))
  displayError({ message: 'QR code expired, please cancel and try again.' })
}

const currentScript = document.currentScript as HTMLScriptElement | null
const nonce = currentScript?.getAttribute('nonce') || ''
applyTheme(config)
wireBranding(config)

const retryLink = document.getElementById('retry-login-btn')
if (retryLink instanceof HTMLAnchorElement || retryLink instanceof HTMLButtonElement) {
  retryLink.onclick = (event) => {
    event.preventDefault()
    window.location.replace(`/oidc/interaction/${config.uid}?retry=1`)
  }
}

document.body.classList.remove('pre-theme')
document.body.classList.add('theme-ready')

if (config.showDebug && config.dbg) {
  const container = document.createElement('div')
  container.className = 'grant-debug debug'

  const details = document.createElement('details')

  const summary = document.createElement('summary')
  summary.className = 'text-center'
  summary.textContent = '(Click to expand) DEBUG information'

  const dl = document.createElement('dl')

  // Trusted Types policy
  const policy = (window as any).trustedTypes?.createPolicy('debug', {
    createHTML: (input: string) => input,
  })

  // -------- window size --------
  const dtWindow = document.createElement('dt')
  dtWindow.textContent = 'window size'

  const ddWindow = document.createElement('dd')
  ddWindow.id = 'window-dimensions-debug'
  ddWindow.textContent = `${window.innerWidth} (w) x ${window.innerHeight} (h)`

  // -------- uid --------
  const dtUid = document.createElement('dt')
  dtUid.textContent = 'uid'

  const ddUid = document.createElement('dd')
  ddUid.textContent = config.uid

  // -------- PARAMS --------
  const dtParams = document.createElement('dt')
  dtParams.textContent = 'PARAMS'

  const ddParams = document.createElement('dd')
  const paramsHtml = `======== <br>${config.dbg.params || ''}`

  ddParams.innerHTML = policy ? policy.createHTML(paramsHtml) : paramsHtml

  // -------- PROMPT --------
  const dtPrompt = document.createElement('dt')
  dtPrompt.textContent = 'PROMPT'

  const ddPrompt = document.createElement('dd')
  const promptHtml = `======== <br>${config.dbg.prompt || ''}`

  ddPrompt.innerHTML = policy ? policy.createHTML(promptHtml) : promptHtml

  // Assemble
  dl.appendChild(dtWindow)
  dl.appendChild(ddWindow)

  dl.appendChild(dtUid)
  dl.appendChild(ddUid)

  dl.appendChild(dtParams)
  dl.appendChild(ddParams)

  dl.appendChild(dtPrompt)
  dl.appendChild(ddPrompt)

  details.appendChild(summary)
  details.appendChild(dl)

  container.appendChild(details)

  // Append AFTER login card (outside it)
  document.body.appendChild(container)
}

displayProgress('Generating QR code...')

startLoginFlow(config, nonce)
