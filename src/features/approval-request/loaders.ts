import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { ApprovalRequestEntity } from './entities/approval-request-entity'

export const approvalRequestLoader = () =>
  new DataLoader<string, ApprovalRequestEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(ApprovalRequestEntity)
      .find({ comment: 'FindApprovalRequestsById', where: { id: In(ids) } })
    return ids.map(
      (id) => results.find((result) => result.id.toUpperCase() === id.toUpperCase()) ?? new Error(`Approval request not found: ${id}`),
    )
  })
