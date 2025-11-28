declare global {
  namespace Express {
    interface Response {
      locals: {
        cspNonce: string
      }
    }
  }
}

export {} // force module scope
