import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

export function EntraAppRedirectAuth() {
  return `${useDocusaurusContext().siteConfig.customFields.GRAPHQL_ENDPOINT}/oidc/auth`
}

export function EntraAppRedirectOidcMeta() {
  return `${useDocusaurusContext().siteConfig.customFields.GRAPHQL_ENDPOINT}/oidc/.well-known/openid-configuration`
}
