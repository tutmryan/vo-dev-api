# AI Instructions: Generate Customer-Facing Release Documentation

This document provides instructions for AI assistants to generate customer-facing release documentation for the Verified Orchestration platform.

## Overview

Customer-facing release documentation is maintained in the docs-site repository as Docusaurus blog posts. The documentation consolidates changes from all repositories (API, Admin Portal, Portal, Client-JS) into a single unified product release.

**IMPORTANT:** Each release note file represents **all releases for a given month**, not individual releases. Multiple releases in the same month are added as separate sections within the same file.

## File Location & Structure

### Directory Structure

- **Location:** `verified-orchestration-api/docs-site/release-notes/{YYYY}/` or `verified-orchestration-api/docs-site/release-notes/`
- **Filename:** `v{YYYY}_{MonthName}.mdx` (e.g., `v2026_January.mdx`, `v2025_September.mdx`)
- **Important:** Each file contains **all releases for that calendar month**
- **Version Format:** Individual releases use `v{YYYY}.{M}.{iteration}` where:
  - `{YYYY}` = Current year (4 digits)
  - `{M}` = Month number without leading zero (e.g., 1 for January, 12 for December)
  - `{iteration}` = Release number for that month, starting at 0 (e.g., v2026.1.0, v2026.1.1)

### File Format (MDX with Frontmatter)

```mdx
---
title: {MonthName} {YYYY}
date: {YYYY}-{MM}-{DD}T00:00
description: [Summary of all releases in this month]
slug: v{YYYY}_{MonthName}
tags: [{YYYY}, v{YYYY}.{M}.{iteration}, v{YYYY}.{M}.{iteration+1}]
---

[Provide a summary of all the changes done in the month - this appears on the listing page]

<!-- truncate -->

## v{YYYY}.{M}.{iteration+1}

### 🚀 What's new

...

---

## v{YYYY}.{M}.{iteration}

### 🚀 What's new

### 🛠️ Notable fixes

- [Fix description]
- [Fix description]

[Additional release if there are multiple releases in the same month...]
```

**Key Points:**

- **Content before `<!-- truncate -->`** is a monthly summary of ALL releases and appears on the release notes listing page
- **Do NOT include individual blurbs under each version heading** - the monthly summary covers everything
- Frontmatter `title` and `slug` use the month name (e.g., "January 2026", "v2026_January")
- Frontmatter `tags` include the year and all version numbers released that month (e.g., [2026, v2026.1.0] for single, or [2025, v2025.0.0, v2025.1.0] for multiple)
- Frontmatter `description` should match the monthly summary before truncate
- Individual release sections use version numbers as headings (e.g., "## v2026.1.0", "## v2026.1.1")
- **Multiple releases in the same month are ordered newest first** (higher version numbers appear before lower version numbers)
- Multiple releases are separated by `---`
- **Do not include "Release Date:" lines** - the date context is clear from the page and version
- The `date` in frontmatter should be the first release date of the month

## Content Guidelines

### What to INCLUDE

✅ Customer-facing features and improvements
✅ User-visible bug fixes
✅ New capabilities and functionality
✅ UI/UX improvements
✅ Performance improvements that impact user experience
✅ Security enhancements
✅ Documentation updates that help customers

### What to EXCLUDE

❌ Internal ticket/issue numbers (e.g., PL-1234)
❌ Internal development tasks (ESLint fixes, CI/CD improvements)
❌ Test-related changes (unless they indicate a customer-facing bug fix)
❌ Internal documentation/workflow changes
❌ Infrastructure changes that don't affect customers
❌ Work-in-progress (WIP) features not ready for customers
❌ Deployment configuration changes
❌ Release documentation tasks (e.g., "Create release notes for v2026.1.0")

### Security Vulnerability Disclosure

**IMPORTANT:** Do NOT disclose specific CVE numbers or vulnerability details in customer-facing release notes.

**Why:**

- Provides attackers a roadmap to exploit systems that haven't upgraded yet
- Not all customers upgrade immediately, creating a window of vulnerability
- Broadcasting the specific CVE tells attackers exactly which vulnerability to target

**Best Practice:**

Use generic security language instead:

✅ "Security updates"
✅ "Security improvements and dependency updates"
✅ "Addressed security vulnerabilities in third-party dependencies"

❌ "Fixed CVE-2026-12345"
❌ "Patched vulnerability in package X version Y"
❌ "Addressed security issue [specific technical details]"

**Examples:**

- Input: "FIX Audit for CVE-2026-22029"
- Output: "Important security updates in Concierge"

- Input: "Update package-name to fix CVE-2025-1234"
- Output: "Security improvements and dependency updates"

For customers requiring specific CVE details, maintain separate security bulletins or provide through private channels.

### Consolidation Rules

- **DO NOT** separate changes by repository (API, Admin, Portal)
- Present as a **single unified product release**
- Group similar features together regardless of which repo they came from
- Reorganize changes into logical customer-facing categories

### Product Naming Conventions

Use the following official product names in customer-facing documentation:

- **API** - The Verified Orchestration API (backend service)
- **Composer** - The admin/management portal (NOT "Admin portal" or "Admin")
- **Concierge** - The end-user portal (NOT "Portal")

**Important:** When consolidating changes from repositories, translate repository names to product names:

- `verified-orchestration-admin` → Composer
- `verified-orchestration-portal` → Concierge
- `verified-orchestration-api` → API

## Process Steps

### Step 1: Determine the Target File

1. Identify the release month and year
2. Check if a file for that month already exists (e.g., `v2026_January.mdx`)
3. If it exists, you'll be **adding a new release section** to the existing file
4. If it doesn't exist, you'll be **creating a new monthly file**

### Step 2: Gather Changes

Collect the list of changes from all repositories:

- verified-orchestration-api
- verified-orchestration-admin
- verified-orchestration-portal
- verified-orchestration-client-js (if applicable)

### Step 3: Filter Content

Review each change and:

1. Remove internal-only items (see exclusion list above)
2. Remove ticket numbers
3. Identify customer-facing value
4. Remove WIP/incomplete features

### Step 4: Categorize & Consolidate

Organize filtered changes into:

1. **New features** - Major new capabilities
2. **Enhancements** - Improvements to existing features
3. **Breaking changes** - Changes that may require customer action (GraphQL schema changes, API changes, deprecated features)
4. **Notable fixes** - Bug fixes that impact customers

Consolidate duplicate or related items across repositories.

#### Documenting Breaking Changes

Breaking changes should be documented with a positive, benefit-focused tone while clearly indicating the change nature.

**Guidelines:**

- Use a dedicated `### ⚠️ Breaking Changes` section when breaking changes exist
- Frame changes positively, emphasizing the improvement or new capability
- Clearly indicate what changed (e.g., "GraphQL Schema", "API")
- Explain the benefit first, then note the constraint
- Use friendly, approachable language

**Example - GraphQL Schema Change:**

✅ Good:

```markdown
### ⚠️ Breaking Changes

- **GraphQL Schema:** Offset parameter validation updated to support zero values, enabling more consistent pagination starting from the first record (now accepts 0 and positive integers only)
```

❌ Avoid:

```markdown
### Breaking Changes

- Fixed offset parameter validation to reject negative values
```

**Template:**

```markdown
- **[Component]:** [Benefit/improvement description], [new behavior/constraint]
```

### Step 5: Write Customer-Friendly Descriptions

- Use clear, non-technical language where possible
- Focus on benefits and capabilities
- Avoid internal jargon
- Be concise but informative

### Step 6: Create or Update File

#### If creating a NEW monthly file:

1. Create directory `release-notes/{YYYY}/` if needed
2. Create file `v{YYYY}_{MonthName}.mdx`
3. Add frontmatter with monthly format
4. Add monthly summary before `<!-- truncate -->`
5. Add first release section with version number heading (NO individual blurb)

#### If UPDATING an existing monthly file:

1. Open the existing `v{YYYY}_{MonthName}.mdx` file
2. Update the monthly summary (both in frontmatter `description` and the paragraph before `<!-- truncate -->`) to include the new release
3. Update the frontmatter `date` to the new release date if it's later than the existing date
4. Add a separator line (`---`)
5. Add new release section with the next version number (e.g., if v2026.1.0 exists, add v2026.1.1)
6. Order releases newest first (higher version numbers on top)
7. Update frontmatter tags to include the new version

### Step 7: Verify Format

- Ensure frontmatter uses month name in title and slug
- Check that individual release sections use version numbers
- Verify the date is correct
- Confirm tags include all version numbers
- Ensure proper heading hierarchy (## for version, ### for sections, #### for subsections)
- Verify NO individual blurbs under version headings

## Example Workflow

**Scenario:** Creating the first release for January 2026

**Input:** List of PR descriptions from all repos

**Output:** New file `v2026_January.mdx`

```mdx
---
title: January 2026
date: 2026-01-07T00:00
description: This release includes significant improvements to audit logging, new instance information features in Composer, rebranding updates for Concierge, and various bug fixes and performance enhancements.
slug: v2026_January
tags: [2026, v2026.1.0]
---

This release includes significant improvements to audit logging, new instance information features in Composer, rebranding updates for Concierge, and various bug fixes and performance enhancements across all components.

<!-- truncate -->

## v2026.1.0

### 🚀 What's new

#### New features

- Expanded audit logging capabilities
- Restructured navigation menu

#### Enhancements

- Added reader access to remote issuances
- Database performance improvements

### ⚠️ Breaking Changes

- **GraphQL Schema:** Updated validation for improved data consistency (now enforces stricter type checking)

### 🛠️ Notable fixes

- Fixed expired status filter issue
```

**Scenario:** Adding a second release to January 2026

**Action:** Update existing `v2026_January.mdx` by updating the monthly summary and adding the new release section:

```mdx
---
title: January 2026
date: 2026-01-07T00:00
description: January 2026 releases include audit logging improvements, navigation enhancements, improved error handling, and authentication fixes.
slug: v2026_January
tags: [2026, v2026.1.0, v2026.1.1]
---

January 2026 releases include audit logging improvements, navigation enhancements, improved error handling, and authentication fixes.

<!-- truncate -->

## v2026.1.1

### 🚀 What's new

#### Enhancements

- Improved error handling in credential uploads

### 🛠️ Notable fixes

- Fixed authentication timeout issue

---

## v2026.1.0

### 🚀 What's new

#### New features

- Expanded audit logging capabilities
- Restructured navigation menu

#### Enhancements

- Added reader access to remote issuances
- Database performance improvements

### 🛠️ Notable fixes

- Fixed expired status filter issue
```

## Quality Checklist

Before finalizing, verify:

- [ ] Filename uses month name format (`v{YYYY}_{MonthName}.mdx`)
- [ ] File is in correct year directory (e.g., `2026/v2026_January.mdx`)
- [ ] Frontmatter slug uses month name (`v{YYYY}_{MonthName}`)
- [ ] Frontmatter title uses format "{MonthName} {YYYY}" (no "Releases" suffix)
- [ ] Frontmatter tags use full version numbers: [{YYYY}, v{YYYY}.{M}.{iteration}] or [{YYYY}, v{YYYY}.{M}.{iteration}, v{YYYY}.{M}.{iteration+1}] for multiple releases
- [ ] Monthly summary before `<!-- truncate -->` covers ALL releases in the month
- [ ] NO individual blurbs under version headings - monthly summary only
- [ ] If multiple releases, newest release appears first (higher version number on top)
- [ ] Product names are correct: "Composer" (not Admin), "Concierge" (not Portal), "API"
- [ ] Each release has version number heading (## v{YYYY}.{M}.{iteration})
- [ ] Multiple releases separated by `---`
- [ ] No internal ticket numbers (PL-XXXX, etc.)
- [ ] No repository names in content
- [ ] No internal/development-only changes
- [ ] No WIP features
- [ ] All changes are customer-relevant
- [ ] Descriptions are clear and benefit-focused
- [ ] Breaking changes (if any) are documented in a dedicated section with positive framing
- [ ] Breaking changes clearly indicate the component/area affected (e.g., "GraphQL Schema:", "API:")

## Additional Notes

### Referencing Existing Releases

Look at previous release notes for tone and style:

- `release-notes/2026/v2026_January.mdx`
- `release-notes/2025/v2025_September.mdx`
- `release-notes/2025/v2025_January.mdx` (example with multiple releases)

### Month Name Format

Always use full month names:

- January, February, March, April, May, June
- July, August, September, October, November, December

### Common Patterns

- **Access Control:** Features related to permissions, roles, authentication
- **Performance:** Database indexes, query optimizations, load time improvements
- **UI/UX:** Navigation changes, new screens, improved workflows
- **Documentation:** Customer-facing docs, help text, tooltips
- **Integration:** API changes, SDK updates, webhook improvements
- **Breaking Changes:** GraphQL schema changes, API parameter validation changes, deprecated features removal, behavior changes requiring customer action

### Common Breaking Change Scenarios

Document these as breaking changes when they occur:

- **GraphQL Schema Changes:** Type changes, new required fields, validation rule changes
- **API Parameter Validation:** Changes to accepted values, type enforcement, range restrictions
- **Deprecated Feature Removal:** Removal of previously deprecated endpoints, features, or properties
- **Behavior Changes:** Changes to default values, response formats, or processing logic that may affect existing integrations

### When in Doubt

- Prioritize clarity over completeness
- Ask the user if a change is customer-facing
- Err on the side of excluding internal changes
- Keep descriptions focused on user value

## Quick Reference

When user provides PR lists for a new release, determine:

1. Is this the first release of the month? → Create new file with monthly summary
2. Is this an additional release in an existing month? → Update monthly summary and add new release section
3. Filter out internal changes
4. Consolidate across all repos
5. Write customer-friendly descriptions
6. Format with version headings and monthly summary (NO individual blurbs)
