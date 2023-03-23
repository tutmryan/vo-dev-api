import { pruneNil } from './prune-nil'

// https://stackoverflow.com/questions/18515254/recursively-remove-null-values-from-javascript-object

describe('pruneNil', () => {
  const dirty = {
    key1: 'AAA',
    key2: {
      key21: 'BBB',
    },
    key3: {
      key31: true,
      key32: false,
    },
    key4: {
      key41: undefined,
      key42: null,
      key43: [],
      key44: {},
      key45: {
        key451: NaN,
        key452: {
          key4521: {},
        },
        key453: [{ foo: {}, bar: '' }, NaN, null, undefined],
      },
      key46: '',
    },
    key5: {
      key51: 1,
      key52: '  ',
      key53: [1, '2', {}, []],
      key54: [{ foo: { bar: true, baz: null } }, { foo: { bar: '', baz: 0 } }],
    },
    key6: function () {
      /* */
    },
  }

  it('should remove all keys with null or undefined values', () => {
    const pruned = pruneNil(dirty)
    expect(pruned).toMatchInlineSnapshot(`
      {
        "key1": "AAA",
        "key2": {
          "key21": "BBB",
        },
        "key3": {
          "key31": true,
          "key32": false,
        },
        "key4": {
          "key43": [],
          "key44": {},
          "key45": {
            "key451": NaN,
            "key452": {
              "key4521": {},
            },
            "key453": [
              {
                "bar": "",
                "foo": {},
              },
              NaN,
              ,
              ,
            ],
          },
          "key46": "",
        },
        "key5": {
          "key51": 1,
          "key52": "  ",
          "key53": [
            1,
            "2",
            {},
            [],
          ],
          "key54": [
            {
              "foo": {
                "bar": true,
              },
            },
            {
              "foo": {
                "bar": "",
                "baz": 0,
              },
            },
          ],
        },
        "key6": [Function],
      }
    `)
  })
})
