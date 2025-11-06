import { notifyEmailSenderConfigChanged } from '..'
import { email } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { EmailSenderConfig, EmailSenderConfigInput } from '../../../generated/graphql'
import { InstanceSettingEntity } from '../entities/instance-setting-entity'

export async function SetEmailSenderConfigCommand(this: CommandContext, input: EmailSenderConfigInput): Promise<EmailSenderConfig> {
  const repo = this.entityManager.getRepository(InstanceSettingEntity)
  const key = 'email-sender'

  let entity = await repo.findOne({ where: { settingKey: key } })

  if (entity) {
    entity.update(input)
  } else {
    entity = InstanceSettingEntity.create(key, input)
  }
  await repo.save(entity)
  notifyEmailSenderConfigChanged()
  const value = entity.getValue()

  return {
    senderName: value.senderName ?? email.from.name,
    senderEmail: value.senderEmail ?? email.from.email,
  }
}
