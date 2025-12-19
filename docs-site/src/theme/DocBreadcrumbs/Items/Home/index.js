import React from 'react'
import translate from '@docusaurus/Translate'
import { useLocation } from '@docusaurus/router'
import IconHome from '@theme/Icon/Home'
import styles from './styles.module.css'

export default function HomeBreadcrumbItem() {
  const location = useLocation()

  // Determine which section we're in based on the URL path
  const currentSection = location.pathname.startsWith('/api-reference')
    ? '/api-reference'
    : location.pathname.startsWith('/release-notes')
      ? '/release-notes'
      : '/docs'

  return (
    <span className={styles.breadcrumbHomeItemWrapper}>
      <a
        className={styles.breadcrumbHomeItem}
        href={currentSection}
        aria-label={translate({
          id: 'theme.docs.breadcrumbs.home',
          message: 'Home page',
          description: 'The ARIA label for the home page in the breadcrumbs',
        })}
      >
        <IconHome className={styles.breadcrumbHomeIcon} />
      </a>
      <span className={styles.breadcrumbSeparator}>›</span>
    </span>
  )
}
