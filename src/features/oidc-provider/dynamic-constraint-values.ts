import type { UnknownObject } from 'oidc-provider'
import { logger } from '../../logger'

const DynamicConstraintValues = {
  loginHint: 'oidc:login_hint',
} as const

type DynamicValue = (typeof DynamicConstraintValues)[keyof typeof DynamicConstraintValues]

export const valueIsDynamic = (value: unknown): value is DynamicValue => {
  return Object.values(DynamicConstraintValues).some((dynamicValue) => value === dynamicValue)
}

export const resolveDynamicConstraintValue = (value: DynamicValue, params: UnknownObject): string => {
  switch (value) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case DynamicConstraintValues.loginHint: {
      if (!params.login_hint) logger.warn(`OIDC dynamic constraint value ${DynamicConstraintValues.loginHint} was mapped to an empty value`)
      return params.login_hint as string
    }
    default:
      throw new Error(`Unknown dynamic constraint value: ${value}`)
  }
}
