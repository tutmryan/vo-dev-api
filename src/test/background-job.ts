import type { Job } from 'bullmq'
import { randomUUID } from 'crypto'
import type { HandlerContext, JobHandler, JobPayload } from '../background-jobs/jobs'
import { dataSource } from '../data'
import { UserEntity } from '../features/users/entities/user-entity'
import { logger } from '../logger'
import { createVerifiedIdAdminService } from '../services'
import { AsyncIssuanceService } from '../services/async-issuance-service'
import { CommunicationsService } from '../services/communications-service'

let workerOid: string

export const createTestWorkerContext = async (): Promise<HandlerContext> => {
  // Create a background worker user if it doesn't exist
  const userRepo = dataSource.getRepository(UserEntity)
  let user = workerOid ? await userRepo.findOneBy({ oid: workerOid }) : undefined
  if (!user) {
    user = await userRepo.save(
      new UserEntity({
        email: null,
        name: 'Background Worker',
        tenantId: randomUUID().toString(),
        oid: randomUUID().toString(),
        isApp: false,
      }),
    )
    workerOid = user.oid
  }

  return {
    logger,
    user,
    entityManager: dataSource.manager,
    updateProgress: jest.fn(),
    jobAuditMetadata: { jobId: randomUUID(), jobData: {} },
    services: {
      verifiedIdAdmin: createVerifiedIdAdminService(logger),
      asyncIssuances: new AsyncIssuanceService(),
      communications: new CommunicationsService(logger),
    },
  }
}

export const createJobMock = <TPayload>(payload: TPayload): Job<TPayload> => {
  const jobMock = {
    data: payload,
  } as Job<TPayload>

  jobMock.updateProgress = jest.fn()

  return jobMock
}

export const executeJob = async <TPayload extends JobPayload = JobPayload>(jobHandler: JobHandler<TPayload>, payload: TPayload) => {
  const workerContext = await createTestWorkerContext()
  await jobHandler(workerContext, payload)
}
