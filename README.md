# Verified Orchestration API

The verified orchestration platform GraphQL API backend repository.

## Developer prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Node v20 LTS](https://nodejs.org/en/download/package-manager)
- [Ngrok](https://ngrok.com/) (required for issuing credentials locally)

## Developer IDE recommendations

The VO solution is known to work well with [VSCode](https://code.visualstudio.com/) and [Webstorm](https://www.jetbrains.com/webstorm/).

When using VSCode, the VO recommendation is to use the extensions listed in the `./vscode/extensions.json` file. After opening the solution in VSCode, you will prompt to you install these extensions if you don't already have them.

For webstorm users, the VO recommendation is to enable 'Optimize imports' on save. This can be done by going to `Settings -> Tools -> Actions on Save ` and check the optimize imports`.

## Getting started

- `npm i`
- `cp .env.template .env`
- fill in `.env` secrets from 1password vault
- run tasks: Start DB & Migrate DB
- F5

**Tip:** If you are getting `Not Authorised!` error when browsing to `http://localhost:4000` and running any query for the first time, then turn on `Include cookies` setting in `Connection settings` dialog of Apollo sandbox.

**Tip:** When the local cert used for azurite https setup expires, you can use the following command to create a new pair.

`openssl req -newkey rsa:2048 -x509 -nodes -keyout ./local-cert/127.0.0.1-key.pem -new -out ./local-cert/127.0.0.1.pem -sha256 -days 365 -addext "subjectAltName=IP:127.0.0.1" -subj "/C=CO/ST=ST/L=LO/O=OR/OU=OU/CN=CN"`

**Note**: Please be aware that if you're using localhost, the [Credentials page](http://localhost:5173/contracts) may not display the logo images for the credentials. This issue arises from the https image URL derived from the local Azurite, which triggers a `self-signed certificate` error in the browser due to untrusted certificate. To resolve this, you can use the following workaround: Right-click on the image and choose the 'Open Image in New Tab' option. In the new tab, bypass the security risk warning to load the image. After performing these steps, the credential logos should be displayed correctly, as your browser will have added the local server to its list of exceptions in the certificate manager.

## Azure Storage Explorer

To view the local storage account, you can use the [Azure Storage Explorer](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-emulator). It has built-in support for connecting to Azurite, the local storage emulator. One thing to note is that the certificates need to be manually imported before a successful connection can be made. This can be done by going to `Edit -> SSL Certificates -> Import` and selecting the `local-cert/127.0.0.1.pem` file.

## Running a fully functional local development environment

By default, the local instances that comprise the VO platform are hosted on the following local ports:

- API: `http://localhost:4000`
- Admin UI: `http://localhost:5471/2` (Depending on order of startup, this may be on port 5472)
- Portal UI: `http://localhost:5471/2` (Depending on order of startup, this may be on port 5472)

However, the default configuration suffers from not being able to issue credentials as the MS servers require publicly accessible endpoints.

To resolve this, there's a small script that will configure Ngrok to expose the local instances to the internet. This script can be run by executing the following command: `npm run start:dev:tunnels`

This will allow you to issue credentials and test the platform as if it were hosted on a public server. Once running successfully, you will find similar readout in your terminal:

```
------------------------------------------------
Tunnels are open
  API:       https://3b34-159-196-209-217.ngrok-free.app
  Admin UI:  https://1fc1-159-196-209-217.ngrok-free.app
  Portal UI: https://cbdb-159-196-209-217.ngrok-free.app

Ngrok dashboard
  http://127.0.0.1:4040/

------------------------------------------------

Press Ctrl+C to close the tunnels and exit
```

Note: *this script requires the local folder layout to be as follows:*

```
/shared-parent-folder/verified-orchestration-api
/shared-parent-folder/verified-orchestration-admin
/shared-parent-folder/verified-orchestration-portal
```

Note: *this script configures the API, Admin UI, and Portal UI to be exposed to the internet and makes all required changes to the configuration files. These changes are reverted when the script is stopped.*
