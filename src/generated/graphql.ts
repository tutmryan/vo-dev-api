/* eslint-disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { TemplateEntity } from '../features/templates/entities/template-entity';
import { GraphQLContext } from '../context';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A field whose value is a hex color code: https://en.wikipedia.org/wiki/Web_colors. */
  HexColorCode: string;
  /** The locale in the format of a BCP 47 (RFC 5646) standard string */
  Locale: string;
  /** Integers that will have a value greater than 0. */
  PositiveInt: number;
  /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
  URL: string;
  /** Represents NULL values */
  Void: null | undefined | void;
};

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

/** Defines a claim included in a verifiable credential */
export type CreateUpdateTemplateDisplayClaimInput = {
  /** The name of the claim to which the label applies */
  claim: Scalars['String'];
  /** The description of the claim */
  description?: InputMaybe<Scalars['String']>;
  /** The label of the claim */
  label: Scalars['String'];
  /**
   * The type of the claim
   * Valid values encountered so far are:
   *   - String
   *   - image/jpg;base64url (in the Verified Employee contract)
   */
  type: Scalars['String'];
  /**
   * The value for the claim
   * If provided, the value is fixed for all credentials referencing this claim
   * If not provided, the value will need to be dynamically provided before the credential is issued
   */
  value?: InputMaybe<Scalars['String']>;
};

/** Supplemental data when the verifiable credential is issued */
export type CreateUpdateTemplateDisplayConsentInput = {
  /** Supplemental text to use when displaying consent */
  instructions?: InputMaybe<Scalars['String']>;
  /** Title of the consent */
  title?: InputMaybe<Scalars['String']>;
};

/**
 * The display properties of the verifiable credential at the template level
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/credential-design#display-definition-wallet-credential-visuals
 */
export type CreateUpdateTemplateDisplayCredentialInput = {
  /** Background color of the credential */
  backgroundColor?: InputMaybe<Scalars['HexColorCode']>;
  /** Supplemental text displayed alongside each credential */
  description?: InputMaybe<Scalars['String']>;
  /** The name of the issuer of the credential */
  issuedBy?: InputMaybe<Scalars['String']>;
  /** Logo information of the credential */
  logo?: InputMaybe<CreateUpdateTemplateDisplayCredentialLogoInput>;
  /** Text color of the credential */
  textColor?: InputMaybe<Scalars['HexColorCode']>;
  /** Title of the credential */
  title?: InputMaybe<Scalars['String']>;
};

/**
 * Defines the logo displayed on the credential
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/rules-and-display-definitions-model#displaycredentiallogo-type
 */
export type CreateUpdateTemplateDisplayCredentialLogoInput = {
  /** The description of the logo */
  description?: InputMaybe<Scalars['String']>;
  /** The base-64 encoded image (optional if url is specified) */
  image?: InputMaybe<Scalars['String']>;
  /** URI of the logo (optional if image is specified) */
  uri?: InputMaybe<Scalars['URL']>;
};

/** Credential display definitions at the template level */
export type CreateUpdateTemplateDisplayModelInput = {
  card?: InputMaybe<CreateUpdateTemplateDisplayCredentialInput>;
  claims?: InputMaybe<Array<CreateUpdateTemplateDisplayClaimInput>>;
  consent?: InputMaybe<CreateUpdateTemplateDisplayConsentInput>;
  locale?: InputMaybe<Scalars['Locale']>;
};

/** Represents an identity that gets issued credentials. */
export type Identity = {
  __typename?: 'Identity';
  /** The unique identifier of the identity in the issuer */
  identifier: Scalars['String'];
  /** The issuer of the identity */
  issuer: Scalars['String'];
  /** The name of the identity */
  name: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createTemplate: Template;
  updateTemplate: Template;
};


export type MutationCreateTemplateArgs = {
  input: TemplateInput;
};


export type MutationUpdateTemplateArgs = {
  id: Scalars['ID'];
  input: TemplateInput;
};

/** A published contract via the Entra Verified ID network */
export type NetworkContract = {
  __typename?: 'NetworkContract';
  /** Claims included in the verifiable credential */
  claims: Array<Scalars['String']>;
  /** The friendly name of this contract */
  name: Scalars['String'];
  /** Types for this contract */
  types: Array<Scalars['String']>;
};

/** An issuer via the Entra Verified ID network */
export type NetworkIssuer = {
  __typename?: 'NetworkIssuer';
  /** The DID for this verifiable credential service instance */
  did: Scalars['ID'];
  /** An autogenerated unique ID, which can be used to retrieve or update the specific instance of the verifiable credential service */
  id: Scalars['ID'];
  /** Indicates that this issuer is trusted (by this organisation) */
  isTrusted?: Maybe<Scalars['Boolean']>;
  /** Domains linked to this DID */
  linkedDomainUrls: Array<Scalars['URL']>;
  /** The friendly name of this instance of the verifiable credential service */
  name: Scalars['String'];
  /** The Azure AD tenant identifier */
  tenantId: Scalars['ID'];
};

/** Criteria used to find issuers from the Entra Verified ID network */
export type NetworkIssuersWhere = {
  /** Only include issuers that are trusted (by this organisation) */
  isTrusted?: InputMaybe<Scalars['Boolean']>;
  linkedDomainUrlsLike?: InputMaybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  /**
   * Finds issuers from the Entra Verified ID network
   * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#searching-for-issuers
   */
  findNetworkIssuers: Array<NetworkIssuer>;
  /** Returns templates, optionally matching the specified criteria */
  findTemplates: Array<Template>;
  /** No-op query to test if the server is up and running. */
  healthcheck?: Maybe<Scalars['Void']>;
  /**
   * Lists the credential contract types for the specified network issuer
   * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#searching-for-published-credential-types-by-an-issuer
   */
  networkContracts: Array<NetworkContract>;
  /** Returns a template by ID */
  template: Template;
};


export type QueryFindNetworkIssuersArgs = {
  where: NetworkIssuersWhere;
};


export type QueryFindTemplatesArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  where?: InputMaybe<TemplateWhere>;
};


export type QueryNetworkContractsArgs = {
  issuerId: Scalars['ID'];
  tenantId: Scalars['ID'];
};


export type QueryTemplateArgs = {
  id: Scalars['ID'];
};

/** Defines a template that can be used as a base for a contract */
export type Template = {
  __typename?: 'Template';
  /** This templates children, if any. */
  children: Array<Template>;
  /** The description of the template */
  description: Scalars['String'];
  /** The full or partial credential display definition defined by this template, if any. */
  display?: Maybe<TemplateDisplayModel>;
  /** The unique identifier for the template */
  id: Scalars['ID'];
  /** Defines whether the contracts created from this template will be published in the Verified Credentials Network */
  isPublic?: Maybe<Scalars['Boolean']>;
  /** The name of the template */
  name: Scalars['String'];
  /**
   * The parent template, if any.
   * The root template has no parent.
   */
  parent?: Maybe<Template>;
  /**
   * The combined representation of this template's parent chain.
   * The root template has no parent.
   */
  parentData?: Maybe<TemplateParentData>;
  /** The lifespan of the credential expressed in seconds */
  validityIntervalInSeconds?: Maybe<Scalars['PositiveInt']>;
};

/** Defines a claim included in a verifiable credential */
export type TemplateDisplayClaim = {
  __typename?: 'TemplateDisplayClaim';
  /** The name of the claim to which the label applies */
  claim: Scalars['String'];
  /** The description of the claim */
  description?: Maybe<Scalars['String']>;
  /** The label of the claim */
  label: Scalars['String'];
  /**
   * The type of the claim
   * Valid values encountered so far are:
   *   - String
   *   - image/jpg;base64url (in the Verified Employee contract)
   */
  type: Scalars['String'];
  /**
   * The value for the claim
   * If provided, the value is fixed for all credentials referencing this claim
   * If not provided, the value will need to be dynamically provided before the credential is issued
   */
  value?: Maybe<Scalars['String']>;
};

/** Supplemental data when the verifiable credential is issued */
export type TemplateDisplayConsent = {
  __typename?: 'TemplateDisplayConsent';
  /** Supplemental text to use when displaying consent */
  instructions?: Maybe<Scalars['String']>;
  /** Title of the consent */
  title?: Maybe<Scalars['String']>;
};

/**
 * The display properties of the verifiable credential at the template level
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/credential-design#display-definition-wallet-credential-visuals
 */
export type TemplateDisplayCredential = {
  __typename?: 'TemplateDisplayCredential';
  /** Background color of the credential */
  backgroundColor?: Maybe<Scalars['HexColorCode']>;
  /** Supplemental text displayed alongside each credential */
  description?: Maybe<Scalars['String']>;
  /** The name of the issuer of the credential */
  issuedBy?: Maybe<Scalars['String']>;
  /** Logo information of the credential */
  logo?: Maybe<TemplateDisplayCredentialLogo>;
  /** Text color of the credential */
  textColor?: Maybe<Scalars['HexColorCode']>;
  /** Title of the credential */
  title?: Maybe<Scalars['String']>;
};

/**
 * Defines the logo displayed on the credential
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/rules-and-display-definitions-model#displaycredentiallogo-type
 */
export type TemplateDisplayCredentialLogo = {
  __typename?: 'TemplateDisplayCredentialLogo';
  /** The description of the logo */
  description?: Maybe<Scalars['String']>;
  /** The base-64 encoded image (optional if url is specified) */
  image?: Maybe<Scalars['String']>;
  /** URI of the logo (optional if image is specified) */
  uri?: Maybe<Scalars['URL']>;
};

/** Credential display definitions at the template level */
export type TemplateDisplayModel = {
  __typename?: 'TemplateDisplayModel';
  card?: Maybe<TemplateDisplayCredential>;
  claims?: Maybe<Array<TemplateDisplayClaim>>;
  consent?: Maybe<TemplateDisplayConsent>;
  locale?: Maybe<Scalars['Locale']>;
};

/** Defines the input to create or update a template */
export type TemplateInput = {
  /** The description of the template */
  description: Scalars['String'];
  /** The full or partial credential display definition defined by this template, if any. */
  display?: InputMaybe<CreateUpdateTemplateDisplayModelInput>;
  /** Defines whether the contracts created from this template will be published in the Verified Credentials Network */
  isPublic?: InputMaybe<Scalars['Boolean']>;
  /** The name of the template */
  name: Scalars['String'];
  /** The ID of the parent template, if any */
  parentTemplateID?: InputMaybe<Scalars['ID']>;
  /** The lifespan of the credential expressed in seconds */
  validityIntervalInSeconds?: InputMaybe<Scalars['PositiveInt']>;
};

/** Represents the combined data of parent templates */
export type TemplateParentData = {
  __typename?: 'TemplateParentData';
  /** The full or partial credential display definition defined by this template, if any. */
  display?: Maybe<TemplateDisplayModel>;
  /** Defines whether the contracts created from this template will be published in the Verified Credentials Network */
  isPublic?: Maybe<Scalars['Boolean']>;
  /** The lifespan of the credential expressed in seconds */
  validityIntervalInSeconds?: Maybe<Scalars['PositiveInt']>;
};

/** Defines the searchable fields usable to find templates */
export type TemplateWhere = {
  /** List only root templates (without a parent) */
  isRoot?: InputMaybe<Scalars['Boolean']>;
  /** The name of the template to match */
  name?: InputMaybe<Scalars['String']>;
};

export type HealthcheckQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthcheckQuery = { __typename?: 'Query', healthcheck?: null | undefined | void | null };

export type TemplateParentDataFragmentFragment = { __typename?: 'Template', parentData?: { __typename?: 'TemplateParentData', isPublic?: boolean | null, validityIntervalInSeconds?: number | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> | null } | null } | null } & { ' $fragmentName'?: 'TemplateParentDataFragmentFragment' };

export type GetTemplateParentDataQueryQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetTemplateParentDataQueryQuery = { __typename?: 'Query', template: (
    { __typename?: 'Template' }
    & { ' $fragmentRefs'?: { 'TemplateParentDataFragmentFragment': TemplateParentDataFragmentFragment } }
  ) };

export type TemplateFragmentFragment = { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null, parent?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> | null } | null } & { ' $fragmentName'?: 'TemplateFragmentFragment' };

export type CreateTemplateMutationVariables = Exact<{
  input: TemplateInput;
}>;


export type CreateTemplateMutation = { __typename?: 'Mutation', createTemplate: (
    { __typename?: 'Template' }
    & { ' $fragmentRefs'?: { 'TemplateFragmentFragment': TemplateFragmentFragment } }
  ) };

export type GetTemplateQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetTemplateQuery = { __typename?: 'Query', template: (
    { __typename?: 'Template' }
    & { ' $fragmentRefs'?: { 'TemplateFragmentFragment': TemplateFragmentFragment } }
  ) };

export type UpdateTemplateMutationVariables = Exact<{
  id: Scalars['ID'];
  input: TemplateInput;
}>;


export type UpdateTemplateMutation = { __typename?: 'Mutation', updateTemplate: (
    { __typename?: 'Template' }
    & { ' $fragmentRefs'?: { 'TemplateFragmentFragment': TemplateFragmentFragment } }
  ) };

export const TemplateParentDataFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateParentDataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]}}]} as unknown as DocumentNode<TemplateParentDataFragmentFragment, unknown>;
export const TemplateFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<TemplateFragmentFragment, unknown>;
export const HealthcheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Healthcheck"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"healthcheck"}}]}}]} as unknown as DocumentNode<HealthcheckQuery, HealthcheckQueryVariables>;
export const GetTemplateParentDataQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTemplateParentDataQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"template"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateParentDataFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateParentDataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]}}]} as unknown as DocumentNode<GetTemplateParentDataQueryQuery, GetTemplateParentDataQueryQueryVariables>;
export const CreateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<CreateTemplateMutation, CreateTemplateMutationVariables>;
export const GetTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"template"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<GetTemplateQuery, GetTemplateQueryVariables>;
export const UpdateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<UpdateTemplateMutation, UpdateTemplateMutationVariables>;


export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  CacheControlScope: CacheControlScope;
  CreateUpdateTemplateDisplayClaimInput: CreateUpdateTemplateDisplayClaimInput;
  String: ResolverTypeWrapper<Scalars['String']>;
  CreateUpdateTemplateDisplayConsentInput: CreateUpdateTemplateDisplayConsentInput;
  CreateUpdateTemplateDisplayCredentialInput: CreateUpdateTemplateDisplayCredentialInput;
  CreateUpdateTemplateDisplayCredentialLogoInput: CreateUpdateTemplateDisplayCredentialLogoInput;
  CreateUpdateTemplateDisplayModelInput: CreateUpdateTemplateDisplayModelInput;
  HexColorCode: ResolverTypeWrapper<Scalars['HexColorCode']>;
  Identity: ResolverTypeWrapper<Identity>;
  Locale: ResolverTypeWrapper<Scalars['Locale']>;
  Mutation: ResolverTypeWrapper<{}>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  NetworkContract: ResolverTypeWrapper<NetworkContract>;
  NetworkIssuer: ResolverTypeWrapper<NetworkIssuer>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  NetworkIssuersWhere: NetworkIssuersWhere;
  PositiveInt: ResolverTypeWrapper<Scalars['PositiveInt']>;
  Query: ResolverTypeWrapper<{}>;
  Template: ResolverTypeWrapper<TemplateEntity>;
  TemplateDisplayClaim: ResolverTypeWrapper<TemplateDisplayClaim>;
  TemplateDisplayConsent: ResolverTypeWrapper<TemplateDisplayConsent>;
  TemplateDisplayCredential: ResolverTypeWrapper<TemplateDisplayCredential>;
  TemplateDisplayCredentialLogo: ResolverTypeWrapper<TemplateDisplayCredentialLogo>;
  TemplateDisplayModel: ResolverTypeWrapper<TemplateDisplayModel>;
  TemplateInput: TemplateInput;
  TemplateParentData: ResolverTypeWrapper<TemplateParentData>;
  TemplateWhere: TemplateWhere;
  URL: ResolverTypeWrapper<Scalars['URL']>;
  Void: ResolverTypeWrapper<Scalars['Void']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  CreateUpdateTemplateDisplayClaimInput: CreateUpdateTemplateDisplayClaimInput;
  String: Scalars['String'];
  CreateUpdateTemplateDisplayConsentInput: CreateUpdateTemplateDisplayConsentInput;
  CreateUpdateTemplateDisplayCredentialInput: CreateUpdateTemplateDisplayCredentialInput;
  CreateUpdateTemplateDisplayCredentialLogoInput: CreateUpdateTemplateDisplayCredentialLogoInput;
  CreateUpdateTemplateDisplayModelInput: CreateUpdateTemplateDisplayModelInput;
  HexColorCode: Scalars['HexColorCode'];
  Identity: Identity;
  Locale: Scalars['Locale'];
  Mutation: {};
  ID: Scalars['ID'];
  NetworkContract: NetworkContract;
  NetworkIssuer: NetworkIssuer;
  Boolean: Scalars['Boolean'];
  NetworkIssuersWhere: NetworkIssuersWhere;
  PositiveInt: Scalars['PositiveInt'];
  Query: {};
  Template: TemplateEntity;
  TemplateDisplayClaim: TemplateDisplayClaim;
  TemplateDisplayConsent: TemplateDisplayConsent;
  TemplateDisplayCredential: TemplateDisplayCredential;
  TemplateDisplayCredentialLogo: TemplateDisplayCredentialLogo;
  TemplateDisplayModel: TemplateDisplayModel;
  TemplateInput: TemplateInput;
  TemplateParentData: TemplateParentData;
  TemplateWhere: TemplateWhere;
  URL: Scalars['URL'];
  Void: Scalars['Void'];
  Int: Scalars['Int'];
  Float: Scalars['Float'];
};

export type CacheControlDirectiveArgs = {
  inheritMaxAge?: Maybe<Scalars['Boolean']>;
  maxAge?: Maybe<Scalars['Int']>;
  scope?: Maybe<CacheControlScope>;
};

export type CacheControlDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = CacheControlDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ConstraintDirectiveArgs = {
  contains?: Maybe<Scalars['String']>;
  endsWith?: Maybe<Scalars['String']>;
  exclusiveMax?: Maybe<Scalars['Float']>;
  exclusiveMin?: Maybe<Scalars['Float']>;
  format?: Maybe<Scalars['String']>;
  max?: Maybe<Scalars['Float']>;
  maxLength?: Maybe<Scalars['Int']>;
  min?: Maybe<Scalars['Float']>;
  minLength?: Maybe<Scalars['Int']>;
  multipleOf?: Maybe<Scalars['Float']>;
  notContains?: Maybe<Scalars['String']>;
  pattern?: Maybe<Scalars['String']>;
  startsWith?: Maybe<Scalars['String']>;
  uniqueTypeName?: Maybe<Scalars['String']>;
};

export type ConstraintDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = ConstraintDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export interface HexColorCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['HexColorCode'], any> {
  name: 'HexColorCode';
}

export type IdentityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Identity'] = ResolversParentTypes['Identity']> = {
  identifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  issuer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface LocaleScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Locale'], any> {
  name: 'Locale';
}

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationCreateTemplateArgs, 'input'>>;
  updateTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationUpdateTemplateArgs, 'id' | 'input'>>;
};

export type NetworkContractResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['NetworkContract'] = ResolversParentTypes['NetworkContract']> = {
  claims?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  types?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NetworkIssuerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['NetworkIssuer'] = ResolversParentTypes['NetworkIssuer']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isTrusted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  linkedDomainUrls?: Resolver<Array<ResolversTypes['URL']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tenantId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface PositiveIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PositiveInt'], any> {
  name: 'PositiveInt';
}

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  findNetworkIssuers?: Resolver<Array<ResolversTypes['NetworkIssuer']>, ParentType, ContextType, RequireFields<QueryFindNetworkIssuersArgs, 'where'>>;
  findTemplates?: Resolver<Array<ResolversTypes['Template']>, ParentType, ContextType, Partial<QueryFindTemplatesArgs>>;
  healthcheck?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType>;
  networkContracts?: Resolver<Array<ResolversTypes['NetworkContract']>, ParentType, ContextType, RequireFields<QueryNetworkContractsArgs, 'issuerId' | 'tenantId'>>;
  template?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<QueryTemplateArgs, 'id'>>;
};

export type TemplateResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Template'] = ResolversParentTypes['Template']> = {
  children?: Resolver<Array<ResolversTypes['Template']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  display?: Resolver<Maybe<ResolversTypes['TemplateDisplayModel']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isPublic?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Template']>, ParentType, ContextType>;
  parentData?: Resolver<Maybe<ResolversTypes['TemplateParentData']>, ParentType, ContextType>;
  validityIntervalInSeconds?: Resolver<Maybe<ResolversTypes['PositiveInt']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateDisplayClaimResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayClaim'] = ResolversParentTypes['TemplateDisplayClaim']> = {
  claim?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateDisplayConsentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayConsent'] = ResolversParentTypes['TemplateDisplayConsent']> = {
  instructions?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateDisplayCredentialResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayCredential'] = ResolversParentTypes['TemplateDisplayCredential']> = {
  backgroundColor?: Resolver<Maybe<ResolversTypes['HexColorCode']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  issuedBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['TemplateDisplayCredentialLogo']>, ParentType, ContextType>;
  textColor?: Resolver<Maybe<ResolversTypes['HexColorCode']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateDisplayCredentialLogoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayCredentialLogo'] = ResolversParentTypes['TemplateDisplayCredentialLogo']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uri?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateDisplayModelResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayModel'] = ResolversParentTypes['TemplateDisplayModel']> = {
  card?: Resolver<Maybe<ResolversTypes['TemplateDisplayCredential']>, ParentType, ContextType>;
  claims?: Resolver<Maybe<Array<ResolversTypes['TemplateDisplayClaim']>>, ParentType, ContextType>;
  consent?: Resolver<Maybe<ResolversTypes['TemplateDisplayConsent']>, ParentType, ContextType>;
  locale?: Resolver<Maybe<ResolversTypes['Locale']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateParentDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateParentData'] = ResolversParentTypes['TemplateParentData']> = {
  display?: Resolver<Maybe<ResolversTypes['TemplateDisplayModel']>, ParentType, ContextType>;
  isPublic?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  validityIntervalInSeconds?: Resolver<Maybe<ResolversTypes['PositiveInt']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['URL'], any> {
  name: 'URL';
}

export interface VoidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Void'], any> {
  name: 'Void';
}

export type Resolvers<ContextType = GraphQLContext> = {
  HexColorCode?: GraphQLScalarType;
  Identity?: IdentityResolvers<ContextType>;
  Locale?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  NetworkContract?: NetworkContractResolvers<ContextType>;
  NetworkIssuer?: NetworkIssuerResolvers<ContextType>;
  PositiveInt?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  Template?: TemplateResolvers<ContextType>;
  TemplateDisplayClaim?: TemplateDisplayClaimResolvers<ContextType>;
  TemplateDisplayConsent?: TemplateDisplayConsentResolvers<ContextType>;
  TemplateDisplayCredential?: TemplateDisplayCredentialResolvers<ContextType>;
  TemplateDisplayCredentialLogo?: TemplateDisplayCredentialLogoResolvers<ContextType>;
  TemplateDisplayModel?: TemplateDisplayModelResolvers<ContextType>;
  TemplateParentData?: TemplateParentDataResolvers<ContextType>;
  URL?: GraphQLScalarType;
  Void?: GraphQLScalarType;
};

export type DirectiveResolvers<ContextType = GraphQLContext> = {
  cacheControl?: CacheControlDirectiveResolver<any, any, ContextType>;
  constraint?: ConstraintDirectiveResolver<any, any, ContextType>;
};
