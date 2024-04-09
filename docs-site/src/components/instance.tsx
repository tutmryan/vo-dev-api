import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

export function Instance() {
  return useDocusaurusContext().siteConfig.customFields.INSTANCE ?? 'local'
}
