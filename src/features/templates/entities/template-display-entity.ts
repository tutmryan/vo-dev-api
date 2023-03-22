import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import { copyUnsetProps } from '../../../util/copy-props'
import { intersectingProps } from '../../../util/intersecting-props'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { TemplateDisplayClaimEntity } from './template-display-claim-entity'
import { TemplateDisplayConsentEntity } from './template-display-consent-entity'
import { TemplateDisplayCredentialEntity } from './template-display-credential-entity'

@Entity('template_display')
export class TemplateDisplayEntity extends VerifiedOrchestrationEntity {
  constructor(args: {
    locale: string | null
    card: TemplateDisplayCredentialEntity
    consent: TemplateDisplayConsentEntity
    claims: TemplateDisplayClaimEntity[]
  }) {
    super()
    typeSafeAssign(this, args)
  }

  @Column({ type: 'nvarchar', nullable: true })
  locale!: string | null

  @OneToOne(() => TemplateDisplayCredentialEntity, { nullable: false, cascade: true, eager: true })
  @JoinColumn()
  card!: TemplateDisplayCredentialEntity

  @OneToOne(() => TemplateDisplayConsentEntity, { nullable: false, cascade: true, eager: true })
  @JoinColumn()
  consent!: TemplateDisplayConsentEntity

  @OneToMany(() => TemplateDisplayClaimEntity, (x) => x.display, { cascade: true, eager: true })
  claims!: TemplateDisplayClaimEntity[]

  merge(child: TemplateDisplayEntity) {
    copyUnsetProps(this, child, ['locale'])

    this.card.merge(child.card)
    this.consent.merge(child.consent)

    // Override existing claims
    for (const claim of this.claims) {
      const childClaim = child.claims.find((x) => x.claim === claim.claim)
      if (childClaim) {
        copyUnsetProps(claim, childClaim, ['description', 'value'])
      }
    }

    // Add claims only defined at the child level
    const claimIdentifiers = this.claims.map((x) => x.claim)
    for (const childClaim of child.claims.filter((x) => !claimIdentifiers.includes(x.claim))) {
      this.claims.push(childClaim)
    }
  }

  checkOverrides(child: TemplateDisplayEntity): string[] {
    const errors = intersectingProps(this, child, ['locale']) as string[]

    errors.push(...this.consent.checkOverrides(child.consent).map((x) => `consent.${x}`))
    errors.push(...this.card.checkOverrides(child.card).map((x) => `card.${x}`))

    return errors
  }
}
