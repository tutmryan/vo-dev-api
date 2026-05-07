import { privateBlobStorage } from '../config'
import type { PresentationFlowContactInput } from '../generated/graphql'
import { PrivateBlobStorageContainerService } from './private-blob-storage-container-service'

export class PresentationFlowService extends PrivateBlobStorageContainerService {
  constructor() {
    super({ containerName: privateBlobStorage.presentationFlowContainer })
  }

  async uploadContact(id: string, contact: PresentationFlowContactInput): Promise<void> {
    await this.upload(id, Buffer.from(JSON.stringify(contact), 'utf-8'))
  }

  async downloadContact(id: string): Promise<PresentationFlowContactInput | undefined> {
    const data = await this.downloadToBuffer(id)
    if (!data) return undefined
    return JSON.parse(data.toString('utf-8')) as PresentationFlowContactInput
  }

  async deleteContactIfExists(id: string): Promise<void> {
    await this.deleteIfExists(id)
  }
}
