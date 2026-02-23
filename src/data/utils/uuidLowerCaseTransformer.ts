import type { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer'

export const uuidLowerCaseTransformer: ValueTransformer = {
  from: (dbValue) => {
    return dbValue == null ? null : (dbValue as string).toLowerCase()
  },
  to: (entityValue) => entityValue,
}
