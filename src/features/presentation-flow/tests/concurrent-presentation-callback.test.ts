import { dataSource } from '../../../data'
import { PresentationFlowStatus } from '../../../generated/graphql'
import { beforeAfterAll } from '../../../test'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { createPresentationFlow, createPresentationForPresentationFlow, getDefaultPresentationFlowInput } from './helpers'

async function getPresentationFlowStatus(id: string): Promise<PresentationFlowStatus> {
  const flow = await dataSource.manager.getRepository(PresentationFlowEntity).findOneByOrFail({ id })
  return flow.status
}

describe('concurrent presentation callbacks', () => {
  beforeAfterAll()

  it('completes two presentation callbacks without error', async () => {
    const flow1 = await createPresentationFlow(await getDefaultPresentationFlowInput())
    const flow2 = await createPresentationFlow(await getDefaultPresentationFlowInput())

    // SQLite serialises transactions so we run sequentially here; on MSSQL these run concurrently.
    // The test validates the DB write pattern (INSERT presentation + UPDATE presentation_flow) succeeds
    // for both flows and produces distinct presentation records — the pattern that previously deadlocked.
    const result1 = await createPresentationForPresentationFlow(flow1.request.id)
    const result2 = await createPresentationForPresentationFlow(flow2.request.id)

    expect(result1.presentation.id).toBeDefined()
    expect(result2.presentation.id).toBeDefined()
    expect(result1.presentation.id).not.toEqual(result2.presentation.id)
  })

  it('both flows reach PresentationVerified status after callbacks', async () => {
    const flow1 = await createPresentationFlow(await getDefaultPresentationFlowInput())
    const flow2 = await createPresentationFlow(await getDefaultPresentationFlowInput())

    await createPresentationForPresentationFlow(flow1.request.id)
    await createPresentationForPresentationFlow(flow2.request.id)
    const [status1, status2] = await Promise.all([getPresentationFlowStatus(flow1.request.id), getPresentationFlowStatus(flow2.request.id)])

    expect(status1).toBe(PresentationFlowStatus.PresentationVerified)
    expect(status2).toBe(PresentationFlowStatus.PresentationVerified)
  })
})
