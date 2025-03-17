import { graphql } from '../../generated'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsInstanceAdmin, expectUnauthorizedError } from '../../test'

const conciergeBrandingQuery = graphql(`
  query ConciergeBranding {
    conciergeBranding {
      data
    }
  }
`)

const saveConciergeBrandingMutation = graphql(`
  mutation SaveConciergeBranding($input: ConciergeBrandingInput!) {
    saveConciergeBranding(input: $input) {
      id
    }
  }
`)

const saveConciergeBrandingMutationInput = {
  input: {
    data: {
      logo: {
        light: 'data:image/svg+xml;base64,PC9zdmc+Cg==',
        dark: 'data:image/svg+xml;base64,Cjwvc3ZnPgo=',
      },
      palette: {
        light: {
          primary: {
            main: '#406bf7',
            light: '#6688f8',
            dark: '#2c4aac',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#b0b5ff',
            light: '#bfc3ff',
            dark: '#7b7eb2',
            contrastText: '#000000',
          },
          background: {
            default: '#fcfcfc',
          },
        },
        dark: {
          primary: {
            main: '#90caf9',
            light: '#e3f2fd',
            dark: '#42a5f5',
            contrastText: '#000000',
          },
          secondary: {
            main: '#b0b5ff',
            light: '#bfc3ff',
            dark: '#7b7eb2',
            contrastText: '#000000',
          },
          background: {
            default: '#1a1a1a',
          },
        },
      },
    },
  },
}

const deleteConciergeBrandingMutation = graphql(`
  mutation DeleteConciergeBranding {
    deleteConciergeBranding
  }
`)

describe('Branding', () => {
  describe('conciergeBranding query', () => {
    beforeAfterAll()

    it('returns conciergeBranding null and no errors when called anonymously', async () => {
      const { data, errors } = await executeOperationAnonymous({
        query: conciergeBrandingQuery,
      })

      expect(data).toMatchObject({ conciergeBranding: null })
      expect(errors).toBeUndefined()
    })
  })

  describe('saveConciergeBranding mutation', () => {
    beforeAfterAll()

    it('returns id and no errors when called as instance admin', async () => {
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: saveConciergeBrandingMutation,
        variables: saveConciergeBrandingMutationInput,
      })

      expect(data).toMatchObject({
        saveConciergeBranding: {
          id: expect.any(String),
        },
      })
      expect(errors).toBeUndefined()
    })
  })

  describe('deleteConciergeBranding mutation', () => {
    beforeAfterAll()

    it('returns deleteConciergeBranding null and no errors when called as instance admin', async () => {
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: deleteConciergeBrandingMutation,
      })

      expect(data).toMatchObject({ deleteConciergeBranding: null })
      expect(errors).toBeUndefined()
    })
  })

  describe('unauthorized operations', () => {
    beforeAfterAll()

    it('should not allow anonymous users to call saveConciergeBranding', async () => {
      const { data, errors } = await executeOperationAnonymous({
        query: saveConciergeBrandingMutation,
        variables: saveConciergeBrandingMutationInput,
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('should not allow anonymous users to call deleteConciergeBranding', async () => {
      const { data, errors } = await executeOperationAnonymous({
        query: deleteConciergeBrandingMutation,
      })

      expect(data?.deleteConciergeBranding).toBeNull()
      expectUnauthorizedError(errors)
    })
  })

  describe('conciergeBranding happy path', () => {
    beforeAfterAll()

    it('saves branding and then retrieves the saved property and then deletes', async () => {
      const initialQueryResult = await executeOperationAnonymous({
        query: conciergeBrandingQuery,
      })
      expect(initialQueryResult?.data?.conciergeBranding).toBeNull()

      const saveResult = await executeOperationAsInstanceAdmin({
        query: saveConciergeBrandingMutation,
        variables: saveConciergeBrandingMutationInput,
      })
      expect(saveResult.data).toMatchObject({
        saveConciergeBranding: {
          id: expect.any(String),
        },
      })
      expect(saveResult.errors).toBeUndefined()

      const postSaveQueryResult = await executeOperationAnonymous({
        query: conciergeBrandingQuery,
      })
      expect(postSaveQueryResult?.data?.conciergeBranding).not.toBeNull()

      expect(postSaveQueryResult?.data?.conciergeBranding?.data?.logo).toEqual(saveConciergeBrandingMutationInput.input.data.logo)

      const deleteResult = await executeOperationAsInstanceAdmin({
        query: deleteConciergeBrandingMutation,
      })
      expect(deleteResult.data).toMatchObject({ deleteConciergeBranding: null })
      expect(deleteResult.errors).toBeUndefined()

      const finalQueryResult = await executeOperationAnonymous({
        query: conciergeBrandingQuery,
      })
      expect(finalQueryResult?.data?.conciergeBranding).toBeNull()
    })
  })
})
