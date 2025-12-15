import { faker } from '@faker-js/faker'
import { graphql } from '../../../generated'
import { EmailSenderConfigInput } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsInstanceAdmin, expectUnauthorizedError } from '../../../test'

faker.seed(Date.now())

function getRandomInput(): EmailSenderConfigInput {
  return {
    senderName: faker.person.fullName(),
    senderEmail: faker.internet.email(),
  }
}

const findQuery = graphql(`
  query GetEmailSenderConfig {
    emailSenderConfig {
      senderName
      senderEmail
    }
  }
`)

const setMutation = graphql(`
  mutation SetEmailSenderConfig($input: EmailSenderConfigInput!) {
    setEmailSenderConfig(input: $input) {
      senderName
      senderEmail
    }
  }
`)

describe('EmailSenderConfig', () => {
  beforeAfterAll()

  describe('setEmailSenderConfig', () => {
    it('allows instance admins to set sender config', async () => {
      const input = getRandomInput()
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input },
      })

      expect(errors).toBeUndefined()
      expect(data?.setEmailSenderConfig).toEqual(expect.objectContaining(input))
    })

    it('overwrites previous config when setting a new one', async () => {
      const initial = getRandomInput()
      const updated = getRandomInput()

      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: initial },
      })

      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: updated },
      })

      const res = await executeOperationAsInstanceAdmin({ query: findQuery })
      expect(res.errors).toBeUndefined()
      expect(res.data?.emailSenderConfig).toEqual(expect.objectContaining(updated))
    })

    it('clears a field & resets to default fallback when explicitly set to null', async () => {
      const initial = getRandomInput()
      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: initial },
      })

      const cleared = { senderName: null, senderEmail: initial.senderEmail }
      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: cleared },
      })

      const res = await executeOperationAsInstanceAdmin({ query: findQuery })
      expect(res.errors).toBeUndefined()
      expect(res.data?.emailSenderConfig?.senderName).toBe('Verified Orchestration')
      expect(res.data?.emailSenderConfig?.senderEmail).toBe(initial.senderEmail)
    })

    it('returns unauthorized for anonymous users', async () => {
      const input = getRandomInput()
      const { data, errors } = await executeOperationAnonymous({
        query: setMutation,
        variables: { input },
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })
  })

  describe('emailSenderConfig query', () => {
    it('returns config after setting', async () => {
      const input = getRandomInput()
      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input },
      })

      const res = await executeOperationAsInstanceAdmin({ query: findQuery })

      expect(res.errors).toBeUndefined()
      expect(res.data?.emailSenderConfig).toEqual(expect.objectContaining(input))
    })

    it('returns unauthorized for anonymous users', async () => {
      const { data, errors } = await executeOperationAnonymous({ query: findQuery })
      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })
  })
})
