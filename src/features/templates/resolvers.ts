import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { resolveUpdatedAt } from '../auditing/updated-at-resolver'
import { CreateTemplateCommand } from './commands/create-template-command'
import { UpdateTemplateCommand } from './commands/update-template-command'
import { FindTemplatesQuery } from './queries/find-templates-query'
import { GetTemplateQuery } from './queries/get-template-query'

export const resolvers: Resolvers = {
  Mutation: {
    createTemplate: (_, { input }, context) => dispatch(context, CreateTemplateCommand, input),
    updateTemplate: (_, { id, input }, context) => dispatch(context, UpdateTemplateCommand, id, input),
  },
  Query: {
    template: (_, { id }, context) => query(context, GetTemplateQuery, id),
    findTemplates: (_, { where, offset, limit }, context) => query(context, FindTemplatesQuery, where, offset, limit),
  },
  Template: {
    updatedAt: resolveUpdatedAt,
  },
}
