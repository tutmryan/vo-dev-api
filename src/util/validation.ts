// use the ZOD regex: https://github.com/colinhacks/zod/blob/main/deno/lib/types.ts
// eslint-disable-next-line no-useless-escape
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i

/**
 * Validates an email address using the ZOD regex
 */
export const isValidEmail = (email: string) => emailRegex.test(email)
