import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import type { PropsWithChildren } from 'react'
import React from 'react'

export const RenderIf = ({ flag, children }: PropsWithChildren<{ flag: string }>) =>
  useDocusaurusContext().siteConfig.customFields[flag] ? <div>{children}</div> : <></>
