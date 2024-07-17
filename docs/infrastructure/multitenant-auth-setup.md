# Multitenant auth setup

A multitenant app registartion is created for each instance in the autmoated deployment pipeline. It is then installed into one or more tenants of the customer who commissioned the instance.

The following app registrations are created for the internal operations of the Verified Orchestration platform and are not exposed to the customers.

## Create an app registration to hold the roles for internal applications

- create app registration named `Verified Orchestration Internal` (with `(non prod)` suffix for the non prod environment)
- choose `Single tenant` option for `Supported account types`
- click "Register" to create the app registration
- add `Application ID URI` (e.g. `api://verified-orchestration-internal-non-prod` for the non prod environment)
- add a scope (e.g. `api://verified-orchestration-internal-non-prod/platform` for the non prod environment)
  - Consent display name: `Verified Orchestration platform [INTERNAL API USE ONLY]`
  - Consent description: `Verified Orchestration platform [INTERNAL API USE ONLY]`
- create a client secret for the app registration to access the Verified ID API
  - set it to expires in 24 months
  - store it in 1Password as `NonProd - Verified Orchestration -> Internal app client secret` for the non prod environment
  - set `[NON_PROD | PROD]_INTERNAL_CLIENT_SECRET` secret in the GitHub organisation
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
    description: "Provides limited access to the Verified Orchestration platform - access tokens with this role are created by the API and given to limited access client. DO NOT GRANT TO OTHER APPLICATIONS.",
    displayName: "Limited access [INTERNAL API USE ONLY]",
    value: "VerifiableCredential.LimitedAccess"
  }
  ```

  ```JSON
  {
    description: "Provides limited access to approval features of the Verified Orchestration platform - access tokens with this role are created by the API and given to limited approval client. DO NOT GRANT TO OTHER APPLICATIONS.",
    displayName: "Limited approval [INTERNAL API USE ONLY]",
    value: "VerifiableCredential.LimitedApproval"
  }
  ```

  ```JSON
  {
    description: "Provides limited access to photo capture features of the Verified Orchestration platform - access tokens with this role are created by the API and given to limited photo capture clients. DO NOT GRANT TO OTHER APPLICATIONS.",
    displayName: "Limited photo capture [INTERNAL API USE ONLY]",
    value: "VerifiableCredential.LimitedPhotoCapture"
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

- create app registration named `Verified Orchestration Limited Access Client` (with `(non prod)` suffix for the non prod environment)
- choose `Single tenant` option for `Supported account types`
- click "Register" to create the app registration
- create a client secret for the Verified Orchestration API to generate a token
  - set it to expires in 24 months
  - store it in 1Password, `NonProd - Verified Orchestration -> Limited access client secret` for the non prod environment
  - set `[NON_PROD | PROD]_LIMITED_ACCESS_CLIENT_SECRET` secret in the GitHub organisation
- add the following application permissions from `Verified Orchestration Internal` API
  - VerifiableCredential.LimitedAccess
- grant admin consent for the added permissions

## Create an app registration for acquiring limited approval tokens

- create app registration named `Verified Orchestration Limited Approval Client` (with `(non prod)` suffix for the non prod environment)
- choose `Single tenant` option for `Supported account types`
- click "Register" to create the app registration
- create a client secret for the Verified Orchestration API to generate a token
  - set it to expires in 24 months
  - store it in 1Password, `NonProd - Verified Orchestration -> Limited approval client secret` for the non prod environment
  - set `[NON_PROD | PROD]_LIMITED_APPROVAL_CLIENT_SECRET` secret in the GitHub organisation
- add the following application permissions from `Verified Orchestration Internal` API
  - VerifiableCredential.LimitedApproval
- grant admin consent for the added permissions

## Create an app registration for acquiring limited photo capture tokens

- create app registration named `Verified Orchestration Limited Photo Capture Client` (with `(non prod)` suffix for the non prod environment)
- choose `Single tenant` option for `Supported account types`
- click "Register" to create the app registration
- create a client secret for the Verified Orchestration API to generate a token
  - set it to expires in 24 months
  - store it in 1Password, `NonProd - Verified Orchestration -> Limited photo capture client secret` for the non prod environment
  - set `[NON_PROD | PROD]_LIMITED_PHOTO_CAPTURE_CLIENT_SECRET` secret in the GitHub organisation
- add the following application permissions from `Verified Orchestration Internal` API
  - VerifiableCredential.LimitedPhotoCapture
- grant admin consent for the added permissions

## Create an app registration for Verified ID callback token generation

- create app registration named `Verified Orchestration VID Callback Client` (with `(non prod)` suffix for the non prod environment)
- choose `Single tenant` option for `Supported account types`
- click "Register" to create the app registration
- create a client secret for the Verified Orchestration API to generate a callback token for the Verified ID
  - set it to expires in 24 months
  - store it in 1Password, `NonProd - Verified Orchestration -> VID callback client secret` for the non prod environment
  - set `[NON_PROD | PROD]_VID_CALLBACK_CLIENT_SECRET` secret in the GitHub organisation
- add the following application permissions from `Verified Orchestration Internal` API
  - VerifiableCredential.Request.Callback
- grant admin consent for the added permissions
