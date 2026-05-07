import { query } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CountCredentialRecordsQuery, FindCredentialRecordsQuery, type CredentialRecordRow } from './queries/find-credential-records-query'

export const resolvers: Resolvers = {
  Query: {
    findCredentialRecords: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindCredentialRecordsQuery, where, offset, limit, orderBy, orderDirection),

    credentialRecordCount: (_, { where }, context) => query(context, CountCredentialRecordsQuery, where),
  },
  // CredentialRecord resolvers use the query result type (with *Id fields) as parent,
  // not the GraphQL type. The resolver loads related entities via DataLoaders.
  CredentialRecord: {
    contract: (parent: CredentialRecordRow, _, { dataLoaders }) => dataLoaders.contracts.load(parent.contractId),
    identity: (parent: CredentialRecordRow, _, { dataLoaders }) => dataLoaders.identities.load(parent.identityId),
    createdBy: (parent: CredentialRecordRow, _, { dataLoaders }) =>
      parent.createdById ? dataLoaders.users.load(parent.createdById).catch(() => null) : null,
    issuance: (parent: CredentialRecordRow, _, { dataLoaders }) =>
      parent.issuanceId ? dataLoaders.issuances.load(parent.issuanceId) : null,
    asyncIssuanceRequest: (parent: CredentialRecordRow, _, { dataLoaders }) =>
      parent.asyncIssuanceId ? dataLoaders.asyncIssuances.load(parent.asyncIssuanceId) : null,
  } as Resolvers['CredentialRecord'],
}
