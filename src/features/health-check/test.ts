import { graphql } from '../../generated'
import { beforeAfterAll, executeOperationAnonymous } from '../../test'

const healthcheckQuery = graphql(`
  query Healthcheck {
    healthcheck
  }
`)

describe('healthcheck query', () => {
  beforeAfterAll()

  it(`returns data and doesn't return errors`, async () => {
    const { data, errors } = await executeOperationAnonymous({
      query: healthcheckQuery,
    })

    expect(data).toMatchObject({ healthcheck: null })
    expect(errors).toBeUndefined()
  })
})
