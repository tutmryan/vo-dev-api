export type Contract = {
  id: string
  name: string
  status: string
  manifestUrl: string
  availableInVcDirectory: boolean
  rules: ContractRules
  displays: ContractDisplay[]
}

export type CreateContractInput = Omit<Contract, 'id' | 'status' | 'manifestUrl'>
export type UpdateContractInput = Omit<CreateContractInput, 'name'>

type ContractRules = {
  attestations: ContractRulesAttestations
  validityInterval: number
  vc: {
    type: string[]
  }
}

type ContractRulesAttestations = {
  idTokenHints: IdTokenHintAttestation[]
}

type IdTokenHintAttestation = {
  mapping: AttestationClaimMapping[]
  required: boolean
  trustedIssuers?: string[]
}

export type AttestationClaimMapping = {
  inputClaim: string
  outputClaim: string
  indexed: boolean
  required: boolean
  type: string
}

type ContractDisplay = {
  locale: string
  card: DisplayCard
  consent: DisplayConsent
  claims: DisplayClaim[]
}

type DisplayCard = {
  title: string
  issuedBy: string
  backgroundColor: string
  textColor: string
  description: string
  logo: DisplayCredentialLogo
}

type DisplayCredentialLogo = {
  uri?: string | null
  description: string
}

type DisplayConsent = {
  title?: string | null
  instructions?: string | null
}

export type DisplayClaim = {
  label: string
  claim: string
  type: string
  description?: string | null
}

export type Credential = {
  id: string
  status: string
  issuedAt: number
}
