import type { PresentationFlowContactInput } from '../../generated/graphql'
import type { PresentationFlowService } from '../presentation-flow-service'

// In-memory store so upload → download round-trips work transparently in tests
const store = new Map<string, PresentationFlowContactInput>()

const serviceMock = {
  uploadContact: jest.fn(async (id: string, contact: PresentationFlowContactInput) => {
    store.set(id, contact)
  }),
  downloadContact: jest.fn(async (id: string) => store.get(id)),
  deleteContactIfExists: jest.fn(async (id: string) => {
    store.delete(id)
  }),
  containerClient: jest.fn(),
  upload: jest.fn(),
  downloadToBuffer: jest.fn(),
  getProperties: jest.fn(),
  deleteIfExists: jest.fn(),
  uploadDataUrl: jest.fn(),
  exists: jest.fn(),
  listAllBlobsFlat: jest.fn(),
} satisfies Record<keyof PresentationFlowService, jest.Mock>

jest.mock('../presentation-flow-service', () => ({
  PresentationFlowService: jest.fn().mockImplementation(() => serviceMock),
}))

export const helper = {
  clearAllMocks: () => {
    store.clear()
    Object.values(serviceMock).forEach((m) => (m as jest.Mock).mockClear())
    // Re-attach the in-memory behaviour after clearing
    ;(serviceMock.uploadContact as jest.Mock).mockImplementation(async (id: string, contact: PresentationFlowContactInput) => {
      store.set(id, contact)
    })
    ;(serviceMock.downloadContact as jest.Mock).mockImplementation(async (id: string) => store.get(id))
    ;(serviceMock.deleteContactIfExists as jest.Mock).mockImplementation(async (id: string) => {
      store.delete(id)
    })
  },
  uploadContact: {
    mock: () => serviceMock.uploadContact,
  },
  downloadContact: {
    mock: () => serviceMock.downloadContact,
  },
}
