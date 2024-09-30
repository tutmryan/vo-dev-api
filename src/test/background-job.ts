import type { Job } from 'bullmq'
import { randomUUID } from 'crypto'
import type { JobHandler, JobPayload, WorkerContext } from '../background-jobs/jobs'
import { createWorkerContext } from '../background-jobs/worker'
import { dataSource } from '../data'
import { UserEntity } from '../features/users/entities/user-entity'

let workerOid: string

export const createTestWorkerContext = async (): Promise<WorkerContext> => {
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

  return createWorkerContext(user.id)
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
  await jobHandler(workerContext, createJobMock(payload))
}
