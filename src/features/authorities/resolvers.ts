import type { Resolvers } from '../../generated/graphql'

export const resolvers: Resolvers = {
  Query: {
    authorities: (_parent, _args, { services: { admin } }) => admin.authorities(),
    authority: (_parent, { id }, { services: { admin } }) => admin.authorityById(id),
  },

  DidModel: {
    __resolveType: ({ did }) => (did.startsWith('did:ion:') ? 'IonDidModel' : 'WebDidModel'),
  },
}
