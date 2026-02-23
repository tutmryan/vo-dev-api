import { Column, Entity, PrimaryColumn } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'

export type InstanceSetting = { key: 'email-sender'; value: { senderName?: string | null; senderEmail?: string | null } }

export type InstanceSettingKey = InstanceSetting['key']

export type InstanceSettingValue<K extends InstanceSettingKey> = Extract<InstanceSetting, { key: K }>['value']

@Entity('instance_settings')
export class InstanceSettingEntity extends VerifiedOrchestrationEntity {
  @PrimaryColumn({ name: 'setting_key', type: 'nvarchar', length: 100 })
  settingKey!: InstanceSettingKey

  @Column({ name: 'setting_value', type: 'nvarchar', length: 'max' })
  settingValue!: string

  getValue<K extends InstanceSettingKey>(): InstanceSettingValue<K> {
    return JSON.parse(this.settingValue) as InstanceSettingValue<K>
  }

  static create<K extends InstanceSettingKey>(key: K, value: InstanceSettingValue<K>): InstanceSettingEntity {
    const entity = new InstanceSettingEntity()
    entity.settingKey = key
    entity.settingValue = JSON.stringify(value)
    return entity
  }

  update<K extends InstanceSettingKey>(this: InstanceSettingEntity & { settingKey: K }, value: InstanceSettingValue<K>): void {
    this.settingValue = JSON.stringify(value)
  }
}
