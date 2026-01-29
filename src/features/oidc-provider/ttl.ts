/**
 * OIDC Provider TTL (Time To Live) configuration values.
 *
 * These values define the lifespan of various OIDC artifacts and align with our
 * credential-centric authentication model where each credential presentation
 * creates a distinct, ephemeral session.
 *
 * Values are in seconds (as required by oidc-provider).
 */
export const OIDC_TTL = {
  /**
   * Session TTL: 1 second (ephemeral)
   * Sessions expire immediately since each credential provides a distinct
   * account/subject identifier. No persistent sessions across credentials.
   */
  Session: 1,

  /**
   * Interaction TTL: 1 hour
   * Time allowed to complete the credential presentation flow
   */
  Interaction: 60 * 60,

  /**
   * Authorization Code TTL: 1 minute
   * Short-lived, used immediately for token exchange
   */
  AuthorizationCode: 60,

  /**
   * Grant TTL: 1 minute
   * Short-lived cleanup buffer. Grant expiration is aligned with session
   * expiration (see grants.ts), but needs Redis TTL for cleanup.
   */
  Grant: 60,

  /**
   * Access Token TTL: 1 hour
   * Standard access token lifetime. No refresh tokens supported.
   */
  AccessToken: 60 * 60,

  /**
   * ID Token TTL: 1 hour
   * Standard ID token lifetime
   */
  IdToken: 60 * 60,

  /**
   * Refresh Token TTL: 1 minute
   * Refresh tokens may still be issued for compatibility with existing client flows,
   * but are intentionally short-lived.
   */
  RefreshToken: 60,
} as const
