import { randomUUID } from 'crypto'

export const slugify = (str: string) =>
  `${str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${randomUUID().toLowerCase().slice(0, 8)}`
