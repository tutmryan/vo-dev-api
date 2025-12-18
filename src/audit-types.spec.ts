import { execSync } from 'child_process'
import path from 'path'

import { AuditEvents, formatEventTypeAsMessage } from './audit-types'

describe('AuditEvents', () => {
  const allEvents = Object.values(AuditEvents)
  const allEventEntries = Object.entries(AuditEvents)

  describe('Event Type IDs', () => {
    it('should have unique ids across all events', () => {
      const ids = allEvents.map((event) => event.id)
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)

      expect(duplicates).toEqual([])
    })

    it('should follow the VO#### format', () => {
      const invalidIds = allEventEntries.filter(([, event]) => !/^VO\d{4}$/.test(event.id))

      expect(invalidIds.map(([name]) => name)).toEqual([])
    })
  })

  describe('Event Types', () => {
    it('should have unique eventTypes across all events', () => {
      const eventTypes = allEvents.map((event) => event.eventType)
      const duplicates = eventTypes.filter((eventType, index) => eventTypes.indexOf(eventType) !== index)

      expect(duplicates).toEqual([])
    })

    it('should follow the taxonomy format (feature.entity[~qualifier].action[~qualifier])', () => {
      // Pattern: feature.entity[~qualifier].action[~qualifier]
      // - feature: lowercase with hyphens (e.g., async-issuance)
      // - entity: lowercase with optional ~qualifier (e.g., notification~email)
      // - action: lowercase with optional ~qualifier (e.g., cancelled~queued)
      const taxonomyPattern = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*(~[a-z]+)?)+$/

      const invalidEventTypes = allEventEntries.filter(([, event]) => !taxonomyPattern.test(event.eventType))

      expect(invalidEventTypes.map(([name, event]) => `${name}: ${event.eventType}`)).toEqual([])
    })
  })

  describe('Event Constants', () => {
    it('should have id and eventType properties defined', () => {
      // This test validates at runtime that the structure matches expectations
      // TypeScript guarantees these exist, but this documents the contract
      for (const [, event] of allEventEntries) {
        expect(event).toHaveProperty('id')
        expect(event).toHaveProperty('eventType')
        expect(typeof event.id).toBe('string')
        expect(typeof event.eventType).toBe('string')
        expect(event.id.length).toBeGreaterThan(0)
        expect(event.eventType.length).toBeGreaterThan(0)
      }
    })

    it('should have constant names in UPPER_SNAKE_CASE', () => {
      const invalidNames = allEventEntries.filter(([name]) => name !== name.toUpperCase() || name.includes('-'))

      expect(invalidNames.map(([name]) => name)).toEqual([])
    })
  })
})

describe('formatEventTypeAsMessage', () => {
  it('should format simple event types', () => {
    expect(formatEventTypeAsMessage('oidc.session.ended')).toBe('OIDC Session Ended')
    expect(formatEventTypeAsMessage('issuance.credential.issued')).toBe('Issuance Credential Issued')
  })

  it('should handle acronyms correctly', () => {
    expect(formatEventTypeAsMessage('api.graphql.operation')).toBe('API GraphQL Operation')
    expect(formatEventTypeAsMessage('oidc.par.succeeded')).toBe('OIDC PAR Succeeded')
  })

  it('should handle tilde qualifiers', () => {
    expect(formatEventTypeAsMessage('async-issuance.notification~email.failed')).toBe('Async Issuance Notification Email Failed')
    expect(formatEventTypeAsMessage('async-issuance.request.cancelled~queued')).toBe('Async Issuance Request Cancelled Queued')
    expect(formatEventTypeAsMessage('async-issuance.request.cancelled~command')).toBe('Async Issuance Request Cancelled Command')
    expect(formatEventTypeAsMessage('async-issuance.notification~job.failed')).toBe('Async Issuance Notification Job Failed')
  })

  it('should handle hyphenated feature names', () => {
    expect(formatEventTypeAsMessage('async-issuance.request.created')).toBe('Async Issuance Request Created')
  })
})

describe('auditEvent call site uniqueness', () => {
  it('should have each AuditEvent used at most once in the codebase', () => {
    const srcDir = path.resolve(__dirname)

    // Find all auditEvent calls in the codebase (excluding test files and audit-types.ts itself)
    const grepCommand = `grep -rn "auditEvent(AuditEvents\\." "${srcDir}" --include="*.ts" | grep -v "\\.spec\\.ts" | grep -v "audit-types.ts"`

    let grepOutput: string
    try {
      grepOutput = execSync(grepCommand, { encoding: 'utf-8' })
    } catch {
      // grep returns exit code 1 if no matches found
      grepOutput = ''
    }

    if (!grepOutput.trim()) {
      // No audit calls found - that's fine for this test
      return
    }

    // Parse the grep output to find which events are used where
    const lines = grepOutput.trim().split('\n')
    const eventUsage: Record<string, string[]> = {}

    for (const line of lines) {
      // Extract the AuditEvents.CONSTANT_NAME from each line
      const match = line.match(/auditEvent\(AuditEvents\.([A-Z_]+)/)
      if (match && match[1]) {
        const eventName = match[1]
        const fileLocation = line.split(':').slice(0, 2).join(':') // file:line
        if (!eventUsage[eventName]) {
          eventUsage[eventName] = []
        }
        eventUsage[eventName].push(fileLocation)
      }
    }

    // Find events used more than once
    const duplicates = Object.entries(eventUsage)
      .filter(([, locations]) => locations.length > 1)
      .map(([eventName, locations]) => `${eventName} used ${locations.length} times:\n  - ${locations.join('\n  - ')}`)

    expect(duplicates).toEqual([])
  })
})
