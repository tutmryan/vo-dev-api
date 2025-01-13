import React, { ReactNode } from 'react'
import styles from './styles.module.css'

export const ImgBorder = ({ children }: { children: ReactNode }) => {
  return <span className={styles.imgBorder}>{children}</span>
}
