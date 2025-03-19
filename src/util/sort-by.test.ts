import { sortBy, sortByIgnoreCase } from './sort-by'

describe('sortBy', () => {
  it('should sort numbers in ascending order', () => {
    const array = [{ value: 3 }, { value: 1 }, { value: 2 }]
    const sorted = array.sort(sortBy((item) => item.value))
    expect(sorted).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
  })

  it('should sort numbers in descending order', () => {
    const array = [{ value: 1 }, { value: 3 }, { value: 2 }]
    const sorted = array.sort(sortBy((item) => item.value, true))
    expect(sorted).toEqual([{ value: 3 }, { value: 2 }, { value: 1 }])
  })

  it('should sort dates in ascending order', () => {
    const array = [{ value: new Date('2023-01-01') }, { value: new Date('2022-01-01') }, { value: new Date('2023-06-01') }]
    const sorted = array.sort(sortBy((item) => item.value))
    expect(sorted).toEqual([{ value: new Date('2022-01-01') }, { value: new Date('2023-01-01') }, { value: new Date('2023-06-01') }])
  })

  it('should sort dates in descending order', () => {
    const array = [{ value: new Date('2022-01-01') }, { value: new Date('2023-01-01') }, { value: new Date('2023-06-01') }]
    const sorted = array.sort(sortBy((item) => item.value, true))
    expect(sorted).toEqual([{ value: new Date('2023-06-01') }, { value: new Date('2023-01-01') }, { value: new Date('2022-01-01') }])
  })
})

describe('sortByIgnoreCase', () => {
  it('should sort strings in ascending order ignoring case', () => {
    const array = [{ value: 'b' }, { value: 'A' }, { value: 'c' }]
    const sorted = array.sort(sortByIgnoreCase((item) => item.value))
    expect(sorted).toEqual([{ value: 'A' }, { value: 'b' }, { value: 'c' }])
  })

  it('should sort strings in descending order ignoring case', () => {
    const array = [{ value: 'a' }, { value: 'C' }, { value: 'b' }]
    const sorted = array.sort(sortByIgnoreCase((item) => item.value, true))
    expect(sorted).toEqual([{ value: 'C' }, { value: 'b' }, { value: 'a' }])
  })
})
