import { portalUrl } from '../../config'
import { dispatch, query } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CancelPresentationFlowCommand } from './commands/cancel-presentation-flow-command'
import { CreatePresentationFlowCommand } from './commands/create-presentation-flow-command'
import { CreatePresentationFlowTemplateCommand } from './commands/create-presentation-flow-template-command'
import { CreatePresentationRequestForPresentationFlowCommand } from './commands/create-presentation-request-for-presentation-flow-command'
import { DeletePresentationFlowTemplateCommand } from './commands/delete-presentation-flow-template-command'
import { SubmitPresentationFlowActionsCommand } from './commands/submit-presentation-flow-actions-command'
import { UpdatePresentationFlowTemplateCommand } from './commands/update-presentation-flow-template-command'
import { resolvePresentationFlowEvent, subscribeToPresentationFlowEvents } from './pubsub'
import { FindActionedPresentationFlowDataQuery } from './queries/find-actioned-presentation-flow-data-query'
import { FindPresentationFlowTemplatesQuery } from './queries/find-presentation-flow-templates-query'
import { FindPresentationFlowsQuery } from './queries/find-presentation-flows-query'

export const resolvers: Resolvers = {
  Mutation: {
    createPresentationFlow: (_, { request }, context) => dispatch(context, CreatePresentationFlowCommand, request),
    createPresentationRequestForPresentationFlow: (_, { presentationFlowId, input }, context) =>
      dispatch(context, CreatePresentationRequestForPresentationFlowCommand, presentationFlowId, input ?? undefined),
    submitPresentationFlowActions: (_, { id, input }, context) => dispatch(context, SubmitPresentationFlowActionsCommand, id, input),
    cancelPresentationFlow: (_, { id }, context) => dispatch(context, CancelPresentationFlowCommand, id),
    createPresentationFlowTemplate: (_, { input }, context) => dispatch(context, CreatePresentationFlowTemplateCommand, input),
    updatePresentationFlowTemplate: (_, { id, input }, context) => dispatch(context, UpdatePresentationFlowTemplateCommand, id, input),
    deletePresentationFlowTemplate: (_, { id }, context) => dispatch(context, DeletePresentationFlowTemplateCommand, id),
  },
  Query: {
    presentationFlow: (_, { id }, { dataLoaders: { presentationFlows } }) => presentationFlows.load(id),
    findPresentationFlows: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindPresentationFlowsQuery, where, offset, limit, orderBy, orderDirection),
    actionedPresentationFlowData: (_, { id }, context) => query(context, FindActionedPresentationFlowDataQuery, id),
    presentationFlowTemplate: (_, { id }, { dataLoaders: { presentationFlowTemplates } }) => presentationFlowTemplates.load(id),
    findPresentationFlowTemplates: (_, _args, context) => query(context, FindPresentationFlowTemplatesQuery),
  },
  PresentationFlow: {
    portalUrl: (root) => `${portalUrl}/presentation-flow/${root.id}`,
    identity: (root, _, { dataLoaders: { identities } }) => (root.identityId == null ? null : identities.load(root.identityId)),
    template: (root, _, { dataLoaders: { presentationFlowTemplates } }) =>
      root.templateId ? presentationFlowTemplates.load(root.templateId) : null,
    action: (root) => {
      if (!root.actionKey) return null

      const actions = root.actions ?? []
      const matched = actions.find((a) => a.key === root.actionKey)
      if (matched) return matched

      if (root.actionKey === 'SUBMIT') {
        return { key: 'SUBMIT', label: 'Submit' }
      }

      return { key: root.actionKey, label: root.actionKey }
    },
  },
  Identity: {
    presentationFlows: (identity, { where, offset, limit }, context) =>
      query(context, FindPresentationFlowsQuery, { identityId: identity.id, ...where }, offset, limit),
  },
  Subscription: {
    presentationFlowEvent: {
      subscribe: subscribeToPresentationFlowEvents,
      resolve: resolvePresentationFlowEvent,
    },
  },
}
