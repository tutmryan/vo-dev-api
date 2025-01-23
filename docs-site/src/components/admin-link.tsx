import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import type { PropsWithChildren } from 'react'
import React from 'react'

export const AdminLink = ({ path = '/', target = '_blank', children }: PropsWithChildren<{ path: string; target?: string }>) => (
  <a href={useDocusaurusContext().siteConfig.customFields.ADMIN_URL + path} target={target}>
    {children}
  </a>
)
