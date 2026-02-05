import { isNotNil } from '@makerx/graphql-core'
import type { SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm'
import { Brackets } from 'typeorm'
import { IssuanceStatus, type IssuanceWhere, type Maybe } from '../../../generated/graphql'
import type { IssuanceEntity } from '../entities/issuance-entity'

/**
 * Recursively builds WHERE clauses for TypeORM QueryBuilder from IssuanceWhere input.
 * Handles AND/OR operators and simple field filters.
 */
export function applyWhereClause(
  qb: SelectQueryBuilder<IssuanceEntity> | WhereExpressionBuilder,
  criteria: Maybe<IssuanceWhere>,
  paramPrefix = 'param',
): void {
  if (!criteria) return

  // Handle logical operators
  if (criteria.AND && criteria.AND.length > 0) {
    criteria.AND.forEach((andCondition, index) => {
      qb.andWhere(
        new Brackets((subQb) => {
          applyWhereClause(subQb, andCondition, `${paramPrefix}_and${index}`)
        }),
      )
    })
  }

  if (criteria.OR && criteria.OR.length > 0) {
    qb.andWhere(
      new Brackets((subQb) => {
        criteria.OR!.forEach((orCondition, index) => {
          subQb.orWhere(
            new Brackets((nestedQb) => {
              applyWhereClause(nestedQb, orCondition, `${paramPrefix}_or${index}`)
            }),
          )
        })
      }),
    )
  }

  // Apply simple field filters
  if (criteria.requestId) {
    qb.andWhere('issuance.requestId = :requestId', { requestId: criteria.requestId })
  }

  if (criteria.identityId) {
    qb.andWhere('issuance.identityId = :identityId', { identityId: criteria.identityId })
  }

  if (criteria.identityStoreId) {
    // Note: Join must be set up externally in the main query builder
    // This only adds the WHERE condition
    qb.andWhere('identity.identityStoreId = :identityStoreId', { identityStoreId: criteria.identityStoreId })
  }

  if (criteria.contractId) {
    qb.andWhere('issuance.contractId = :contractId', { contractId: criteria.contractId })
  }

  if (criteria.issuedById) {
    qb.andWhere('issuance.issuedById = :issuedById', { issuedById: criteria.issuedById })
  }

  if (criteria.revokedById) {
    qb.andWhere('issuance.revokedById = :revokedById', { revokedById: criteria.revokedById })
  }

  if (isNotNil(criteria.hasFaceCheckPhoto)) {
    qb.andWhere('ISNULL(issuance.hasFaceCheckPhoto, 0) = :hasFaceCheckPhoto', {
      hasFaceCheckPhoto: criteria.hasFaceCheckPhoto,
    })
  }

  if (criteria.presentationId) {
    // Note: Join must be set up externally in the main query builder
    // This only adds the WHERE condition
    qb.andWhere('presentation.id = :presentationId', { presentationId: criteria.presentationId })
  }

  // Date range filters
  if (criteria.from || criteria.to) {
    if (criteria.from && criteria.to) {
      qb.andWhere('issuance.issuedAt BETWEEN :issuedFrom AND :issuedTo', {
        issuedFrom: criteria.from,
        issuedTo: criteria.to,
      })
    } else if (criteria.from) {
      qb.andWhere('issuance.issuedAt >= :issuedFrom', { issuedFrom: criteria.from })
    } else if (criteria.to) {
      qb.andWhere('issuance.issuedAt <= :issuedTo', { issuedTo: criteria.to })
    }
  }

  if (criteria.expiresFrom || criteria.expiresTo) {
    if (criteria.expiresFrom && criteria.expiresTo) {
      qb.andWhere('issuance.expiresAt BETWEEN :expiresFrom AND :expiresTo', {
        expiresFrom: criteria.expiresFrom,
        expiresTo: criteria.expiresTo,
      })
    } else if (criteria.expiresFrom) {
      qb.andWhere('issuance.expiresAt >= :expiresFrom', { expiresFrom: criteria.expiresFrom })
    } else if (criteria.expiresTo) {
      qb.andWhere('issuance.expiresAt <= :expiresTo', { expiresTo: criteria.expiresTo })
    }
  }

  if (criteria.revokedFrom || criteria.revokedTo) {
    if (criteria.revokedFrom && criteria.revokedTo) {
      qb.andWhere('issuance.revokedAt BETWEEN :revokedFrom AND :revokedTo', {
        revokedFrom: criteria.revokedFrom,
        revokedTo: criteria.revokedTo,
      })
    } else if (criteria.revokedFrom) {
      qb.andWhere('issuance.revokedAt >= :revokedFrom', { revokedFrom: criteria.revokedFrom })
    } else if (criteria.revokedTo) {
      qb.andWhere('issuance.revokedAt <= :revokedTo', { revokedTo: criteria.revokedTo })
    }
  }

  // Status filter
  if (criteria.status === IssuanceStatus.Active) {
    qb.andWhere('issuance.revokedAt IS NULL')
    qb.andWhere('issuance.expiresAt >= :now', { now: new Date().toISOString() })
  } else if (criteria.status === IssuanceStatus.Expired) {
    qb.andWhere('issuance.expiresAt <= :now', { now: new Date().toISOString() })
  } else if (criteria.status === IssuanceStatus.Revoked) {
    qb.andWhere('issuance.isRevoked = :isRevoked', { isRevoked: true })
  }
}
