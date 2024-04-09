# Verified Orchestration API

The verified orchestration platform GraphQL API backend repository.

## Developer prerequisites

- docker
- node v20 LTS

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
