import type { QueryContext } from '../../../cqs'
import { dataSource } from '../../../data'
import type { CredentialTypesWhere } from '../../../generated/graphql'

const contractTypesSelect = `
  select value
  from contract
  cross apply openjson(credential_types_json, '$')
`

const templateTypesSelect = `
  select value
  from template
  cross apply openjson(credential_types_json, '$')
`

const partnerTypesSelect = `
  select value
  from partner
  cross apply openjson(credential_types_json, '$')
`

export async function CredentialTypesQuery(this: QueryContext, where?: CredentialTypesWhere) {
  const selects: string[] = []

  if (where) {
    if (where.includeContractTypes) selects.push(contractTypesSelect)
    if (where.includeTemplateTypes) selects.push(templateTypesSelect)
    if (where.includePartnerTypes) selects.push(partnerTypesSelect)
    if (selects.length === 0) throw new Error('No credential type criteria selected')
  } else selects.push(contractTypesSelect, templateTypesSelect, partnerTypesSelect)

  const data = await dataSource.query(`
    /* CredentialTypesQuery */
    select distinct value from (
      ${selects.join(' union ')}
    ) as all_types order by value
  `)

  return data.map(({ value }: { value: string }) => value)
}
