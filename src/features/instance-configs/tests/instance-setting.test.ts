import { graphql } from '../../../generated'
import { InstanceSettingKey } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsInstanceAdmin, expectUnauthorizedError } from '../../../test'

const getQuery = graphql(`
  query GetInstanceSetting($key: InstanceSettingKey!) {
    instanceSetting(key: $key) {
      key
      value
    }
  }
`)

const setMutation = graphql(`
  mutation SetInstanceSetting($input: SetInstanceSettingInput!) {
    setInstanceSetting(input: $input) {
      key
      value
    }
  }
`)

describe('InstanceSetting', () => {
  beforeAfterAll()

  describe('use-modern-oidc-ui setting', () => {
    it('returns null when setting does not exist', async () => {
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: getQuery,
        variables: { key: InstanceSettingKey.UseModernOidcUi },
      })

      expect(errors).toBeUndefined()
      expect(data?.instanceSetting).toBeNull()
    })

    it('allows instance admins to set use-modern-oidc-ui to true', async () => {
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.UseModernOidcUi, value: true } },
      })

      expect(errors).toBeUndefined()
      expect(data?.setInstanceSetting.key).toBe(InstanceSettingKey.UseModernOidcUi)
      expect(data?.setInstanceSetting.value).toBe(true)
    })

    it('allows instance admins to set use-modern-oidc-ui to false', async () => {
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.UseModernOidcUi, value: false } },
      })

      expect(errors).toBeUndefined()
      expect(data?.setInstanceSetting.key).toBe(InstanceSettingKey.UseModernOidcUi)
      expect(data?.setInstanceSetting.value).toBe(false)
    })

    it('overwrites previous value when setting a new one', async () => {
      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.UseModernOidcUi, value: true } },
      })

      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.UseModernOidcUi, value: false } },
      })

      const res = await executeOperationAsInstanceAdmin({
        query: getQuery,
        variables: { key: InstanceSettingKey.UseModernOidcUi },
      })

      expect(res.errors).toBeUndefined()
      expect(res.data?.instanceSetting?.key).toBe(InstanceSettingKey.UseModernOidcUi)
      expect(res.data?.instanceSetting?.value).toBe(false)
    })

    it('rejects non-boolean value for use-modern-oidc-ui', async () => {
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.UseModernOidcUi, value: 'true' } },
      })

      expect(data).toBeNull()
      expect(errors).toBeDefined()
      expect(errors?.[0]?.message).toContain('useModernOidcUi instance setting expects a boolean')
    })

    it('returns unauthorized for anonymous users on mutation', async () => {
      const { data, errors } = await executeOperationAnonymous({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.UseModernOidcUi, value: true } },
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('returns unauthorized for anonymous users on query', async () => {
      const { data, errors } = await executeOperationAnonymous({
        query: getQuery,
        variables: { key: InstanceSettingKey.UseModernOidcUi },
      })

      expect(data?.instanceSetting).toBeNull()
      expectUnauthorizedError(errors)
    })
  })

  describe('email-sender setting', () => {
    it('allows instance admins to set email-sender config', async () => {
      const emailConfig = { senderName: 'Test Sender', senderEmail: 'test@example.com' }

      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.EmailSender, value: emailConfig } },
      })

      expect(errors).toBeUndefined()
      expect(data?.setInstanceSetting.key).toBe(InstanceSettingKey.EmailSender)
      expect(data?.setInstanceSetting.value).toEqual(emailConfig)
    })

    it('allows partial email-sender config with null values', async () => {
      const emailConfig = { senderName: null, senderEmail: 'test@example.com' }

      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.EmailSender, value: emailConfig } },
      })

      expect(errors).toBeUndefined()
      expect(data?.setInstanceSetting.value).toEqual(emailConfig)
    })

    it('retrieves email-sender config after setting', async () => {
      const emailConfig = { senderName: 'Test Sender', senderEmail: 'test@example.com' }

      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.EmailSender, value: emailConfig } },
      })

      const res = await executeOperationAsInstanceAdmin({
        query: getQuery,
        variables: { key: InstanceSettingKey.EmailSender },
      })

      expect(res.errors).toBeUndefined()
      expect(res.data?.instanceSetting?.key).toBe(InstanceSettingKey.EmailSender)
      expect(res.data?.instanceSetting?.value).toEqual(emailConfig)
    })

    it('rejects email-sender config with invalid field types', async () => {
      const invalidConfig = { senderName: 123, senderEmail: 456 }

      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: { key: InstanceSettingKey.EmailSender, value: invalidConfig } },
      })

      expect(data).toBeNull()
      expect(errors).toBeDefined()
      expect(errors?.[0]?.message).toMatch(/sender(Name|Email) must be string|null|undefined/)
    })
  })
})
