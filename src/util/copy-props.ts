import { isNil } from 'lodash'

/***
 * Copies the specified property values from source to target if they are not already set on the target.
 */
export function copyUnsetProps<T>(target: T, source: T, props: Array<keyof T>) {
  props.forEach((prop) => {
    if (!isNil(target[prop])) return
    target[prop] = source[prop]
  })
}
