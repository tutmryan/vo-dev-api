export function mockFunction<T extends (...args: any) => any>() {
  return jest.fn<ReturnType<T>, Parameters<T>>()
}

type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? never : K
}[keyof T]

export type ServiceMock<T, O extends keyof T = never> = {
  // No idea why the NonFunctionPropertyNames is needed here, but it is 🤷‍♂️, as the conditional extends or never should filter out the functions
  [K in keyof Omit<T, O | NonFunctionPropertyNames<T>>]: T[K] extends (...args: any) => any
    ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
    : never
}
