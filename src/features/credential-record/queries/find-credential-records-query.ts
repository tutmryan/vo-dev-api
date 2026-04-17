import type { QueryContext } from '../../../cqs'
import { isTestSqlite } from '../../../data/utils/crossDbColumnTypes'
import {
  CredentialIssuanceMethod,
  CredentialRecordOrderBy,
  CredentialRecordStatus,
  OrderDirection,
  type Maybe,
} from '../../../generated/graphql'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { validateFilter } from '../../issuance/validation/filter-validation'

/**
 * Converts a Date to the appropriate format for a raw SQL parameter.
 * In SQLite tests, raw Date params must be converted to UTC datetime strings because
 * sqlite3 converts Date objects to REAL (Unix timestamps), which breaks datetime TEXT comparisons.
 */
function toDateParam(value: Date): string | Date {
  if (isTestSqlite) {
    // Format as 'YYYY-MM-DD HH:MM:SS.mmm' matching TypeORM's datetime storage format for SQLite
    const d = value
    const pad = (n: number, len = 2) => String(n).padStart(len, '0')
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`
  }
  return value
}

export interface CredentialRecordRow {
  id: string
  contractId: string
  identityId: string
  createdById: string
  createdAt: Date
  expiresAt: Date | null
  issuanceMethod: CredentialIssuanceMethod
  credentialRecordStatus: CredentialRecordStatus
  issuanceId: string | null
  asyncIssuanceId: string | null
}

interface WhereLike {
  id?: string | null
  contractId?: string | null
  identityId?: string | null
  identityStoreId?: string | null
  createdById?: string | null
  issuanceMethod?: string | null
  credentialRecordStatus?: string | null
  createdFrom?: Date | null
  createdTo?: Date | null
  AND?: WhereLike[] | null
  OR?: WhereLike[] | null
}

/**
 * Merges two flat WhereLike conjunctions into one (AND semantics).
 * Scalar fields from `b` override `a` only if not already set.
 * Array fields (AND/OR) are not present in leaf conjunctions produced by flattenToConjunctions.
 */
function mergeConjunctions(a: WhereLike, b: WhereLike): WhereLike {
  const result: WhereLike = { ...a }
  for (const key of Object.keys(b) as (keyof WhereLike)[]) {
    if (key === 'AND' || key === 'OR') continue
    if (b[key] != null && result[key] == null) {
      ;(result as Record<string, unknown>)[key] = b[key]
    }
  }
  return result
}

/**
 * Converts a possibly nested AND/OR WhereLike tree into Disjunctive Normal Form:
 * a flat array of conjunctions (plain WhereLike objects without AND/OR).
 * Each conjunction represents one set of filter conditions that, when OR'd together,
 * are equivalent to the original expression.
 */
function flattenToConjunctions(where: WhereLike | null | undefined): WhereLike[] {
  if (!where) return [{}]

  const { AND, OR, ...leaf } = where

  // Start with the leaf fields as the base conjunction
  let conjunctions: WhereLike[] = [leaf]

  // AND: each AND child must hold — intersect every child's conjunctions with the current set
  if (AND && AND.length > 0) {
    for (const andClause of AND) {
      const childConjunctions = flattenToConjunctions(andClause)
      // Cross-product merge: every existing conjunction must also satisfy each child conjunction
      // Since AND means all must hold, we merge each child into every existing conjunction
      conjunctions = conjunctions.flatMap((existing) => childConjunctions.map((child) => mergeConjunctions(existing, child)))
    }
  }

  // OR: at least one branch must hold — union all branches
  if (OR && OR.length > 0) {
    const orConjunctions = OR.flatMap((orClause) => {
      const childConjunctions = flattenToConjunctions(orClause)
      // Each OR branch must also carry the current conjunctions as context
      return conjunctions.flatMap((existing) => childConjunctions.map((child) => mergeConjunctions(existing, child)))
    })
    return orConjunctions
  }

  return conjunctions
}

type ParamList = unknown[]

function buildBranch1(where: WhereLike | null | undefined, params: ParamList): string {
  const conditions: string[] = ['1=1']
  const status = where?.credentialRecordStatus
  const method = where?.issuanceMethod

  const nowIdx = 0 // @0 is always `now`, added by callers before calling build functions

  if (where?.id) {
    params.push(where.id)
    conditions.push(`LOWER(i.credential_record_id) = @${params.length - 1}`)
  }
  if (where?.contractId) {
    params.push(where.contractId)
    conditions.push(`i.contract_id = @${params.length - 1}`)
  }
  if (where?.identityId) {
    params.push(where.identityId)
    conditions.push(`i.identity_id = @${params.length - 1}`)
  }
  if (where?.identityStoreId) {
    params.push(where.identityStoreId)
    conditions.push(`[iden].identity_store_id = @${params.length - 1}`)
  }
  if (where?.createdById) {
    params.push(where.createdById)
    conditions.push(`cr.created_by_id = @${params.length - 1}`)
  }
  if (where?.createdFrom) {
    params.push(toDateParam(where.createdFrom))
    conditions.push(`cr.created_at >= @${params.length - 1}`)
  }
  if (where?.createdTo) {
    params.push(toDateParam(where.createdTo))
    conditions.push(`cr.created_at <= @${params.length - 1}`)
  }

  if (status === CredentialRecordStatus.IssuanceCompleted) {
    conditions.push('(i.is_revoked IS NULL OR i.is_revoked = 0)')
    conditions.push(`i.expires_at >= @${nowIdx}`)
  } else if (status === CredentialRecordStatus.Revoked) {
    conditions.push('i.is_revoked = 1')
  } else if (status === CredentialRecordStatus.Expired) {
    conditions.push('(i.is_revoked IS NULL OR i.is_revoked = 0)')
    conditions.push(`i.expires_at < @${nowIdx}`)
  } else if (
    status === CredentialRecordStatus.IssuanceStarted ||
    status === CredentialRecordStatus.Offered ||
    status === CredentialRecordStatus.OfferExpired ||
    status === CredentialRecordStatus.OfferFailed ||
    status === CredentialRecordStatus.IssuanceFailed ||
    status === CredentialRecordStatus.OfferCancelled ||
    status === CredentialRecordStatus.VerificationStarted ||
    status === CredentialRecordStatus.IdentityNotVerified ||
    status === CredentialRecordStatus.IssuanceExpired
  ) {
    conditions.push('1=0')
  }

  if (method === CredentialIssuanceMethod.InPerson) {
    conditions.push('ai.id IS NULL')
  } else if (method === CredentialIssuanceMethod.Remote) {
    conditions.push('ai.id IS NOT NULL')
  }

  return `
    SELECT
      LOWER(i.credential_record_id) AS id,
      LOWER(i.contract_id) AS contract_id,
      LOWER(i.identity_id) AS identity_id,
      LOWER(cr.created_by_id) AS created_by_id,
      i.created_at,
      i.expires_at,
      'issuance' AS source,
      LOWER(i.id) AS issuance_id,
      LOWER(ai.id) AS async_issuance_id,
      CASE
        WHEN i.is_revoked = 1 THEN '${CredentialRecordStatus.Revoked}'
        WHEN i.expires_at < @${nowIdx} THEN '${CredentialRecordStatus.Expired}'
        ELSE '${CredentialRecordStatus.IssuanceCompleted}'
      END AS credential_status,
      CASE
        WHEN ai.id IS NOT NULL THEN '${CredentialIssuanceMethod.Remote}'
        ELSE '${CredentialIssuanceMethod.InPerson}'
      END AS issuance_method,
      c.name AS contract_name,
      [iden].name AS identity_name
    FROM [issuance] i
    JOIN [contract] c ON c.id = i.contract_id
    JOIN [identity] [iden] ON [iden].id = i.identity_id
    JOIN [credential_record] cr ON cr.id = i.credential_record_id
    LEFT JOIN [async_issuance] ai ON ai.issuance_id = i.id
    WHERE ${conditions.join(' AND ')}
  `
}

function buildBranch2(where: WhereLike | null | undefined, params: ParamList): string {
  const conditions: string[] = ["ai.state != 'issued'"]
  const status = where?.credentialRecordStatus

  const nowIdx = 0 // @0 is always `now`

  if (where?.id) {
    params.push(where.id)
    conditions.push(`LOWER(ai.credential_record_id) = @${params.length - 1}`)
  }
  if (where?.contractId) {
    params.push(where.contractId)
    conditions.push(`ai.contract_id = @${params.length - 1}`)
  }
  if (where?.identityId) {
    params.push(where.identityId)
    conditions.push(`ai.identity_id = @${params.length - 1}`)
  }
  if (where?.identityStoreId) {
    params.push(where.identityStoreId)
    conditions.push(`[iden].identity_store_id = @${params.length - 1}`)
  }
  if (where?.createdById) {
    params.push(where.createdById)
    conditions.push(`ai.created_by_id = @${params.length - 1}`)
  }
  if (where?.createdFrom) {
    params.push(toDateParam(where.createdFrom))
    conditions.push(`ai.created_at >= @${params.length - 1}`)
  }
  if (where?.createdTo) {
    params.push(toDateParam(where.createdTo))
    conditions.push(`ai.created_at <= @${params.length - 1}`)
  }

  if (status === CredentialRecordStatus.Offered) {
    conditions.push("ai.state IN ('pending', 'contacted')")
    conditions.push(`ai.expires_on >= @${nowIdx}`)
  } else if (status === CredentialRecordStatus.OfferExpired) {
    conditions.push("ai.state NOT IN ('issued', 'cancelled')")
    conditions.push(`ai.expires_on < @${nowIdx}`)
  } else if (status === CredentialRecordStatus.OfferFailed) {
    conditions.push("ai.state = 'contact-failed'")
    conditions.push(`ai.expires_on >= @${nowIdx}`)
  } else if (status === CredentialRecordStatus.IssuanceFailed) {
    conditions.push("ai.state = 'issuance-failed'")
    conditions.push(`ai.expires_on >= @${nowIdx}`)
  } else if (status === CredentialRecordStatus.OfferCancelled) {
    conditions.push("ai.state = 'cancelled'")
  } else if (status === CredentialRecordStatus.IdentityNotVerified) {
    conditions.push("ai.state = 'issuance-verification-failed'")
    conditions.push(`ai.expires_on >= @${nowIdx}`)
  } else if (status === CredentialRecordStatus.VerificationFailed) {
    // Placeholder: no current async_issuance state maps to a technical verification failure
    conditions.push('1=0')
  } else if (status === CredentialRecordStatus.VerificationStarted) {
    conditions.push('ai.has_verification_communication = 1')
    conditions.push("ai.state NOT IN ('contact-failed', 'issuance-failed', 'issuance-verification-failed', 'cancelled')")
    conditions.push(`ai.expires_on >= @${nowIdx}`)
  } else if (status === CredentialRecordStatus.IssuanceStarted) {
    conditions.push("ai.state = 'verification-complete'")
    conditions.push(`ai.expires_on >= @${nowIdx}`)
  } else if (
    status === CredentialRecordStatus.IssuanceCompleted ||
    status === CredentialRecordStatus.Revoked ||
    status === CredentialRecordStatus.Expired ||
    status === CredentialRecordStatus.IssuanceExpired
  ) {
    conditions.push('1=0')
  }

  // Uses denormalized has_verification_communication flag for performance at scale
  return `
    SELECT
      LOWER(ai.credential_record_id) AS id,
      LOWER(ai.contract_id) AS contract_id,
      LOWER(ai.identity_id) AS identity_id,
      LOWER(ai.created_by_id) AS created_by_id,
      ai.created_at,
      ai.expires_on AS expires_at,
      'async_issuance' AS source,
      NULL AS issuance_id,
      LOWER(ai.id) AS async_issuance_id,
      CASE
        WHEN ai.state = 'cancelled' THEN '${CredentialRecordStatus.OfferCancelled}'
        WHEN ai.expires_on < @${nowIdx} THEN '${CredentialRecordStatus.OfferExpired}'
        WHEN ai.state = 'issuance-verification-failed' AND ai.expires_on >= @${nowIdx} THEN '${CredentialRecordStatus.IdentityNotVerified}'
        WHEN ai.state = 'contact-failed' AND ai.expires_on >= @${nowIdx} THEN '${CredentialRecordStatus.OfferFailed}'
        WHEN ai.state = 'issuance-failed' AND ai.expires_on >= @${nowIdx} THEN '${CredentialRecordStatus.IssuanceFailed}'
        WHEN ai.state = 'verification-complete' AND ai.expires_on >= @${nowIdx} THEN '${CredentialRecordStatus.IssuanceStarted}'
        WHEN ai.has_verification_communication = 1 AND ai.expires_on >= @${nowIdx} THEN '${CredentialRecordStatus.VerificationStarted}'
        ELSE '${CredentialRecordStatus.Offered}'
      END AS credential_status,
      '${CredentialIssuanceMethod.Remote}' AS issuance_method,
      c.name AS contract_name,
      [iden].name AS identity_name
    FROM [async_issuance] ai
    JOIN [contract] c ON c.id = ai.contract_id
    JOIN [identity] [iden] ON [iden].id = ai.identity_id
    WHERE ${conditions.join(' AND ')}
  `
}

function buildBranch3(where: WhereLike | null | undefined, params: ParamList): string {
  const conditions: string[] = ['i.id IS NULL', 'ai.id IS NULL']
  const status = where?.credentialRecordStatus

  const nowIdx = 0 // @0 is always `now`, added by callers before calling build functions

  if (where?.id) {
    params.push(where.id)
    conditions.push(`LOWER(cr.id) = @${params.length - 1}`)
  }
  if (where?.contractId) {
    params.push(where.contractId)
    conditions.push(`cr.contract_id = @${params.length - 1}`)
  }
  if (where?.identityId) {
    params.push(where.identityId)
    conditions.push(`cr.identity_id = @${params.length - 1}`)
  }
  if (where?.identityStoreId) {
    params.push(where.identityStoreId)
    conditions.push(`[iden].identity_store_id = @${params.length - 1}`)
  }
  if (where?.createdById) {
    params.push(where.createdById)
    conditions.push(`cr.created_by_id = @${params.length - 1}`)
  }
  if (where?.createdFrom) {
    params.push(toDateParam(where.createdFrom))
    conditions.push(`cr.created_at >= @${params.length - 1}`)
  }
  if (where?.createdTo) {
    params.push(toDateParam(where.createdTo))
    conditions.push(`cr.created_at <= @${params.length - 1}`)
  }

  if (status === CredentialRecordStatus.OfferCancelled) {
    conditions.push('cr.cancelled_at IS NOT NULL')
  } else if (status === CredentialRecordStatus.IssuanceFailed) {
    conditions.push('cr.failed_at IS NOT NULL')
    conditions.push('cr.cancelled_at IS NULL')
  } else if (status === CredentialRecordStatus.IssuanceExpired) {
    conditions.push('cr.cancelled_at IS NULL')
    conditions.push('cr.failed_at IS NULL')
    conditions.push('cr.expires_at IS NOT NULL')
    conditions.push(`cr.expires_at < @${nowIdx}`)
  } else if (status === CredentialRecordStatus.IssuanceStarted) {
    conditions.push('cr.failed_at IS NULL')
    conditions.push('cr.cancelled_at IS NULL')
    conditions.push(`(cr.expires_at IS NULL OR cr.expires_at >= @${nowIdx})`)
  }

  return `
    SELECT
      LOWER(cr.id) AS id,
      LOWER(cr.contract_id) AS contract_id,
      LOWER(cr.identity_id) AS identity_id,
      LOWER(cr.created_by_id) AS created_by_id,
      cr.created_at,
      cr.expires_at,
      'credential_record' AS source,
      NULL AS issuance_id,
      NULL AS async_issuance_id,
      CASE
        WHEN cr.cancelled_at IS NOT NULL THEN '${CredentialRecordStatus.OfferCancelled}'
        WHEN cr.failed_at IS NOT NULL THEN '${CredentialRecordStatus.IssuanceFailed}'
        WHEN cr.expires_at IS NOT NULL AND cr.expires_at < @${nowIdx} THEN '${CredentialRecordStatus.IssuanceExpired}'
        ELSE '${CredentialRecordStatus.IssuanceStarted}'
      END AS credential_status,
      '${CredentialIssuanceMethod.InPerson}' AS issuance_method,
      c.name AS contract_name,
      [iden].name AS identity_name
    FROM [credential_record] cr
    JOIN [contract] c ON c.id = cr.contract_id
    JOIN [identity] [iden] ON [iden].id = cr.identity_id
    LEFT JOIN [issuance] i ON i.credential_record_id = cr.id
    LEFT JOIN [async_issuance] ai ON ai.credential_record_id = cr.id
    WHERE ${conditions.join(' AND ')}
  `
}

function shouldIncludeBranch1(status: string | null | undefined, _method: string | null | undefined): boolean {
  // Branch1 covers completed issuances — including those that originated from an async (Remote) request.
  // The method filter (InPerson/Remote) is applied inside buildBranch1 via ai.id IS NULL / IS NOT NULL.
  if (
    status &&
    !([CredentialRecordStatus.IssuanceCompleted, CredentialRecordStatus.Revoked, CredentialRecordStatus.Expired] as string[]).includes(
      status,
    )
  )
    return false
  return true
}

function shouldIncludeBranch2(status: string | null | undefined, method: string | null | undefined): boolean {
  if (method === CredentialIssuanceMethod.InPerson) return false
  if (
    status &&
    !(
      [
        CredentialRecordStatus.Offered,
        CredentialRecordStatus.OfferFailed,
        CredentialRecordStatus.OfferExpired,
        CredentialRecordStatus.OfferCancelled,
        CredentialRecordStatus.VerificationStarted,
        CredentialRecordStatus.IdentityNotVerified,
        CredentialRecordStatus.VerificationFailed,
        CredentialRecordStatus.IssuanceFailed,
        CredentialRecordStatus.IssuanceStarted,
      ] as string[]
    ).includes(status)
  )
    return false
  return true
}

function shouldIncludeBranch3(status: string | null | undefined, method: string | null | undefined): boolean {
  if (method === CredentialIssuanceMethod.Remote) return false
  if (
    status &&
    !(
      [
        CredentialRecordStatus.IssuanceStarted,
        CredentialRecordStatus.IssuanceFailed,
        CredentialRecordStatus.OfferCancelled,
        CredentialRecordStatus.IssuanceExpired,
      ] as string[]
    ).includes(status)
  )
    return false
  return true
}

function orderColumn(orderBy: string | null | undefined): string {
  switch (orderBy) {
    case CredentialRecordOrderBy.ContractName:
      return 'contract_name'
    case CredentialRecordOrderBy.IdentityName:
      return 'identity_name'
    default:
      return 'created_at'
  }
}

function mapRow(row: Record<string, unknown>): CredentialRecordRow {
  return {
    id: row.id as string,
    contractId: row.contract_id as string,
    identityId: row.identity_id as string,
    createdById: row.created_by_id as string,
    createdAt: new Date(row.created_at as string),
    expiresAt: row.expires_at ? new Date(row.expires_at as string) : null,
    issuanceMethod: row.issuance_method as CredentialIssuanceMethod,
    credentialRecordStatus: row.credential_status as CredentialRecordStatus,
    issuanceId: (row.issuance_id as string | null) ?? null,
    asyncIssuanceId: (row.async_issuance_id as string | null) ?? null,
  }
}

export async function FindCredentialRecordsQuery(
  this: QueryContext,
  where?: Maybe<WhereLike>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<string>,
  orderDirection?: Maybe<OrderDirection>,
): Promise<CredentialRecordRow[]> {
  validateFilter(where)

  const now = new Date()
  const params: ParamList = [toDateParam(now)] // @0 = now

  const conjunctions = flattenToConjunctions(where)
  const branches: string[] = []
  for (const conjunction of conjunctions) {
    const status = conjunction.credentialRecordStatus
    const method = conjunction.issuanceMethod
    if (shouldIncludeBranch1(status, method)) branches.push(buildBranch1(conjunction, params))
    if (shouldIncludeBranch2(status, method)) branches.push(buildBranch2(conjunction, params))
    if (shouldIncludeBranch3(status, method)) branches.push(buildBranch3(conjunction, params))
  }
  if (branches.length === 0) return []

  const dir = orderDirection === OrderDirection.Desc ? 'DESC' : 'ASC'
  const col = orderColumn(orderBy)
  const limitVal = limit ?? 100
  const offsetVal = offset ?? 0

  // UNION (not UNION ALL) deduplicates rows that appear in multiple OR branches
  const unionSql = branches.join('\nUNION\n')
  // In SQLite test mode, @0 = now is in params but not referenced when only branch3 runs (no date comparisons).
  // SQLite throws SQLITE_RANGE if params array has more elements than @N placeholders in the SQL.
  if (isTestSqlite && !unionSql.includes('@0')) {
    params.shift()
  }
  let paginationSql: string
  if (isTestSqlite) {
    // SQLite does not support parameterized LIMIT/OFFSET; use inlined integer literals (safe — values are internal integers, not user strings)
    paginationSql = `LIMIT ${limitVal} OFFSET ${offsetVal}`
  } else {
    params.push(offsetVal)
    const offsetIdx = params.length - 1
    params.push(limitVal)
    const limitIdx = params.length - 1
    paginationSql = `OFFSET @${offsetIdx} ROWS FETCH NEXT @${limitIdx} ROWS ONLY`
  }
  const sql = `
/* FindCredentialRecordsQuery */
SELECT * FROM (
${unionSql}
) AS [combined]
ORDER BY [${col}] ${dir}
${paginationSql}
`

  const rows = await this.entityManager.getRepository(IssuanceEntity).query(sql, params)
  return (rows as Record<string, unknown>[]).map(mapRow)
}

export async function CountCredentialRecordsQuery(this: QueryContext, where?: Maybe<WhereLike>): Promise<number> {
  validateFilter(where)

  const now = new Date()
  const params: ParamList = [toDateParam(now)] // @0 = now

  const conjunctions = flattenToConjunctions(where)
  const branches: string[] = []
  for (const conjunction of conjunctions) {
    const status = conjunction.credentialRecordStatus
    const method = conjunction.issuanceMethod
    if (shouldIncludeBranch1(status, method)) branches.push(buildBranch1(conjunction, params))
    if (shouldIncludeBranch2(status, method)) branches.push(buildBranch2(conjunction, params))
    if (shouldIncludeBranch3(status, method)) branches.push(buildBranch3(conjunction, params))
  }
  if (branches.length === 0) return 0

  // UNION deduplicates rows that appear in multiple OR branches
  const unionSql = branches.join('\nUNION\n')
  // In SQLite test mode, strip the unused @0=now param if no branch references it (avoids SQLITE_RANGE)
  if (isTestSqlite && !unionSql.includes('@0')) {
    params.shift()
  }
  const sql = `
/* CountCredentialRecordsQuery */
SELECT COUNT(*) AS cnt FROM (
${unionSql}
) AS [combined]
`

  const rows = await this.entityManager.getRepository(IssuanceEntity).query(sql, params)
  const raw = (rows as Record<string, unknown>[])[0]?.['cnt'] ?? 0
  return typeof raw === 'string' ? parseInt(raw, 10) : Number(raw)
}
