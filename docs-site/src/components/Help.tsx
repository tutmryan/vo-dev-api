import React, { ReactNode } from 'react'

export const Help = ({ children }: { children: ReactNode }) => {
  return (
    <span
      style={{
        fontSize: '80%',
        fontStyle: 'italic',
      }}
    >
      {children}
    </span>
  )
}
