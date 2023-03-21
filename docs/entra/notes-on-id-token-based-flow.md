## Notes about the ID token-based issuance flow

Verified ID supports different ways to get claims information during issuance.
The below is not exhaustive, but we know about:

- The consumer app adds claims to the issuance request payload &mdash; this is known as an "ID token hint" attestation.
- Authenticator requires the user to log in prior to the credential being issued, and uses claims from that ID token to get claims values &mdash; this is the "ID token" attestation.

It's worth noting that a contract can use both types of attestations, where some claims are passed through the issuance request, and some are fetched from the ID token when the user logs in via the Authenticator app.

We got an example of the ID token attestation working, and here are some notes that might help in the future.
There are some [official docs](https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/how-to-use-quickstart-idtoken) about this flow, but they're lacking in some ways

### Sample display and rules definition JSON files

Nothing special in the display definition:

```json
{
  "locale": "en-US",
  "card": {
    "backgroundColor": "#000000",
    "description": "Description",
    "issuedBy": "Mick",
    "textColor": "#ffffff",
    "title": "ID token credential",
    "logo": {
      "description": "The GitHub logo",
      "uri": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
    }
  },
  "consent": {
    "instructions": "Consent instructions",
    "title": "Consent title"
  },
  "claims": [
    {
      "claim": "vc.credentialSubject.preferredUsername",
      "label": "Name",
      "type": "String"
    }
  ]
}
```

The rules definition has some specifities, see the inline comments:

```jsonc
{
  "attestations": {
    "idTokens": [
      {
        // Client ID of an app registration, set up with a "Desktop & mobile devices" redirect URL of vcclient://openid/
        "clientId": "e506eed9-1096-40a0-99ae-bc59d6101158",

        // I'm fairly sure the Authenticator app uses the new Microsoft identity platform (formerly AAD v2.0 endpoint) to log
        // the user in, so the URL to the OIDC metadata document needs to be v2.0 as well
        "configuration": "https://login.microsoftonline.com/3511d23e-c2a1-4dbb-b94b-422802400348/v2.0/.well-known/openid-configuration",

        // This is fixed
        "redirectUri": "vcclient://openid/",

        // We could add more scopes if we need, these two seem fine
        "scope": "openid profile",
        "mapping": [
          {
            // This matches the name of the claim in the display definition, minus
            // the `vc.credentialSubject.` prefix
            "outputClaim": "preferredUsername",
            "required": true,

            // This seems to need to have the `$.` prefix, and the rest needs
            // to match the name of a claim in the ID token
            "inputClaim": "$.preferred_username",
            "indexed": false
          }
        ],
        "required": true
      }
    ]
  },
  "validityInterval": 2592000,
  "vc": {
    "type": ["MickIdTokenTestCredential"]
  }
}
```

### About optional claims in ID token

By default, AAD only returns a few claims in the ID token.
If we want more claims, for example `first_name` and `family_name`, we need to configure optional claims in the app registration.

See <https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/how-to-use-quickstart-idtoken#claims-in-the-id-token-from-the-identity-provider>.

### About issuance request

When using the ID token attestation **alone**, the issuance request payload cannot include any claims.
If it does, the initial issuance request will succeed, i.e. it will return an issuance URL and/or QR code, the user can go through the process, and log in to their identity provider.
However, when trying to add the credential to the wallet in Authenticator, an error will be returned.

If there are no claims in the issuance request payload, a PIN flow cannot be used.
