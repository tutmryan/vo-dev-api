import { graphql } from '../../../generated'
import {
  beforeAfterAll,
  executeOperationAsCredentialAdmin,
  executeOperationAsPartnerAdmin,
  expectToBeDefinedAndNotNull,
  expectToBeUndefined,
  expectUnauthorizedError,
} from '../../../test'
import { createImportInput, createInvalidOrderImportInput, createMissingParentImportInput } from './create-import-input'

export const importMutation = graphql(`
  mutation Import($input: ImportInput!) {
    import(input: $input)
  }
`)

describe('Import', () => {
  describe('import mutation', () => {
    beforeAfterAll()
    it('returns no errors when called with valid input', async () => {
      const input = createImportInput()
      const { errors } = await executeOperationAsCredentialAdmin({
        query: importMutation,
        variables: {
          input,
        },
      })
      expectToBeUndefined(errors)
    })

    it('returns errors when called with invalid template order', async () => {
      const invalidInput = createInvalidOrderImportInput()
      const { errors } = await executeOperationAsCredentialAdmin({
        query: importMutation,
        variables: {
          input: invalidInput,
        },
      })
      expectToBeDefinedAndNotNull(errors)
      expect(errors?.[0]?.message).toContain('Invalid import order')
    })

    it('returns error when a template depends on a missing parent', async () => {
      const invalidInput = createMissingParentImportInput()

      const { errors } = await executeOperationAsCredentialAdmin({
        query: importMutation,
        variables: {
          input: invalidInput,
        },
      })

      expectToBeDefinedAndNotNull(errors)
      expect(errors?.[0]?.message).toContain('Missing parent')
    })

    it('returns unauthorized when called with unauthorized role', async () => {
      const input = createImportInput()
      const { errors } = await executeOperationAsPartnerAdmin({
        query: importMutation,
        variables: {
          input,
        },
      })
      expectUnauthorizedError(errors)
    })
  })
})
