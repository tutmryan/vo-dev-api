import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { PropsWithChildren } from 'react';
import React from 'react';

export const PortalUrl = ({ path = '/', target = '_blank', children }: PropsWithChildren<{ path: string; target?: string }>) => (
  <a href={useDocusaurusContext().siteConfig.customFields.PORTAL_URL + path} target={target}>
    {children}
  </a>
)
