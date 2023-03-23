import { isNil } from 'lodash'

export function intersectingProps<T>(target: T, source: T, props: Array<string & keyof T>): Array<string & keyof T> {
  return props.filter((prop) => !isNil(target[prop]) && !isNil(source[prop]))
}
