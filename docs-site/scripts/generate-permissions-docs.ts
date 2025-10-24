import fs from 'fs'
import path from 'path'
import { InternalClientRoles, InternalRoles } from '../../src/roles'

// Load shield rules snapshot
const snapPath = path.resolve(__dirname, '../../src/__snapshots__/shield.test.ts.snap')
const snapContent = fs.readFileSync(snapPath, 'utf8')
const match = snapContent.match(/exports\[`shield rules are setup correctly 1`\] = `\n"([\s\S]+)"\n`;/)
if (!match) throw new Error('Could not find shield rules snapshot in file')
const rulesObj = JSON.parse(match[1] as string)

// Load app-roles.json
const appRolesPath = path.resolve(__dirname, '../../infrastructure/scripts/app-roles.json')
const appRoles = JSON.parse(fs.readFileSync(appRolesPath, 'utf8'))

// Build display name lookup and type maps
const roleDisplayNameMap = new Map<string, string>()
const userRolesSet = new Set<string>()
const appRolesSet = new Set<string>()
for (const role of appRoles) {
  roleDisplayNameMap.set(role.value, role.displayName || role.value)
  if (role.allowedMemberTypes.includes('User')) userRolesSet.add(role.value)
  if (role.allowedMemberTypes.includes('Application')) appRolesSet.add(role.value)
}

// Internal roles to hide
const internalRoles = [...Object.values(InternalRoles), ...Object.values(InternalClientRoles)]

// Recursively extract all roles for a rule node
function extractRoles(node: any): string[] {
  if (!node) return []
  let roles: string[] = []
  if (node.__roles) {
    roles = roles.concat(node.__roles)
  }
  if (node.rulesOr)
    node.rulesOr.forEach((child: any) => {
      roles = roles.concat(extractRoles(child))
    })
  if (node.rulesAnd)
    node.rulesAnd.forEach((child: any) => {
      roles = roles.concat(extractRoles(child))
    })
  if (node.ruleNot)
    node.ruleNot.forEach((child: any) => {
      roles = roles.concat(extractRoles(child))
    })
  if (node.rules)
    node.rules.forEach((child: any) => {
      roles = roles.concat(extractRoles(child))
    })
  return Array.from(new Set(roles))
}

// Walk the rules tree and collect roles
function walkFields(obj: any, pathArr: string[] = [], out: any[] = []) {
  for (const key of Object.keys(obj)) {
    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !obj[key].name &&
      !obj[key].rulesOr &&
      !obj[key].rulesAnd &&
      !obj[key].ruleNot &&
      !obj[key].rules &&
      !obj[key].__roles
    ) {
      walkFields(obj[key], [...pathArr, key], out)
    } else {
      const fieldPath = [...pathArr, key].join('.')
      const roles = extractRoles(obj[key])
      out.push({ field: fieldPath, roles })
    }
  }
  return out
}

const entries = walkFields(rulesObj)

// Filter and map roles
function filterAndMapRoles(roles: string[], allowedSet: Set<string>) {
  return roles.filter((r) => allowedSet.has(r) && !internalRoles.includes(r as InternalRoles)).map((r) => roleDisplayNameMap.get(r) || r)
}

function groupEntries(entries: any[]) {
  const groups: { Query: any[]; Mutation: any[]; Subscription: any[]; Field: any[] } = {
    Query: [],
    Mutation: [],
    Subscription: [],
    Field: [],
  }
  for (const entry of entries) {
    if (entry.field.startsWith('Query.')) {
      groups.Query.push(entry)
    } else if (entry.field.startsWith('Mutation.')) {
      groups.Mutation.push(entry)
    } else if (entry.field.startsWith('Subscription.')) {
      groups.Subscription.push(entry)
    } else {
      groups.Field.push(entry)
    }
  }
  return groups
}

function makeCombinedTable(entries: any[], label: string) {
  const sorted = entries.sort((a, b) => a.field.localeCompare(b.field))
  return (
    `### ${label}\n\n| Field | User roles | App roles |\n|-------|------------|-----------|\n` +
    sorted
      .map((e) => {
        const userDisplayRoles = filterAndMapRoles(e.roles, userRolesSet)
        const appDisplayRoles = filterAndMapRoles(e.roles, appRolesSet)
        const userRoleText = e.roles.length === 0 ? 'Anyone' : userDisplayRoles.length === 0 ? '-' : userDisplayRoles.join(', ')
        const appRoleText = e.roles.length === 0 ? 'Anyone' : appDisplayRoles.length === 0 ? '-' : appDisplayRoles.join(', ')
        return `| \`${e.field}\` | ${userRoleText} | ${appRoleText} |`
      })
      .join('\n')
  )
}

const groups = groupEntries(entries)
const queryTable = makeCombinedTable(groups.Query, 'Queries')
const mutationTable = makeCombinedTable(groups.Mutation, 'Mutations')
const subscriptionTable = makeCombinedTable(groups.Subscription, 'Subscriptions')
const fieldTable = makeCombinedTable(groups.Field, 'Types and fields')

// Use template
const templatePath = path.resolve(__dirname, './permissions.template.md')
const template = fs.readFileSync(templatePath, 'utf8')
const permissionsTables = `${queryTable}\n\n${mutationTable}\n\n${subscriptionTable}\n\n${fieldTable}`
const markdown = template.replace('{{PERMISSIONS_TABLES}}', permissionsTables)

// Output to /guides/permissions.md
const outputPath = path.resolve(__dirname, '../docs/guides/permissions.md')
fs.writeFileSync(outputPath, markdown)

console.log('RBAC docs generated')
