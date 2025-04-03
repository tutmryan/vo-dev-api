# Auth setup

## API app registration (repeat for all environments e.g. localdev, dev, prod)

1. Name: Verified Orchestration API (localdev)
1. Expose an API
1. Application ID URI (Set): api://verified-orchestration-api-localdev
1. Add a scope (see infrastructure/scripts/api-scopes.json):
   1. Name: `Admin`
   1. Admin consent display name: `Verified orchestration platform admin`
   1. Admin consent description: `Allows the user to administer the verified orchestration platform`
   1. Add scope
1. Add roles from infrastructure/scripts/api-app-roles.json
1. Add Verified ID and MS Graph resources from infrastructure/scripts/api-requested-resource-accesses.json
1. Add optional token claims from infrastructure/scripts/api-optional-claims.json

## Admin API UI app registration (repeat for all environments where an API UI will be hosted e.g. localdev, dev)

1. Name: Verified Orchestration API UI (localdev)
1. Add platform `Web` (for server-side PKCE) with one Redirect URI: `http(s)://${host}` (http://localhost for localdev)
1. Click Register
1. API permissions > Add a permission > My APIs > Verified Orchestration API ({environment}) > Delegated permissions > Admin > Add permissions
1. API permissions > Grant admin consent for {tenant} > Yes

## Admin website app registration (repeat for all environments e.g. localdev, dev, prod)

1. Name: Verified Orchestration Admin (localdev)
1. Add platform `Single-page application (SPA)` with one Redirect URI: `http(s)://${host}` (http://localhost for localdev)
1. Click Register
1. API permissions > Add a permission > My APIs > Verified Orchestration API ({environment}) > Delegated permissions > Admin > Add permissions
1. API permissions > Grant admin consent for {tenant} > Yes

Note: for localdev, configure API permissions for both localdev and dev APIs

## Limited access client app registration (repeat for all environments e.g. localdev, dev, prod)

1. Name: Verified Orchestration limited access client (localdev)
1. Click Register
1. API permissions > Add a permission > My APIs > Verified Orchestration API ({environment}) > Application permissions > VerifiableCredential.LimitedAccess > Add permissions
1. API permissions > Grant admin consent for {tenant} > Yes
1. Certificates & secrets > New client secret
1. Description: Client credentials secret
1. Expires: 24 months
1. Add
1. Copy to the Bitwarden vault (for localdev) or GitHub environment secrets deployed instances
