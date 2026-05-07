import { email } from '../../../config'
import type { QueryContext } from '../../../cqs'
import { InstanceSettingKey } from '../../../generated/graphql'
import type { InstanceSettingValueMap } from '../entities/instance-setting-entity'
import { InstanceSettingEntity } from '../entities/instance-setting-entity'

type EmailSenderSetting = InstanceSettingValueMap[InstanceSettingKey.EmailSender]

export async function FindEmailSenderConfigQuery(this: QueryContext) {
  const repo = this.entityManager.getRepository(InstanceSettingEntity)

  const setting = await repo.findOneBy({ settingKey: InstanceSettingKey.EmailSender })
  if (!setting) {
    return {
      senderName: email.from.name,
      senderEmail: email.from.email,
    }
  }

  const value = JSON.parse(setting.settingValue) as EmailSenderSetting

  return {
    senderName: value.senderName ?? email.from.name,
    senderEmail: value.senderEmail ?? email.from.email,
  }
}
