export const getObjectSizeInBytes = (obj: object): number => {
  const jsonString = JSON.stringify(obj)
  return new Blob([jsonString]).size
}

export const getObjectSizeInMB = (obj: object): number => {
  const bytes = getObjectSizeInBytes(obj)
  return bytes / (1024 * 1024)
}
