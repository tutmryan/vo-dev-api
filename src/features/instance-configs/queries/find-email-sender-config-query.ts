import { email } from '../../../config'
import type { QueryContext } from '../../../cqs'
import { InstanceSettingEntity } from '../entities/instance-setting-entity'

export async function FindEmailSenderConfigQuery(this: QueryContext) {
  const repo = this.entityManager.getRepository(InstanceSettingEntity)
  const config = await repo.findOneBy({ settingKey: 'email-sender' })
  const value = config?.getValue()

  return {
    senderName: value?.senderName ?? email.from.name,
    senderEmail: value?.senderEmail ?? email.from.email,
  }
}
