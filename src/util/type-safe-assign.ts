export const typeSafeAssign = <T extends object, TProperties extends keyof T>(target: T, props: Pick<T, TProperties>) => {
  Object.assign(target, props)
}

export const typeSafeAssignPartial = <T extends object, TProperties extends keyof T>(target: T, props: Partial<Pick<T, TProperties>>) => {
  Object.assign(target, props)
}
