import type { IsolationLevel } from 'typeorm/driver/types/IsolationLevel'

export * from './data-source'
export const ISOLATION_LEVEL: IsolationLevel = 'REPEATABLE READ'
