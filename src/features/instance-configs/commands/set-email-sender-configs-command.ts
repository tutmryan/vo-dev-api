import { notifyInstanceSettingChanged } from '..'
import { email } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { EmailSenderConfig, EmailSenderConfigInput } from '../../../generated/graphql'
import { InstanceSettingKey } from '../../../generated/graphql'
import type { EmailSenderSettingValue } from '../entities/instance-setting-entity'
import { InstanceSettingEntity, parseSettingValue } from '../entities/instance-setting-entity'

export async function SetEmailSenderConfigCommand(this: CommandContext, input: EmailSenderConfigInput): Promise<EmailSenderConfig> {
  const repo = this.entityManager.getRepository(InstanceSettingEntity)

  let entity = await repo.findOneBy({ settingKey: InstanceSettingKey.EmailSender })

  if (entity) {
    entity.settingValue = JSON.stringify(input)
  } else {
    entity = new InstanceSettingEntity()
    entity.settingKey = InstanceSettingKey.EmailSender
    entity.settingValue = JSON.stringify(input)
  }

  await repo.save(entity)
  notifyInstanceSettingChanged()

  const value = parseSettingValue<EmailSenderSettingValue>(entity)

  return {
    senderName: value?.senderName ?? email.from.name,
    senderEmail: value?.senderEmail ?? email.from.email,
  }
}
