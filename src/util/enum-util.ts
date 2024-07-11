export const convertEnum = <TEnumIn, TEnumOut, TKeys extends string>(
  value: TEnumIn,
  fromEnum: Record<TKeys, TEnumIn>,
  toEnum: Record<TKeys, TEnumOut>,
): TEnumOut => {
  const keyOfValue = Object.entries(fromEnum).find(([, v]) => v === value)?.[0]
  if (!keyOfValue) {
    // missing value
    throw new Error('key missing')
  }
  return toEnum[keyOfValue as keyof typeof toEnum]
}

export const enumStringValues = <TEnum extends Record<keyof TEnum, TEnum[keyof TEnum]>>(enumObject: TEnum): string[] => {
  return Object.values(enumObject) as string[]
}
