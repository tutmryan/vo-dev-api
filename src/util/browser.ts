export function isWebView3(userAgent: string) {
  return userAgent.includes('WebView/3.0') && userAgent.includes('Chrome/70')
}

export function isIe11(userAgent: string) {
  return userAgent.includes('Trident/7.0; rv:11.0') && userAgent.includes('Windows')
}
