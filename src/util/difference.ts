export const difference = <T>(whatIsInThis: readonly T[], thatIsntInThis: readonly T[]) =>
  whatIsInThis.filter((x) => !thatIsntInThis.includes(x))
