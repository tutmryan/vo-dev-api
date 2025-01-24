import type { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer'

export const uuidLowerCaseTransformer: ValueTransformer = {
  from: (dbValue) => {
    return (dbValue as string | null)?.toLowerCase()
  },
  to: (entityValue) => entityValue,
}
