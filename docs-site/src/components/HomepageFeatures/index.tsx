import Link from '@docusaurus/Link'
import clsx from 'clsx'
import React from 'react'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  Svg: React.ComponentType<React.ComponentProps<'svg'>>
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to integrate with',
    Svg: require('@site/static/img/integrations.svg').default,
    description: <>We offer comprehensive guides and code samples for multiple platforms to integrate with us.</>,
  },
  {
    title: 'Focus on seamless experience',
    Svg: require('@site/static/img/rocket.svg').default,
    description: (
      <>
        The articles in the <Link to="/docs/guides">Guides</Link> section will get you started issuing and presenting verifiable credentials
        quickly.
      </>
    ),
  },
  {
    title: 'Powered by GraphQL',
    Svg: require('@site/static/img/network.svg').default,
    description: (
      <>
        Provide declarative, efficient data fetching to suit the requirements of your app with the help of explorable{' '}
        <Link to="/docs/reference">Schema reference</Link>.
      </>
    ),
  },
]

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
