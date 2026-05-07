import { randomUUID } from 'crypto'
import { isIP } from 'net'
import { BeforeInsert, BeforeUpdate, Column, DeleteDateColumn, Entity, JoinTable, ManyToMany, OneToMany, RelationId } from 'typeorm'
import {
  booleanType,
  dateTimeOffsetTransformer,
  dateTimeOffsetType,
  nvarcharMaxType,
  nvarcharType,
  varcharMaxLength,
} from '../../../data/utils/crossDbColumnTypes'
import { OidcApplicationType, OidcClientType, OidcResponseType, OidcTokenEndpointAuthMethod } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { assertExhaustive } from '../../../util/type-helpers'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { PartnerEntity } from '../../partners/entities/partner-entity'
import { OidcClaimMappingEntity } from './oidc-claim-mapping-entity'
import type { OidcClientClaimConstraint } from './oidc-client-claim-constraint'
import { claimConstraintFromJSON, validateClaimConstraint } from './oidc-client-claim-constraint'
import { OidcClientResourceEntity } from './oidc-client-resource-entity'
import { OidcClientVcPolicy, OidcClientVcPolicyData } from './oidc-client-vc-policy'
import { OidcIdentityResolverEntity } from './oidc-identity-resolver-entity'

type RequiredArgs = Pick<
  OidcClientEntity,
  'name' | 'applicationType' | 'clientType' | 'redirectUris' | 'postLogoutUris' | 'tokenEndpointAuthMethod'
>
type OptionalArgs = Pick<
  OidcClientEntity,
  | 'credentialTypes'
  | 'uniqueClaimsForSubjectId'
  | 'logo'
  | 'backgroundColor'
  | 'backgroundImage'
  | 'policyUrl'
  | 'termsOfServiceUrl'
  | 'partnerIds'
  | 'allowAnyPartner'
  | 'requireFaceCheck'
  | 'faceCheckConfidenceThreshold'
  | 'authorizationRequestsTypeJarEnabled'
  | 'authorizationRequestsTypeStandardEnabled'
  | 'relyingPartyJwks'
  | 'relyingPartyJwksUri'
  | 'clientJwks'
  | 'clientJwksUri'
  | 'vcPolicy'
  | 'claimConstraint'
  | 'responseTypes'
>

type CreateOrUpdateArgs = RequiredArgs & Partial<OptionalArgs>

@Entity('oidc_client')
export class OidcClientEntity extends AuditedAndTrackedEntity {
  constructor(args?: CreateOrUpdateArgs & Pick<Partial<OidcClientEntity>, 'id'>) {
    super()
    if (args) {
      const { id, ...rest } = args
      typeSafeAssign(this, { id: args.id ?? randomUUID(), ...OidcClientEntity.validateInflateArgs(rest) })
    }
  }

  @DeleteDateColumn({ type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  deletedAt!: Date | null

  @Column({ type: nvarcharType })
  name!: string

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'logo' })
  logo!: string | null
  @BeforeInsert()
  @BeforeUpdate()
  private setLogo() {
    this.logo = this.logo?.toString() ?? null
  }

  @Column({ type: nvarcharType, nullable: true })
  backgroundColor!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'background_image' })
  backgroundImage!: string | null
  @BeforeInsert()
  @BeforeUpdate()
  private setBackgroundImage() {
    this.backgroundImage = this.backgroundImage?.toString() ?? null
  }

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'policy_url' })
  policyUrl!: string | null
  @BeforeInsert()
  @BeforeUpdate()
  private setPolicyUrl() {
    this.policyUrl = this.policyUrl?.toString() ?? null
  }

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'terms_of_service_url' })
  termsOfServiceUrl!: string | null
  @BeforeInsert()
  @BeforeUpdate()
  private setTermsOfServiceUrl() {
    this.termsOfServiceUrl = this.termsOfServiceUrl?.toString() ?? null
  }

  @Column({ type: nvarcharType, default: OidcApplicationType.Web })
  applicationType!: OidcApplicationType

  @Column({ type: nvarcharType, default: OidcClientType.Public })
  clientType!: OidcClientType

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  private redirectUrisJson!: string

  get redirectUris(): string[] {
    return JSON.parse(this.redirectUrisJson)
  }
  set redirectUris(value: string[]) {
    this.redirectUrisJson = JSON.stringify(value)
  }

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  private postLogoutUrisJson!: string

  get postLogoutUris(): string[] {
    return JSON.parse(this.postLogoutUrisJson)
  }
  set postLogoutUris(value: string[]) {
    this.postLogoutUrisJson = JSON.stringify(value)
  }

  /**
   * Require the client to use face check for all auth presentations.
   */
  @Column({ type: booleanType, default: false })
  requireFaceCheck!: boolean

  /**
   * The face check match confidence threshold (50–100).
   * Only applicable when requireFaceCheck is true.
   * When set, this value is sent as the matchConfidenceThreshold in the presentation request.
   */
  @Column({ type: 'int', nullable: true, name: 'face_check_confidence_threshold' })
  faceCheckConfidenceThreshold!: number | null

  /**
   * Indicates whether JWT-secured authorisation requests (JAR) are enabled for this client.
   */
  @Column({ type: booleanType, default: false, name: 'authorization_request_type_jar_enabled' })
  authorizationRequestsTypeJarEnabled!: boolean

  /**
   * Indicates whether standard authorisation requests (query params) are enabled for this client.
   */
  @Column({ type: booleanType, default: true, name: 'authorization_request_type_standard_enabled' })
  authorizationRequestsTypeStandardEnabled!: boolean

  /**
   * The relying party's public key set (JWKS) as a JSON string, used for verifying JWT-secured authorisation requests (JAR).
   */
  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'relying_party_jwks' })
  private relyingPartyJwksJson!: string | null

  get relyingPartyJwks(): object | null {
    return this.relyingPartyJwksJson ? JSON.parse(this.relyingPartyJwksJson) : null
  }
  set relyingPartyJwks(value: object | null) {
    this.relyingPartyJwksJson = value ? JSON.stringify(value) : null
  }

  /**
   * A URI pointing to the relying party's public key set (JWKS), used for verifying JWT-secured authorisation requests (JAR).
   */
  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'relying_party_jwks_uri' })
  relyingPartyJwksUri!: string | null

  /**
   * The token endpoint authentication method for this client.
   */
  @Column({ type: nvarcharType, length: 50, nullable: false, name: 'token_endpoint_auth_method' })
  tokenEndpointAuthMethod!: OidcTokenEndpointAuthMethod

  /**
   * The client's public key set (JWKS) as a JSON string, used for private_key_jwt client authentication.
   */
  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'client_jwks' })
  private clientJwksJson!: string | null

  get clientJwks(): object | null {
    return this.clientJwksJson ? JSON.parse(this.clientJwksJson) : null
  }
  set clientJwks(value: object | null) {
    this.clientJwksJson = value ? JSON.stringify(value) : null
  }

  /**
   * A URI pointing to the client's public key set (JWKS), used for private_key_jwt client authentication.
   */
  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'client_jwks_uri' })
  clientJwksUri!: string | null

  /**
   * Allow the client to auth using presentations from any partner.
   */
  @Column({ type: booleanType })
  allowAnyPartner!: boolean

  /**
   * Allow the client to auth using presentations from the specified partners.
   */
  @ManyToMany(() => PartnerEntity)
  @JoinTable({ name: 'oidc_client_partners' })
  partners!: Promise<PartnerEntity[]>

  @RelationId((client: OidcClientEntity) => client.partners)
  partnerIds!: string[]

  /**
   * The unique claim(s) which can be used to derive the subject identifier (sub claim value) from partner credentials (where no unique claim value is known).
   *
   * Note:
   * - This is not needed for authentication using VO credentials, the issuanceId claim is used.
   * - Multiple values can be specified, the first claim that is present in the partner presentation will be used.
   * - The authentication client also can specify the claim to use via the `vc_unique_claim_for_sub` auth request parameter.
   * - If values are defined here and the `vc_unique_claim_for_sub` auth request parameter is provided, it is validated to be from this list.
   */
  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  private uniqueClaimsForSubjectIdJSON!: string | null

  get uniqueClaimsForSubjectId(): string[] | null {
    return this.uniqueClaimsForSubjectIdJSON ? JSON.parse(this.uniqueClaimsForSubjectIdJSON) : null
  }
  set uniqueClaimsForSubjectId(value: string[] | null) {
    this.uniqueClaimsForSubjectIdJSON = value ? JSON.stringify(value) : null
  }

  /**
   * Optionally limit the client to auth using presentations of the specified types.
   */
  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  private credentialTypesJson!: string | null

  get credentialTypes(): string[] | null {
    return this.credentialTypesJson ? JSON.parse(this.credentialTypesJson) : null
  }
  set credentialTypes(types: string[] | null) {
    this.credentialTypesJson = types ? JSON.stringify(types) : null
  }

  /**
   * The OAuth response types permitted for this client, stored as a JSON array.
   */
  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  private responseTypesJson!: string

  get responseTypes(): OidcResponseType[] {
    return JSON.parse(this.responseTypesJson)
  }
  set responseTypes(value: OidcResponseType[]) {
    this.responseTypesJson = JSON.stringify(value)
  }

  /**
   * The resources this client may access.
   */
  @OneToMany(() => OidcClientResourceEntity, (clientResource) => clientResource.client)
  resources!: Promise<OidcClientResourceEntity[]>

  /**
   * The claim mappings applied to this client.
   */
  @ManyToMany(() => OidcClaimMappingEntity)
  @JoinTable({ name: 'oidc_client_claim_mappings' })
  claimMappings!: Promise<OidcClaimMappingEntity[]>

  @RelationId((client: OidcClientEntity) => client.claimMappings)
  claimMappingIds!: string[]

  /**
   * The identity resolvers applied to this client.
   */
  @ManyToMany(() => OidcIdentityResolverEntity)
  @JoinTable({ name: 'oidc_client_identity_resolvers' })
  identityResolvers!: Promise<OidcIdentityResolverEntity[]>

  @RelationId((client: OidcClientEntity) => client.identityResolvers)
  identityResolverIds!: string[]

  /**
   * The vc_* authorisation parameter policy for this client, stored as a JSON column.
   */
  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'vc_policy_json' })
  private vcPolicyJson!: string | null

  get vcPolicy(): OidcClientVcPolicy {
    return OidcClientVcPolicy.fromJSON(this.vcPolicyJson)
  }
  set vcPolicy(value: OidcClientVcPolicy) {
    this.vcPolicyJson = JSON.stringify(value.toJSON())
  }

  /**
   * A single claim constraint stored as JSON.
   * Uses the same shape as the GraphQL ClaimConstraint input:
   *  - { claimName, values: ["US", "UK"] }       for values operator
   *  - { claimName, contains: "@example.com" }    for contains operator
   *  - { claimName, startsWith: "John" }          for startsWith operator
   *
   *
   * Used as the default/fixed value for vc_constraint_* parameters
   * depending on the vcPolicy.vcConstraint mode.
   */
  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true, name: 'constraint_json' })
  private constraintJson!: string | null

  get claimConstraint(): OidcClientClaimConstraint | null {
    return claimConstraintFromJSON(this.constraintJson)
  }

  set claimConstraint(value: OidcClientClaimConstraint | null) {
    if (value) {
      validateClaimConstraint(value)
      this.constraintJson = JSON.stringify(value)
    } else {
      this.constraintJson = null
    }
  }

  update(args: CreateOrUpdateArgs) {
    typeSafeAssign(this, OidcClientEntity.validateInflateArgs(args))
  }

  /**
   * Updates only the vc policy on this client.
   */
  updateVcPolicy(policyData: Partial<OidcClientVcPolicyData>) {
    this.vcPolicy = OidcClientVcPolicy.fromInput(policyData)
  }

  static validateInflateArgs(args: CreateOrUpdateArgs): RequiredArgs & OptionalArgs {
    OidcClientEntity.validateUris('redirect', args.redirectUris, args.applicationType)
    OidcClientEntity.validateUris('log out', args.postLogoutUris, args.applicationType)

    if (args.faceCheckConfidenceThreshold !== undefined && args.faceCheckConfidenceThreshold !== null) {
      invariant(
        args.faceCheckConfidenceThreshold >= 50 && args.faceCheckConfidenceThreshold <= 100,
        'faceCheckConfidenceThreshold must be between 50 and 100',
      )
    }

    return {
      name: args.name,
      applicationType: args.applicationType,
      clientType: args.clientType,
      redirectUris: args.redirectUris,
      postLogoutUris: args.postLogoutUris,
      partnerIds: args.partnerIds ?? [],
      allowAnyPartner: args.allowAnyPartner !== undefined ? args.allowAnyPartner : false,
      requireFaceCheck: args.requireFaceCheck !== undefined ? args.requireFaceCheck : false,
      faceCheckConfidenceThreshold: args.faceCheckConfidenceThreshold ?? 70, // Previous default was 70, keep this for backward compatibility unless specified otherwise
      authorizationRequestsTypeJarEnabled:
        args.authorizationRequestsTypeJarEnabled !== undefined ? args.authorizationRequestsTypeJarEnabled : false,
      authorizationRequestsTypeStandardEnabled:
        args.authorizationRequestsTypeStandardEnabled !== undefined ? args.authorizationRequestsTypeStandardEnabled : true,
      relyingPartyJwks: args.relyingPartyJwks ?? null,
      relyingPartyJwksUri: args.relyingPartyJwksUri ?? null,
      tokenEndpointAuthMethod: args.tokenEndpointAuthMethod,
      clientJwks: args.clientJwks ?? null,
      clientJwksUri: args.clientJwksUri ?? null,
      credentialTypes: args.credentialTypes ?? null,
      uniqueClaimsForSubjectId: args.uniqueClaimsForSubjectId ?? null,
      // Empty response types means 'none' (authentication check only)
      responseTypes: args.responseTypes ?? [],
      logo: args.logo ?? null,
      backgroundColor: args.backgroundColor ?? null,
      backgroundImage: args.backgroundImage ?? null,
      policyUrl: args.policyUrl ?? null,
      termsOfServiceUrl: args.termsOfServiceUrl ?? null,
      vcPolicy: args.vcPolicy ?? OidcClientVcPolicy.default(),
      claimConstraint: args.claimConstraint ?? null,
    }
  }

  static validateUris(type: 'redirect' | 'log out', uris: Array<string | URL>, applicationType: OidcApplicationType) {
    if (type === 'redirect') {
      invariant(uris.length > 0, `At least one ${type} URI is required`)
    }

    uris.forEach((uri) => {
      const protocol = typeof uri === 'string' ? new URL(uri).protocol : uri.protocol
      const isHttps = protocol === 'https:'
      const hostname = typeof uri === 'string' ? new URL(uri).hostname : uri.hostname
      const isLocalhost = hostname === 'localhost'

      // https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
      switch (applicationType) {
        case OidcApplicationType.Web:
          if (!isHttps) invariant(isLocalhost, `http: URLs can only be used with localhost`)
          break
        case OidcApplicationType.Native:
          // Native Clients MUST only register redirect_uris using custom URI schemes or loopback URLs using the http scheme;
          invariant(
            isHttps === false,
            `${applicationType} clients MUST only register redirect_uris using custom URI schemes or loopback URLs using the http scheme`,
          )
          // loopback URLs use localhost or the IP loopback literals 127.0.0.1 or [::1] as the hostname.
          invariant(
            isLocalhost || hostname === '127.0.0.1' || hostname === '[::1]' || isIP(hostname) === 0,
            `${applicationType} client loopback URLs must use localhost or the IP loopback literals 127.0.0.1 or [::1] as the hostname`,
          )
          break
        default:
          assertExhaustive(applicationType, `Unknown application type: ${applicationType}`)
      }
    })
  }
}
