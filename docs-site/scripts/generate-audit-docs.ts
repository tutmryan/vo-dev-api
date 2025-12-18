import fs from 'fs'
import path from 'path'
import { AuditEvents, formatEventTypeAsMessage, UNKNOWN_EVENT_TYPE, UNKNOWN_EVENT_TYPE_ID } from '../../src/audit-types'

/**
 * Generates audit event documentation from the AuditEvents catalog.
 * Outputs:
 * - docs/guides/audit-events.md (markdown documentation)
 * - static/audit-events.json (machine-readable catalog for SIEM integration)
 */

// Define event categories based on eventType prefix
type Category = {
  name: string
  prefix: string | string[]
  description: string
}

const categories: Category[] = [
  {
    name: 'API Events',
    prefix: 'api.',
    description: 'Events related to API operations including GraphQL queries, mutations, and subscriptions.',
  },
  {
    name: 'OIDC Events',
    prefix: 'oidc.',
    description: 'Events related to OpenID Connect authentication flows, including login, logout, and authorization.',
  },
  {
    name: 'Presentation Events',
    prefix: 'presentation.',
    description: 'Events related to verifiable credential presentations (verification requests).',
  },
  {
    name: 'Issuance Events',
    prefix: 'issuance.',
    description: 'Events related to verifiable credential issuance.',
  },
  {
    name: 'Async Issuance Events',
    prefix: 'async-issuance.',
    description: 'Events related to async (remote) issuance workflows, including notifications and request lifecycle.',
  },
]

// Group events by category
function categorizeEvents() {
  const eventList = Object.entries(AuditEvents).map(([key, value]) => ({
    key,
    id: value.id,
    eventType: value.eventType,
    description: formatEventTypeAsMessage(value.eventType),
  }))

  // Sort by ID to maintain consistent ordering
  eventList.sort((a, b) => a.id.localeCompare(b.id))

  const categorized: Map<string, typeof eventList> = new Map()

  for (const category of categories) {
    categorized.set(category.name, [])
  }
  categorized.set('Other Events', [])

  for (const event of eventList) {
    let matched = false
    for (const category of categories) {
      const prefixes = Array.isArray(category.prefix) ? category.prefix : [category.prefix]
      if (prefixes.some((p) => event.eventType.startsWith(p))) {
        categorized.get(category.name)!.push(event)
        matched = true
        break
      }
    }
    if (!matched) {
      categorized.get('Other Events')!.push(event)
    }
  }

  return categorized
}

// Generate markdown table for a category
function generateTable(events: ReturnType<typeof categorizeEvents> extends Map<string, infer T> ? T : never): string {
  if (events.length === 0) return ''

  const header = '| Event Type ID | Event Type | Description |\n|---------------|------------|-------------|\n'
  const rows = events.map((e) => `| \`${e.id}\` | \`${e.eventType}\` | ${e.description} |`).join('\n')

  return header + rows
}

// Generate the full markdown content
function generateMarkdown(): string {
  const categorized = categorizeEvents()

  let tables = ''

  for (const category of categories) {
    const events = categorized.get(category.name) || []
    if (events.length === 0) continue

    tables += `## ${category.name}\n\n`
    tables += `${category.description}\n\n`
    tables += generateTable(events)
    tables += '\n\n'
  }

  // Add any uncategorized events
  const otherEvents = categorized.get('Other Events') || []
  if (otherEvents.length > 0) {
    tables += `## Other Events\n\n`
    tables += generateTable(otherEvents)
    tables += '\n\n'
  }

  return tables.trim()
}

// Main execution
const templatePath = path.resolve(__dirname, './audit-events.template.md')
const template = fs.readFileSync(templatePath, 'utf8')

const auditEventsTable = generateMarkdown()
const markdown = template.replace('{{AUDIT_EVENTS_TABLE}}', auditEventsTable)

const outputPath = path.resolve(__dirname, '../docs/guides/audit-events.md')
fs.writeFileSync(outputPath, markdown)

console.log('Audit event docs generated:', outputPath)

// Generate JSON catalog for SIEM integration
const categorized = categorizeEvents()

type AuditEventJson = {
  eventTypeId: string
  eventType: string
  category: string
  description: string
}

const allEvents: AuditEventJson[] = []

// Add reserved VO0000 event
allEvents.push({
  eventTypeId: UNKNOWN_EVENT_TYPE_ID,
  eventType: UNKNOWN_EVENT_TYPE,
  category: 'System',
  description: 'Unknown or fallback event when eventTypeId is missing or invalid',
})

// Add all categorized events
for (const category of categories) {
  const events = categorized.get(category.name) || []
  for (const event of events) {
    allEvents.push({
      eventTypeId: event.id,
      eventType: event.eventType,
      category: category.name.replace(' Events', ''),
      description: event.description,
    })
  }
}

// Add any uncategorized events
const otherEvents = categorized.get('Other Events') || []
for (const event of otherEvents) {
  allEvents.push({
    eventTypeId: event.id,
    eventType: event.eventType,
    category: 'Other',
    description: event.description,
  })
}

const jsonCatalog = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  name: 'Verified Orchestration Audit Events',
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  events: allEvents,
}

const jsonOutputPath = path.resolve(__dirname, '../static/audit-events.json')
fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonCatalog, null, 2))

console.log('Audit event JSON catalog generated:', jsonOutputPath)
