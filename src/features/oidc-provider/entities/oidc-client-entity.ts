import { randomUUID } from 'crypto'
import { BeforeInsert, BeforeUpdate, Column, DeleteDateColumn, Entity, JoinTable, ManyToMany, OneToMany, RelationId } from 'typeorm'
import { OidcApplicationType } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { PartnerEntity } from '../../partners/entities/partner-entity'
import { OidcClaimMappingEntity } from './oidc-claim-mapping-entity'
import { OidcClientResourceEntity } from './oidc-client-resource-entity'

type RequiredArgs = Pick<OidcClientEntity, 'name' | 'redirectUris' | 'postLogoutUris'>
type OptionalArgs = Pick<
  OidcClientEntity,
  | 'applicationType'
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
>
type CreateOrUpdateArgs = RequiredArgs & Partial<OptionalArgs>

function inflateArgs(args: CreateOrUpdateArgs): RequiredArgs & OptionalArgs {
  return {
    name: args.name,
    redirectUris: args.redirectUris,
    postLogoutUris: args.postLogoutUris,
    partnerIds: args.partnerIds ?? [],
    allowAnyPartner: args.allowAnyPartner !== undefined ? args.allowAnyPartner : false,
    requireFaceCheck: args.requireFaceCheck !== undefined ? args.requireFaceCheck : false,
    applicationType: args.applicationType ?? null,
    credentialTypes: args.credentialTypes ?? null,
    uniqueClaimsForSubjectId: args.uniqueClaimsForSubjectId ?? null,
    logo: args.logo ?? null,
    backgroundColor: args.backgroundColor ?? null,
    backgroundImage: args.backgroundImage ?? null,
    policyUrl: args.policyUrl ?? null,
    termsOfServiceUrl: args.termsOfServiceUrl ?? null,
  }
}

@Entity('oidc_client')
export class OidcClientEntity extends AuditedAndTrackedEntity {
  constructor(args?: CreateOrUpdateArgs & Pick<Partial<OidcClientEntity>, 'id'>) {
    super()
    if (args) {
      const { id, ...rest } = args
      typeSafeAssign(this, { id: args.id ?? randomUUID(), ...inflateArgs(rest) })
    }
  }

  @DeleteDateColumn({ type: 'datetimeoffset', nullable: true })
  deletedAt!: Date | null

  @Column({ type: 'nvarchar' })
  name!: string

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'logo' })
  logo!: string | null
  @BeforeInsert()
  @BeforeUpdate()
  private setLogo() {
    this.logo = this.logo?.toString() ?? null
  }

  @Column({ type: 'nvarchar', nullable: true })
  backgroundColor!: string | null

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'background_image' })
  backgroundImage!: string | null
  @BeforeInsert()
  @BeforeUpdate()
  private setBackgroundImage() {
    this.backgroundImage = this.backgroundImage?.toString() ?? null
  }

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'policy_url' })
  policyUrl!: string | null
  @BeforeInsert()
  @BeforeUpdate()
  private setPolicyUrl() {
    this.policyUrl = this.policyUrl?.toString() ?? null
  }

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'terms_of_service_url' })
  termsOfServiceUrl!: string | null
  @BeforeInsert()
  @BeforeUpdate()
  private setTermsOfServiceUrl() {
    this.termsOfServiceUrl = this.termsOfServiceUrl?.toString() ?? null
  }

  @Column({ name: 'application_type', type: 'nvarchar', default: 'web' })
  applicationType!: OidcApplicationType | null
  @BeforeInsert()
  @BeforeUpdate()
  private setApplicationType() {
    invariant(
      this.applicationType === OidcApplicationType.Web || this.applicationType === null,
      'Only web application types are currently supported',
    )
    this.applicationType = this.applicationType ?? OidcApplicationType.Web
  }

  @Column({ type: 'nvarchar', length: 'MAX' })
  private redirectUrisJson!: string

  get redirectUris(): string[] {
    return JSON.parse(this.redirectUrisJson)
  }
  set redirectUris(value: string[]) {
    this.redirectUrisJson = JSON.stringify(value)
  }

  @Column({ type: 'nvarchar', length: 'MAX' })
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
  @Column({ type: 'bit', default: false })
  requireFaceCheck!: boolean

  /**
   * Allow the client to auth using presentations from any partner.
   */
  @Column({ type: 'bit' })
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
   * - This is not needed for authentication using Verified Orchestration credentials, the issuanceId claim is used.
   * - Multiple values can be specified, the first claim that is present in the partner presentation will be used.
   * - The authentication client also can specify the claim to use via the `vc_unique_claim_for_sub` auth request parameter.
   * - If values are defined here and the `vc_unique_claim_for_sub` auth request parameter is provided, it is validated to be from this list.
   */
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
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
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  private credentialTypesJson!: string | null

  get credentialTypes(): string[] | null {
    return this.credentialTypesJson ? JSON.parse(this.credentialTypesJson) : null
  }
  set credentialTypes(types: string[] | null) {
    this.credentialTypesJson = types ? JSON.stringify(types) : null
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

  update(args: CreateOrUpdateArgs) {
    typeSafeAssign(this, inflateArgs(args))
  }
}
