import { chunkify } from './chunkify'

describe('chunkify', () => {
  it.each<{
    i: unknown[]
    out: unknown[][]
    size: number
    type: string
  }>([
    { i: [], out: [], size: 1, type: 'empty array' },
    { i: [1], out: [[1]], size: 1, type: '1:1:1' },
    { i: [1, 2, 3], out: [[1], [2], [3]], size: 1, type: '3:3:1' },
    { i: [1, 2, 3], out: [[1, 2], [3]], size: 2, type: '3:2:2' },
    { i: [1, 2, 3], out: [[1, 2, 3]], size: 3, type: '3:1:3' },
    { i: [1, 2, 3], out: [[1, 2, 3]], size: 4, type: '3:1:4' },
  ])('$type', async ({ i, out, size }) => {
    // Act
    const result = chunkify(i, size)

    // Assert
    expect(result).toEqual(out)
  })
})
