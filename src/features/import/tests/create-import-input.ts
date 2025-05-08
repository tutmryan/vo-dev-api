import type { DeepPartial } from 'typeorm'
import type {
  ClaimType,
  ClaimValidation,
  ClaimValidationInput,
  Contract,
  ContractDisplayClaim,
  ContractDisplayClaimInput,
  ContractDisplayModel,
  ContractDisplayModelInput,
  ContractImportInput,
  CreateUpdateTemplateDisplayClaimInput,
  CreateUpdateTemplateDisplayModelInput,
  FaceCheckPhotoSupport,
  ImportInput,
  ListValidationInput,
  NumberValidationInput,
  RegexValidationInput,
  Template,
  TemplateDisplayClaim,
  TemplateDisplayModel,
  TemplateImportInput,
  TextValidationInput,
} from '../../../generated/graphql'

const validPngImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII='

const parentTemplate: DeepPartial<Template> = {
  id: '29cd25c2-413d-4c5c-b674-414085c11775',
  name: 'Fairway Credentials',
  credentialTypes: ['GolfScoreCard'],
  display: {
    locale: null,
    card: {
      title: 'Golf Scorecard',
      issuedBy: 'Fairway Credentials',
      backgroundColor: '#b0d7ac',
      textColor: '#126009',
      description: 'A secure and verified digital scorecard for golf tournaments, showcasing player performance and scores.',
      logo: {
        image: validPngImage,
        description: 'some logo description',
        __typename: 'TemplateDisplayCredentialLogo',
      },
      __typename: 'TemplateDisplayCredential',
    },
    consent: {
      title: 'Add Your Golf Scorecard to Your Wallet',
      instructions:
        'Review your golf tournament scorecard and details. If the information is correct, click ‘Add to Wallet’ to save this verified credential securely in your digital wallet.',
      __typename: 'TemplateDisplayConsent',
    },
    claims: [],
    __typename: 'TemplateDisplayModel',
  },
  isPublic: null,
  validityIntervalInSeconds: 315360000,
  faceCheckSupport: null,
  parent: null,
  children: [
    {
      id: '56987bfb-9f5f-4773-bb15-fd6ee96d91bb',
      name: '4 hole format',
    },
  ],
  __typename: 'Template',
  contracts: [],
}

const childTemplate: DeepPartial<Template> = {
  id: '56987bfb-9f5f-4773-bb15-fd6ee96d91bb',
  name: '4 hole format',
  credentialTypes: null,
  display: {
    locale: null,
    card: null,
    consent: null,
    claims: [
      {
        label: 'Hole 1',
        claim: 'hole_1',
        type: 'number' as ClaimType,
        description: 'Hole 1',
        value: '1',
        isOptional: false,
        isFixed: null,
        validation: {
          __typename: 'NumberValidation',
          min: 1,
          max: null,
          precision: 0,
        },
        __typename: 'TemplateDisplayClaim',
      },
      {
        label: 'Hole 2',
        claim: 'hole_2',
        type: 'number' as ClaimType,
        description: 'Hole 2',
        value: '1',
        isOptional: false,
        isFixed: null,
        validation: {
          __typename: 'NumberValidation',
          min: 1,
          max: null,
          precision: 0,
        },
        __typename: 'TemplateDisplayClaim',
      },
      {
        label: 'Hole 3',
        claim: 'hole_3',
        type: 'number' as ClaimType,
        description: 'Hole 3',
        value: '1',
        isOptional: false,
        isFixed: null,
        validation: {
          __typename: 'NumberValidation',
          min: 1,
          max: null,
          precision: 0,
        },
        __typename: 'TemplateDisplayClaim',
      },
      {
        label: 'Hole 4',
        claim: 'hole_4',
        type: 'number' as ClaimType,
        description: 'Hole 4',
        value: '1',
        isOptional: false,
        isFixed: null,
        validation: {
          __typename: 'NumberValidation',
          min: 0,
          max: null,
          precision: 1,
        },
        __typename: 'TemplateDisplayClaim',
      },
      {
        label: 'email',
        claim: 'email',
        type: 'email' as ClaimType,
        description: 'email',
        value: 'test@email.com',
        isOptional: false,
        isFixed: true,
        validation: null,
        __typename: 'TemplateDisplayClaim',
      },
      {
        label: 'Hole 5',
        claim: 'hole_5',
        type: 'number' as ClaimType,
        description: 'Hole 5',
        value: '1',
        isOptional: true,
        isFixed: false,
        validation: {
          __typename: 'NumberValidation',
          min: 1,
          max: null,
          precision: 0,
        },
        __typename: 'TemplateDisplayClaim',
      },
    ],
    __typename: 'TemplateDisplayModel',
  },
  isPublic: null,
  validityIntervalInSeconds: null,
  faceCheckSupport: null,
  parent: {
    id: '29cd25c2-413d-4c5c-b674-414085c11775',
    __typename: 'Template',
  },
  __typename: 'Template',
}

function mapTemplatesToTemplateImportInputs(templates: DeepPartial<Template>[]): TemplateImportInput[] {
  return templates.map((template) => ({
    id: template.id!,
    templateInput: {
      name: template.name!,
      parentTemplateId: template.parent?.id,
      display: mapTemplateDisplayToInput(template.display as TemplateDisplayModel),
      isPublic: template.isPublic ?? null,
      validityIntervalInSeconds: template.validityIntervalInSeconds!,
      credentialTypes: template.credentialTypes! as string[],
      faceCheckSupport: template.faceCheckSupport,
    },
  }))
}

function mapTemplateDisplayToInput(display: TemplateDisplayModel): CreateUpdateTemplateDisplayModelInput {
  return {
    locale: display.locale ?? undefined,
    card: display.card
      ? {
          title: display.card.title ?? undefined,
          description: display.card.description ?? undefined,
          backgroundColor: display.card.backgroundColor ?? undefined,
          textColor: display.card.textColor ?? undefined,
          issuedBy: display.card.issuedBy ?? undefined,
          logo: display.card.logo
            ? {
                image: display.card.logo.image,
                description: display.card.logo.description ?? undefined,
              }
            : undefined,
        }
      : undefined,
    consent: display.consent
      ? {
          title: display.consent.title ?? undefined,
          instructions: display.consent.instructions ?? undefined,
        }
      : undefined,
    claims: display.claims?.map(mapTemplateClaimToInput) ?? [],
  }
}

function mapTemplateClaimToInput(claim: TemplateDisplayClaim): CreateUpdateTemplateDisplayClaimInput {
  const base = {
    claim: claim.claim,
    label: claim.label,
    type: claim.type,
    description: claim.description ?? undefined,
    value: claim.value ?? undefined,
    isOptional: claim.isOptional ?? undefined,
    isFixed: claim.isFixed ?? undefined,
  }

  if (claim.validation != null) {
    return {
      ...base,
      validation: mapClaimValidationToInput(claim.validation, claim.type),
    }
  }

  return base
}

function mapClaimValidationToInput(validation: ClaimValidation, type: ClaimType): ClaimValidationInput {
  const { __typename, ...rest } = validation as ClaimValidation

  switch (type) {
    case 'list':
      return { list: rest as ListValidationInput }
    case 'number':
      return { number: rest as NumberValidationInput }
    case 'regex':
      return { regex: rest as RegexValidationInput }
    case 'text':
      return { text: rest as TextValidationInput }
    default:
      throw new Error(`Unsupported claim type: ${type}`)
  }
}

const contract: DeepPartial<Contract> = {
  id: '5989d45e-22bc-49b8-9074-5fa545f2db1c',
  name: 'Mini Masters test 20244',
  credentialTypes: ['GolfScoreCard'],
  display: {
    locale: 'en-AU',
    card: {
      title: 'Golf Scorecard',
      issuedBy: 'Fairway Credentials',
      backgroundColor: '#b0d7ac',
      textColor: '#126009',
      description: 'A secure and verified digital scorecard for golf tournaments, showcasing player performance and scores.',
      logo: {
        image: validPngImage,
        description: 'some logo description',
        __typename: 'ContractDisplayCredentialLogo',
      },
      __typename: 'ContractDisplayCredential',
    },
    consent: {
      title: 'Add Your Golf Scorecard to Your Wallet',
      instructions:
        'Review your golf tournament scorecard and details. If the information is correct, click ‘Add to Wallet’ to save this verified credential securely in your digital wallet.',
      __typename: 'ContractDisplayConsent',
    },
    claims: [
      {
        label: 'Hole 1',
        claim: 'hole_1',
        type: 'number' as ClaimType,
        description: 'Hole 1',
        value: '1',
        isOptional: false,
        isFixed: null,
        validation: {
          __typename: 'NumberValidation',
          min: 1,
          max: null,
          precision: 0,
        },
        __typename: 'ContractDisplayClaim',
      },
      {
        label: 'Hole 2',
        claim: 'hole_2',
        type: 'number' as ClaimType,
        description: 'Hole 2',
        value: '1',
        isOptional: false,
        isFixed: null,
        validation: {
          __typename: 'NumberValidation',
          min: 1,
          max: null,
          precision: 0,
        },
        __typename: 'ContractDisplayClaim',
      },
      {
        label: 'Hole 3',
        claim: 'hole_3',
        type: 'number' as ClaimType,
        description: 'Hole 3',
        value: '1',
        isOptional: false,
        isFixed: null,
        validation: {
          __typename: 'NumberValidation',
          min: 1,
          max: null,
          precision: 0,
        },
        __typename: 'ContractDisplayClaim',
      },
      {
        label: 'Hole 4',
        claim: 'hole_4',
        type: 'number' as ClaimType,
        description: 'Hole 4',
        value: '1',
        isOptional: false,
        isFixed: null,
        validation: {
          __typename: 'NumberValidation',
          min: 0,
          max: null,
          precision: 1,
        },
        __typename: 'ContractDisplayClaim',
      },
      {
        label: 'email',
        claim: 'email',
        type: 'email' as ClaimType,
        description: 'email',
        value: 'test@email.com',
        isOptional: false,
        isFixed: true,
        validation: null,
        __typename: 'ContractDisplayClaim',
      },
      {
        label: 'Hole 5',
        claim: 'hole_5',
        type: 'number' as ClaimType,
        description: 'Hole 5',
        value: '1',
        isOptional: true,
        isFixed: false,
        validation: {
          __typename: 'NumberValidation',
          min: 1,
          max: null,
          precision: 0,
        },
        __typename: 'ContractDisplayClaim',
      },
    ],
    __typename: 'ContractDisplayModel',
  },
  isPublic: true,
  validityIntervalInSeconds: 315360000,
  faceCheckSupport: 'none' as FaceCheckPhotoSupport,
  template: {
    id: '56987bfb-9f5f-4773-bb15-fd6ee96d91bb',
    __typename: 'Template',
  },

  __typename: 'Contract',
}

function mapContractsToContractImportInputs(contracts: DeepPartial<Contract>[]): ContractImportInput[] {
  return contracts.map((contract) => ({
    id: contract.id!,
    contractInput: {
      name: contract.name!,
      templateId: contract.template?.id,
      display: mapContractDisplayToInput(contract.display as ContractDisplayModel),
      isPublic: contract.isPublic ?? false,
      validityIntervalInSeconds: contract.validityIntervalInSeconds!,
      credentialTypes: contract.credentialTypes! as string[],
      faceCheckSupport: contract.faceCheckSupport,
    },
  }))
}

function mapContractDisplayToInput(display: ContractDisplayModel): ContractDisplayModelInput {
  return {
    locale: display.locale,
    card: {
      title: display.card.title,
      description: display.card.description,
      backgroundColor: display.card.backgroundColor,
      textColor: display.card.textColor,
      issuedBy: display.card.issuedBy,
      logo: {
        image: display.card.logo.image,
        description: display.card.logo.description,
      },
    },
    consent: {
      title: display.consent.title,
      instructions: display.consent.instructions,
    },
    claims: display.claims.map(mapClaimToInput),
  }
}

function mapClaimToInput(claim: ContractDisplayClaim): ContractDisplayClaimInput {
  const base = {
    claim: claim.claim,
    label: claim.label,
    type: claim.type,
    value: claim.value,
  }

  if (claim.validation != null) {
    return {
      ...base,
      validation: mapClaimValidationToInput(claim.validation, claim.type),
    }
  }
  return base
}

export function createImportInput(): ImportInput {
  return {
    contracts: mapContractsToContractImportInputs([contract]),
    templates: mapTemplatesToTemplateImportInputs([parentTemplate, childTemplate]),
  }
}

export function createInvalidOrderImportInput(): ImportInput {
  return {
    contracts: mapContractsToContractImportInputs([contract]),
    templates: mapTemplatesToTemplateImportInputs([childTemplate, parentTemplate]),
  }
}

export function createMissingParentImportInput(): ImportInput {
  return {
    contracts: mapContractsToContractImportInputs([contract]),
    templates: mapTemplatesToTemplateImportInputs([childTemplate]),
  }
}
