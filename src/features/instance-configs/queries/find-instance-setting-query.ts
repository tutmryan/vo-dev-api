import type { QueryContext } from '../../../cqs'
import type { InstanceSettingKey } from '../../../generated/graphql'
import type { InstanceSettingValueMap } from '../entities/instance-setting-entity'
import { InstanceSettingEntity } from '../entities/instance-setting-entity'

export async function FindInstanceSettingQuery<K extends InstanceSettingKey>(
  this: QueryContext,
  key: K,
): Promise<{ key: K; value: InstanceSettingValueMap[K] } | null> {
  const repo = this.entityManager.getRepository(InstanceSettingEntity)
  const entity = await repo.findOneBy({ settingKey: key })

  if (!entity) {
    return null
  }

  return {
    key: entity.settingKey as K,
    value: JSON.parse(entity.settingValue) as InstanceSettingValueMap[K],
  }
}
