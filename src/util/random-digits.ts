function randomDigit() {
  return Math.floor(Math.random() * 10)
}

export function randomDigits(length: number) {
  return [...Array(length)].map(randomDigit).join('')
}
