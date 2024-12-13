# Release

A release is created prior to deploying to non-production environment instances.

Releases are usually deployed in stages to:
1. non production and sandbox instances, where customers run them / QC for a period
1. production instances

## Process

Once QA has been performed and a proposed release is agreed:

1. Create a new release in GitHub (one for each component being released)
1. For the title, use version number (which is the default)
1. Use versioning `v${YYYY}.${minor}.${patch}` e.g. `v2024.0.0`, `v2024.1.0` or `v2024.1.1` (patch)
  1. Use the current year
  1. Increment the minor version when creating a new release from main
  1. Increment the patch when creating a new release from a prior release
1. Generate release notes
1. Curate [release notes](#release-notes))
1. Ensure customer communications are completed with release notes, and any notification period is awaited before deployment at agreed time

## Release notes

Curate the release notes into a format which will make sense to a customer.

Break into sections for:
 1. New features
 1. Enhancements
 1. Fixes

Balance detail with customer relevency.

### Example

#### New features
- OIDC authentication
- Claim types and validation
- Presentation constraints
- Documentation search

#### Enhancements
- Add asyncIssuanceRequests field to Identity and Contract
- Documentation updates:
  - Identity mapping
  - Platform components
  - Integration options
  - Approvals
- Validating issuance payload to be less than 1 MB

#### Fixes
- Presentation demo is now off-by-default in production instances
- Expired async issuances are no longer returned when using 'pending' status filter
- Library vulnerability patching

## Hotfix procedure

1. Fix bug
1. PR and merge to main
1. Test, confirm
1. Create **branch from target release tag** (usually the most recent release)
1. Cherrypick fix commit(s) to release branch
1. Create release in the usual way, **incrementing only the patch version number** from the target release version
1. Verify fix as appropriate before broad rollout
