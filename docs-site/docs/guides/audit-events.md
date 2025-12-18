---
sidebar_position: 16
---

# Audit Event Types

This document provides a reference of all audit event types emitted by the Verified Orchestration platform. Each event has a stable **Event Type ID** that can be used for filtering and alerting in SIEM systems.

## Event Schema

Audit events are sent to Azure Log Analytics with the following structure:

| Field | Description |
|-------|-------------|
| `EventTime` | ISO 8601 timestamp of when the event occurred |
| `EventTypeId` | Stable event code (e.g., `VO0010`) - never changes once assigned |
| `EventType` | Semantic event type (e.g., `api.graphql.operation`) |
| `Message` | Human-readable description of the event |
| `Properties` | Additional context specific to the event type |

## Event Type ID Format

Event Type IDs follow the format `VO####` where:
- `VO` = Verified Orchestration (organization prefix)
- `####` = Sequential number assigned to each event type

**Important:** Event Type IDs are stable identifiers that never change once assigned. Use these for SIEM rules and alerts.

## API Events

Events related to API operations including GraphQL queries, mutations, and subscriptions.

| Event Type ID | Event Type | Description |
|---------------|------------|-------------|
| `VO0010` | `api.graphql.operation` | API GRAPHQL Operation |
| `VO0011` | `api.graphql.query` | API GRAPHQL Query |
| `VO0012` | `api.graphql.mutation` | API GRAPHQL Mutation |
| `VO0013` | `api.graphql.subscription` | API GRAPHQL Subscription |

## OIDC Events

Events related to OpenID Connect authentication flows, including login, logout, and authorization.

| Event Type ID | Event Type | Description |
|---------------|------------|-------------|
| `VO0030` | `oidc.interaction.started` | OIDC Interaction Started |
| `VO0031` | `oidc.interaction.ended` | OIDC Interaction Ended |
| `VO0032` | `oidc.par.succeeded` | OIDC PAR Succeeded |
| `VO0033` | `oidc.authorization.succeeded` | OIDC Authorization Succeeded |
| `VO0034` | `oidc.authorization.failed` | OIDC Authorization Failed |
| `VO0035` | `oidc.grant.succeeded` | OIDC Grant Succeeded |
| `VO0036` | `oidc.backchannel.succeeded` | OIDC Backchannel Succeeded |
| `VO0037` | `oidc.registration.created` | OIDC Registration Created |
| `VO0038` | `oidc.registration.updated` | OIDC Registration Updated |
| `VO0039` | `oidc.registration.deleted` | OIDC Registration Deleted |
| `VO0040` | `oidc.presentation.created` | OIDC Presentation Created |
| `VO0041` | `oidc.session.started` | OIDC Session Started |
| `VO0042` | `oidc.session.ended` | OIDC Session Ended |

## Presentation Events

Events related to verifiable credential presentations (verification requests).

| Event Type ID | Event Type | Description |
|---------------|------------|-------------|
| `VO0060` | `presentation.request.created` | Presentation Request Created |
| `VO0061` | `presentation.request.retrieved` | Presentation Request Retrieved |
| `VO0062` | `presentation.request.completed` | Presentation Request Completed |
| `VO0063` | `presentation.request.failed` | Presentation Request Failed |

## Issuance Events

Events related to verifiable credential issuance.

| Event Type ID | Event Type | Description |
|---------------|------------|-------------|
| `VO0080` | `issuance.request.created` | Issuance Request Created |
| `VO0081` | `issuance.request.retrieved` | Issuance Request Retrieved |
| `VO0082` | `issuance.credential.issued` | Issuance Credential Issued |
| `VO0083` | `issuance.credential.revoked` | Issuance Credential Revoked |
| `VO0084` | `issuance.credential.failed` | Issuance Credential Failed |

## Async Issuance Events

Events related to async (remote) issuance workflows, including notifications and request lifecycle.

| Event Type ID | Event Type | Description |
|---------------|------------|-------------|
| `VO0100` | `async-issuance.request.created` | Async Issuance Request Created |
| `VO0101` | `async-issuance.request.claimed` | Async Issuance Request Claimed |
| `VO0102` | `async-issuance.contact.fetched` | Async Issuance Contact Fetched |
| `VO0103` | `async-issuance.contact.updated` | Async Issuance Contact Updated |
| `VO0104` | `async-issuance.notification~email.sent` | Async Issuance Notification Email Sent |
| `VO0105` | `async-issuance.notification~sms.sent` | Async Issuance Notification SMS Sent |
| `VO0106` | `async-issuance.notification.resend~queued` | Async Issuance Notification Resend Queued |
| `VO0107` | `async-issuance.notification~email.status` | Async Issuance Notification Email Status |
| `VO0108` | `async-issuance.notification~sms.status` | Async Issuance Notification SMS Status |
| `VO0109` | `async-issuance.notification.resend~failed` | Async Issuance Notification Resend Failed |
| `VO0110` | `async-issuance.notification~email.failed` | Async Issuance Notification Email Failed |
| `VO0111` | `async-issuance.notification~sms.failed` | Async Issuance Notification SMS Failed |
| `VO0112` | `async-issuance.notification~job.failed` | Async Issuance Notification Job Failed |
| `VO0113` | `async-issuance.request.cancelled~queued` | Async Issuance Request Cancelled Queued |
| `VO0114` | `async-issuance.request.cancelled~command` | Async Issuance Request Cancelled Command |
| `VO0115` | `async-issuance.request.cancelled~job` | Async Issuance Request Cancelled Job |
| `VO0116` | `async-issuance.request.cancelled~failed` | Async Issuance Request Cancelled Failed |

## SIEM Integration

When integrating with your SIEM system, we recommend:

1. **Filter by EventTypeId** for precise event matching
2. **Use EventType** for human-readable categorization
3. **Parse Properties** for detailed event context

### Machine-Readable Event Catalog

Download the complete event catalog in JSON format for import into your SIEM:

**[Download audit-events.json](/audit-events.json)**

This file is automatically generated and kept in sync with the platform.

See the [Audit documentation](./audit.mdx) for sample audit entries and integration guidance.
