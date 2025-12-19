import type { PropsWithChildren } from 'react'
import React from 'react'

export const AdminLink = ({ path = '/', target = '_blank', children }: PropsWithChildren<{ path: string; target?: string }>) => (
  <>{children}</>
)
