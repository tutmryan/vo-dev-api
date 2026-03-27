import casual from 'casual'
import { dataSource } from '../../../data'
import { ContactMethod } from '../../../generated/graphql'
import { beforeAfterAll } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { createIdentity } from '../../identity/tests/create-identity'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { createPresentationFlow } from './helpers'
import { getDefaultPresentationFlowInput } from './helpers'
import { sendPresentationFlowNotification } from '../notification'
import { createTestWorkerContext } from '../../../test/background-job'

describe('resendPresentationFlowNotification', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
  })

  describe('sendPresentationFlowNotification function - resend scenarios', () => {
    it('throws error when resend for cancelled presentation flow', async () => {
      // Arrange
      const identity = await createIdentity()
      const input = await getDefaultPresentationFlowInput()
      input.identityId = identity.id
      input.contact = {
        notification: {
          method: ContactMethod.Email,
          value: casual.email,
        },
      }

      const result = await createPresentationFlow(input)

      // Cancel the presentation flow
      const presentationFlowRepo = dataSource.manager.getRepository(PresentationFlowEntity)
      await presentationFlowRepo.update(result.request.id, { isCancelled: true })

      const context = await createTestWorkerContext()

      // Act & Assert
      await expect(
        sendPresentationFlowNotification(context, dataSource.manager, result.request.id),
      ).rejects.toThrow('Cannot send notification for cancelled presentation flow')
    })

    it('throws error when resend for submitted presentation flow', async () => {
      // Arrange
      const identity = await createIdentity()
      const input = await getDefaultPresentationFlowInput()
      input.identityId = identity.id
      input.contact = {
        notification: {
          method: ContactMethod.Email,
          value: casual.email,
        },
      }

      const result = await createPresentationFlow(input)

      // Mark the presentation flow as submitted
      const presentationFlowRepo = dataSource.manager.getRepository(PresentationFlowEntity)
      await presentationFlowRepo.update(result.request.id, { isSubmitted: true })

      const context = await createTestWorkerContext()

      // Act & Assert
      await expect(
        sendPresentationFlowNotification(context, dataSource.manager, result.request.id),
      ).rejects.toThrow('Cannot send notification for submitted presentation flow')
    })

    it('throws error when no contact is set', async () => {
      // Arrange
      const identity = await createIdentity()
      const input = await getDefaultPresentationFlowInput()
      input.identityId = identity.id
      // Do not set contact

      const result = await createPresentationFlow(input)

      const context = await createTestWorkerContext()

      // Act & Assert
      await expect(
        sendPresentationFlowNotification(context, dataSource.manager, result.request.id),
      ).rejects.toThrow('No contact information set for this presentation flow')
    })
  })
})
