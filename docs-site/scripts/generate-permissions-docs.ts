import fs from 'fs'
import path from 'path'

// Dynamically import all enums from roles.ts
import * as rolesEnums from '../../src/roles'

// Load shield rules snapshot
const snapPath = path.resolve(__dirname, '../../src/__snapshots__/shield.test.ts.snap')
const snapContent = fs.readFileSync(snapPath, 'utf8')
const match = snapContent.match(/exports\[`shield rules are setup correctly 1`\] = `\n"([\s\S]+)"\n`;/)
if (!match) throw new Error('Could not find shield rules snapshot in file')
const rulesObj = JSON.parse(match[1] as string)

// Load app-roles.json for display names
const appRolesPath = path.resolve(__dirname, '../../infrastructure/scripts/app-roles.json')
const appRoles = JSON.parse(fs.readFileSync(appRolesPath, 'utf8'))

// Build display name lookup
const roleDisplayNameMap = new Map<string, string>()
for (const role of appRoles) {
  roleDisplayNameMap.set(role.value, role.displayName || role.value)
}

// Internal roles to hide
const internalRoles = [...Object.values(rolesEnums.InternalRoles), ...Object.values(rolesEnums.InternalClientRoles)]

// Recursively extract rule as a string
function extractRule(node: any): string {
  if (!node) return ''
  if (node.__roles && node.__roles.length > 0) {
    return node.__roles.map((r: string) => r.replace(/^VerifiableCredential\./, '')).join(' OR ')
  }
  if (node.ruleNot) {
    const parts = node.ruleNot.map(extractRule).filter(Boolean)
    // If no roles, use the name property
    if (parts.length === 0 && node.ruleNot.length > 0) {
      return (
        'NOT (' +
        node.ruleNot
          .map((n: any) => n.name || '')
          .filter(Boolean)
          .join(' OR ') +
        ')'
      )
    }
    return parts.length ? 'NOT (' + parts.join(' OR ') + ')' : ''
  }
  if (node.rulesOr) {
    const parts = node.rulesOr.map(extractRule).filter(Boolean)
    return parts.length ? '(' + parts.join(' OR ') + ')' : ''
  }
  if (node.rulesAnd) {
    const parts = node.rulesAnd.map(extractRule).filter(Boolean)
    return parts.length ? '(' + parts.join(' AND ') + ')' : ''
  }
  if (node.rules) {
    const parts = node.rules.map(extractRule).filter(Boolean)
    return parts.length ? '(' + parts.join(' AND ') + ')' : ''
  }
  // If only a name property, include it
  if (node.name) {
    return node.name.replace(/^hasRole-VerifiableCredential\./, '').replace(/^hasApiResourceScope-VerifiableCredential\./, '')
  }
  return ''
}

// Recursively walk the rules tree and collect rule for each field
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
      out.push({ field: fieldPath, node: obj[key] })
    }
  }
  return out
}

const entries = walkFields(rulesObj)

// Get all enums from roles.ts except InternalRoles and InternalClientRoles & OidcScopes
let enumNames = Object.keys(rolesEnums).filter(
  (k) => typeof rolesEnums[k] === 'object' && k !== 'InternalRoles' && k !== 'InternalClientRoles' && k !== 'OidcScopes',
)

// Rename LimitedAccessTokenAcquisitionRoles header
const limitedAccessIdx = enumNames.indexOf('LimitedAccessTokenAcquisitionRoles')
if (limitedAccessIdx !== -1) {
  enumNames[limitedAccessIdx] = 'Limited Access Token Roles'
}

// Move UserRoles to the front
const userRolesIdx = enumNames.indexOf('UserRoles')
if (userRolesIdx > 0) {
  const [userRoles] = enumNames.splice(userRolesIdx, 1)
  enumNames.unshift(userRoles)
}

const enumValues = enumNames.map((name) =>
  name === 'Limited Access Token Roles'
    ? Object.values(rolesEnums.LimitedAccessTokenAcquisitionRoles)
    : Object.values(rolesEnums[name as keyof typeof rolesEnums]),
)

function shortenLimitedAccessRole(role: string) {
  const prefix = 'AcquireLimitedAccessToken.'
  if (role.startsWith(prefix)) {
    return role.replace(prefix, '')
  }
  return role
}

function stripOuterParens(str: string): string {
  // Remove outer parentheses only if they wrap the entire string
  if (str.startsWith('(') && str.endsWith(')')) {
    let depth = 0
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '(') depth++
      if (str[i] === ')') depth--
      if (depth === 0 && i < str.length - 1) return str
    }
    return str.slice(1, -1)
  }
  return str
}

function abbreviateRuleTerm(term: string): string {
  return term
    .replace('hasApprovalRequestPresentationAndMatchesApprovalRequestId', 'hasApprovalReqPresMatchId')
    .replace('issuanceIsToAuthenticatedUser', 'issuanceIsToAuthUser')
    .replace('hasApiResourceScope-', '')
}

function stripRulePrefix(rule: string) {
  return rule.replace(/VerifiableCredential\./g, '')
}

function addWordBreaks(str: string): string {
  // Insert <wbr/> between lowercase-uppercase transitions for camelCase
  return str.replace(/([a-z])([A-Z])/g, '$1<wbr/>$2')
}

function formatRule(rule: string) {
  // Abbreviate long terms, add word breaks, and add line breaks
  return rule
    .replace(/ OR /g, ' `OR`<br />')
    .replace(/ AND /g, ' `AND`<br />')
    .replace(/NOT \(/g, '`NOT` (')
    .split(/<br \/>/)
    .map((term) => addWordBreaks(abbreviateRuleTerm(term.trim())))
    .join('<br />')
}

function extractRolesForEnum(node: any, enumValues: string[], insideNot = false): string[] {
  if (!node) return []
  if (node.__roles && node.__roles.length > 0) {
    return insideNot ? [] : node.__roles.filter((r: string) => enumValues.includes(r))
  }
  let roles: string[] = []
  if (node.rulesOr) {
    for (const child of node.rulesOr) {
      roles = roles.concat(extractRolesForEnum(child, enumValues, insideNot))
    }
  }
  if (node.rulesAnd) {
    for (const child of node.rulesAnd) {
      roles = roles.concat(extractRolesForEnum(child, enumValues, insideNot))
    }
  }
  if (node.ruleNot) {
    for (const child of node.ruleNot) {
      roles = roles.concat(extractRolesForEnum(child, enumValues, true))
    }
  }
  if (node.rules) {
    for (const child of node.rules) {
      roles = roles.concat(extractRolesForEnum(child, enumValues, insideNot))
    }
  }
  return roles
}

// For each field, show which roles from each enum are present in the rules
function makeExpandedTable(entries: any[], label: string) {
  const headers = ['Field', ...enumNames, 'Rule']
  const rows = entries
    .sort((a, b) => a.field.localeCompare(b.field))
    .map((e) => {
      const rule = extractRule(e.node)
      const ruleStripped = stripRulePrefix(rule)
      let enumColumns = enumValues.map((values, idx) => {
        const enumName = enumNames[idx]
        const present = Array.from(new Set(extractRolesForEnum(e.node, values as string[]))).filter(
          (role) => !internalRoles.includes(role as rolesEnums.InternalRoles),
        )
        if (present.length) {
          return present
            .map((r) => {
              if (enumName === 'Limited Access Token Roles') {
                return shortenLimitedAccessRole(stripRulePrefix(r as string))
              }
              return roleDisplayNameMap.get(r as string) || stripRulePrefix(r as string)
            })
            .join(', ')
        }
        return '-'
      })
      if (rule === '' || rule === 'Anyone') {
        enumColumns = enumColumns.map(() => '*')
      }
      return [
        `\`${e.field}\``,
        ...enumColumns,
        rule ? `<details><summary>Show</summary>${stripOuterParens(formatRule(ruleStripped))}</details>` : 'Anyone',
      ]
    })
  return (
    `### ${label}\n\n| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n` +
    rows.map((row) => `| ${row.join(' | ')} |`).join('\n')
  )
}

// Group entries by Query, Mutation, Subscription, Field
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

const groups = groupEntries(entries)
const queryTable = makeExpandedTable(groups.Query, 'Queries')
const mutationTable = makeExpandedTable(groups.Mutation, 'Mutations')
const subscriptionTable = makeExpandedTable(groups.Subscription, 'Subscriptions')
const fieldTable = makeExpandedTable(groups.Field, 'Types and fields')

const note = `
  > **Note:**
  > - All role names are shown without the \`VerifiableCredential.\` or \`AcquireLimitedAccessToken.\` prefix.
  > - Some columns (such as internal roles) are hidden to keep the table readable and focused on the most relevant permissions for typical users.
  > - Long rule names are abbreviated, e.g.:
  >   - \`hasApprovalRequestPresentationAndMatchesApprovalRequestId\` → \`hasApprovalReqPresMatchId\`
  >   - \`issuanceIsToAuthenticatedUser\` → \`issuanceIsToAuthUser\`
  > - The \`Rule\` column shows the full access rule for each field, including all required roles and logical conditions.
  `
// Use template
const templatePath = path.resolve(__dirname, './permissions.template.md')
const template = fs.readFileSync(templatePath, 'utf8')
const permissionsTables = `${note}\n\n${queryTable}\n\n${mutationTable}\n\n${subscriptionTable}\n\n${fieldTable}`
const markdown = template.replace('{{PERMISSIONS_TABLES}}', permissionsTables)

// Output to /guides/permissions.md
const outputPath = path.resolve(__dirname, '../docs/guides/permissions.md')
fs.writeFileSync(outputPath, markdown)

console.log('RBAC docs generated')
