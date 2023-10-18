import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import type { PropsWithChildren } from 'react'
import React from 'react'

export const AdminUrl = ({ path, children }: PropsWithChildren<{ path: string }>) => (
  <a href={useDocusaurusContext().siteConfig.customFields.ADMIN_URL + path}>{children}</a>
)
