export const mockCreateContract = jest.fn()
export const mockUpdateContract = jest.fn()
export const mock = jest.mock('../admin', () => ({
  AdminService: jest.fn().mockImplementation(() => ({
    createContract: mockCreateContract,
    updateContract: mockUpdateContract,
  })),
}))
