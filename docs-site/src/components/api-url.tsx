import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import type { PropsWithChildren } from 'react'
import React from 'react'

export const ApiUrl = ({ path, children }: PropsWithChildren<{ path: string }>) => (
  <a href={useDocusaurusContext().siteConfig.customFields.GRAPHQL_ENDPOINT + path}>{children}</a>
)
