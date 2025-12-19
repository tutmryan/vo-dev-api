import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import type { PropsWithChildren } from 'react'
import React from 'react'

export const ApiLink = ({ path = '/graphql', target = '_blank', children }: PropsWithChildren<{ path: string; target?: string }>) => (
  <>
    {children} at <strong>{path}</strong>
  </>
)
