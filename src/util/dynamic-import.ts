export async function dynamicImport<ReturnType>(packageName: string): Promise<ReturnType> {
  return new Function(`return import('${packageName}')`)()
}
