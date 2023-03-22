import { isNil } from 'lodash'

export function intersectingProps<T>(target: T, source: T, props: Array<keyof T>): Array<keyof T> {
  return props.filter((prop) => !isNil(target[prop]) && !isNil(source[prop]))
}
