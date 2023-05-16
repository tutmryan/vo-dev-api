import type { Express } from 'express'
import { express as voyagerMiddleware } from 'graphql-voyager/middleware'

export const addVoyager = (app: Express, route = '/voyager'): void => {
  app.get(route, (req, res) => {
    const headers = { authorization: `Bearer ${req.session?.accessToken}` }
    return voyagerMiddleware({ endpointUrl: '/graphql', headersJS: JSON.stringify(headers) })(req, res)
  })
}
