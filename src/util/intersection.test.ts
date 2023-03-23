import { findKeysIntersection } from './intersection'

describe('intersection', () => {
  const a = {
    foo: 'foo',
    bar: {
      baz: 'baz',
      nullz: null,
      nested: {
        deeply: {
          nested: {
            prop: 'value',
          },
        },
      },
    },
  }
  const b = {
    bar: {
      baz: 'baz',
      bing: {
        bong: 'bong',
      },
      nullz: null,
      nested: {
        deeply: {
          nested: {
            prop: 'value',
          },
        },
      },
    },
  }

  it('should return the keys that are in both objects', () => {
    expect(findKeysIntersection(a, b)).toMatchInlineSnapshot(`
      [
        "bar.baz",
        "bar.nullz",
        "bar.nested.deeply.nested.prop",
      ]
    `)
  })

  it('should ignore the keys with null values in both objects', () => {
    expect(findKeysIntersection(a, b, { ignoreNulls: true })).toMatchInlineSnapshot(`
      [
        "bar.baz",
        "bar.nested.deeply.nested.prop",
      ]
    `)
  })
})
