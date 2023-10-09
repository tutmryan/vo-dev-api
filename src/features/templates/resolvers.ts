import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { downloadToDataUrl } from '../../util/data-url'
import { resolveUpdatedAt } from '../auditing/updated-at-resolver'
import { CreateTemplateCommand } from './commands/create-template-command'
import { DeleteTemplateCommand } from './commands/delete-template-command'
import { UpdateTemplateCommand } from './commands/update-template-command'
import { FindTemplatesQuery } from './queries/find-templates-query'

export const resolvers: Resolvers = {
  Mutation: {
    createTemplate: (_, { input }, context) => dispatch(context, CreateTemplateCommand, input),
    updateTemplate: (_, { id, input }, context) => dispatch(context, UpdateTemplateCommand, id, input),
    deleteTemplate: (_, { id }, context) => dispatch(context, DeleteTemplateCommand, id),
  },
  Query: {
    template: (_, { id }, { dataLoaders: { templates } }) => templates.load(id),
    findTemplates: (_, { where, offset, limit }, context) => query(context, FindTemplatesQuery, where, offset, limit),
    templateCombinedData: async (_, { templateId }, { dataLoaders: { templates } }) => {
      const template = await templates.load(templateId)
      return template.combinedData()
    },
  },
  Template: {
    description: () => '',
    updatedAt: resolveUpdatedAt,
  },
  TemplateDisplayCredentialLogo: {
    image: ({ uri }) => (uri ? downloadToDataUrl(uri) : null),
  },
}
