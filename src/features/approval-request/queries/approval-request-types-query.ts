import type { QueryContext } from '../../../cqs'
import { dataSource } from '../../../data'

export async function ApprovalRequestTypesQuery(this: QueryContext) {
  const data = await dataSource.query(`
    /* ApprovalRequestTypesQuery */
    select distinct request_type from approval_request order by request_type asc
  `)

  return data.map(({ request_type }: { request_type: string }) => request_type)
}
