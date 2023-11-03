import { formatISO, subWeeks } from 'date-fns'
import type { QueryContext } from '../../../cqs'
import type { ContractPresentationWeeklyAverageWhere } from '../../../generated/graphql'
import { PresentationEntity } from '../entities/presentation-entity'

export async function WeeklyAveragePresentationsByContractQuery(
  this: QueryContext,
  criteria: ContractPresentationWeeklyAverageWhere & { contractId: string },
) {
  const { entityManager } = this
  const toDate = criteria.to
  const numberOfWeeks = criteria.numberOfWeeks
  const rawData = await entityManager.getRepository(PresentationEntity).query(
    `
SELECT SUM(weekly_total) / CAST(@0 AS NUMERIC) AS weekly_average
FROM (
	SELECT DATEDIFF(wk, [presentation].[presented_at], @3) AS week_ago, COUNT(DISTINCT [presentation].[id]) AS weekly_total
	FROM
		[dbo].[presentation]
		JOIN [dbo].[presentation_issuances]
			ON [presentation].[id] = [presentation_issuances].[presentation_id]
		JOIN [dbo].[issuance]
			ON [presentation_issuances].[issuance_id] = [issuance].[id]
			AND [issuance].[contract_id] = @1
	WHERE [presentation].[presented_at] BETWEEN @2 AND @3
	GROUP BY DATEDIFF(wk, [presentation].[presented_at], @3)
) AS PresentationTotal
`,
    [numberOfWeeks, criteria.contractId, formatISO(subWeeks(toDate, numberOfWeeks), { representation: 'date' }), formatISO(toDate)],
  )

  return (rawData as Record<string, number>[])[0]?.['weekly_average'] ?? 0.0
}
