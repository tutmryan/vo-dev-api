import type { QueryContext } from '../../../cqrs/query-context'
import { dataSource } from '../../../data'

export async function CredentialTypesQuery(this: QueryContext) {
  const data = await dataSource.query(`
select distinct value from (
  select value
  from contract
  cross apply openjson(credential_types_json, '$')
  union
  select value
  from template
  cross apply openjson(credential_types_json, '$')
  union
  select value
  from partner
  cross apply openjson(credential_types_json, '$')
) as all_types order by value
`)
  return data.map(({ value }: { value: string }) => value)
}
