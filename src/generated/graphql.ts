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
  /** Banking account number is a string of 5 to 17 alphanumeric values for representing an generic account number */
  AccountNumber: unknown;
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: unknown;
  /** The `Byte` scalar type represents byte value as a Buffer */
  Byte: unknown;
  /** A country code as defined by ISO 3166-1 alpha-2 */
  CountryCode: unknown;
  /** A field whose value conforms to the standard cuid format as specified in https://github.com/ericelliott/cuid#broken-down */
  Cuid: unknown;
  /** A field whose value is a Currency: https://en.wikipedia.org/wiki/ISO_4217. */
  Currency: unknown;
  /** A field whose value conforms to the standard DID format as specified in did-core: https://www.w3.org/TR/did-core/. */
  DID: unknown;
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: unknown;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: Date;
  /**
   * A string representing a duration conforming to the ISO8601 standard,
   * such as: P1W1DT13H23M34S
   * P is the duration designator (for period) placed at the start of the duration representation.
   * Y is the year designator that follows the value for the number of years.
   * M is the month designator that follows the value for the number of months.
   * W is the week designator that follows the value for the number of weeks.
   * D is the day designator that follows the value for the number of days.
   * T is the time designator that precedes the time components of the representation.
   * H is the hour designator that follows the value for the number of hours.
   * M is the minute designator that follows the value for the number of minutes.
   * S is the second designator that follows the value for the number of seconds.
   *
   * Note the time designator, T, that precedes the time value.
   *
   * Matches moment.js, Luxon and DateFns implementations
   * ,/. is valid for decimal places and +/- is a valid prefix
   */
  Duration: unknown;
  /** A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/. */
  EmailAddress: string;
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  GUID: unknown;
  /** A field whose value is a CSS HSL color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#hsl()_and_hsla(). */
  HSL: unknown;
  /** A field whose value is a CSS HSLA color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#hsl()_and_hsla(). */
  HSLA: unknown;
  /** A field whose value is a hex color code: https://en.wikipedia.org/wiki/Web_colors. */
  HexColorCode: string;
  /** A field whose value is a hexadecimal: https://en.wikipedia.org/wiki/Hexadecimal. */
  Hexadecimal: unknown;
  /** A field whose value is an International Bank Account Number (IBAN): https://en.wikipedia.org/wiki/International_Bank_Account_Number. */
  IBAN: unknown;
  /** A field whose value is either an IPv4 or IPv6 address: https://en.wikipedia.org/wiki/IP_address. */
  IP: unknown;
  /** A field whose value is a IPv4 address: https://en.wikipedia.org/wiki/IPv4. */
  IPv4: unknown;
  /** A field whose value is a IPv6 address: https://en.wikipedia.org/wiki/IPv6. */
  IPv6: unknown;
  /** A field whose value is a ISBN-10 or ISBN-13 number: https://en.wikipedia.org/wiki/International_Standard_Book_Number. */
  ISBN: unknown;
  /**
   * A string representing a duration conforming to the ISO8601 standard,
   * such as: P1W1DT13H23M34S
   * P is the duration designator (for period) placed at the start of the duration representation.
   * Y is the year designator that follows the value for the number of years.
   * M is the month designator that follows the value for the number of months.
   * W is the week designator that follows the value for the number of weeks.
   * D is the day designator that follows the value for the number of days.
   * T is the time designator that precedes the time components of the representation.
   * H is the hour designator that follows the value for the number of hours.
   * M is the minute designator that follows the value for the number of minutes.
   * S is the second designator that follows the value for the number of seconds.
   *
   * Note the time designator, T, that precedes the time value.
   *
   * Matches moment.js, Luxon and DateFns implementations
   * ,/. is valid for decimal places and +/- is a valid prefix
   */
  ISO8601Duration: unknown;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: unknown;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: unknown;
  /** A field whose value is a JSON Web Token (JWT): https://jwt.io/introduction. */
  JWT: unknown;
  /** A field whose value is a valid decimal degrees latitude number (53.471): https://en.wikipedia.org/wiki/Latitude */
  Latitude: unknown;
  /** A local date string (i.e., with no associated timezone) in `YYYY-MM-DD` format, e.g. `2020-01-01`. */
  LocalDate: string;
  /** A local time string (i.e., with no associated timezone) in 24-hr `HH:mm[:ss[.SSS]]` format, e.g. `14:25` or `14:25:06` or `14:25:06.123`.  This scalar is very similar to the `LocalTime`, with the only difference being that `LocalEndTime` also allows `24:00` as a valid value to indicate midnight of the following day.  This is useful when using the scalar to represent the exclusive upper bound of a time block. */
  LocalEndTime: unknown;
  /** A local time string (i.e., with no associated timezone) in 24-hr `HH:mm[:ss[.SSS]]` format, e.g. `14:25` or `14:25:06` or `14:25:06.123`. */
  LocalTime: unknown;
  /** The locale in the format of a BCP 47 (RFC 5646) standard string */
  Locale: string;
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  Long: unknown;
  /** A field whose value is a valid decimal degrees longitude number (53.471): https://en.wikipedia.org/wiki/Longitude */
  Longitude: unknown;
  /** A field whose value is a IEEE 802 48-bit MAC address: https://en.wikipedia.org/wiki/MAC_address. */
  MAC: unknown;
  /** Floats that will have a value less than 0. */
  NegativeFloat: unknown;
  /** Integers that will have a value less than 0. */
  NegativeInt: unknown;
  /** A string that cannot be passed as an empty value */
  NonEmptyString: unknown;
  /** Floats that will have a value of 0 or more. */
  NonNegativeFloat: unknown;
  /** Integers that will have a value of 0 or more. */
  NonNegativeInt: unknown;
  /** Floats that will have a value of 0 or less. */
  NonPositiveFloat: unknown;
  /** Integers that will have a value of 0 or less. */
  NonPositiveInt: unknown;
  /** A field whose value conforms with the standard mongodb object ID as described here: https://docs.mongodb.com/manual/reference/method/ObjectId/#ObjectId. Example: 5e5677d71bdc2ae76344968c */
  ObjectID: unknown;
  /** A field whose value conforms to the standard E.164 format as specified in: https://en.wikipedia.org/wiki/E.164. Basically this is +17895551234. */
  PhoneNumber: unknown;
  /** A field whose value is a valid TCP port within the range of 0 to 65535: https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_ports */
  Port: unknown;
  /** Floats that will have a value greater than 0. */
  PositiveFloat: number;
  /** Integers that will have a value greater than 0. */
  PositiveInt: number;
  /** A field whose value conforms to the standard postal code formats for United States, United Kingdom, Germany, Canada, France, Italy, Australia, Netherlands, Spain, Denmark, Sweden, Belgium, India, Austria, Portugal, Switzerland or Luxembourg. */
  PostalCode: unknown;
  /** A field whose value is a CSS RGB color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb()_and_rgba(). */
  RGB: unknown;
  /** A field whose value is a CSS RGBA color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb()_and_rgba(). */
  RGBA: unknown;
  /** In the US, an ABA routing transit number (`ABA RTN`) is a nine-digit code to identify the financial institution. */
  RoutingNumber: unknown;
  /** The `SafeInt` scalar type represents non-fractional signed whole numeric values that are considered safe as defined by the ECMAScript specification. */
  SafeInt: unknown;
  /** A field whose value is a Semantic Version: https://semver.org */
  SemVer: unknown;
  /** A time string at UTC, such as 10:15:30Z, compliant with the `full-time` format outlined in section 5.6 of the RFC 3339profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Time: unknown;
  /** A field whose value exists in the standard IANA Time Zone Database: https://www.iana.org/time-zones */
  TimeZone: unknown;
  /** The javascript `Date` as integer. Type represents date and time as number of milliseconds from start of UNIX epoch. */
  Timestamp: unknown;
  /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
  URL: string;
  /** A currency string, such as $21.25 */
  USCurrency: unknown;
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: unknown;
  /** Floats that will have a value of 0 or more. */
  UnsignedFloat: unknown;
  /** Integers that will have a value of 0 or more. */
  UnsignedInt: unknown;
  /** A field whose value is a UTC Offset: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones */
  UtcOffset: unknown;
  /** Represents NULL values */
  Void: unknown;
  /** A field whose value matches /^\d{4}$/. */
  Year: unknown;
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
  /** The name of the template to match */
  name: Scalars['String'];
};

export type HealthcheckQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthcheckQuery = { __typename?: 'Query', healthcheck?: unknown | null };

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
export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

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
export type ResolversTypes = ResolversObject<{
  AccountNumber: ResolverTypeWrapper<Scalars['AccountNumber']>;
  BigInt: ResolverTypeWrapper<Scalars['BigInt']>;
  Byte: ResolverTypeWrapper<Scalars['Byte']>;
  CacheControlScope: CacheControlScope;
  CountryCode: ResolverTypeWrapper<Scalars['CountryCode']>;
  CreateUpdateTemplateDisplayClaimInput: CreateUpdateTemplateDisplayClaimInput;
  String: ResolverTypeWrapper<Scalars['String']>;
  CreateUpdateTemplateDisplayConsentInput: CreateUpdateTemplateDisplayConsentInput;
  CreateUpdateTemplateDisplayCredentialInput: CreateUpdateTemplateDisplayCredentialInput;
  CreateUpdateTemplateDisplayCredentialLogoInput: CreateUpdateTemplateDisplayCredentialLogoInput;
  CreateUpdateTemplateDisplayModelInput: CreateUpdateTemplateDisplayModelInput;
  Cuid: ResolverTypeWrapper<Scalars['Cuid']>;
  Currency: ResolverTypeWrapper<Scalars['Currency']>;
  DID: ResolverTypeWrapper<Scalars['DID']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>;
  Duration: ResolverTypeWrapper<Scalars['Duration']>;
  EmailAddress: ResolverTypeWrapper<Scalars['EmailAddress']>;
  GUID: ResolverTypeWrapper<Scalars['GUID']>;
  HSL: ResolverTypeWrapper<Scalars['HSL']>;
  HSLA: ResolverTypeWrapper<Scalars['HSLA']>;
  HexColorCode: ResolverTypeWrapper<Scalars['HexColorCode']>;
  Hexadecimal: ResolverTypeWrapper<Scalars['Hexadecimal']>;
  IBAN: ResolverTypeWrapper<Scalars['IBAN']>;
  IP: ResolverTypeWrapper<Scalars['IP']>;
  IPv4: ResolverTypeWrapper<Scalars['IPv4']>;
  IPv6: ResolverTypeWrapper<Scalars['IPv6']>;
  ISBN: ResolverTypeWrapper<Scalars['ISBN']>;
  ISO8601Duration: ResolverTypeWrapper<Scalars['ISO8601Duration']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']>;
  JSONObject: ResolverTypeWrapper<Scalars['JSONObject']>;
  JWT: ResolverTypeWrapper<Scalars['JWT']>;
  Latitude: ResolverTypeWrapper<Scalars['Latitude']>;
  LocalDate: ResolverTypeWrapper<Scalars['LocalDate']>;
  LocalEndTime: ResolverTypeWrapper<Scalars['LocalEndTime']>;
  LocalTime: ResolverTypeWrapper<Scalars['LocalTime']>;
  Locale: ResolverTypeWrapper<Scalars['Locale']>;
  Long: ResolverTypeWrapper<Scalars['Long']>;
  Longitude: ResolverTypeWrapper<Scalars['Longitude']>;
  MAC: ResolverTypeWrapper<Scalars['MAC']>;
  Mutation: ResolverTypeWrapper<{}>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  NegativeFloat: ResolverTypeWrapper<Scalars['NegativeFloat']>;
  NegativeInt: ResolverTypeWrapper<Scalars['NegativeInt']>;
  NetworkContract: ResolverTypeWrapper<NetworkContract>;
  NetworkIssuer: ResolverTypeWrapper<NetworkIssuer>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  NetworkIssuersWhere: NetworkIssuersWhere;
  NonEmptyString: ResolverTypeWrapper<Scalars['NonEmptyString']>;
  NonNegativeFloat: ResolverTypeWrapper<Scalars['NonNegativeFloat']>;
  NonNegativeInt: ResolverTypeWrapper<Scalars['NonNegativeInt']>;
  NonPositiveFloat: ResolverTypeWrapper<Scalars['NonPositiveFloat']>;
  NonPositiveInt: ResolverTypeWrapper<Scalars['NonPositiveInt']>;
  ObjectID: ResolverTypeWrapper<Scalars['ObjectID']>;
  PhoneNumber: ResolverTypeWrapper<Scalars['PhoneNumber']>;
  Port: ResolverTypeWrapper<Scalars['Port']>;
  PositiveFloat: ResolverTypeWrapper<Scalars['PositiveFloat']>;
  PositiveInt: ResolverTypeWrapper<Scalars['PositiveInt']>;
  PostalCode: ResolverTypeWrapper<Scalars['PostalCode']>;
  Query: ResolverTypeWrapper<{}>;
  RGB: ResolverTypeWrapper<Scalars['RGB']>;
  RGBA: ResolverTypeWrapper<Scalars['RGBA']>;
  RoutingNumber: ResolverTypeWrapper<Scalars['RoutingNumber']>;
  SafeInt: ResolverTypeWrapper<Scalars['SafeInt']>;
  SemVer: ResolverTypeWrapper<Scalars['SemVer']>;
  Template: ResolverTypeWrapper<TemplateEntity>;
  TemplateDisplayClaim: ResolverTypeWrapper<TemplateDisplayClaim>;
  TemplateDisplayConsent: ResolverTypeWrapper<TemplateDisplayConsent>;
  TemplateDisplayCredential: ResolverTypeWrapper<TemplateDisplayCredential>;
  TemplateDisplayCredentialLogo: ResolverTypeWrapper<TemplateDisplayCredentialLogo>;
  TemplateDisplayModel: ResolverTypeWrapper<TemplateDisplayModel>;
  TemplateInput: TemplateInput;
  TemplateParentData: ResolverTypeWrapper<TemplateParentData>;
  TemplateWhere: TemplateWhere;
  Time: ResolverTypeWrapper<Scalars['Time']>;
  TimeZone: ResolverTypeWrapper<Scalars['TimeZone']>;
  Timestamp: ResolverTypeWrapper<Scalars['Timestamp']>;
  URL: ResolverTypeWrapper<Scalars['URL']>;
  USCurrency: ResolverTypeWrapper<Scalars['USCurrency']>;
  UUID: ResolverTypeWrapper<Scalars['UUID']>;
  UnsignedFloat: ResolverTypeWrapper<Scalars['UnsignedFloat']>;
  UnsignedInt: ResolverTypeWrapper<Scalars['UnsignedInt']>;
  UtcOffset: ResolverTypeWrapper<Scalars['UtcOffset']>;
  Void: ResolverTypeWrapper<Scalars['Void']>;
  Year: ResolverTypeWrapper<Scalars['Year']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AccountNumber: Scalars['AccountNumber'];
  BigInt: Scalars['BigInt'];
  Byte: Scalars['Byte'];
  CountryCode: Scalars['CountryCode'];
  CreateUpdateTemplateDisplayClaimInput: CreateUpdateTemplateDisplayClaimInput;
  String: Scalars['String'];
  CreateUpdateTemplateDisplayConsentInput: CreateUpdateTemplateDisplayConsentInput;
  CreateUpdateTemplateDisplayCredentialInput: CreateUpdateTemplateDisplayCredentialInput;
  CreateUpdateTemplateDisplayCredentialLogoInput: CreateUpdateTemplateDisplayCredentialLogoInput;
  CreateUpdateTemplateDisplayModelInput: CreateUpdateTemplateDisplayModelInput;
  Cuid: Scalars['Cuid'];
  Currency: Scalars['Currency'];
  DID: Scalars['DID'];
  Date: Scalars['Date'];
  DateTime: Scalars['DateTime'];
  Duration: Scalars['Duration'];
  EmailAddress: Scalars['EmailAddress'];
  GUID: Scalars['GUID'];
  HSL: Scalars['HSL'];
  HSLA: Scalars['HSLA'];
  HexColorCode: Scalars['HexColorCode'];
  Hexadecimal: Scalars['Hexadecimal'];
  IBAN: Scalars['IBAN'];
  IP: Scalars['IP'];
  IPv4: Scalars['IPv4'];
  IPv6: Scalars['IPv6'];
  ISBN: Scalars['ISBN'];
  ISO8601Duration: Scalars['ISO8601Duration'];
  JSON: Scalars['JSON'];
  JSONObject: Scalars['JSONObject'];
  JWT: Scalars['JWT'];
  Latitude: Scalars['Latitude'];
  LocalDate: Scalars['LocalDate'];
  LocalEndTime: Scalars['LocalEndTime'];
  LocalTime: Scalars['LocalTime'];
  Locale: Scalars['Locale'];
  Long: Scalars['Long'];
  Longitude: Scalars['Longitude'];
  MAC: Scalars['MAC'];
  Mutation: {};
  ID: Scalars['ID'];
  NegativeFloat: Scalars['NegativeFloat'];
  NegativeInt: Scalars['NegativeInt'];
  NetworkContract: NetworkContract;
  NetworkIssuer: NetworkIssuer;
  Boolean: Scalars['Boolean'];
  NetworkIssuersWhere: NetworkIssuersWhere;
  NonEmptyString: Scalars['NonEmptyString'];
  NonNegativeFloat: Scalars['NonNegativeFloat'];
  NonNegativeInt: Scalars['NonNegativeInt'];
  NonPositiveFloat: Scalars['NonPositiveFloat'];
  NonPositiveInt: Scalars['NonPositiveInt'];
  ObjectID: Scalars['ObjectID'];
  PhoneNumber: Scalars['PhoneNumber'];
  Port: Scalars['Port'];
  PositiveFloat: Scalars['PositiveFloat'];
  PositiveInt: Scalars['PositiveInt'];
  PostalCode: Scalars['PostalCode'];
  Query: {};
  RGB: Scalars['RGB'];
  RGBA: Scalars['RGBA'];
  RoutingNumber: Scalars['RoutingNumber'];
  SafeInt: Scalars['SafeInt'];
  SemVer: Scalars['SemVer'];
  Template: TemplateEntity;
  TemplateDisplayClaim: TemplateDisplayClaim;
  TemplateDisplayConsent: TemplateDisplayConsent;
  TemplateDisplayCredential: TemplateDisplayCredential;
  TemplateDisplayCredentialLogo: TemplateDisplayCredentialLogo;
  TemplateDisplayModel: TemplateDisplayModel;
  TemplateInput: TemplateInput;
  TemplateParentData: TemplateParentData;
  TemplateWhere: TemplateWhere;
  Time: Scalars['Time'];
  TimeZone: Scalars['TimeZone'];
  Timestamp: Scalars['Timestamp'];
  URL: Scalars['URL'];
  USCurrency: Scalars['USCurrency'];
  UUID: Scalars['UUID'];
  UnsignedFloat: Scalars['UnsignedFloat'];
  UnsignedInt: Scalars['UnsignedInt'];
  UtcOffset: Scalars['UtcOffset'];
  Void: Scalars['Void'];
  Year: Scalars['Year'];
  Int: Scalars['Int'];
  Float: Scalars['Float'];
}>;

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

export interface AccountNumberScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['AccountNumber'], any> {
  name: 'AccountNumber';
}

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}

export interface ByteScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Byte'], any> {
  name: 'Byte';
}

export interface CountryCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['CountryCode'], any> {
  name: 'CountryCode';
}

export interface CuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Cuid'], any> {
  name: 'Cuid';
}

export interface CurrencyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Currency'], any> {
  name: 'Currency';
}

export interface DidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DID'], any> {
  name: 'DID';
}

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export interface DurationScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Duration'], any> {
  name: 'Duration';
}

export interface EmailAddressScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['EmailAddress'], any> {
  name: 'EmailAddress';
}

export interface GuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['GUID'], any> {
  name: 'GUID';
}

export interface HslScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['HSL'], any> {
  name: 'HSL';
}

export interface HslaScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['HSLA'], any> {
  name: 'HSLA';
}

export interface HexColorCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['HexColorCode'], any> {
  name: 'HexColorCode';
}

export interface HexadecimalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Hexadecimal'], any> {
  name: 'Hexadecimal';
}

export interface IbanScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IBAN'], any> {
  name: 'IBAN';
}

export interface IpScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IP'], any> {
  name: 'IP';
}

export interface IPv4ScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IPv4'], any> {
  name: 'IPv4';
}

export interface IPv6ScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IPv6'], any> {
  name: 'IPv6';
}

export interface IsbnScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ISBN'], any> {
  name: 'ISBN';
}

export interface Iso8601DurationScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ISO8601Duration'], any> {
  name: 'ISO8601Duration';
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSONObject'], any> {
  name: 'JSONObject';
}

export interface JwtScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JWT'], any> {
  name: 'JWT';
}

export interface LatitudeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Latitude'], any> {
  name: 'Latitude';
}

export interface LocalDateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['LocalDate'], any> {
  name: 'LocalDate';
}

export interface LocalEndTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['LocalEndTime'], any> {
  name: 'LocalEndTime';
}

export interface LocalTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['LocalTime'], any> {
  name: 'LocalTime';
}

export interface LocaleScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Locale'], any> {
  name: 'Locale';
}

export interface LongScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Long'], any> {
  name: 'Long';
}

export interface LongitudeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Longitude'], any> {
  name: 'Longitude';
}

export interface MacScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['MAC'], any> {
  name: 'MAC';
}

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  createTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationCreateTemplateArgs, 'input'>>;
  updateTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationUpdateTemplateArgs, 'id' | 'input'>>;
}>;

export interface NegativeFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NegativeFloat'], any> {
  name: 'NegativeFloat';
}

export interface NegativeIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NegativeInt'], any> {
  name: 'NegativeInt';
}

export type NetworkContractResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['NetworkContract'] = ResolversParentTypes['NetworkContract']> = ResolversObject<{
  claims?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  types?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NetworkIssuerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['NetworkIssuer'] = ResolversParentTypes['NetworkIssuer']> = ResolversObject<{
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isTrusted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  linkedDomainUrls?: Resolver<Array<ResolversTypes['URL']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tenantId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface NonEmptyStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NonEmptyString'], any> {
  name: 'NonEmptyString';
}

export interface NonNegativeFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NonNegativeFloat'], any> {
  name: 'NonNegativeFloat';
}

export interface NonNegativeIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NonNegativeInt'], any> {
  name: 'NonNegativeInt';
}

export interface NonPositiveFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NonPositiveFloat'], any> {
  name: 'NonPositiveFloat';
}

export interface NonPositiveIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NonPositiveInt'], any> {
  name: 'NonPositiveInt';
}

export interface ObjectIdScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ObjectID'], any> {
  name: 'ObjectID';
}

export interface PhoneNumberScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PhoneNumber'], any> {
  name: 'PhoneNumber';
}

export interface PortScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Port'], any> {
  name: 'Port';
}

export interface PositiveFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PositiveFloat'], any> {
  name: 'PositiveFloat';
}

export interface PositiveIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PositiveInt'], any> {
  name: 'PositiveInt';
}

export interface PostalCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PostalCode'], any> {
  name: 'PostalCode';
}

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  findNetworkIssuers?: Resolver<Array<ResolversTypes['NetworkIssuer']>, ParentType, ContextType, RequireFields<QueryFindNetworkIssuersArgs, 'where'>>;
  findTemplates?: Resolver<Array<ResolversTypes['Template']>, ParentType, ContextType, Partial<QueryFindTemplatesArgs>>;
  healthcheck?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType>;
  networkContracts?: Resolver<Array<ResolversTypes['NetworkContract']>, ParentType, ContextType, RequireFields<QueryNetworkContractsArgs, 'issuerId' | 'tenantId'>>;
  template?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<QueryTemplateArgs, 'id'>>;
}>;

export interface RgbScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['RGB'], any> {
  name: 'RGB';
}

export interface RgbaScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['RGBA'], any> {
  name: 'RGBA';
}

export interface RoutingNumberScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['RoutingNumber'], any> {
  name: 'RoutingNumber';
}

export interface SafeIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['SafeInt'], any> {
  name: 'SafeInt';
}

export interface SemVerScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['SemVer'], any> {
  name: 'SemVer';
}

export type TemplateResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Template'] = ResolversParentTypes['Template']> = ResolversObject<{
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
}>;

export type TemplateDisplayClaimResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayClaim'] = ResolversParentTypes['TemplateDisplayClaim']> = ResolversObject<{
  claim?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TemplateDisplayConsentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayConsent'] = ResolversParentTypes['TemplateDisplayConsent']> = ResolversObject<{
  instructions?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TemplateDisplayCredentialResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayCredential'] = ResolversParentTypes['TemplateDisplayCredential']> = ResolversObject<{
  backgroundColor?: Resolver<Maybe<ResolversTypes['HexColorCode']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  issuedBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['TemplateDisplayCredentialLogo']>, ParentType, ContextType>;
  textColor?: Resolver<Maybe<ResolversTypes['HexColorCode']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TemplateDisplayCredentialLogoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayCredentialLogo'] = ResolversParentTypes['TemplateDisplayCredentialLogo']> = ResolversObject<{
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uri?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TemplateDisplayModelResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateDisplayModel'] = ResolversParentTypes['TemplateDisplayModel']> = ResolversObject<{
  card?: Resolver<Maybe<ResolversTypes['TemplateDisplayCredential']>, ParentType, ContextType>;
  claims?: Resolver<Maybe<Array<ResolversTypes['TemplateDisplayClaim']>>, ParentType, ContextType>;
  consent?: Resolver<Maybe<ResolversTypes['TemplateDisplayConsent']>, ParentType, ContextType>;
  locale?: Resolver<Maybe<ResolversTypes['Locale']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TemplateParentDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateParentData'] = ResolversParentTypes['TemplateParentData']> = ResolversObject<{
  display?: Resolver<Maybe<ResolversTypes['TemplateDisplayModel']>, ParentType, ContextType>;
  isPublic?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  validityIntervalInSeconds?: Resolver<Maybe<ResolversTypes['PositiveInt']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface TimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Time'], any> {
  name: 'Time';
}

export interface TimeZoneScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['TimeZone'], any> {
  name: 'TimeZone';
}

export interface TimestampScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Timestamp'], any> {
  name: 'Timestamp';
}

export interface UrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['URL'], any> {
  name: 'URL';
}

export interface UsCurrencyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['USCurrency'], any> {
  name: 'USCurrency';
}

export interface UuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['UUID'], any> {
  name: 'UUID';
}

export interface UnsignedFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['UnsignedFloat'], any> {
  name: 'UnsignedFloat';
}

export interface UnsignedIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['UnsignedInt'], any> {
  name: 'UnsignedInt';
}

export interface UtcOffsetScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['UtcOffset'], any> {
  name: 'UtcOffset';
}

export interface VoidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Void'], any> {
  name: 'Void';
}

export interface YearScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Year'], any> {
  name: 'Year';
}

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  AccountNumber?: GraphQLScalarType;
  BigInt?: GraphQLScalarType;
  Byte?: GraphQLScalarType;
  CountryCode?: GraphQLScalarType;
  Cuid?: GraphQLScalarType;
  Currency?: GraphQLScalarType;
  DID?: GraphQLScalarType;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  Duration?: GraphQLScalarType;
  EmailAddress?: GraphQLScalarType;
  GUID?: GraphQLScalarType;
  HSL?: GraphQLScalarType;
  HSLA?: GraphQLScalarType;
  HexColorCode?: GraphQLScalarType;
  Hexadecimal?: GraphQLScalarType;
  IBAN?: GraphQLScalarType;
  IP?: GraphQLScalarType;
  IPv4?: GraphQLScalarType;
  IPv6?: GraphQLScalarType;
  ISBN?: GraphQLScalarType;
  ISO8601Duration?: GraphQLScalarType;
  JSON?: GraphQLScalarType;
  JSONObject?: GraphQLScalarType;
  JWT?: GraphQLScalarType;
  Latitude?: GraphQLScalarType;
  LocalDate?: GraphQLScalarType;
  LocalEndTime?: GraphQLScalarType;
  LocalTime?: GraphQLScalarType;
  Locale?: GraphQLScalarType;
  Long?: GraphQLScalarType;
  Longitude?: GraphQLScalarType;
  MAC?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  NegativeFloat?: GraphQLScalarType;
  NegativeInt?: GraphQLScalarType;
  NetworkContract?: NetworkContractResolvers<ContextType>;
  NetworkIssuer?: NetworkIssuerResolvers<ContextType>;
  NonEmptyString?: GraphQLScalarType;
  NonNegativeFloat?: GraphQLScalarType;
  NonNegativeInt?: GraphQLScalarType;
  NonPositiveFloat?: GraphQLScalarType;
  NonPositiveInt?: GraphQLScalarType;
  ObjectID?: GraphQLScalarType;
  PhoneNumber?: GraphQLScalarType;
  Port?: GraphQLScalarType;
  PositiveFloat?: GraphQLScalarType;
  PositiveInt?: GraphQLScalarType;
  PostalCode?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  RGB?: GraphQLScalarType;
  RGBA?: GraphQLScalarType;
  RoutingNumber?: GraphQLScalarType;
  SafeInt?: GraphQLScalarType;
  SemVer?: GraphQLScalarType;
  Template?: TemplateResolvers<ContextType>;
  TemplateDisplayClaim?: TemplateDisplayClaimResolvers<ContextType>;
  TemplateDisplayConsent?: TemplateDisplayConsentResolvers<ContextType>;
  TemplateDisplayCredential?: TemplateDisplayCredentialResolvers<ContextType>;
  TemplateDisplayCredentialLogo?: TemplateDisplayCredentialLogoResolvers<ContextType>;
  TemplateDisplayModel?: TemplateDisplayModelResolvers<ContextType>;
  TemplateParentData?: TemplateParentDataResolvers<ContextType>;
  Time?: GraphQLScalarType;
  TimeZone?: GraphQLScalarType;
  Timestamp?: GraphQLScalarType;
  URL?: GraphQLScalarType;
  USCurrency?: GraphQLScalarType;
  UUID?: GraphQLScalarType;
  UnsignedFloat?: GraphQLScalarType;
  UnsignedInt?: GraphQLScalarType;
  UtcOffset?: GraphQLScalarType;
  Void?: GraphQLScalarType;
  Year?: GraphQLScalarType;
}>;

export type DirectiveResolvers<ContextType = GraphQLContext> = ResolversObject<{
  cacheControl?: CacheControlDirectiveResolver<any, any, ContextType>;
  constraint?: ConstraintDirectiveResolver<any, any, ContextType>;
}>;
