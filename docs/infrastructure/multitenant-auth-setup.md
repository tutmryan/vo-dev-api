# Multitenant auth setup

## Create an app registration for the Verified Orchestration

A single app registration is created in each of the non prod and prod environments for all the customer facing components; (e.g. API, Admin UI, and Docs site).

- create an app registration named `Verified Orchestration` (with `(non prod)` suffix for the non prod environment and `(sandbox)` suffix for the sandbox environment)
- choose `(Any Microsoft Entra ID tenant - Multitenant)` option for `Supported account types`
- Click "Register" to create the app registration
- set the `API_CLIENT_ID` variable in the relevant GitHub environment
- add `Application ID URI` (e.g. `api://verified-orchestration-non-prod` for the non prod environment and `api://verified-orchestration-sandbox` for the sandbox environment)
- add a scope `platform` (e.g. `api://verified-orchestration-non-prod/platform` for the non prod environment)
  - Consent display name: `Access the Verified Orchestration platform`
  - Consent description: `Allows the app to access the Verified Orchestration platform`
- create a client secret for the app registration to access the Verified ID API
  - set it to expires in 24 months
  - store it in 1Password as `API client secret`
  - set `API_CLIENT_SECRET` secret in the relevant GitHub environment
- add the following application permissions from `Verifiable Credentials Service Admin` API
  - VerifiableCredential.Authority.ReadWrite
  - VerifiableCredential.Contract.ReadWrite
  - VerifiableCredential.Credential.Revoke
  - VerifiableCredential.Credential.Search
  - VerifiableCredential.Network.Read
- add the following application permissions from `Verifiable Credentials Service Request` API
  - VerifiableCredential.Create.All
- grant admin consent for the added permissions
- create the following Applications roles

  ```JSON
  {
    value: "VerifiableCredential.AcquireLimitedAccessToken.ListContracts",
    description: "Provides access to acquire limited access tokens for listing contracts via the acquireLimitedAccessToken mutation"
    displayName: "Acquire limited access token: list contracts",
  }
  ```

  ```JSON
  {
    value: "VerifiableCredential.AcquireLimitedAccessToken.AnonymousPresentations",
    description: "Provides access to acquire limited access tokens for anonymous presentations via the acquireLimitedAccessToken mutation",
    displayName: "Acquire limited access token: anonymous presentations",
  }
  ```

  ```JSON
  {
    value: "VerifiableCredential.AcquireLimitedAccessToken.Issue",
    description: "Provides access to acquire limited access tokens for issuance operations via the acquireLimitedAccessToken mutation",
    displayName: "Acquire limited access token: issue",
  }
  ```

  ```JSON
  {
    value: "VerifiableCredential.AcquireLimitedAccessToken.Present",
    description: "Provides access to acquire limited access tokens for presentation operations via the acquireLimitedAccessToken mutation",
    displayName: "Acquire limited access token: present",
  ```

- create the following Users/Groups roles

  ```JSON
  {
    value: "VerifiableCredential.Reader",
    description: "Provides read access to templates, contracts, issuances, presentations, etc.",
    displayName: "Reader",
  }
  ```

  ```JSON
  {
     value: "VerifiableCredential.Issuer",
     description: "Provides access to manual issuance of credentials; includes Reader access",
     displayName: "Issuer",
  }
  ```

  ```JSON
  {
    value: "VerifiableCredential.CredentialAdmin",
    description: "Provides access to administer contracts and templates, and revoke issuances; includes Reader access",
    displayName: "Credential Admin",
  }
  ```

  ```JSON
  {
    value: "VerifiableCredential.PartnerAdmin",
    description: "Provide access to administer partners; includes Reader access",
    displayName: "Partner admin",
  }
  ```

- optionally: add `Single-page application` platform in `Authentication` -> `Platform configurations` section with any non-automated redirect URIs (e.g. `http://localhost` for local dev)
- add `Web` platform in `Authentication` -> `Platform configurations` section for PKCE
- add any non-automated redirect URIs (e.g. `http://localhost/auth` for local dev; if there are none, just add `https://placeholder` in order to add a platform)
- under the "Implicit grant and hybrid flows" section, check `ID tokens` (required for the docs static site auth)s
- in the "Manage" section, click on "Branding & properties", then "Update domain" next to "Publisher domain" to select the publisher domain

## Create an app registration to hold the roles for internal applications

- creat app registration named `Verified Orchestration Internal` (with `(non prod)` suffix for the non prod environment)
- choose `Single tenant` option for `Supported account types`
- click "Register" to create the app registration
- add `Application ID URI` (e.g. `api://verified-orchestration-internal-non-prod` for the non prod environment)
- add a scope (e.g. `api://verified-orchestration-internal-non-prod/platform` for the non prod environment)
  - Consent display name: `Verified Orchestration platform [INTERNAL API USE ONLY]`
  - Consent description: `Verified Orchestration platform [INTERNAL API USE ONLY]`
- create the following Applications roles

  ```JSON
  {
    description: "Provides limited access to the Verified Orchestration platform - access tokens with this role are created by the API and given to limited access client. DO NOT GRANT TO OTHER APPLICATIONS.",
    displayName: "Limited access [INTERNAL API USE ONLY]",
    value: "VerifiableCredential.LimitedAccess"
  }
  ```

  ```JSON
  {
    description "Used to secure the issuance and presentation request callback endpoints - access tokens with this role are creatd by the API and given to Entra to securely invoke the callback endpoint. DO NOT GRANT TO OTHER APPLICATIONS.",
    displayName: "Request callback [INTERNAL API USE ONLY]",
    value: "VerifiableCredential.Request.Callback"
  }
  ```

## Create an app registration for acquiring limited access tokens

- creat app registration named `Verified Orchestration Limited Access Client` (with `(non prod)` suffix for the non prod environment)
- choose `Single tenant` option for `Supported account types`
- click "Register" to create the app registration
- create a client secret for the Verified Orchestration API to generate a token
  - set it to expires in 24 months
  - store it in 1Password, `NonProd - Verified Orchestration -> Limited access client secret` for the non prod environment
  - set `LIMITED_ACCESS_CLIENT_SECRET` secret in the relevant GitHub environment
- add the following application permissions from `Verified Orchestration Internal` API
  - VerifiableCredential.LimitedAccess
- grant admin consent for the added permissions

## Create an app registration for Verified ID callback token generation

- create app registration named `Verified Orchestration VID Callback Client` (with `(non prod)` suffix for the non prod environment)
- choose `Single tenant` option for `Supported account types`
- click "Register" to create the app registration
- create a client secret for the Verified Orchestration API to generate a callback token for the Verified ID
  - set it to expires in 24 months
  - store it in 1Password, `NonProd - Verified Orchestration -> VID callback client secret` for the non prod environment
  - set `VID_CALLBACK_CLIENT_SECRET` secret in the relevant GitHub environment
- add the following application permissions from `Verified Orchestration Internal` API
  - VerifiableCredential.Request.Callback
- grant admin consent for the added permissions
