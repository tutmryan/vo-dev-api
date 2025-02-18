# Security Protections

This page describes the security protections in place for the Verified Orchestration platform and associated hosted components including the OIDC endpoint, developer tools and associated interactive authentication.

## Vulnerabilities

Verified Orchestration incorporates vulnerability scanning to ensure that no vulnerabilities (of any severity) can be present in deployable artifacts at deployment time.

## Authorization

The API requires authorization for the majority of operations.

Authorization is performed against JWT access tokens, which are verified, must have the correct audience and be from a whitelist of issuers:

1. Customer home tenant and additional whitelisted tenants (Entra ID tenants).
1. The hosting platform Entra ID tenant, for operations where JWTs produced from internal operations are required.
1. The OIDC provider issuer.

Application and User roles also used to assess the authorization level for the operation.

Anonymous operations have restrictions on input and output to minimize the risk of abuse.

### Protocols

- **HTTPS**: API access over HTTPS requires a valid JWT token via an `Authorization: Bearer {token}` header.
- **WSS**: API access for subscriptions over websockets requires a valid JWT token in an `Authorization: Bearer {token}` connection parameter.

## Rate limiting

The API is rate limited for DDOS protection. The majority of operations have a base rate plus burst rate limit, allowing frequency to increase over the ongoing limit for short periods, which is generally how applications behave.

Limits are applied according to whether the request is authenticated or not:

- Authenticated request are limited to the `jti` (or `uti`) claim value in the JWT token.
- Unauthenticated requests are limited to the IP address.

Some operations have different limits, for example:

- Acquiring an async issuance token (using an OTP) is limited to x attempts per OTP expiry window.

## Request size limits

The API host has limits on the size of requests to prevent abuse. Authenticated requests accept a larger payload size than unauthenticated requests.

## GraphQL protections

There are limits in place for the GraphQL operations to prevent abuse:

- **Max Aliases**: Limit the number of aliases in the GraphQL operation.
- **Max Depth**: Limit the nesting depth of the GraphQL operation.
- **Max Directives**: Limit the number of directives in the GraphQL operation.
- **Max Tokens**: Limit the number of tokens (characters) in the GraphQL operation.

## Headers

HTTP headers returned from the API host process are controlled to achieve an A rating from securityheaders.com ([example](https://securityheaders.com/?q=https%3A%2F%2Fpartner.api.verifiedorchestration.com%2Fgraphql&hide=on)).

### Content Security Policy

The API host returns a restricted Content-Security-Policy header. The policy value depends on whether the instance is [hosting developer tools](#developer-tools) (off by default for production instances).

#### Notable inclusions in Content Security Policy

- `https: 'unsafe-inline'` is required for the OIDC provider auth flow interaction pages which self-submit HTML forms.

## Developer tools

The API optionally hosts developer tools. These are disabled by default for production instances.

When enabled, additional functionality runs:

- **GraphQL Playground**: An interactive GraphQL IDE hosted at `/graphql`.
- **Voyager**: An interactive GraphQL schema visualizer hosted at `/voyager`.
- **Interactive Authentication**: Microsoft PKCE authentication is performed for browser-based access to the developer tools, so that users can run authenticated operations from the tools against the API.

### Content Security Policy for developer tools

When developer tools are enabled, the API host returns a more relaxed Content-Security-Policy header value to allow the developer tools to function.

#### Notable inclusions in Content Security Policy for developer tools

- `https: 'unsafe-eval'` is required for the Voyager to function.

## Static content

The composer, concierge and docs sites are static, hosted on a separate domains via CDNs and are not part of the API hosting.

These sites are served over HTTPS and have a Content-Security-Policy headers set to restrict the content.

All sites have a securityheaders.com A rating.

### Notable inclusions in Content Security Policy for static content

- `https: 'unsafe-inline'` is required for authentication libraries in both composer and portal.

### Authentication for static content

- **Composer**: Authentication is performed client-side using the PKCE via Entra ID.
- **Concierge**: Authentication for issuee sign-in is performed client-side using PKCE via the OIDC endpoint.
- **Docs**: Authentication is performed server-side via Entra ID.
