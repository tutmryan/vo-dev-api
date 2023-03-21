import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateTemplateCommand } from './commands/create-template-command'
import { FindTemplatesQuery } from './queries/find-templates-query'
import { GetParentTemplateDataQuery } from './queries/get-parent-template-data-query'
import { GetTemplateQuery } from './queries/get-template-query'

export const resolvers: Resolvers = {
  Mutation: {
    createTemplate: (_, { input }, context) => dispatch(context, CreateTemplateCommand, input),
  },
  Query: {
    template: (_, { id }, context) => query(context, GetTemplateQuery, id),
    findTemplates: (_, { where, offset, limit }, context) => query(context, FindTemplatesQuery, where, offset, limit),
  },
  Template: {
    parentData: (template, _, context) => query(context, GetParentTemplateDataQuery, template),
  },
}
