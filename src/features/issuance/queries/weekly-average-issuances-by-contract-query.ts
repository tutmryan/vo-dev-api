import { formatISO, subWeeks } from 'date-fns'
import type { QueryContext } from '../../../cqrs/query-context'
import type { ContractIssuanceWeeklyAverageWhere } from '../../../generated/graphql'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function WeeklyAverageIssuancesByContractQuery(
  this: QueryContext,
  criteria: ContractIssuanceWeeklyAverageWhere & { contractId: string },
) {
  const { entityManager } = this
  const toDate = criteria.to
  const numberOfWeeks = criteria.numberOfWeeks
  const rawData = await entityManager.getRepository(IssuanceEntity).query(
    `
SELECT SUM(weekly_total) / CAST(@0 AS NUMERIC) AS weekly_average
FROM (
	SELECT DATEDIFF(wk, [issuance].[issued_at], @3) AS week_ago, COUNT([issuance].[id]) AS weekly_total
	FROM [dbo].[issuance]
	WHERE
		[issuance].[issued_at] BETWEEN @2 AND @3
		AND [issuance].[contract_id] = @1
	GROUP BY DATEDIFF(wk, [issuance].[issued_at], @3)
) AS IssuanceTotal
`,
    [numberOfWeeks, criteria.contractId, formatISO(subWeeks(toDate, numberOfWeeks), { representation: 'date' }), formatISO(toDate)],
  )

  return (rawData as Record<string, number>[])[0]?.['weekly_average'] ?? 0.0
}
