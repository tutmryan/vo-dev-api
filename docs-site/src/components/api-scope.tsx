import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

export function ApiScope() {
  return `${useDocusaurusContext().siteConfig.customFields.API_CLIENT_ID ?? 'local'}/.default`
}
