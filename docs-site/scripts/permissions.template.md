# RBAC permissions

This page documents which roles can access which GraphQL operations.

> **Note:**
> For each operation type (Query, Mutation, etc.), a rule marked as `*` acts as a default.
> Any field not explicitly listed will inherit the permissions of the `*` rule.
> This ensures new or unlisted fields are not accidentally left unprotected.

Below you will find tables for Query, Mutation, and types/fields, showing which user and app roles are required for each.

{{PERMISSIONS_TABLES}}
