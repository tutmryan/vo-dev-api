import DefaultAdmonitionTypes from '@theme-original/Admonition/Types';

import clsx from 'clsx';
import styles from './styles.module.css';

function VoCustomAdmonition({ title = 'VO Tip', children }) {
  return (
    <div className={clsx('theme-admonition', 'admonition-vo-tip', 'alert', styles.admonition)}>
      <div className={clsx('theme-admonition-heading', 'admonition-heading-vo-tip', styles.admonitionHeading)}>
        <span className={clsx('admonition-icon', styles.admonitionIcon)}>
          <img src="/img/vo-logo-icon-primary.svg" alt="VO Icon" width={24} height={24} />
        </span>
          {title}
      </div>
      <div className={clsx('admonition-content', styles.admonitionContent)}>
        {children}
      </div>
    </div>
  );
}

const AdmonitionTypes = {
  ...DefaultAdmonitionTypes,

  'vo-tip': VoCustomAdmonition,
};

export default AdmonitionTypes;
