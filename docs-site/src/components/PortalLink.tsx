import type { PropsWithChildren } from 'react'
import React from 'react'

export const PortalLink = ({ path = '/', target = '_blank', children }: PropsWithChildren<{ path: string; target?: string }>) => (
  <>
    {children} at <strong>{path}</strong>
  </>
)
