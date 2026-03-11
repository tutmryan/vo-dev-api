import { notifyInstanceSettingChanged } from '..'
import type { CommandContext } from '../../../cqs'
import type { InstanceSetting } from '../../../generated/graphql'
import type { InstanceSettingKey } from '../../../generated/graphql'
import { InstanceSettingEntity, validateInstanceSettingValue } from '../entities/instance-setting-entity'

export async function SetInstanceSettingCommand(this: CommandContext, key: InstanceSettingKey, value: unknown): Promise<InstanceSetting> {
  const repo = this.entityManager.getRepository(InstanceSettingEntity)

  const validatedValue = validateInstanceSettingValue(key, value)
  const serializedValue = JSON.stringify(validatedValue)

  let entity = await repo.findOneBy({ settingKey: key })
  if (entity) {
    entity.settingValue = serializedValue
  } else {
    entity = new InstanceSettingEntity()
    entity.settingKey = key
    entity.settingValue = serializedValue
  }

  await repo.save(entity)
  notifyInstanceSettingChanged()

  return {
    key: entity.settingKey,
    value: JSON.parse(entity.settingValue),
  }
}
