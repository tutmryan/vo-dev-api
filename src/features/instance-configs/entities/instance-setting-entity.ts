import { Column, Entity, PrimaryColumn } from 'typeorm'
import { nvarcharMaxType, nvarcharType, varcharMaxLength } from '../../../data/utils/crossDbColumnTypes'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { InstanceSettingKey } from '../../../generated/graphql'

export type InstanceSettingValueMap = {
  [InstanceSettingKey.EmailSender]: { senderName?: string | null; senderEmail?: string | null }
  [InstanceSettingKey.UseModernOidcUi]: boolean
}

// optional convenience alias
export type EmailSenderSettingValue = InstanceSettingValueMap[InstanceSettingKey.EmailSender]
export type UseModernOidcUiSettingValue = InstanceSettingValueMap[InstanceSettingKey.UseModernOidcUi]

@Entity('instance_settings')
export class InstanceSettingEntity extends VerifiedOrchestrationEntity {
  @PrimaryColumn({ name: 'setting_key', type: nvarcharType, length: 100 })
  settingKey!: InstanceSettingKey

  @Column({ name: 'setting_value', type: nvarcharMaxType, length: varcharMaxLength })
  settingValue!: string
}

export function parseSettingValue<T>(entity: InstanceSettingEntity | null | undefined): T | undefined {
  if (!entity) return undefined
  return JSON.parse(entity.settingValue) as T
}

/**
 * Central place for per-key instance setting validation.
 *
 * When you add a new InstanceSettingKey in the GraphQL schema and regenerate types:
 * - Extend InstanceSettingValueMap above with the value type for that key.
 * - Add a corresponding entry to instanceSettingValidators below that:
 *   - Performs any runtime validation needed for the incoming JSON value.
 *   - Returns a value matching InstanceSettingValueMap[key].
 *
 * TypeScript will fail compilation if:
 * - You add a new InstanceSettingKey but forget to extend InstanceSettingValueMap.
 * - You extend InstanceSettingValueMap but forget to add a validator here.
 */
type InstanceSettingValidator<K extends InstanceSettingKey> = (value: unknown) => InstanceSettingValueMap[K]

const instanceSettingValidators: { [K in InstanceSettingKey]: InstanceSettingValidator<K> } = {
  [InstanceSettingKey.UseModernOidcUi]: (value): InstanceSettingValueMap[InstanceSettingKey.UseModernOidcUi] => {
    if (typeof value !== 'boolean') {
      throw new Error('useModernOidcUi instance setting expects a boolean')
    }
    return value
  },

  [InstanceSettingKey.EmailSender]: (value): InstanceSettingValueMap[InstanceSettingKey.EmailSender] => {
    if (typeof value !== 'object' || value === null) {
      throw new Error('emailSender instance setting expects an object')
    }

    const v = value as { senderName?: unknown; senderEmail?: unknown }
    const senderName = v.senderName
    const senderEmail = v.senderEmail

    if (senderName !== undefined && senderName !== null && typeof senderName !== 'string') {
      throw new Error('senderName must be string|null|undefined')
    }
    if (senderEmail !== undefined && senderEmail !== null && typeof senderEmail !== 'string') {
      throw new Error('senderEmail must be string|null|undefined')
    }

    return {
      senderName: senderName as string | null | undefined,
      senderEmail: senderEmail as string | null | undefined,
    }
  },
}

export function validateInstanceSettingValue<K extends InstanceSettingKey>(key: K, value: unknown): InstanceSettingValueMap[K] {
  const validator: InstanceSettingValidator<K> = instanceSettingValidators[key]
  return validator(value)
}
