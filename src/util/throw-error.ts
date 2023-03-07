/*
Allows you to throw an error in a context where an expression is expected (eg. inside a ternary or null-coalesce expression)
The never return type indicates to flow analysis that calling this expression will never return a value meaning you can do things like

const val = someNullableValue ?? throwError(new Error('Oh noes it is null'))

# val is assumed not null here
val.doSomething()

 */
export const throwError = (error: Error): never => {
  throw error
}
