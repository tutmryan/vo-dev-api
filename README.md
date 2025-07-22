# Verified Orchestration API

The verified orchestration platform GraphQL API backend repository.

## Developer prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Node v22 LTS](https://nodejs.org/en/download/package-manager)
- [Ngrok](https://ngrok.com/) (required for issuing credentials locally)

## Developer IDE recommendations

The VO solution is known to work well with [VSCode](https://code.visualstudio.com/) and [Webstorm](https://www.jetbrains.com/webstorm/).

When using VSCode, the VO recommendation is to use the extensions listed in the `./vscode/extensions.json` file. After opening the solution in VSCode, you will prompt to you install these extensions if you don't already have them.

For webstorm users, the VO recommendation is to enable 'Optimize imports' on save. This can be done by going to `Settings -> Tools -> Actions on Save` and check the optimize imports.

## Getting started

- `npm i`
- `cp .env.template .env`
- fill in `.env` secrets from the Bitwarden vault
- add your email (if needed) and phone number to the `# Email and SMS config` section in the `.env` file
- run tasks: Start DB & Migrate DB
- F5

**Tip:** If you are getting `Not Authorised!` error when browsing to `http://localhost:4000` and running any query for the first time, then turn on `Include cookies` setting in `Connection settings` dialog of Apollo sandbox.

**Tip:** When the local cert used for azurite https setup expires, you can use the following command to create a new pair.

`openssl req -newkey rsa:2048 -x509 -nodes -keyout ./local-dev/cert/127.0.0.1-key.pem -new -out ./local-dev/cert/127.0.0.1.pem -sha256 -days 365 -addext "subjectAltName=IP:127.0.0.1" -subj "/C=CO/ST=ST/L=LO/O=OR/OU=OU/CN=CN"`

**Note**: Please be aware that if you're using localhost, the [Credentials page](http://localhost:5173/contracts) may not display the logo images for the credentials. This issue arises from the https image URL derived from the local Azurite, which triggers a `self-signed certificate` error in the browser due to untrusted certificate. To resolve this, you can use the following workaround: Right-click on the image and choose the 'Open Image in New Tab' option. In the new tab, bypass the security risk warning to load the image. After performing these steps, the credential logos should be displayed correctly, as your browser will have added the local server to its list of exceptions in the certificate manager.

## Open Telemetry (Local Development)

After running the `npm run start:db` task, docker compose will have added a few additional services to the local environment. Some of these services are used for Open Telemetry, and the data can be viewed by using one of these UIs:

- Aspire: http://localhost:4001/
- Seq: http://localhost:4002/

## Azure Storage Explorer

To view the local storage account, you can use the [Azure Storage Explorer](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-emulator). It has built-in support for connecting to Azurite, the local storage emulator. One thing to note is that the certificates need to be manually imported before a successful connection can be made. This can be done by going to `Edit -> SSL Certificates -> Import` and selecting the `local-dev/cert/127.0.0.1.pem` file.

## Running a fully functional local development environment

By default, the local instances that comprise the VO platform are hosted on the following local ports:

- API: `http://localhost:4000`
- Admin UI: `http://localhost:5473`
- Portal UI: `http://localhost:5174`

However, the default configuration suffers from not being able to issue credentials as the MS servers require publicly accessible endpoints.

To resolve this, there's a small script that will configure Ngrok to expose the local instances to the internet. This script can be run by executing the following command: `npm run start:dev:tunnels`

This will allow you to issue credentials and test the platform as if it were hosted on a public server. Once running successfully, you will find similar readout in your terminal:

```
Tunnels are open
  API:       https://0649-159-196-209-217.ngrok-free.app
  Admin UI:  https://8305-159-196-209-217.ngrok-free.app
  Portal UI: https://7d6e-159-196-209-217.ngrok-free.app

Ngrok dashboard
  http://127.0.0.1:4040/

------------------------------------------------

Press Ctrl+C to close the tunnels and exit

Enter `b` to open the API
Enter `a` to open the Admin UI
Enter `p` to open the Portal UI
Enter `n` to open the ngrok dashboard
```

Note: _this script requires the local folder layout to be as follows:_

```
/shared-parent-folder/verified-orchestration-api
/shared-parent-folder/verified-orchestration-admin
/shared-parent-folder/verified-orchestration-portal
```

_Note: this script configures the API, Admin UI, and Portal UI to be exposed to the internet and makes all required changes to the configuration files. These changes are reverted when the script is stopped._

## Using Entra ID EAM with the VO OIDC provider locally

_Note 💡: all EAM cloud infrastructure is set up in the `VO Dev Sandbox` tenant. You will need to PIM into the Global Admin role to make changes._

_Note 🚨: the configuration in the Sandbox tenant is set up to support only a **single dev environment** at a time. It is possible to configure the environment to support multiple dev environments, but this is not covered in this guide. Given this limitation, it's good practise to confirm with team before using._

### Set up

To successfully use Entra ID EAM with the VO OIDC provider locally, you will need to follow these steps:

_Feel free to skip any steps that you have already completed._

1. Run the `npm run start:dev:tunnels` command to expose the local instances to the internet.
2. Update the **two** `Redirect URIs` set in the Entra ID application named [EAM VO OIDC LocalDev](https://entra.microsoft.com/?feature.msaljs=true#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Authentication/appId/bf811ba3-af2a-4189-beb6-12c54d8f0b55/isMSAApp~/false) to reflect the URI for your local API.<br/><br/>
   ![Ngrok](/docs/assets/ngrok-local-tunnel-output-uris.png)<br/>
   ![App redirects](/docs/assets/entra-id-eam-app-redirect-uris.png)
3. Register a new Authentication client in your local Orchestrator with the following redirect URI `https://login.microsoftonline.com/common/federation/externalauthprovider` and take note of the `Client ID`.
4. Update the `Client ID` and `Discovery Endpoint` in the Entra ID Authentication Method named [EAM VO OIDC LocalDev - EAM](<https://entra.microsoft.com/#view/Microsoft_AAD_AuthenticationMethods/ConfigureAuthMethod.ReactView/authMethodType/%23microsoft.graph.externalAuthenticationMethodConfiguration/authMethod~/%7B%22%40odata.type%22%3A%22%23microsoft.graph.externalAuthenticationMethodConfiguration%22%2C%22id%22%3A%22f7d00d04-2473-42de-933c-004a98795f36%22%2C%22state%22%3A%22enabled%22%2C%22displayName%22%3A%22EAM%20VO%20OIDC%20LocalDev%20-%20EAM%22%2C%22appId%22%3A%22bf811ba3-af2a-4189-beb6-12c54d8f0b55%22%2C%22excludeTargets%22%3A%5B%5D%2C%22openIdConnectSetting%22%3A%7B%22clientId%22%3A%225b5fdbc8-045e-4ac6-9d03-00beab33930d%22%2C%22discoveryUrl%22%3A%22https%3A%2F%2F3668c2d5b8f6.ngrok.app%2Foidc%2F.well-known%2Fopenid-configuration%22%7D%2C%22includeTargets%40odata.context%22%3A%22https%3A%2F%2Fgraph.microsoft.com%2Fbeta%2F%24metadata%23policies%2FauthenticationMethodsPolicy%2FauthenticationMethodConfigurations('f7d00d04-2473-42de-933c-004a98795f36')%2Fmicrosoft.graph.externalAuthenticationMethodConfiguration%2FincludeTargets%22%2C%22includeTargets%22%3A%5B%7B%22targetType%22%3A%22group%22%2C%22id%22%3A%22d775d0c2-0fbf-4acb-ade0-e6dbb9514d1a%22%2C%22isRegistrationRequired%22%3Afalse%2C%22displayName%22%3A%22EAM%20VO%20OIDC%20LocalDev%20-%20Group%22%7D%5D%2C%22enabled%22%3Atrue%2C%22target%22%3A%221%20group%22%2C%22isAllUsers%22%3Afalse%2C%22voiceDisabled%22%3Afalse%7D/canModify~/true>) to match the `Client ID` from step 3 and `Discovery Endpoint` to match the API Ngrok URL from step 1.<br/><br/>
   ![External Auth Method](/docs/assets/entra-id-auth-method-external-oidc.png)
5. Register an identity for the Entra `EAM VO OIDC LocalDev - User` test user with the following details:

- `identifier`: `226804b1-ab49-45f3-b28a-698e94e7678e`
- `issuer`: `e5d1575e-338a-469b-b757-71788a0f3702`
- `name`: `EAM VO OIDC LocalDev - User`<br/>
  _Note: you may use this graphQL [query](http://localhost:4000/graphql?explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4RxighigSwiQAIBlXANwQEkxlCUBPACgBICkAHHdEuhgWY1uOAIQBKEsAA6pEgGcqteqiGtOPFHw6iUU2fJIkCYOceNJcicxdOCAZgQQAnW8YIKFMV7YC%2Bcn4gADQglLguBLgARgA2CAoYIIbGMiCaOGl8KRZp9mpOvhgkaQBMpQBsABwADAAs0QCMALQxdQCczXUArA4AzM3RpVW4zRXtVQjtdQgA7BWzk2nB7iXpXj5uxWkI3WCN3bPdCM19fSNd49GDR7PNs42LIzX9szWly6tpVjbbIACiAEEALIkABqAHkSBCaAARADCJAAMtBcLFYQhKCRmiQAKoKIr%2BQIgPxAA) to create the identity_

6. Issue a credential for yourself with the `EAM VO OIDC LocalDev - User` identity, as the credential will be needed for development and testing.

### Testing

To test the Entra ID EAM setup, use the following steps:

1. In a private browser tab, navigate to https://myapps.microsoft.com/ and sign in with the following credentials:

- Username: `eam-vo-oidc-localdev-user@vodevsandbox.onmicrosoft.com`
- Password: See Bitwarden `EAM VO OIDC LocalDev - User`

2. During the sign-in process, you will be requested to provide a second factor. Click/Tap the `Approve with EAM VO OIDC LocalDev - EAM` button.<br/><br/>
   ![EAM Second Factor Select](/docs/assets/entra-id-second-factor-eam-select.png)
3. You will then be present to present your VC<br/><br/>
   ![EAM Second Factor Present](/docs/assets/entra-id-eam-flow-vc-present.png)
4. Upon successful presentation, you will be signed in and redirected to the My Apps portal.<br/><br/>
   ![EAM Second Factor Success](/docs/assets/entra-id-eam-success-signin.png)

## Approvals

Approvals allow integrating apps to create an approval request which can be actioned by someone presenting a credential.

To test the approval workflow you must create the approval request via an authorised client, with the application role `VerifiableCredential.RequestApproval`.

### Test client

First, obtain the client secret from the [Github Approvals Demo client secret](https://vault.bitwarden.com/#/vault?organizationId=407a7ce4-93c3-4fb6-abdd-b1bd0185aa00&itemId=ce7341dc-fd43-4456-9873-b28400851ab4&action=view) item in Bitwarden.

### Obtain access token

Run the following authentication request to obtain an access token via Postman or whatever you prefer:

POST to `https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/oauth2/v2.0/token`

BODY should be `x-www-form-urlencoded`

```
client_id:70b5693a-6fa0-4639-bc6a-f4e1f011b447
scope:f24dc8de-66da-4b8b-928b-be4c6657d1cc/.default
client_secret:{FROM BitWarden}
grant_type:client_credentials
```

### Create approval request

Follow the docs [create an approval request](https://dev.docs.verifiedorchestration.com/docs/guides/approvals#step-1-request-approval).

## Limited access tokens

To test limited access token clients, either set up a new App Registration or use the existing `Onboarding Demo API` client.

### Test client

First, obtain the client secret from the [Onboarding Demo API client secret](https://vault.bitwarden.com/#/vault?itemId=130c22e8-b7b5-4577-8240-b2840083881e&action=view) item in Bitwarden.

This client is from the `Verified Orchestration Onboarding Demo` tenant. It has access to both `demo` and `dev` VO instances

### Obtain access token

Run the following authentication request to obtain an access token via Postman or whatever you prefer:

POST to `https://login.microsoftonline.com/10b631d3-9e47-49e1-a938-cbd933f0488d/oauth2/v2.0/token`

BODY should be `x-www-form-urlencoded`

```
client_id:9d663e0c-2931-4ddd-b57b-e2d05e867e21
scope:f24dc8de-66da-4b8b-928b-be4c6657d1cc/.default
client_secret:{FROM BitWarden}
grant_type:client_credentials
```

### How to use

1. Copy the access token into Apollo Sandbox and apply an `Authorization: Bearer {token}` header.
2. Run the token acquisition mutation with this header applied.
3. Receive the limited access token.
4. Apply `Authorization: Bearer {token}` header using the limited access token for subsequent operations.
