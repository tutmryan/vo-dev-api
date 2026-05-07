# Credential record state machine

This document describes the state transitions for `CredentialRecord` status across the three verification/issuance methods.

## Overview

`CredentialRecord` provides a unified lifecycle view of credentials, combining data from `issuance` (completed) and `async_issuance` (remote) tables, plus bare `credential_record` rows (in-person, pre-issuance). The `credentialRecordStatus` is computed at query time from the underlying entity states.

Statuses are grouped into four phases: **Offer**, **Verification**, **Issuance**, and **Credential lifecycle**. Two statuses (`offerAccepted`, `verificationCompleted`) are transient — used only in audit events and never returned by queries.

## Status values

| Status                  | Phase                | Description                                             | Source                                                                                                                   |
| ----------------------- | -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `offered`               | Offer                | Remote offer pending recipient action                   | `async_issuance.state` in (`pending`, `contacted`)                                                                       |
| `offerAccepted`         | Offer                | Issuee accepted the offer; verification flow opened     | Transient — audit only                                                                                                   |
| `offerExpired`          | Offer                | Remote offer expired before acceptance                  | `async_issuance.expires_on < now`                                                                                        |
| `offerCancelled`        | Offer                | Offer cancelled by operator                             | `async_issuance.state = 'cancelled'` OR `credential_record.cancelled_at IS NOT NULL`                                     |
| `offerFailed`           | Offer                | Notification delivery failure                           | `async_issuance.state = 'contact-failed'`                                                                                |
| `verificationStarted`   | Verification         | OTP/link sent; awaiting identity confirmation           | `async_issuance.has_verification_communication = 1`                                                                      |
| `verificationCompleted` | Verification         | Identity verified; system advances to `issuanceStarted` | Transient — audit only                                                                                                   |
| `identityNotVerified`   | Verification         | Verification failed (wrong OTP / biometric mismatch)    | `async_issuance.state = 'issuance-verification-failed'`                                                                  |
| `verificationFailed`    | Verification         | Technical/system error during verification              | Placeholder — reserved for future IDV integration                                                                        |
| `issuanceStarted`       | Issuance             | QR code generated; awaiting wallet redemption           | In-person: `credential_record` only (no linked issuance/async). Remote: `async_issuance.state = 'verification-complete'` |
| `issuanceFailed`        | Issuance             | Credential issuance call rejected                       | `async_issuance.state = 'issuance-failed'` OR `credential_record.failed_at IS NOT NULL`                                  |
| `issuanceExpired`       | Issuance             | QR code window (5 min) closed without wallet redemption | `credential_record.expires_at < now` (no linked issuance/async)                                                          |
| `issuanceCompleted`     | Credential lifecycle | Credential active in wallet                             | `issuance.is_revoked = false AND expires_at >= now`                                                                      |
| `expired`               | Credential lifecycle | Issued credential has passed its validity period        | `issuance.expires_at < now`                                                                                              |
| `revoked`               | Credential lifecycle | Credential revoked by operator                          | `issuance.is_revoked = true`                                                                                             |

---

## State machines by method

### 1. In-person issuance (PIN verification)

The operator generates and presents the credential offer directly to the recipient. No remote communications are created.

```
                    ┌─────────────────────────┐
                    │     issuanceStarted     │
                    │  (QR code displayed to  │
                    │      recipient)         │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
               PIN valid               PIN invalid /
               QR scanned               QR expired
                    │                        │
         ┌──────────┴──────────┐             ▼
         │                     │    ┌──────────────────┐
   wallet redeems         QR window  │  issuanceFailed  │
         │                 closes    │  issuanceExpired │
         ▼                    │      └──────────────────┘
  ┌─────────────────┐         ▼
  │ issuanceComplete│   ┌──────────────────┐
  └────────┬────────┘   │ issuanceExpired  │
           │            └──────────────────┘
  ┌────────┴────────┐
  │                 │
revoked          expires
  │                 │
  ▼                 ▼
revoked          expired
```

**Key points:**

- Records start at `issuanceStarted` — offer acceptance and PIN verification are handled in person by the operator and are not tracked as separate states
- No `Communication` records are created (PIN exchange is out-of-band)
- `offerCancelled` is available at any point before `issuanceCompleted` via `credential_record.cancelled_at`

---

### 2. Remote issuance with OTP verification

The system sends a 6-digit OTP via SMS/email. The recipient enters the OTP to verify their identity.

```
                    ┌─────────────────────────┐
                    │        offered          │
                    │  (state: pending /      │
                    │   contacted)            │
                    └───────────┬─────────────┘
                                │
              sendAsyncIssuanceVerification()
              Communication record created (purpose=verification)
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   verificationStarted   │
                    │ has_verification_comm=1 │
                    └───────────┬─────────────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
             OTP valid                  OTP invalid
          acquireToken()               (10 attempts)
                  │                           │
                  ▼                           ▼
       ┌──────────────────┐        ┌──────────────────────┐
       │  issuanceStarted │        │  identityNotVerified │
       │ (verification-   │        │ (issuance-           │
       │  complete)       │        │  verification-failed)│
       └────────┬─────────┘        └──────────────────────┘
                │
  createIssuanceRequestForAsyncIssuance()
                │
                ▼
       ┌─────────────────┐
       │ issuanceComplete│
       └────────┬────────┘
                │
     ┌──────────┴──────────┐
     │                     │
  revoked               expires
     │                     │
     ▼                     ▼
  revoked               expired
```

**Expiry / cancellation branches (from `offered` or `verificationStarted`):**

```
  offered / verificationStarted
               │
   ┌───────────┴──────────┐
   │                      │
expires_on < now     state = cancelled
   │                      │
   ▼                      ▼
offerExpired         offerCancelled
```

**Key points:**

- `Communication` records track OTP delivery (`purpose = 'verification'`)
- `has_verification_communication` flag on `async_issuance` enables efficient queries without joining `communication`
- OTP validation is rate-limited to 10 attempts per 5 minutes; OTP expires after 5 minutes (re-send available after 120 s throttle)
- `verificationCompleted` is transient — the system immediately advances to `issuanceStarted`; it is recorded in audit events only

---

### 3. Remote issuance via Concierge (credential-based authentication)

The recipient authenticates to Concierge using an existing credential. No OTP is required.

```
                    ┌─────────────────────────┐
                    │        offered          │
                    │  (state: pending /      │
                    │   contacted)            │
                    │  no verification contact│
                    └───────────┬─────────────┘
                                │
              User accesses issuance URL → /issue/{id}
              sendAsyncIssuanceVerification() → method: null
                                │
                                ▼
                    ┌─────────────────────────┐
                    │    Concierge login      │
                    │  (browser auth via      │
                    │  existing credential)   │
                    └───────────┬─────────────┘
                                │
              identityId === user.entity.id verified
                                │
                                ▼
                    ┌─────────────────────────┐
                    │     issuanceStarted     │
                    │ (verification-complete) │
                    └───────────┬─────────────┘
                                │
              createIssuanceRequestForAsyncIssuance()
                                │
                                ▼
                    ┌─────────────────────────┐
                    │    issuanceCompleted    │
                    └───────────┬─────────────┘
                                │
                   ┌────────────┴────────────┐
                   │                         │
                revoked                  expires
                   │                         │
                   ▼                         ▼
                revoked                  expired
```

**Key points:**

- No `Communication` records are created (no OTP)
- There is no `verificationStarted` state — the record goes directly from `offered` → `issuanceStarted`
- Identity is verified by the browser session with an existing credential (fastest path, minimal friction)

---

## `async_issuance.state` mapping

| State                          | Description                             | Maps to `CredentialRecordStatus`                                          |
| ------------------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| `pending`                      | Initial state                           | `offered`                                                                 |
| `contacted`                    | Notification sent                       | `offered`                                                                 |
| `verification-complete`        | OTP or Concierge verification succeeded | `issuanceStarted`                                                         |
| `issuance-verification-failed` | OTP verification failed                 | `identityNotVerified`                                                     |
| `contact-failed`               | Failed to deliver notification          | `offerFailed`                                                             |
| `issuance-failed`              | Credential issuance call failed         | `issuanceFailed`                                                          |
| `issued`                       | Credential successfully issued          | (joins to `issuance` table → `issuanceCompleted` / `revoked` / `expired`) |
| `cancelled`                    | Offer cancelled by operator             | `offerCancelled`                                                          |

---

## Query behaviour

`FindCredentialRecordsQuery` uses a 3-branch UNION to compute status:

1. **Branch 1 (`issuance`)** — Completed issuances (both in-person and remote). Returns `issuanceCompleted`, `revoked`, `expired`.
2. **Branch 2 (`async_issuance` where `state != 'issued'`)** — Active remote requests. Returns `offered`, `offerExpired`, `offerCancelled`, `offerFailed`, `verificationStarted`, `issuanceStarted` (verification-complete), `identityNotVerified`, `issuanceFailed`.
3. **Branch 3 (`credential_record` with no linked `issuance` or `async_issuance`)** — In-person records awaiting redemption. Returns `issuanceStarted`, `issuanceFailed`, `issuanceExpired`, `offerCancelled`.

Status is computed per-row using CASE expressions. Branch inclusion logic prunes irrelevant branches based on filter criteria for performance.

---

## Performance considerations

For 100M+ credential records:

1. **Denormalised flag**: `async_issuance.has_verification_communication` eliminates a subquery on the `communication` table when computing `verificationStarted`
2. **Composite indexes**: Created for common filter patterns (`identity_id`, `state`, `expires_on`)
3. **Communication index**: `ix_communication_async_issuance_id_purpose` optimises verification lookups
4. **Status filtering**: Branch inclusion logic prunes irrelevant UNION branches based on filter criteria
