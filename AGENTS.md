# AGENTS.md

This file provides guidance to AI agents when working with code in the verified-orchestration API project.

## Always apply

- All instructions found in agent files in outer solution directories apply.
- Enforce strict TDD. Write the failing test first (proves the behaviour change), then implement the minimum code to make it pass, then refactor. Do not merge changes that are not driven by tests. Cover success and failure paths.
- When making any GraphQL schema change, explicitly consider authorisation and roles. Create/remove/update roles/permissions as required. If any role changes occur, reflect them in `infrastructure/scripts/app-roles.json` (and any related app registration automation that consumes it).
- Do not try to add custom scalars. Use only the scalars available from `@graphql-codegen/scalars` package.
- Check that properties in the database tables related to the entities you're working with are in sync with the entity classes. Detect and deal with any unused properties.
