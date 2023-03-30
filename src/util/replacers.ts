export const getReplacer = () => {
  return (propertyName: string, value: any) => {
    const replacedValue = typeOrmPropertiesReplacer(propertyName, value)
    if (!replacedValue) {
      return
    }

    return getCircularReplacer()(propertyName, value)
  }
}

const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (_: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    if (typeof value === 'bigint') return value.toString()
    return value
  }
}

/**
 * TypeORM creates "private" properties when a property is marked as Promise<T>.
 * This makes sure they don't get serialised.
 * @param propertyName The name of the property
 * @param value The value of the property
 */
const typeOrmPropertiesReplacer = (propertyName: string, value: any) => {
  if (propertyName.startsWith('__') && propertyName.endsWith('__')) {
    return
  }

  return value
}
