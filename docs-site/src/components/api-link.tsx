import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import type { PropsWithChildren } from 'react'
import React from 'react'

export const ApiLink = ({ path = '/graphql', target = '_blank', children }: PropsWithChildren<{ path: string; target?: string }>) => (
  <a href={useDocusaurusContext().siteConfig.customFields.GRAPHQL_ENDPOINT + path} target={target}>
    {children}
  </a>
)
