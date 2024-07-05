/* eslint-disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { TemplateEntity } from '../features/templates/entities/template-entity';
import { ContractEntity } from '../features/contracts/entities/contract-entity';
import { UserEntity } from '../features/users/entities/user-entity';
import { IssuanceEntity } from '../features/issuance/entities/issuance-entity';
import { PresentationEntity } from '../features/presentation/entities/presentation-entity';
import { IdentityEntity } from '../features/identity/entities/identity-entity';
import { PartnerEntity } from '../features/network/entities/partner-entity';
import { ApprovalRequestEntity } from '../features/approval-request/entities/approval-request-entity';
import { GraphQLContext } from '../context';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: Date; output: Date; }
  /** A field whose value conforms to the standard internet email address format as specified in HTML Spec: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address. */
  EmailAddress: { input: string; output: string; }
  /** A field whose value is a hex color code: https://en.wikipedia.org/wiki/Web_colors. */
  HexColorCode: { input: string; output: string; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: Record<string, unknown>; output: Record<string, unknown>; }
  /** The locale in the format of a BCP 47 (RFC 5646) standard string */
  Locale: { input: string; output: string; }
  /** Integers that will have a value of 0 or more. */
  NonNegativeInt: { input: number; output: number; }
  /** Floats that will have a value greater than 0. */
  PositiveFloat: { input: number; output: number; }
  /** Integers that will have a value greater than 0. */
  PositiveInt: { input: number; output: number; }
  /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
  URL: { input: string; output: string; }
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: { input: string; output: string; }
  /** Represents NULL values */
  Void: { input: null | undefined | void; output: null | undefined | void; }
};

/** A limited access token response. */
export type AccessTokenResponse = {
  __typename?: 'AccessTokenResponse';
  expires: Scalars['DateTime']['output'];
  token: Scalars['String']['output'];
};

/** Input for acquiring a limited access token. */
export type AcquireLimitedAccessTokenInput = {
  /**
   * If true, the limited access token can be used to request presentations of credentials from any identity (`identityId` is not required).
   *
   *   - The app acquiring the token must be granted the `VerifiableCredential.AcquireLimitedAccessToken.AnonymousPresentations` role
   */
  allowAnonymousPresentation?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * The ID of the (issuee) identity to which access will be limited.
   *
   * The ID is required in all limited access scenarios except anonymous presentations (`allowAnonymousPresentation`).
   *
   * The ID, if supplied:
   * - will be used for issuance requests: limited access tokens can only be used to issue credentials to a fixed single identity specified at token acquisition time
   * - must match the identity ID in presented credentials
   * - will be saved as the identity of the presentation of partner credentials (useful when the presenter identity is known via authentication or other means)
   * - must match that used in criteria when querying presentation, issuance or identity data; or when subscribing to issuance or presentation events
   */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * The ID(s) of the contract(s) that can be issued.
   *
   *   - The app acquiring the token must be granted the `VerifiableCredential.AcquireLimitedAccessToken.Issue` role
   *   - `identityId` must also be specified (limited access tokens can only be used to issue credentials to a fixed single identity)
   */
  issuableContractIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /**
   * If true, the limited access token can be used to list contracts via Query.findContracts
   *
   *   - The app acquiring the token must be granted the `VerifiableCredential.AcquireLimitedAccessToken.ListContracts` role
   *   - Note: issuances and presentations of the contracts can be queried if a matching `identityId` is also supplied as criteria
   */
  listContracts?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Defines the types of credentials that can requested for presentation.
   *
   *   - The app acquiring the token must be granted the `VerifiableCredential.AcquireLimitedAccessToken.Present` role
   */
  requestableCredentials?: InputMaybe<Array<RequestedCredentialSpecificationInput>>;
};

/** Input for acquiring a limited token for approval. */
export type AcquireLimitedApprovalTokenInput = {
  /** The ID of the approval request to which access will be limited. */
  approvalRequestId: Scalars['UUID']['input'];
};

/** Input for actioning an approval request. */
export type ActionApprovalRequestInput = {
  /** Optional comment on approval or rejection of this request. */
  actionedComment?: InputMaybe<Scalars['String']['input']>;
  /** Indicates whether the approval has been granted. */
  isApproved: Scalars['Boolean']['input'];
};

/** Details of the action taken on the approval request. */
export type ActionedApprovalData = {
  __typename?: 'ActionedApprovalData';
  /** When the approval request was actioned. */
  actionedAt: Scalars['DateTime']['output'];
  /** The person who actioned the approval request, if known. */
  actionedBy?: Maybe<ActionedBy>;
  /** Optional comment on approval or rejection of this request. */
  actionedComment?: Maybe<Scalars['String']['output']>;
  /** The ID of the approval request that was actioned. */
  approvalRequestId: Scalars['ID']['output'];
  /** A unique secret that can be used to verify the authenticity of the callback. */
  callbackSecret: Scalars['String']['output'];
  /** The optional originating source entity ID of the artifact requiring approval. */
  correlationId?: Maybe<Scalars['ID']['output']>;
  /** Indicates whether the approval has been granted. */
  isApproved: Scalars['Boolean']['output'];
  /** Optional additional data that is useful for / relevent to the approval; the schema of which would vary by type. */
  requestData?: Maybe<Scalars['JSONObject']['output']>;
  /** Arbitrary state value which was optionally included in the approval request callback definition. */
  state?: Maybe<Scalars['String']['output']>;
};

/** The details of the person who actioned the approval request */
export type ActionedBy = {
  __typename?: 'ActionedBy';
  /** The id of this identity */
  id: Scalars['ID']['output'];
  /** The name of the identity */
  name: Scalars['String']['output'];
};

/** An instance of an approval request. */
export type ApprovalRequest = {
  __typename?: 'ApprovalRequest';
  /** Optional comment on approval or rejection of this request. */
  actionedComment?: Maybe<Scalars['String']['output']>;
  /** The optional originating source entity ID of the artifact requiring approval. */
  correlationId?: Maybe<Scalars['ID']['output']>;
  /** When the approval expires; presentations cannot be made for an expired approval. */
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** Indicates whether the approval has been granted. */
  isApproved?: Maybe<Scalars['Boolean']['output']>;
  /** The presentation that was provided to satisfy approval requirement */
  presentation?: Maybe<Presentation>;
  /** The presentation request definition for this approval. */
  presentationRequest: Scalars['JSONObject']['output'];
  /** Purpose for requesting approval. */
  purpose: Scalars['String']['output'];
  /** Optional URL to the artifact for approval. */
  referenceUrl?: Maybe<Scalars['String']['output']>;
  /** Optional additional data that is useful for / relevent to the approval; the schema of which would vary by type. */
  requestData?: Maybe<Scalars['JSONObject']['output']>;
  /** The type of approval request, useful for partioning and filtering different types of approval requests. */
  requestType: Scalars['String']['output'];
  requestedAt: Scalars['DateTime']['output'];
  /** The platform user (application or person) that requested the approval. */
  requestedBy: User;
  /** The approval status. */
  status: ApprovalRequestStatus;
  /** When the approval request was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the approval request. */
  updatedBy?: Maybe<User>;
};

/** The input for creating a new approval request. */
export type ApprovalRequestInput = {
  /** Callback will be invoked when the approval request is actioned. */
  callback?: InputMaybe<Callback>;
  /** The optional originating source entity ID of the artifact requiring approval. */
  correlationId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * When the approval expires; presentations cannot be made for an expired approval.
   * Defaults to 7 days from the current date.
   */
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** The presentation request definition for this approval. */
  presentationRequestInput: ApprovalRequestPresentationInput;
  /** Purpose for requesting approval. */
  purpose: Scalars['String']['input'];
  /** Optional URL to the artifact for approval. */
  referenceUrl?: InputMaybe<Scalars['String']['input']>;
  /** Optional additional data that is useful for / relevent to the approval; the schema of which would vary by type. */
  requestData?: InputMaybe<Scalars['JSONObject']['input']>;
  /** The type of approval request, useful for partioning and filtering different types of approval requests. */
  requestType: Scalars['String']['input'];
};

/** Defines the approval request's verifiable credentials presentation request. */
export type ApprovalRequestPresentationInput = {
  /** A collection of RequestCredential objects representing the credentials the user needs to provide. */
  requestedCredentials: Array<RequestCredential>;
};

/** A response for a newly created approval request. */
export type ApprovalRequestResponse = {
  __typename?: 'ApprovalRequestResponse';
  /** A unique secret that can be used to verify the authenticity of the callback. */
  callbackSecret: Scalars['String']['output'];
  /** The ID of the newly created approval request. */
  id: Scalars['ID']['output'];
  /** The URL to the newly created approval request in the portal */
  portalUrl: Scalars['String']['output'];
};

/** The status of the approval. */
export enum ApprovalRequestStatus {
  Approved = 'approved',
  Expired = 'expired',
  Pending = 'pending',
  Rejected = 'rejected'
}

/** A limited approval token response. */
export type ApprovalTokenResponse = {
  __typename?: 'ApprovalTokenResponse';
  expires: Scalars['DateTime']['output'];
  token: Scalars['String']['output'];
};

/** A configured authority or verifiable credential service instance */
export type Authority = {
  __typename?: 'Authority';
  didModel: WebDidModel;
  /** An autogenerated unique ID, which can be used to retrieve or update the specific instance of the verifiable credential service */
  id: Scalars['ID']['output'];
  /** Indicates whether the linked domains have been verified */
  linkedDomainsVerified: Scalars['Boolean']['output'];
  /** The friendly name of this instance of the verifiable credential service */
  name: Scalars['String']['output'];
};

/** The background job active events are published as the jobs are waiting to be processed. */
export type BackgroundJobActiveEvent = {
  __typename?: 'BackgroundJobActiveEvent';
  status: BackgroundJobStatus;
};

/** The background job completed events are published as they are processed successfully */
export type BackgroundJobCompletedEvent = {
  __typename?: 'BackgroundJobCompletedEvent';
  /** When the status property value is COMPLETED, this property contains the result of the background job. */
  result: Scalars['JSONObject']['output'];
  status: BackgroundJobStatus;
};

/** The background job error events are published as they encounter errors in retrying or failed status */
export type BackgroundJobErrorEvent = {
  __typename?: 'BackgroundJobErrorEvent';
  /** When the status property value is FAILED or RETRYING, this property contains the error message. */
  error: Scalars['String']['output'];
  status: BackgroundJobStatus;
};

export type BackgroundJobEvent = BackgroundJobActiveEvent | BackgroundJobCompletedEvent | BackgroundJobErrorEvent | BackgroundJobProgressEvent;

/** Data representing an background job event (see BackgroundJobStatus, could be received, successful, failed). */
export type BackgroundJobEventData = {
  __typename?: 'BackgroundJobEventData';
  /** The callback event data */
  event: BackgroundJobEvent;
  /** The background job id */
  jobId: Scalars['ID']['output'];
  /** The background job name */
  jobName: Scalars['String']['output'];
  /** The ID of the user that requested the background job. */
  user?: Maybe<User>;
};

/** Criteria for filtering background job events. */
export type BackgroundJobEventWhere = {
  /** The id of the background job, returned from the mutations which trigger a background job. */
  jobId?: InputMaybe<Scalars['ID']['input']>;
  /** The name of the background job */
  jobName?: InputMaybe<Scalars['String']['input']>;
  /** Only return events with the specified status. */
  status?: InputMaybe<BackgroundJobStatus>;
  /** The ID of the user that requested the background job. */
  userId?: InputMaybe<Scalars['ID']['input']>;
};

/** The background job progress events are published as it progress from being queued to completed or failed. */
export type BackgroundJobProgressEvent = {
  __typename?: 'BackgroundJobProgressEvent';
  /** When the status property value is PROGRESS, this property contains the progress number. */
  progress: Scalars['PositiveInt']['output'];
  status: BackgroundJobStatus;
};

export enum BackgroundJobStatus {
  /** The background job has been added to the queue. */
  Active = 'active',
  /** The background job has been completed. */
  Completed = 'completed',
  /** The background job has failed. */
  Failed = 'failed',
  /** The background job is in progress. */
  Progress = 'progress',
  /** The background job has encountered an error and is going to be retried */
  Retrying = 'retrying'
}

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

/**
 * Allows the developer to asynchronously get information on the flow during the verifiable credential issuance process.
 * For example, the developer might want a call when the user has scanned the QR code or if the issuance request succeeds or fails.
 */
export type Callback = {
  /**
   * You can include a collection of HTTP headers required by the receiving end of the POST message.
   * The current supported header values are the api-key or the Authorization headers.
   * Any other header will throw an invalid callback header error
   */
  headers?: InputMaybe<Scalars['JSONObject']['input']>;
  /**
   * Optional data that is passed to the callback endpoint.
   * E.g. to correlate information between the issuance request and the callback.
   */
  state?: InputMaybe<Scalars['String']['input']>;
  /**
   * URI to the callback endpoint of your application.
   * The URI must point to a reachable endpoint on the internet otherwise the service will throw callback URL unreadable error.
   * Accepted formats IPv4, IPv6 or DNS resolvable hostname
   */
  url: Scalars['URL']['input'];
};

/** Provides information about the presented credentials should be validated */
export type ConfigurationValidation = {
  /** Determines if a revoked credential should be accepted. Default is false (it shouldn't be accepted). */
  allowRevoked?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Determines whether face check validation should be performed for this credential and provides optional settings.
   * If wish to perform face check validation using default settings, set this field to an empty object.
   */
  faceCheck?: InputMaybe<FaceCheckValidationInput>;
  /** Determines if the linked domain should be validated. Default is false. Setting this flag to false means you as a Relying Party application accept credentials from unverified linked domain. Setting this flag to true means the linked domain will be validated and only verified domains will be accepted. */
  validateLinkedDomain?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Defines a contract that can be used to issue credentials */
export type Contract = {
  __typename?: 'Contract';
  /** When the contract was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the contract. */
  createdBy: User;
  /**
   * The type(s) of the contract / credential
   * Requires at least one type, and cannot have duplicate types
   */
  credentialTypes: Array<Scalars['String']['output']>;
  /** When the contract was deprecated. */
  deprecatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Who deprecated the contract. */
  deprecatedBy?: Maybe<User>;
  /**
   * The description of the contract
   * @deprecated no longer in use
   */
  description: Scalars['String']['output'];
  /** The full or partial credential display definition defined by this contract */
  display: ContractDisplayModel;
  /**
   * The ID of the contract in the Verified ID service.
   * This only has a value when the contract has been provisioned.
   */
  externalId?: Maybe<Scalars['String']['output']>;
  /** The type of face check photo support */
  faceCheckSupport: FaceCheckPhotoSupport;
  /** The unique identifier for the contract */
  id: Scalars['ID']['output'];
  /** Defines whether the contract is deprecated, if so no new issuance can be requested for it */
  isDeprecated?: Maybe<Scalars['Boolean']['output']>;
  /** Defines whether the contracts created from this template will be published in the Verified Credentials Network */
  isPublic: Scalars['Boolean']['output'];
  /** Returns the total number of credential issuances for this contract. */
  issuanceCount: Scalars['Int']['output'];
  /** Returns the weekly average of credential issuances for this contract. */
  issuanceWeeklyAverage: Scalars['Float']['output'];
  /** Returns the successful credential issuances for this contract. */
  issuances: Array<Issuance>;
  /** When the contract was last provisioned in the Verified ID service. */
  lastProvisionedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Who last provisioned the contract in the Verified ID service. */
  lastProvisionedBy?: Maybe<User>;
  /** The name of the contract */
  name: Scalars['String']['output'];
  /** Returns the weekly average of credential presentations for this contract. */
  presentationWeeklyAverage: Scalars['Float']['output'];
  /** Returns the successful credential presentations for this contract. */
  presentations: Array<Presentation>;
  /** When the contract was initially provisioned in the Verified ID service. */
  provisionedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Who initially provisioned the contract in the Verified ID service. */
  provisionedBy?: Maybe<User>;
  /** The template that this contract is based on */
  template?: Maybe<Template>;
  /** The combined representation of the template's parent chain. */
  templateData?: Maybe<TemplateParentData>;
  /** When the contract was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the contract. */
  updatedBy?: Maybe<User>;
  /** The lifespan of the credential expressed in seconds */
  validityIntervalInSeconds: Scalars['PositiveInt']['output'];
};


/** Defines a contract that can be used to issue credentials */
export type ContractIssuanceWeeklyAverageArgs = {
  where: ContractIssuanceWeeklyAverageWhere;
};


/** Defines a contract that can be used to issue credentials */
export type ContractIssuancesArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<ContractIssuanceWhere>;
};


/** Defines a contract that can be used to issue credentials */
export type ContractPresentationWeeklyAverageArgs = {
  where: ContractPresentationWeeklyAverageWhere;
};


/** Defines a contract that can be used to issue credentials */
export type ContractPresentationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<ContractPresentationWhere>;
};

/** Represents a count of occurrences of a contract. */
export type ContractCount = {
  __typename?: 'ContractCount';
  /** The contract. */
  contract: Contract;
  /** The number of occurrences of this contract. */
  count: Scalars['NonNegativeInt']['output'];
};

/** Defines a claim included in a verifiable credential */
export type ContractDisplayClaim = {
  __typename?: 'ContractDisplayClaim';
  /** The name of the claim to which the label applies */
  claim: Scalars['String']['output'];
  /** The description of the claim */
  description?: Maybe<Scalars['String']['output']>;
  /** The label of the claim */
  label: Scalars['String']['output'];
  /**
   * The type of the claim
   * Valid values encountered so far are:
   * - String
   * - image/jpg;base64url (in the Verified Employee contract)
   */
  type: Scalars['String']['output'];
  /** The value for the claim (optional, only set if the value is fixed) */
  value?: Maybe<Scalars['String']['output']>;
};

/** Defines a claim included in a verifiable credential */
export type ContractDisplayClaimInput = {
  /** The name of the claim to which the label applies */
  claim: Scalars['String']['input'];
  /** The description of the claim */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The label of the claim */
  label: Scalars['String']['input'];
  /**
   * The type of the claim
   * Valid values encountered so far are:
   * - String
   * - image/jpg;base64url (in the Verified Employee contract)
   */
  type: Scalars['String']['input'];
  /** The value for the claim (optional, only set if the value is fixed) */
  value?: InputMaybe<Scalars['String']['input']>;
};

/** Supplemental data when the verifiable credential is issued */
export type ContractDisplayConsent = {
  __typename?: 'ContractDisplayConsent';
  /** Supplemental text to use when displaying consent */
  instructions?: Maybe<Scalars['String']['output']>;
  /** Title of the consent */
  title?: Maybe<Scalars['String']['output']>;
};

/** Supplemental data when the verifiable credential is issued */
export type ContractDisplayConsentInput = {
  /** Supplemental text to use when displaying consent */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** Title of the consent */
  title?: InputMaybe<Scalars['String']['input']>;
};

/**
 * The display properties of the verifiable credential at the template level
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/credential-design#display-definition-wallet-credential-visuals
 */
export type ContractDisplayCredential = {
  __typename?: 'ContractDisplayCredential';
  /** Background color of the credential */
  backgroundColor: Scalars['HexColorCode']['output'];
  /** Supplemental text displayed alongside each credential */
  description: Scalars['String']['output'];
  /** The name of the issuer of the credential */
  issuedBy: Scalars['String']['output'];
  /** Logo information of the credential */
  logo: ContractDisplayCredentialLogo;
  /** Text color of the credential */
  textColor: Scalars['HexColorCode']['output'];
  /** Title of the credential */
  title: Scalars['String']['output'];
};

/**
 * The display properties of the verifiable credential at the template level
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/credential-design#display-definition-wallet-credential-visuals
 */
export type ContractDisplayCredentialInput = {
  /** Background color of the credential */
  backgroundColor: Scalars['HexColorCode']['input'];
  /** Supplemental text displayed alongside each credential */
  description: Scalars['String']['input'];
  /** The name of the issuer of the credential */
  issuedBy: Scalars['String']['input'];
  /** Logo information of the credential */
  logo: ContractDisplayCredentialLogoInput;
  /** Text color of the credential */
  textColor: Scalars['HexColorCode']['input'];
  /** Title of the credential */
  title: Scalars['String']['input'];
};

/**
 * Defines the logo displayed on the credential
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/rules-and-display-definitions-model#displaycredentiallogo-type
 */
export type ContractDisplayCredentialLogo = {
  __typename?: 'ContractDisplayCredentialLogo';
  /** The description of the logo */
  description: Scalars['String']['output'];
  /** The base-64 encoded logo in [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) format */
  image: Scalars['String']['output'];
  /** URI of the logo */
  uri: Scalars['URL']['output'];
};

/**
 * Defines the logo displayed on the credential
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/rules-and-display-definitions-model#displaycredentiallogo-type
 */
export type ContractDisplayCredentialLogoInput = {
  /** The description of the logo */
  description: Scalars['String']['input'];
  /** The base-64 encoded logo in [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) format */
  image: Scalars['String']['input'];
};

/** Credential display definitions at the template level */
export type ContractDisplayModel = {
  __typename?: 'ContractDisplayModel';
  card: ContractDisplayCredential;
  claims: Array<ContractDisplayClaim>;
  consent: ContractDisplayConsent;
  locale: Scalars['Locale']['output'];
};

/** Credential display definitions at the template level */
export type ContractDisplayModelInput = {
  card: ContractDisplayCredentialInput;
  claims: Array<ContractDisplayClaimInput>;
  consent: ContractDisplayConsentInput;
  locale: Scalars['Locale']['input'];
};

/** Defines the input to create or update a template */
export type ContractInput = {
  /**
   * The type(s) of the contract / credential
   * Requires at least one type, and cannot have duplicate types
   */
  credentialTypes: Array<Scalars['String']['input']>;
  /** The credential display definition defined by this contract. */
  display: ContractDisplayModelInput;
  /** The type of face check photo support */
  faceCheckSupport?: InputMaybe<FaceCheckPhotoSupport>;
  /** Defines whether the contracts created from this template will be published in the Verified Credentials Network */
  isPublic: Scalars['Boolean']['input'];
  /** The name of the template */
  name: Scalars['String']['input'];
  /** The ID of the template used as a base for the contract */
  templateId?: InputMaybe<Scalars['ID']['input']>;
  /** The lifespan of the credential expressed in seconds */
  validityIntervalInSeconds: Scalars['PositiveInt']['input'];
};

/** Criteria for calculating weekly average of contract issuances. */
export type ContractIssuanceWeeklyAverageWhere = {
  /** The number of weeks to calculate average for. */
  numberOfWeeks: Scalars['Int']['input'];
  /** The end of the issuedAt period to include. */
  to: Scalars['DateTime']['input'];
};

/** Criteria for filtering contract issuances. */
export type ContractIssuanceWhere = {
  /** The start of the expiresAt period to include. */
  expiresFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the expiresAt period to include. */
  expiresTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** The start of the issuedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** Indicates whether the issued credential has face check photo. */
  hasFaceCheckPhoto?: InputMaybe<Scalars['Boolean']['input']>;
  /** The ID of the identity that was issued the credential. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the user (Person or Application) that issued the credential. */
  issuedById?: InputMaybe<Scalars['ID']['input']>;
  /** The presentation which included the issuance */
  presentationId?: InputMaybe<Scalars['ID']['input']>;
  /** The requestId of the issuance request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the platform user (application or person) that revoked the credential. */
  revokedById?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the revokedAt period to include. */
  revokedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the revokedAt period to include. */
  revokedTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** The status of the issuance. */
  status?: InputMaybe<IssuanceStatus>;
  /** The end of the issuedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Columns that can be used for sorting contracts. */
export enum ContractOrderBy {
  /** The name of the contract. */
  ContractName = 'contractName',
  /** The timestamp when the contract was created. */
  CreatedAt = 'createdAt',
  /** The name of the user that created the contract. */
  CreatedByName = 'createdByName'
}

/** Criteria for calculating weekly average of contract presentations. */
export type ContractPresentationWeeklyAverageWhere = {
  /** The number of weeks to calculate average for. */
  numberOfWeeks: Scalars['Int']['input'];
  /** The end of the presentedAt period to include. */
  to: Scalars['DateTime']['input'];
};

/** Criteria for filtering contract presentations. */
export type ContractPresentationWhere = {
  /** The start of the presentedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** The ID of the identity who presented the credential (if known). */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** Whether face check validation was requested. */
  isFaceCheckRequested?: InputMaybe<Scalars['Boolean']['input']>;
  /** The issuance that was presented */
  issuanceId?: InputMaybe<Scalars['ID']['input']>;
  /** The partner who issued the credential that was presented */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential presented. */
  presentedType?: InputMaybe<Scalars['String']['input']>;
  /** The requestId of the presentation request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the user (Person or Application) that requested & received the presentation. */
  requestedById?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential requested. */
  requestedType?: InputMaybe<Scalars['String']['input']>;
  /** The end of the presentedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Defines the filter critiera used to find contracts */
export type ContractWhere = {
  /** The ID of the user (Person or Application) that created the contract. */
  createdById?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the createdAt period to include. */
  createdFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the createdAt period to include. */
  createdTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** List only the contracts which include any of these credential types */
  credentialTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The type of face check photo support */
  faceCheckSupport?: InputMaybe<FaceCheckPhotoSupport>;
  /** List only the contracts whose deprecation status matches the flag */
  isDeprecated?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only contracts that are or are not published in the Verified Credentials Network */
  isProvisioned?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only contracts matching this name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** List only contracts from this template */
  templateId?: InputMaybe<Scalars['ID']['input']>;
};

/** Input type for creating a new partner */
export type CreatePartnerInput = {
  /**
   * The type(s) of the contract / credential
   * Requires at least one type, and cannot have duplicate types
   */
  credentialTypes: Array<Scalars['String']['input']>;
  /** The DID of the partner */
  did: Scalars['String']['input'];
  /** The unique identifier of the verifiable credential service instance if the partner is on Entra network */
  issuerId?: InputMaybe<Scalars['ID']['input']>;
  /** Domains linked to this partner's DID */
  linkedDomainUrls?: InputMaybe<Array<Scalars['URL']['input']>>;
  /** The name of the partner */
  name: Scalars['String']['input'];
  /** The Azure AD tenant identifier if the partner is on Entra network */
  tenantId?: InputMaybe<Scalars['ID']['input']>;
};

/** Input for creating approval presentation requests */
export type CreatePresentationRequestForApprovalInput = {
  /**
   * Determines whether a QR code is included in the response of this request
   * Present the QR code and ask the user to scan it.
   * Scanning the QR code launches the authenticator app with this issuance request.
   * Possible values are true (default) or false.
   * When you set the value to false, use the return url property to render a deep link.
   */
  includeQRCode?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Defines a claim included in a verifiable credential */
export type CreateUpdateTemplateDisplayClaimInput = {
  /** The name of the claim to which the label applies */
  claim: Scalars['String']['input'];
  /** The description of the claim */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The label of the claim */
  label: Scalars['String']['input'];
  /**
   * The type of the claim
   * Valid values encountered so far are:
   *   - String
   *   - image/jpg;base64url (in the Verified Employee contract)
   */
  type: Scalars['String']['input'];
  /**
   * The value for the claim
   * If provided, the value is fixed for all credentials referencing this claim
   * If not provided, the value will need to be dynamically provided before the credential is issued
   */
  value?: InputMaybe<Scalars['String']['input']>;
};

/** Supplemental data when the verifiable credential is issued */
export type CreateUpdateTemplateDisplayConsentInput = {
  /** Supplemental text to use when displaying consent */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** Title of the consent */
  title?: InputMaybe<Scalars['String']['input']>;
};

/**
 * The display properties of the verifiable credential at the template level
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/credential-design#display-definition-wallet-credential-visuals
 */
export type CreateUpdateTemplateDisplayCredentialInput = {
  /** Background color of the credential */
  backgroundColor?: InputMaybe<Scalars['HexColorCode']['input']>;
  /** Supplemental text displayed alongside each credential */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The name of the issuer of the credential */
  issuedBy?: InputMaybe<Scalars['String']['input']>;
  /** Logo information of the credential */
  logo?: InputMaybe<CreateUpdateTemplateDisplayCredentialLogoInput>;
  /** Text color of the credential */
  textColor?: InputMaybe<Scalars['HexColorCode']['input']>;
  /** Title of the credential */
  title?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Defines the logo displayed on the credential
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/rules-and-display-definitions-model#displaycredentiallogo-type
 */
export type CreateUpdateTemplateDisplayCredentialLogoInput = {
  /** The description of the logo */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The base-64 encoded logo in [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) format */
  image?: InputMaybe<Scalars['String']['input']>;
};

/** Credential display definitions at the template level */
export type CreateUpdateTemplateDisplayModelInput = {
  card?: InputMaybe<CreateUpdateTemplateDisplayCredentialInput>;
  claims?: InputMaybe<Array<CreateUpdateTemplateDisplayClaimInput>>;
  consent?: InputMaybe<CreateUpdateTemplateDisplayConsentInput>;
  locale?: InputMaybe<Scalars['Locale']['input']>;
};

/** Defines the criteria used to find credential types. */
export type CredentialTypesWhere = {
  /**
   * If true, or not specified, contract types are returned.
   * If false, contract types are excluded.
   */
  includeContractTypes?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * If true, or not specified, partner types are returned.
   * If false, partner types are excluded.
   */
  includePartnerTypes?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * If true, or not specified, template types are returned.
   * If false, template types are excluded.
   */
  includeTemplateTypes?: InputMaybe<Scalars['Boolean']['input']>;
};

/** status of the DID */
export enum DidDocumentStatus {
  Published = 'published',
  Submitted = 'submitted'
}

/** Returns discoverable information about this API instance */
export type Discovery = {
  __typename?: 'Discovery';
  /** Returns the features enabled for this API instance. */
  features: Features;
};

/** The type of face check photo support */
export enum FaceCheckPhotoSupport {
  /** A face check photo cannot be provided when issuing a credential with this contract */
  None = 'none',
  /** A face check photo can optionally be provided when issuing a credential with this contract */
  Optional = 'optional',
  /** A face check photo must be provided when issuing a credential with this contract */
  Required = 'required'
}

/** Face check result information included in the PresentedCredential. */
export type FaceCheckResult = {
  __typename?: 'FaceCheckResult';
  matchConfidenceScore: Scalars['PositiveFloat']['output'];
  sourcePhotoQuality: Scalars['String']['output'];
};

/** Face check validation settings */
export type FaceCheckValidation = {
  __typename?: 'FaceCheckValidation';
  /** Optional confidence threshold between 50-100. The default is 70. */
  matchConfidenceThreshold?: Maybe<Scalars['PositiveInt']['output']>;
};

/** Face check validation settings */
export type FaceCheckValidationInput = {
  /** Optional confidence threshold between 50-100. The default is 70. */
  matchConfidenceThreshold?: InputMaybe<Scalars['Int']['input']>;
};

/** Specifies which features are enabled for this API instance. */
export type Features = {
  __typename?: 'Features';
  /** Indicates whether the API dev tools (Apollo sandbox, introspection, PKCE) are available. */
  devToolsEnabled: Scalars['Boolean']['output'];
  /** Indicates whether the API instance is configured to support finding home tenant identities via the findTenantIdentities query. */
  findTenantIdentities: Scalars['Boolean']['output'];
};

/** Represents an identity that is issued credentials */
export type Identity = {
  __typename?: 'Identity';
  /** When the identity was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the identity. */
  createdBy: User;
  /** The local id of this identity */
  id: Scalars['ID']['output'];
  /** The unique identifier of the identity in the issuing tenant */
  identifier: Scalars['String']['output'];
  /** Returns the total number of credential issuances for this identity. */
  issuanceCount: Scalars['Int']['output'];
  /** Returns the successful credential issuances for this identity. */
  issuances: Array<Issuance>;
  /** The issuer of the identity */
  issuer: Scalars['String']['output'];
  /** The optional user-facing label of the identity issuer */
  issuerLabel?: Maybe<Scalars['String']['output']>;
  /** The name of the identity */
  name: Scalars['String']['output'];
  /** Returns the successful credential presentations for this identity. */
  presentations: Array<Presentation>;
  /** When the identity was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the identity. */
  updatedBy?: Maybe<User>;
};


/** Represents an identity that is issued credentials */
export type IdentityIssuancesArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<IdentityIssuanceWhere>;
};


/** Represents an identity that is issued credentials */
export type IdentityPresentationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<IdentityPresentationWhere>;
};

/** Input type representing an identity that is issued credentials */
export type IdentityInput = {
  /** The unique identifier of the identity in the issuer */
  identifier: Scalars['String']['input'];
  /** The issuer of the identity */
  issuer: Scalars['String']['input'];
  /** The name of the identity */
  name: Scalars['String']['input'];
};

/** Criteria for filtering issuances for an identity. */
export type IdentityIssuanceWhere = {
  /** The ID of the contract that was issued. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the expiresAt period to include. */
  expiresFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the expiresAt period to include. */
  expiresTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** The start of the issuedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** Indicates whether the issued credential has face check photo. */
  hasFaceCheckPhoto?: InputMaybe<Scalars['Boolean']['input']>;
  /** The ID of the user (Person or Application) that issued the credential. */
  issuedById?: InputMaybe<Scalars['ID']['input']>;
  /** The presentation which included the issuance */
  presentationId?: InputMaybe<Scalars['ID']['input']>;
  /** The requestId of the issuance request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the platform user (application or person) that revoked the credential. */
  revokedById?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the revokedAt period to include. */
  revokedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the revokedAt period to include. */
  revokedTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** The status of the issuance. */
  status?: InputMaybe<IssuanceStatus>;
  /** The end of the issuedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** The identity issuer, referenced by ID, optionally having a user-facing label */
export type IdentityIssuer = {
  __typename?: 'IdentityIssuer';
  /** The id of the identity issuer */
  id: Scalars['ID']['output'];
  /** The label of the identity */
  label?: Maybe<Scalars['String']['output']>;
};

/** Columns that can be used for sorting identities. */
export enum IdentityOrderBy {
  /** The unique identifier of the identity in the issuing tenant */
  Identifier = 'identifier',
  /** The name of the identity. */
  Name = 'name'
}

/** Criteria for filtering identity presentations. */
export type IdentityPresentationWhere = {
  /** The ID of a contract used to make the presentation request. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the presentedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** Whether face check validation was requested. */
  isFaceCheckRequested?: InputMaybe<Scalars['Boolean']['input']>;
  /** The issuance that was presented */
  issuanceId?: InputMaybe<Scalars['ID']['input']>;
  /** The partner who issued the credential that was presented */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential presented. */
  presentedType?: InputMaybe<Scalars['String']['input']>;
  /** The requestId of the presentation request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the user (Person or Application) that requested & received the presentation. */
  requestedById?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential requested. */
  requestedType?: InputMaybe<Scalars['String']['input']>;
  /** The end of the presentedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Defines the searchable fields usable to find identities */
export type IdentityWhere = {
  /** The issuer of the identity to match */
  issuer?: InputMaybe<Scalars['String']['input']>;
  /** The name of the identity to match */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** An instance of a successful contract-to-credential issuance. */
export type Issuance = {
  __typename?: 'Issuance';
  /** The contract defining the issued credential. */
  contract: Contract;
  /**
   * When the issued credential expires according to the validity period of the contract.
   * @deprecated Renamed, use expiresAt instead
   */
  credentialExpiresAt: Scalars['DateTime']['output'];
  /** When the issued credential expires, according to the validity period of the published contract (at the time of issuance). */
  expiresAt: Scalars['DateTime']['output'];
  /** Indicates whether the issued credential has face check photo. */
  hasFaceCheckPhoto?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  /** The identity of the person who was issued the credential. */
  identity: Identity;
  /** Indicates whether the issued credential has been revoked. */
  isRevoked?: Maybe<Scalars['Boolean']['output']>;
  issuedAt: Scalars['DateTime']['output'];
  /** The platform user (application or person) that issued the credential. */
  issuedBy: User;
  /** Returns the successful credential presentations for this issuance. */
  presentations: Array<Presentation>;
  /** When the credential was revoked. */
  revokedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The platform user (application or person) that revoked the credential. */
  revokedBy?: Maybe<User>;
  /** The issuance status. */
  status: IssuanceStatus;
};


/** An instance of a successful contract-to-credential issuance. */
export type IssuancePresentationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<IssuancePresentationWhere>;
};

/** The callback endpoint is called when a user scans the QR code, uses the deep link the authenticator app, or finishes the issuance process. */
export type IssuanceCallbackEvent = {
  __typename?: 'IssuanceCallbackEvent';
  /** When the requestStatus property value is issuance_error, this property contains information about the error. */
  error?: Maybe<RequestError>;
  /** Mapped to the original request when the payload was posted to the Verifiable Credentials service. */
  requestId: Scalars['ID']['output'];
  requestStatus: IssuanceRequestStatus;
  /** The optional state value that you passed in the original request payload. */
  state?: Maybe<Scalars['String']['output']>;
};

/** Data representing an issuance event (see IssuanceRequestStatus, could be received, successful, failed). */
export type IssuanceEventData = {
  __typename?: 'IssuanceEventData';
  /** The callback event data */
  event: IssuanceCallbackEvent;
  /** The issuance data, if the issuance was successful */
  issuance?: Maybe<Issuance>;
};

/** Criteria for filtering issuance events. */
export type IssuanceEventWhere = {
  /** The ID of the contract to be issued. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the identity that the issuance is for. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the user (Person or Application) that requested issuance. */
  issuedById?: InputMaybe<Scalars['ID']['input']>;
  /** The requestId of the issuance request, returned from the createIssuanceRequest mutation. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** Only return events with the specified status. */
  status?: InputMaybe<IssuanceRequestStatus>;
};

/** Columns that can be used for sorting issuances. */
export enum IssuanceOrderBy {
  /** The name of the contract that was issued. */
  ContractName = 'contractName',
  /** The timestamp When the issued credential expires */
  ExpiresAt = 'expiresAt',
  /** The name of the identity that the issuance is for. */
  IdentityName = 'identityName',
  /** The timestamp when the credential was issued */
  IssuedAt = 'issuedAt',
  /** The name of the user (Person or Application) that requested issuance. */
  IssuedByName = 'issuedByName'
}

/** Criteria for filtering issuance presentations. */
export type IssuancePresentationWhere = {
  /** The start of the presentedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** The ID of the identity who presented the credential (if known). */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** Whether face check validation was requested. */
  isFaceCheckRequested?: InputMaybe<Scalars['Boolean']['input']>;
  /** The partner who issued the credential that was presented */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential presented. */
  presentedType?: InputMaybe<Scalars['String']['input']>;
  /** The requestId of the presentation request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the user (Person or Application) that requested & received the presentation. */
  requestedById?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential requested. */
  requestedType?: InputMaybe<Scalars['String']['input']>;
  /** The end of the presentedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/**
 * The issuance request payload contains information about your verifiable credentials issuance request.
 * The following example demonstrates an issuance request by using a PIN code flow with user claims, such as first name and last name.
 * The result of this request returns a QR code with a link to start the issuance process.
 */
export type IssuanceRequestInput = {
  callback?: InputMaybe<Callback>;
  /**
   * A collection of assertions made about the subject in the verifiable credential.
   * Must fulfill the contract claims definition.
   */
  claims?: InputMaybe<Scalars['JSONObject']['input']>;
  /** The ID of the contract you wish to issue */
  contractId: Scalars['ID']['input'];
  /**
   * Use this setting to explicitly control when a credential expires, regardless of when it is issued.
   * Please note that the date should be in ISO format.
   */
  expirationDate?: InputMaybe<Scalars['DateTime']['input']>;
  /**
   * The issuee's photo for the purpose of face check presentation verification, also displayed via the authenticator app.
   * The image content type and encoding must be: `image/jpg;base64`.
   * For more info on the photo requirements, see the [Face Check documentation](https://learn.microsoft.com/en-us/entra/verified-id/using-facecheck#what-are-the-requirements-for-the-photo-in-the-verified-id)
   */
  faceCheckPhoto?: InputMaybe<Scalars['String']['input']>;
  /**
   * The identity you wish to issue to (alternatively use the identityId property, if known)
   *
   * - Not required when issuing using a limited access token
   */
  identity?: InputMaybe<IdentityInput>;
  /**
   * The ID of the identity you wish to issue to (alternatively use the identity property)
   *
   * - Not required when issuing using a limited access token
   */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * Determines whether a QR code is included in the response of this request
   * Present the QR code and ask the user to scan it.
   * Scanning the QR code launches the authenticator app with this issuance request.
   * Possible values are true (default) or false.
   * When you set the value to false, use the return url property to render a deep link.
   */
  includeQRCode?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional PIN code required for the issuance. */
  pin?: InputMaybe<Pin>;
};

export type IssuanceRequestResponse = IssuanceResponse | RequestErrorResponse;

/** The status returned for the request. */
export enum IssuanceRequestStatus {
  /** There was an error during issuance. For details, see the error property. */
  IssuanceError = 'issuance_error',
  /** The issuance of the verifiable credentials was successful. */
  IssuanceSuccessful = 'issuance_successful',
  /** The user scanned the QR code or selected the link that starts the issuance flow. */
  RequestRetrieved = 'request_retrieved'
}

/**
 * Respresents a successful issuance.
 * When your app receives the response, the app needs to present the QR code to the user.
 * The user scans the QR code, which opens the authenticator app and starts the issuance process.
 */
export type IssuanceResponse = {
  __typename?: 'IssuanceResponse';
  /** Indicates when the response will expire. */
  expiry: Scalars['PositiveInt']['output'];
  /** A QR code that user can scan to start the issuance flow. */
  qrCode?: Maybe<Scalars['String']['output']>;
  /** An autogenerated request ID. The callback uses the same request, allowing you to keep track of the issuance request and its callbacks. */
  requestId: Scalars['ID']['output'];
  /** A URL that launches the authenticator app and starts the issuance process. You can present this URL to the user if they can't scan the QR code. */
  url: Scalars['URL']['output'];
};

/** The status of the issuance. */
export enum IssuanceStatus {
  Active = 'active',
  Expired = 'expired',
  Revoked = 'revoked'
}

/** Criteria for filtering issuances. */
export type IssuanceWhere = {
  /** The ID of the contract that was issued. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the expiresAt period to include. */
  expiresFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the expiresAt period to include. */
  expiresTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** The start of the issuedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** Indicates whether the issued credential has face check photo. */
  hasFaceCheckPhoto?: InputMaybe<Scalars['Boolean']['input']>;
  /** The ID of the identity that was issued the credential. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the user (Person or Application) that issued the credential. */
  issuedById?: InputMaybe<Scalars['ID']['input']>;
  /** The presentation which included the issuance */
  presentationId?: InputMaybe<Scalars['ID']['input']>;
  /** The requestId of the issuance request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the platform user (application or person) that revoked the credential. */
  revokedById?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the revokedAt period to include. */
  revokedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the revokedAt period to include. */
  revokedTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** The status of the issuance. */
  status?: InputMaybe<IssuanceStatus>;
  /** The end of the issuedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Input type for finding identity by issuer and identifier */
export type IssuerIdentifierInput = {
  /** The unique identifier of the identity in the issuer */
  identifier: Scalars['String']['input'];
  /** The issuer of the identity */
  issuer: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Acquire a limited access token, suitable for use in a client application, which can be used:
   * - to issue one or more credentials to a specified identity
   * - for presentations of one or more credentials from the specified identity (for scenarios where the identity is known via authentication or other means)
   * - for presentations of credentials from any identity (anonymous presentations)
   *
   * The following restrictions apply:
   * - For issuance and presentation operations, `requestId` is the only supported method to subscribe to issuance and presentation events.
   * - Issuance and presentation data can be queried, but only for the specified identity.
   */
  acquireLimitedAccessToken: AccessTokenResponse;
  /**
   * Acquire a limited approval token that can be used to:
   * - create presentation request anonymously
   * - fetch details of the approval request
   * - approve or reject the approval request
   */
  acquireLimitedApprovalToken: ApprovalTokenResponse;
  /** Actions an approval request. */
  actionApprovalRequest: ApprovalRequest;
  /** Creates a new approval request. */
  createApprovalRequest: ApprovalRequestResponse;
  /** Creates a new contract */
  createContract: Contract;
  /** The result of this request returns a QR code with a link to start the issuance process, or an error */
  createIssuanceRequest: IssuanceRequestResponse;
  /** Creates a partner whose credential types can be requested for presentation */
  createPartner: Partner;
  /** The result of this request returns a QR code with a link to start the presentation process, or an error */
  createPresentationRequest: PresentationRequestResponse;
  /** The result of this request returns a QR code with a link to start the presentation process, or an error */
  createPresentationRequestForApproval: PresentationRequestResponse;
  /** Creates a new template */
  createTemplate: Template;
  /** Deletes an existing contract. Only possible when the contract has not yet been provisioned. */
  deleteContract?: Maybe<Scalars['Void']['output']>;
  /** Deletes an existing template */
  deleteTemplate?: Maybe<Scalars['Void']['output']>;
  /** Deprecates an existing contract. */
  deprecateContract: Contract;
  /** Provisions or re-provisions a contract into the Verified ID service */
  provisionContract: Contract;
  /** Revokes existing credentials for a contract. */
  revokeContractIssuances: Scalars['ID']['output'];
  /** Revokes existing credentials for an identity. */
  revokeIdentityIssuances: Scalars['ID']['output'];
  /** Revokes an existing credential. */
  revokeIssuance: Issuance;
  /** Revokes existing credentials. */
  revokeIssuances: Scalars['ID']['output'];
  /** Revokes existing credentials issued by a user. */
  revokeUserIssuances: Scalars['ID']['output'];
  /** Creates or updates an identity based on its issuer and identifier */
  saveIdentity: Identity;
  /** Updates an existing contract */
  updateContract: Contract;
  /** Updates the name and credential types of a partner */
  updatePartner: Partner;
  /** Updates an existing template */
  updateTemplate: Template;
};


export type MutationAcquireLimitedAccessTokenArgs = {
  input: AcquireLimitedAccessTokenInput;
};


export type MutationAcquireLimitedApprovalTokenArgs = {
  input: AcquireLimitedApprovalTokenInput;
};


export type MutationActionApprovalRequestArgs = {
  id: Scalars['ID']['input'];
  input: ActionApprovalRequestInput;
};


export type MutationCreateApprovalRequestArgs = {
  request: ApprovalRequestInput;
};


export type MutationCreateContractArgs = {
  input: ContractInput;
};


export type MutationCreateIssuanceRequestArgs = {
  request: IssuanceRequestInput;
};


export type MutationCreatePartnerArgs = {
  input: CreatePartnerInput;
};


export type MutationCreatePresentationRequestArgs = {
  request: PresentationRequestInput;
};


export type MutationCreatePresentationRequestForApprovalArgs = {
  approvalRequestId: Scalars['ID']['input'];
  input?: InputMaybe<CreatePresentationRequestForApprovalInput>;
};


export type MutationCreateTemplateArgs = {
  input: TemplateInput;
};


export type MutationDeleteContractArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeprecateContractArgs = {
  id: Scalars['ID']['input'];
};


export type MutationProvisionContractArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRevokeContractIssuancesArgs = {
  contractId: Scalars['ID']['input'];
};


export type MutationRevokeIdentityIssuancesArgs = {
  identityId: Scalars['ID']['input'];
};


export type MutationRevokeIssuanceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRevokeIssuancesArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationRevokeUserIssuancesArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationSaveIdentityArgs = {
  input: IdentityInput;
};


export type MutationUpdateContractArgs = {
  id: Scalars['ID']['input'];
  input: ContractInput;
};


export type MutationUpdatePartnerArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePartnerInput;
};


export type MutationUpdateTemplateArgs = {
  id: Scalars['ID']['input'];
  input: TemplateInput;
};

/** A published contract via the Entra Verified ID network */
export type NetworkContract = {
  __typename?: 'NetworkContract';
  /** Claims included in the verifiable credential */
  claims: Array<Scalars['String']['output']>;
  /** The friendly name of this contract */
  name: Scalars['String']['output'];
  /** Types for this contract */
  types: Array<Scalars['String']['output']>;
};

/** An issuer via the Entra Verified ID network */
export type NetworkIssuer = {
  __typename?: 'NetworkIssuer';
  /** The DID for this verifiable credential service instance */
  did: Scalars['ID']['output'];
  /** An autogenerated unique ID, which can be used to retrieve or update the specific instance of the verifiable credential service */
  id: Scalars['ID']['output'];
  /** Indicates that this issuer is trusted (by this organisation) */
  isTrusted?: Maybe<Scalars['Boolean']['output']>;
  /** Domains linked to this DID */
  linkedDomainUrls: Array<Scalars['URL']['output']>;
  /** The friendly name of this instance of the verifiable credential service */
  name: Scalars['String']['output'];
  /** The Azure AD tenant identifier */
  tenantId: Scalars['ID']['output'];
};

/** Criteria used to find issuers from the Entra Verified ID network */
export type NetworkIssuersWhere = {
  /** Only include issuers that are trusted (by this organisation) */
  isTrusted?: InputMaybe<Scalars['Boolean']['input']>;
  linkedDomainUrlsLike?: InputMaybe<Scalars['String']['input']>;
};

export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

/** A credential issuer partner trusted by the platform */
export type Partner = {
  __typename?: 'Partner';
  /** When the partner was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the partner. */
  createdBy: User;
  /**
   * The type(s) of the contract / credential
   * Requires at least one type, and cannot have duplicate types
   */
  credentialTypes: Array<Scalars['String']['output']>;
  /** The DID of the partner */
  did: Scalars['String']['output'];
  /** The local id of this partner */
  id: Scalars['ID']['output'];
  /** The unique identifier of the verifiable credential service instance if the partner is on Entra network */
  issuerId?: Maybe<Scalars['ID']['output']>;
  /** Domains linked to this partner's DID */
  linkedDomainUrls?: Maybe<Array<Scalars['URL']['output']>>;
  /** The name of the partner */
  name: Scalars['String']['output'];
  /** Returns the successful credential presentations of credentails issued by this partner. */
  presentations: Array<Presentation>;
  /** The Azure AD tenant identifier if the partner is on Entra network */
  tenantId?: Maybe<Scalars['ID']['output']>;
  /** When the partner was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the partner. */
  updatedBy?: Maybe<User>;
};


/** A credential issuer partner trusted by the platform */
export type PartnerPresentationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<PartnerPresentationWhere>;
};

/** Columns that can be used for sorting partners. */
export enum PartnerOrderBy {
  /** The unique identifier of the verifiable credential service instance if the partner is on Entra network */
  IssuerId = 'issuerId',
  /** The name of the identity. */
  Name = 'name',
  /** The Azure AD tenant identifier if the partner is on Entra network */
  TenantId = 'tenantId'
}

/** Criteria for filtering presentations of credentials issued by the partner. */
export type PartnerPresentationWhere = {
  /** The ID of a contract used to make the presentation request. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the presentedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** The ID of the identity who presented the credential (if known). */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** Whether face check validation was requested. */
  isFaceCheckRequested?: InputMaybe<Scalars['Boolean']['input']>;
  /** The issuance that was presented */
  issuanceId?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential presented. */
  presentedType?: InputMaybe<Scalars['String']['input']>;
  /** The requestId of the presentation request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the user (Person or Application) that requested & received the presentation. */
  requestedById?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential requested. */
  requestedType?: InputMaybe<Scalars['String']['input']>;
  /** The end of the presentedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Defines the searchable fields usable to find partners */
export type PartnerWhere = {
  /** The type of credential the partner provides. */
  credentialType?: InputMaybe<Scalars['String']['input']>;
  /** The partial domain url linked to the partner to match */
  linkedDomainUrl?: InputMaybe<Scalars['String']['input']>;
  /** The partial name of the partner to match */
  name?: InputMaybe<Scalars['String']['input']>;
};

/**
 * The pin type defines a PIN code that can be displayed as part of the issuance.
 * Pin is optional, and, if used, should always be sent out-of-band.
 * When you're using a HASH PIN code, you must define the salt, alg, and iterations properties.
 */
export type Pin = {
  /** The hashing algorithm for the hashed PIN. Supported algorithm: sha256. */
  alg?: InputMaybe<Scalars['String']['input']>;
  /** The number of hashing iterations. Possible value: 1. */
  iterations?: InputMaybe<Scalars['PositiveInt']['input']>;
  /** The length of the PIN code. The default length is 6, the minimum is 4, and the maximum is 16. */
  length?: InputMaybe<Scalars['PositiveInt']['input']>;
  /** The salt of the hashed PIN code. The salt is prepended during hash computation. Encoding: UTF-8. */
  salt?: InputMaybe<Scalars['String']['input']>;
  /** The type of the PIN code. Possible value: numeric (default). */
  type?: InputMaybe<Scalars['String']['input']>;
  /** Contains the PIN value in plain text. When you're using a hashed PIN, the value property contains the salted hash, base64 encoded. */
  value: Scalars['String']['input'];
};

/** An instance of a successful credential presentation. */
export type Presentation = {
  __typename?: 'Presentation';
  id: Scalars['ID']['output'];
  /** The identity of the person who presented the credential (if known). */
  identity?: Maybe<Identity>;
  /** The issuances that were presented (which may be none, if the presented credentials were from an external issuer) */
  issuances: Array<Issuance>;
  /** The partners who issued the credentials that were presented (which may be none, if the presented credentials were internal) */
  partners: Array<Partner>;
  presentedAt: Scalars['DateTime']['output'];
  /** The credentials that were presented (excluding claims data) */
  presentedCredentials: Array<PresentedCredential>;
  /** The platform user (application or person) that requested the credential presentation. */
  requestedBy: User;
  /** The credentials that were requested */
  requestedCredentials: Array<RequestedCredential>;
};

/** The callback endpoint is called when a user scans the QR code, uses the deep link the authenticator app, or finishes the presentation process. */
export type PresentationCallbackEvent = {
  __typename?: 'PresentationCallbackEvent';
  /** When the requestStatus property value is presentation_error, this property contains information about the error. */
  error?: Maybe<RequestError>;
  /**
   * The receipt contains the original payload sent from the wallet to the Verifiable Credentials service.
   * The receipt should be used for troubleshooting/debugging only.
   * The format in the receipt isn't fix and can change based on the wallet and version used.
   */
  receipt?: Maybe<Scalars['JSONObject']['output']>;
  /** Mapped to the original request when the payload was posted to the Verifiable Credentials service. */
  requestId: Scalars['ID']['output'];
  requestStatus: PresentationRequestStatus;
  /** The optional state value that you passed in the original request payload. */
  state?: Maybe<Scalars['String']['output']>;
  /** The verifiable credential user DID. */
  subject?: Maybe<Scalars['String']['output']>;
  verifiedCredentialsData?: Maybe<Array<PresentedCredential>>;
};

/** Represents a credential presentation between a client application and a user (presenter of the credential and associated claims) */
export type PresentationEvent = {
  __typename?: 'PresentationEvent';
  /** The claims presented */
  claims: Scalars['JSONObject']['output'];
  /** The client application that requested the presentation */
  clientName: Scalars['String']['output'];
  /** The credential types that were specified as accepted for presentation */
  credentialTypes: Scalars['String']['output'];
  /** The list of issuers that were specified as accepted for presentation */
  issuers: Scalars['String']['output'];
  /** When the presentation was made */
  time: Scalars['DateTime']['output'];
};

/** Data representing an presentation event. */
export type PresentationEventData = {
  __typename?: 'PresentationEventData';
  /** The callback event data */
  event: PresentationCallbackEvent;
  /** The presentation data, if the presentation was successful */
  presentation?: Maybe<Presentation>;
};

/** Criteria for filtering presentation events. */
export type PresentationEventWhere = {
  /** The ID of the identity that the presentation is for. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** The requestId of the presentation request, returned from the createPresentationRequest mutation. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the user (Person or Application) that requested presentation. */
  requestedById?: InputMaybe<Scalars['ID']['input']>;
  /** Only return events with the specified status. */
  status?: InputMaybe<PresentationRequestStatus>;
  /**
   * The type of credential presented.
   * Note: type data is only available on complete presentation events; if specified, only complete presentations containing this type will be returned.
   */
  type?: InputMaybe<Scalars['String']['input']>;
};

/** Columns that can be used for sorting presentations. */
export enum PresentationOrderBy {
  /** The name of the identity who presented the credential. */
  IdentityName = 'identityName',
  /** The timestamp when the credential was presented */
  PresentedAt = 'presentedAt',
  /** The name of the user (Person or Application) that requested & received the presentation data. */
  RequestedByName = 'requestedByName'
}

/** The presentation request payload contains information about your verifiable credentials presentation request. */
export type PresentationRequestInput = {
  callback?: InputMaybe<Callback>;
  /**
   * The identity who will present (alternatively use the identityId property, if known).
   * Presentation identity information is only required for presentations where all requested credentials are issued by external partners.
   */
  identity?: InputMaybe<IdentityInput>;
  /**
   * The ID of the identity who will present (alternatively use the identity property).
   * Presentation identity information is only required for presentations where all requested credentials are issued by external partners.
   */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * Determines whether a QR code is included in the response of this request.
   * Present the QR code and ask the user to scan it.
   * Scanning the QR code launches the authenticator app with this presentation request.
   * Possible values are true (default) or false.
   * When you set the value to false, use the return url property to render a deep link.
   */
  includeQRCode?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Determines whether a receipt should be included in the response of this request.
   * Possible values are true or false (default).
   * The receipt contains the original payload sent from the authenticator to the Verifiable Credentials service.
   * The receipt is useful for troubleshooting or if you have the need to ge the full details of the payload.
   * There's otherwise no need be set this value to true by default.
   * In the OpenId Connect SIOP request, the receipt contains the ID token from the original request.
   */
  includeReceipt?: InputMaybe<Scalars['Boolean']['input']>;
  registration: PresentationRequestRegistration;
  /** A collection of RequestCredential objects representing the credentials the user needs to provide. */
  requestedCredentials: Array<RequestCredential>;
};

/** Provides information about the verifier. */
export type PresentationRequestRegistration = {
  /** A display name of the verifier of the verifiable credential. This name will be presented to the user in the authenticator app. */
  clientName: Scalars['String']['input'];
  /** A string that is displayed to inform the user why the verifiable credentials are being requested. */
  purpose?: InputMaybe<Scalars['String']['input']>;
};

export type PresentationRequestResponse = PresentationResponse | RequestErrorResponse;

/** The status returned for the request. */
export enum PresentationRequestStatus {
  /** The verifiable credential presentation failed, refer to the error property for details. */
  PresentationError = 'presentation_error',
  /** The verifiable credential validation completed successfully. */
  PresentationVerified = 'presentation_verified',
  /** The user scanned the QR code or selected the link that starts the presentation flow. */
  RequestRetrieved = 'request_retrieved'
}

/** Represents a successful presentation request response */
export type PresentationResponse = {
  __typename?: 'PresentationResponse';
  /** Indicates when the response will expire. */
  expiry: Scalars['PositiveInt']['output'];
  /** A QR code that the user can scan to start the presentation flow. */
  qrCode?: Maybe<Scalars['String']['output']>;
  /** An autogenerated request ID. The callback uses the same request, allowing you to keep track of the presentation request and its callbacks. */
  requestId: Scalars['ID']['output'];
  /** A URL that launches the authenticator app and starts the presentation process. You can present this URL to the user if they can't scan the QR code. */
  url: Scalars['URL']['output'];
};

/** Criteria for filtering presentations. */
export type PresentationWhere = {
  /** The ID of a contract that was presented. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the presentedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** The ID of the identity who presented the credential (if known). */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** Whether face check validation was requested. */
  isFaceCheckRequested?: InputMaybe<Scalars['Boolean']['input']>;
  /** The issuance that was presented */
  issuanceId?: InputMaybe<Scalars['ID']['input']>;
  /** The partner who issued the credential that was presented */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential presented. */
  presentedType?: InputMaybe<Scalars['String']['input']>;
  /** The requestId of the presentation request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the user (Person or Application) that requested & received the presentation data. */
  requestedById?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential requested. */
  requestedType?: InputMaybe<Scalars['String']['input']>;
  /** The end of the presentedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Loosely typed representation based on documentation / example event here: https://docs.microsoft.com/en-us/azure/active-directory/verifiable-credentials/presentation-request-api#callback-events */
export type PresentedCredential = {
  __typename?: 'PresentedCredential';
  claims: Scalars['JSONObject']['output'];
  credentialState: Scalars['JSONObject']['output'];
  domainValidation?: Maybe<Scalars['JSONObject']['output']>;
  faceCheck?: Maybe<FaceCheckResult>;
  issuer: Scalars['String']['output'];
  type: Array<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  /** Returns details of the action taken on the approval request. */
  actionedApprovalData?: Maybe<ActionedApprovalData>;
  /** Returns an approval request by ID. */
  approvalRequest: ApprovalRequest;
  /** Returns the details of the configured instance authority */
  authority: Authority;
  /** Returns a contract by ID */
  contract: Contract;
  /**
   * Returns a list of credential types, optionally filtered by the given criteria.
   * By default, all credential types are returned.
   */
  credentialTypes: Array<Scalars['String']['output']>;
  discovery: Discovery;
  /** Returns contracts, optionally matching the specified criteria */
  findContracts: Array<Contract>;
  /** Returns identites, optionally matching the specified criteria */
  findIdentities: Array<Identity>;
  /** Returns successful credential issuances, optionally matching the specified criteria. */
  findIssuances: Array<Issuance>;
  /**
   * Finds issuers from the Entra Verified ID network
   * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#searching-for-issuers
   */
  findNetworkIssuers: Array<NetworkIssuer>;
  /** Returns partners, optionally matching the specified criteria */
  findPartners: Array<Partner>;
  /** Returns successful credential presentations, optionally matching the specified criteria. */
  findPresentations: Array<Presentation>;
  /** Returns templates, optionally matching the specified criteria */
  findTemplates: Array<Template>;
  /** Returns home tenant user identies matching the specified criteria */
  findTenantIdentities: Array<TenantIdentity>;
  /** Returns users, optionally matching the specified criteria */
  findUsers: Array<User>;
  /** No-op query to test if the server is up and running. */
  healthcheck?: Maybe<Scalars['Void']['output']>;
  /** Returns a list of identities for the given IDs */
  identities: Array<Maybe<Identity>>;
  /** Returns a list of identities for the given issuer identifiers */
  identitiesByIdentifiers: Array<Maybe<Identity>>;
  /** Returns an identity by ID */
  identity: Identity;
  /** Returns the distinct set of issuers from all identities */
  identityIssuers: Array<IdentityIssuer>;
  /** Returns an issuance by ID */
  issuance: Issuance;
  /** Returns the issuance count, optionally matching the specified criteria. */
  issuanceCount: Scalars['NonNegativeInt']['output'];
  /** Returns the issuance count, grouped by Contract, optionally matching the specified criteria. */
  issuanceCountByContract: Array<ContractCount>;
  /** Returns the issuance count, grouped by User, optionally matching the specified criteria. */
  issuanceCountByUser: Array<UserCount>;
  /**
   * Lists the credential contract types for the specified network issuer
   * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#searching-for-published-credential-types-by-an-issuer
   */
  networkContracts: Array<NetworkContract>;
  /** Returns a partner by ID */
  partner: Partner;
  /** Returns a presentation by ID */
  presentation: Presentation;
  /** Returns the successful presentation count, optionally matching the specified criteria. */
  presentationCount: Scalars['NonNegativeInt']['output'];
  /** Returns the successful presentation count, grouped by Contract, optionally matching the specified criteria. */
  presentationCountByContract: Array<ContractCount>;
  /** Returns the successful presentation count, grouped by requesting User, optionally matching the specified criteria. */
  presentationCountByUser: Array<UserCount>;
  /** Returns a template by ID */
  template: Template;
  /** Returns the combined data of a template and its ancestors */
  templateCombinedData: TemplateParentData;
  /** Returns a user by ID */
  user: User;
};


export type QueryActionedApprovalDataArgs = {
  id: Scalars['ID']['input'];
};


export type QueryApprovalRequestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryContractArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCredentialTypesArgs = {
  where?: InputMaybe<CredentialTypesWhere>;
};


export type QueryFindContractsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<ContractOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ContractWhere>;
};


export type QueryFindIdentitiesArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<IdentityOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<IdentityWhere>;
};


export type QueryFindIssuancesArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<IssuanceOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<IssuanceWhere>;
};


export type QueryFindNetworkIssuersArgs = {
  where: NetworkIssuersWhere;
};


export type QueryFindPartnersArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<PartnerOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<PartnerWhere>;
};


export type QueryFindPresentationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<PresentationOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<PresentationWhere>;
};


export type QueryFindTemplatesArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<TemplateWhere>;
};


export type QueryFindTenantIdentitiesArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  where: TenantIdentityWhere;
};


export type QueryFindUsersArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<UserOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<UserWhere>;
};


export type QueryIdentitiesArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type QueryIdentitiesByIdentifiersArgs = {
  filters?: InputMaybe<Array<IssuerIdentifierInput>>;
};


export type QueryIdentityArgs = {
  id: Scalars['ID']['input'];
};


export type QueryIssuanceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryIssuanceCountArgs = {
  where?: InputMaybe<IssuanceWhere>;
};


export type QueryIssuanceCountByContractArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<IssuanceWhere>;
};


export type QueryIssuanceCountByUserArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<IssuanceWhere>;
};


export type QueryNetworkContractsArgs = {
  issuerId: Scalars['ID']['input'];
  tenantId: Scalars['ID']['input'];
};


export type QueryPartnerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPresentationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPresentationCountArgs = {
  where?: InputMaybe<PresentationWhere>;
};


export type QueryPresentationCountByContractArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<PresentationWhere>;
};


export type QueryPresentationCountByUserArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<PresentationWhere>;
};


export type QueryTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTemplateCombinedDataArgs = {
  templateId: Scalars['ID']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

/** Provides configuration information about the presentation request */
export type RequestConfiguration = {
  validation?: InputMaybe<ConfigurationValidation>;
};

/** Validation information on the presentation request */
export type RequestConfigurationValidation = {
  __typename?: 'RequestConfigurationValidation';
  /** Determines if a revoked credential should be accepted. Default is false (it shouldn't be accepted). */
  allowRevoked?: Maybe<Scalars['Boolean']['output']>;
  /**
   * Determines whether face check validation should be performed for this credential and provides optional settings.
   * If wish to perform face check validation using default settings, set this field to an empty object.
   */
  faceCheck?: Maybe<FaceCheckValidation>;
  /** Determines if the linked domain should be validated. Default is false. Setting this flag to false means you as a Relying Party application accept credentials from unverified linked domain. Setting this flag to true means the linked domain will be validated and only verified domains will be accepted. */
  validateLinkedDomain?: Maybe<Scalars['Boolean']['output']>;
};

/** Provides information about the requested credentials the user needs to provide. */
export type RequestCredential = {
  /**
   * A collection of issuers' DIDs that could issue the type of verifiable credential that subjects can present.
   * If not specified, the Verified Orchestration platform issuer DID will be used.
   * This field should only be used when requesting credentials from external issuers.
   */
  acceptedIssuers?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Optional settings for presentation validation. */
  configuration?: InputMaybe<RequestConfiguration>;
  /** Provide information about the purpose of requesting this verifiable credential. */
  purpose?: InputMaybe<Scalars['String']['input']>;
  /**
   * The verifiable credential type.
   * The type must match the type as defined in the issuer verifiable credential manifest.
   */
  type: Scalars['String']['input'];
};

/** Contains information about the error. */
export type RequestError = {
  __typename?: 'RequestError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

/** Represents an error returned by the request API (issuance or presentation requests) */
export type RequestErrorResponse = {
  __typename?: 'RequestErrorResponse';
  /** The time of the error. */
  date: Scalars['DateTime']['output'];
  /** The outer error object */
  error: RequestErrorWithInner;
  /** Internal Microsoft code. */
  mscv: Scalars['String']['output'];
  /** An autogenerated request ID. */
  requestId: Scalars['ID']['output'];
};

/** Contains information about the error. */
export type RequestErrorWithInner = {
  __typename?: 'RequestErrorWithInner';
  /** The return error code matching the HTTP Status Code. */
  code: Scalars['String']['output'];
  /** Provide details on what caused the error. */
  innererror: RequestInnerError;
  /** A standardized error message that is also dependent on the HTTP status code returned. */
  message: Scalars['String']['output'];
};

/** Contains error specific details useful to the developer to help investigate the current failure. */
export type RequestInnerError = {
  __typename?: 'RequestInnerError';
  /** The internal error code. Contains a standardized code, based on the type of the error */
  code: Scalars['String']['output'];
  /** The internal error message. Contains a detailed message of the error. */
  message: Scalars['String']['output'];
  /** Contains the field in the request that is causing this error. This field is optional and may not be present, depending on the error type. */
  target?: Maybe<Scalars['String']['output']>;
};

/** The configuration information used on the presentation request */
export type RequestedConfiguration = {
  __typename?: 'RequestedConfiguration';
  validation?: Maybe<RequestConfigurationValidation>;
};

/** Provides information about the requested credential for an presentation. */
export type RequestedCredential = {
  __typename?: 'RequestedCredential';
  /** A collection of issuers' DIDs that could issue the type of verifiable credential requested for issuance. */
  acceptedIssuers?: Maybe<Array<Scalars['String']['output']>>;
  /** Optional settings for presentation validation. */
  configuration?: Maybe<RequestedConfiguration>;
  /** The purpose of requesting presentation of the credential. */
  purpose?: Maybe<Scalars['String']['output']>;
  /** The verifiable credential type that was requested */
  type: Scalars['String']['output'];
};

/** Specification for a RequestedCredential that limited-access clients may request presentations of. */
export type RequestedCredentialSpecificationInput = {
  /**
   * The issuer DIDs that can be used in each requested credential.
   * If not specified, the home tenant DID is the only accepted issuer.
   * Note: external issuers are not supported for anonymous presentations.
   */
  acceptedIssuers?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The verifiable credential type that can be requested for presentation */
  credentialType: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Returns event data when the background job progresses from being queued to completed or failed */
  backgroundJobEvent: BackgroundJobEventData;
  /** Returns event data when an issuance callback is received */
  issuanceEvent: IssuanceEventData;
  /** Returns event data when an presentation callback is received */
  presentationEvent: PresentationEventData;
};


export type SubscriptionBackgroundJobEventArgs = {
  where?: InputMaybe<BackgroundJobEventWhere>;
};


export type SubscriptionIssuanceEventArgs = {
  where?: InputMaybe<IssuanceEventWhere>;
};


export type SubscriptionPresentationEventArgs = {
  where?: InputMaybe<PresentationEventWhere>;
};

/** Defines a template that can be used as a base for a contract */
export type Template = {
  __typename?: 'Template';
  /** This templates children, if any. */
  children: Array<Template>;
  /** The combined representation of this template, it's parent + ancestors, if any. */
  combinedData?: Maybe<TemplateParentData>;
  /** The template contracts, if any */
  contracts: Array<Contract>;
  /** When the template was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the template. */
  createdBy: User;
  /** The type(s) of the contract / credential */
  credentialTypes?: Maybe<Array<Scalars['String']['output']>>;
  /**
   * The description of the template
   * @deprecated no longer in use
   */
  description: Scalars['String']['output'];
  /** The full or partial credential display definition defined by this template, if any. */
  display?: Maybe<TemplateDisplayModel>;
  /** The type of face check photo support */
  faceCheckSupport?: Maybe<FaceCheckPhotoSupport>;
  /** The unique identifier for the template */
  id: Scalars['ID']['output'];
  /** Defines whether the contracts created from this template will be published in the Verified Credentials Network */
  isPublic?: Maybe<Scalars['Boolean']['output']>;
  /** The name of the template */
  name: Scalars['String']['output'];
  /** The parent template, if any. */
  parent?: Maybe<Template>;
  /** The combined representation of this template's parent + ancestors, if any. */
  parentData?: Maybe<TemplateParentData>;
  /** When the template was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the template. */
  updatedBy?: Maybe<User>;
  /** The lifespan of the credential expressed in seconds */
  validityIntervalInSeconds?: Maybe<Scalars['PositiveInt']['output']>;
};

/** Defines a claim included in a verifiable credential */
export type TemplateDisplayClaim = {
  __typename?: 'TemplateDisplayClaim';
  /** The name of the claim to which the label applies */
  claim: Scalars['String']['output'];
  /** The description of the claim */
  description?: Maybe<Scalars['String']['output']>;
  /** The label of the claim */
  label: Scalars['String']['output'];
  /**
   * The type of the claim
   * Valid values encountered so far are:
   *   - String
   *   - image/jpg;base64url (in the Verified Employee contract)
   */
  type: Scalars['String']['output'];
  /**
   * The value for the claim
   * If provided, the value is fixed for all credentials referencing this claim
   * If not provided, the value will need to be provided by one of the child template or contract
   */
  value?: Maybe<Scalars['String']['output']>;
};

/** Supplemental data when the verifiable credential is issued */
export type TemplateDisplayConsent = {
  __typename?: 'TemplateDisplayConsent';
  /** Supplemental text to use when displaying consent */
  instructions?: Maybe<Scalars['String']['output']>;
  /** Title of the consent */
  title?: Maybe<Scalars['String']['output']>;
};

/**
 * The display properties of the verifiable credential at the template level
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/credential-design#display-definition-wallet-credential-visuals
 */
export type TemplateDisplayCredential = {
  __typename?: 'TemplateDisplayCredential';
  /** Background color of the credential */
  backgroundColor?: Maybe<Scalars['HexColorCode']['output']>;
  /** Supplemental text displayed alongside each credential */
  description?: Maybe<Scalars['String']['output']>;
  /** The name of the issuer of the credential */
  issuedBy?: Maybe<Scalars['String']['output']>;
  /** Logo information of the credential */
  logo?: Maybe<TemplateDisplayCredentialLogo>;
  /** Text color of the credential */
  textColor?: Maybe<Scalars['HexColorCode']['output']>;
  /** Title of the credential */
  title?: Maybe<Scalars['String']['output']>;
};

/**
 * Defines the logo displayed on the credential
 * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/rules-and-display-definitions-model#displaycredentiallogo-type
 */
export type TemplateDisplayCredentialLogo = {
  __typename?: 'TemplateDisplayCredentialLogo';
  /** The description of the logo */
  description?: Maybe<Scalars['String']['output']>;
  /** The base-64 encoded logo in [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) format */
  image?: Maybe<Scalars['String']['output']>;
  /** URI of the logo */
  uri?: Maybe<Scalars['URL']['output']>;
};

/** Credential display definitions at the template level */
export type TemplateDisplayModel = {
  __typename?: 'TemplateDisplayModel';
  card?: Maybe<TemplateDisplayCredential>;
  claims?: Maybe<Array<TemplateDisplayClaim>>;
  consent?: Maybe<TemplateDisplayConsent>;
  locale?: Maybe<Scalars['Locale']['output']>;
};

/** Defines the input to create or update a template */
export type TemplateInput = {
  /** The type(s) of the contract / credential */
  credentialTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The full or partial credential display definition defined by this template, if any. */
  display?: InputMaybe<CreateUpdateTemplateDisplayModelInput>;
  /** The type of face check photo support */
  faceCheckSupport?: InputMaybe<FaceCheckPhotoSupport>;
  /** Defines whether the contracts created from this template will be published in the Verified Credentials Network */
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  /** The name of the template */
  name: Scalars['String']['input'];
  /** The ID of the parent template, if any */
  parentTemplateId?: InputMaybe<Scalars['ID']['input']>;
  /** The lifespan of the credential expressed in seconds */
  validityIntervalInSeconds?: InputMaybe<Scalars['PositiveInt']['input']>;
};

/** Represents the combined data of parent templates */
export type TemplateParentData = {
  __typename?: 'TemplateParentData';
  /** The type(s) of the contract / credential */
  credentialTypes?: Maybe<Array<Scalars['String']['output']>>;
  /** The full or partial credential display definition defined by this template, if any. */
  display?: Maybe<TemplateDisplayModel>;
  /** The type of face check photo support */
  faceCheckSupport?: Maybe<FaceCheckPhotoSupport>;
  /** Defines whether the contracts created from this template will be published in the Verified Credentials Network */
  isPublic?: Maybe<Scalars['Boolean']['output']>;
  /** The lifespan of the credential expressed in seconds */
  validityIntervalInSeconds?: Maybe<Scalars['PositiveInt']['output']>;
};

/** Defines the filter critiera used to find templates */
export type TemplateWhere = {
  /** List only the templates which include any of these credential types */
  credentialTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** List only root templates (without a parent) */
  isRoot?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only templates matching this name */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Represents a home tenant identity */
export type TenantIdentity = {
  __typename?: 'TenantIdentity';
  /** The OID of this user identity within the home tenant */
  id: Scalars['ID']['output'];
  /** The issuer (tenant ID) of this user identity */
  issuer: Scalars['String']['output'];
  /** The displayName of the user identity */
  name: Scalars['String']['output'];
  /** The userType, usually 'Member' or 'Guest' */
  userType: Scalars['String']['output'];
};

/** Defines criteria used to find home tenant identities */
export type TenantIdentityWhere = {
  /** The partial name of the user to match */
  nameStartsWith: Scalars['String']['input'];
};

/** Input type for updating a new partner */
export type UpdatePartnerInput = {
  /**
   * The type(s) of the contract / credential
   * Requires at least one type, and cannot have duplicate types
   */
  credentialTypes: Array<Scalars['String']['input']>;
  /** The name of the partner */
  name: Scalars['String']['input'];
};

/**
 * Represents a user of the platform, whether a person (interactive user) or a third-party application.
 * Users are members of the platform home tenant, people are AAD tenant users, applications are app registrations.
 */
export type User = {
  __typename?: 'User';
  /**
   * The email of the user
   * Only specified for interactive users; null for applications
   */
  email?: Maybe<Scalars['String']['output']>;
  /** The ID of the user */
  id: Scalars['ID']['output'];
  /** Indicates whether the user is an application */
  isApp: Scalars['Boolean']['output'];
  /** Returns the successful credential issuances this user has made (issuance.issuedBy => user). */
  issuances: Array<Issuance>;
  /**
   * The name of the user
   * For applications, this is a unique identifier
   */
  name: Scalars['String']['output'];
  /** Returns the successful credential presentations this user has requested (presentation.requestedBy => user). */
  presentations: Array<Presentation>;
};


/**
 * Represents a user of the platform, whether a person (interactive user) or a third-party application.
 * Users are members of the platform home tenant, people are AAD tenant users, applications are app registrations.
 */
export type UserIssuancesArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<UserIssuanceWhere>;
};


/**
 * Represents a user of the platform, whether a person (interactive user) or a third-party application.
 * Users are members of the platform home tenant, people are AAD tenant users, applications are app registrations.
 */
export type UserPresentationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<UserPresentationWhere>;
};

/** Represents a count of occurrences of a user. */
export type UserCount = {
  __typename?: 'UserCount';
  /** The number of occurrences of this user. */
  count: Scalars['NonNegativeInt']['output'];
  /** The user (Person or Application). */
  user: User;
};

/** Criteria for filtering issuances for a user. */
export type UserIssuanceWhere = {
  /** The ID of the contract that was issued. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the expiresAt period to include. */
  expiresFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the expiresAt period to include. */
  expiresTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** The start of the issuedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** Indicates whether the issued credential has face check photo. */
  hasFaceCheckPhoto?: InputMaybe<Scalars['Boolean']['input']>;
  /** The ID of the identity that was issued the credential. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** The presentation which included the issuance */
  presentationId?: InputMaybe<Scalars['ID']['input']>;
  /** The requestId of the issuance request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the platform user (application or person) that revoked the credential. */
  revokedById?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the revokedAt period to include. */
  revokedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the revokedAt period to include. */
  revokedTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** The status of the issuance. */
  status?: InputMaybe<IssuanceStatus>;
  /** The end of the issuedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Columns that can be used for sorting users. */
export enum UserOrderBy {
  /** The email of the user. */
  Email = 'email',
  /** The name of the user. */
  Name = 'name'
}

/** Criteria for filtering user presentations. */
export type UserPresentationWhere = {
  /** The ID of a contract used to make the presentation request. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the presentedAt period to include. */
  from?: InputMaybe<Scalars['DateTime']['input']>;
  /** The ID of the identity who presented the credential (if known). */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** Whether face check validation was requested. */
  isFaceCheckRequested?: InputMaybe<Scalars['Boolean']['input']>;
  /** The issuance that was presented */
  issuanceId?: InputMaybe<Scalars['ID']['input']>;
  /** The partner who issued the credential that was presented */
  partnerId?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential presented. */
  presentedType?: InputMaybe<Scalars['String']['input']>;
  /** The requestId of the presentation request. */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  /** The type of credential requested. */
  requestedType?: InputMaybe<Scalars['String']['input']>;
  /** The end of the presentedAt period to include. */
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Defines the searchable fields usable to find users */
export type UserWhere = {
  /**
   * The email of the user to match
   * Note: only relevent for users who are people, applications don't have an email
   */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Matches users that are applications (or not - people) */
  isApp?: InputMaybe<Scalars['Boolean']['input']>;
  /** The name of the user to match */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** DID information for the Web model */
export type WebDidModel = {
  __typename?: 'WebDidModel';
  did: Scalars['ID']['output'];
  didDocumentStatus: DidDocumentStatus;
  linkedDomainUrls: Array<Scalars['URL']['output']>;
};

export type CreateApprovalRequestMutationVariables = Exact<{
  input: ApprovalRequestInput;
}>;


export type CreateApprovalRequestMutation = { __typename?: 'Mutation', createApprovalRequest: { __typename?: 'ApprovalRequestResponse', id: string, portalUrl: string, callbackSecret: string } };

export type ActionApprovalRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ActionApprovalRequestInput;
}>;


export type ActionApprovalRequestMutation = { __typename?: 'Mutation', actionApprovalRequest: { __typename?: 'ApprovalRequest', id: string, status: ApprovalRequestStatus, isApproved?: boolean | null, actionedComment?: string | null } };

export type FindActionedApprovalDataQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type FindActionedApprovalDataQuery = { __typename?: 'Query', actionedApprovalData?: { __typename?: 'ActionedApprovalData', approvalRequestId: string, correlationId?: string | null, requestData?: Record<string, unknown> | null, state?: string | null, isApproved: boolean, actionedComment?: string | null, actionedAt: Date, callbackSecret: string, actionedBy?: { __typename?: 'ActionedBy', id: string, name: string } | null } | null };

export type ApprovalRequestQueryVariables = Exact<{
  approvalRequestId: Scalars['ID']['input'];
}>;


export type ApprovalRequestQuery = { __typename?: 'Query', approvalRequest: { __typename?: 'ApprovalRequest', id: string, requestedAt: Date, expiresAt: Date, requestType: string, correlationId?: string | null, referenceUrl?: string | null, purpose: string, requestData?: Record<string, unknown> | null, actionedComment?: string | null, status: ApprovalRequestStatus } };

export type ContractFragmentFragment = { __typename?: 'Contract', id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> } };

export type CreateContractMutationVariables = Exact<{
  input: ContractInput;
}>;


export type CreateContractMutation = { __typename?: 'Mutation', createContract: { __typename?: 'Contract', id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> } } };

export type DeprecateContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeprecateContractMutation = { __typename?: 'Mutation', deprecateContract: { __typename?: 'Contract', externalId?: string | null, provisionedAt?: Date | null, lastProvisionedAt?: Date | null, isDeprecated?: boolean | null, deprecatedAt?: Date | null, id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> } } };

export type GetContractQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetContractQuery = { __typename?: 'Query', contract: { __typename?: 'Contract', id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> } } };

export type ProvisionContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ProvisionContractMutation = { __typename?: 'Mutation', provisionContract: { __typename?: 'Contract', externalId?: string | null, provisionedAt?: Date | null, lastProvisionedAt?: Date | null, id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> } } };

export type UpdateContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ContractInput;
}>;


export type UpdateContractMutation = { __typename?: 'Mutation', updateContract: { __typename?: 'Contract', id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> } } };

export type HealthcheckQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthcheckQuery = { __typename?: 'Query', healthcheck?: null | undefined | void | null };

export type IdentityQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type IdentityQuery = { __typename?: 'Query', identity: { __typename?: 'Identity', id: string, issuer: string, identifier: string, name: string } };

export type SaveIdentityMutationVariables = Exact<{
  input: IdentityInput;
}>;


export type SaveIdentityMutation = { __typename?: 'Mutation', saveIdentity: { __typename?: 'Identity', id: string, issuer: string, identifier: string, name: string } };

export type FindIdentitiesQueryVariables = Exact<{
  where?: InputMaybe<IdentityWhere>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
}>;


export type FindIdentitiesQuery = { __typename?: 'Query', findIdentities: Array<{ __typename?: 'Identity', id: string, issuer: string, identifier: string, name: string }> };

export type AcquireLimitedAccessTokenMutationVariables = Exact<{
  input: AcquireLimitedAccessTokenInput;
}>;


export type AcquireLimitedAccessTokenMutation = { __typename?: 'Mutation', acquireLimitedAccessToken: { __typename?: 'AccessTokenResponse', expires: Date, token: string } };

export type FindContractsQueryVariables = Exact<{
  where?: InputMaybe<ContractWhere>;
  forIdentityId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type FindContractsQuery = { __typename?: 'Query', findContracts: Array<{ __typename?: 'Contract', id: string, credentialTypes: Array<string>, display: { __typename?: 'ContractDisplayModel', card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, description: string } } }, issuances: Array<{ __typename?: 'Issuance', id: string, issuedAt: Date, expiresAt: Date }>, presentations: Array<{ __typename?: 'Presentation', id: string, presentedAt: Date }> }> };

export type ContractQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  forIdentityId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type ContractQuery = { __typename?: 'Query', contract: { __typename?: 'Contract', id: string, credentialTypes: Array<string>, display: { __typename?: 'ContractDisplayModel', card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, description: string } } }, issuances: Array<{ __typename?: 'Issuance', id: string, issuedAt: Date, expiresAt: Date }>, presentations: Array<{ __typename?: 'Presentation', id: string, presentedAt: Date }> } };

export type FindIssuancesQueryVariables = Exact<{
  where?: InputMaybe<IssuanceWhere>;
}>;


export type FindIssuancesQuery = { __typename?: 'Query', findIssuances: Array<{ __typename?: 'Issuance', issuedAt: Date }> };

export type CredentialTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type CredentialTypesQuery = { __typename?: 'Query', credentialTypes: Array<string> };

export type CreateIssuanceRequestMutationVariables = Exact<{
  request: IssuanceRequestInput;
}>;


export type CreateIssuanceRequestMutation = { __typename?: 'Mutation', createIssuanceRequest: { __typename?: 'IssuanceResponse', requestId: string, url: string, qrCode?: string | null } | { __typename?: 'RequestErrorResponse', error: { __typename?: 'RequestErrorWithInner', code: string, message: string } } };

export type CreatePresentationRequestMutationVariables = Exact<{
  request: PresentationRequestInput;
}>;


export type CreatePresentationRequestMutation = { __typename?: 'Mutation', createPresentationRequest: { __typename?: 'PresentationResponse', requestId: string, url: string, qrCode?: string | null, expiry: number } | { __typename?: 'RequestErrorResponse', error: { __typename?: 'RequestErrorWithInner', code: string, message: string, innererror: { __typename?: 'RequestInnerError', code: string, message: string, target?: string | null } } } };

export type AcquireLimitedApprovalTokenMutationVariables = Exact<{
  input: AcquireLimitedApprovalTokenInput;
}>;


export type AcquireLimitedApprovalTokenMutation = { __typename?: 'Mutation', acquireLimitedApprovalToken: { __typename?: 'ApprovalTokenResponse', token: string, expires: Date } };

export type TemplateParentDataFragmentFragment = { __typename?: 'Template', parentData?: { __typename?: 'TemplateParentData', isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> | null } | null } | null };

export type GetTemplateParentDataQueryQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTemplateParentDataQueryQuery = { __typename?: 'Query', template: { __typename?: 'Template', parentData?: { __typename?: 'TemplateParentData', isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> | null } | null } | null } };

export type TemplateFragmentFragment = { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, parent?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> | null } | null };

export type CreateTemplateMutationVariables = Exact<{
  input: TemplateInput;
}>;


export type CreateTemplateMutation = { __typename?: 'Mutation', createTemplate: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, parent?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> | null } | null } };

export type GetTemplateQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTemplateQuery = { __typename?: 'Query', template: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, parent?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> | null } | null } };

export type UpdateTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: TemplateInput;
}>;


export type UpdateTemplateMutation = { __typename?: 'Mutation', updateTemplate: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, parent?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: string, description?: string | null, value?: string | null }> | null } | null } };

export type CreatePartnerMutationVariables = Exact<{
  input: CreatePartnerInput;
}>;


export type CreatePartnerMutation = { __typename?: 'Mutation', createPartner: { __typename?: 'Partner', id: string } };

export const ContractFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<ContractFragmentFragment, unknown>;
export const TemplateParentDataFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateParentDataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]}}]} as unknown as DocumentNode<TemplateParentDataFragmentFragment, unknown>;
export const TemplateFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<TemplateFragmentFragment, unknown>;
export const CreateApprovalRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateApprovalRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ApprovalRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createApprovalRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"portalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"callbackSecret"}}]}}]}}]} as unknown as DocumentNode<CreateApprovalRequestMutation, CreateApprovalRequestMutationVariables>;
export const ActionApprovalRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActionApprovalRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ActionApprovalRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actionApprovalRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isApproved"}},{"kind":"Field","name":{"kind":"Name","value":"actionedComment"}}]}}]}}]} as unknown as DocumentNode<ActionApprovalRequestMutation, ActionApprovalRequestMutationVariables>;
export const FindActionedApprovalDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindActionedApprovalData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actionedApprovalData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvalRequestId"}},{"kind":"Field","name":{"kind":"Name","value":"correlationId"}},{"kind":"Field","name":{"kind":"Name","value":"requestData"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"isApproved"}},{"kind":"Field","name":{"kind":"Name","value":"actionedComment"}},{"kind":"Field","name":{"kind":"Name","value":"actionedAt"}},{"kind":"Field","name":{"kind":"Name","value":"actionedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"callbackSecret"}}]}}]}}]} as unknown as DocumentNode<FindActionedApprovalDataQuery, FindActionedApprovalDataQueryVariables>;
export const ApprovalRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ApprovalRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approvalRequestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvalRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approvalRequestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requestedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"requestType"}},{"kind":"Field","name":{"kind":"Name","value":"correlationId"}},{"kind":"Field","name":{"kind":"Name","value":"referenceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"requestData"}},{"kind":"Field","name":{"kind":"Name","value":"actionedComment"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ApprovalRequestQuery, ApprovalRequestQueryVariables>;
export const CreateContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContractInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<CreateContractMutation, CreateContractMutationVariables>;
export const DeprecateContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeprecateContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deprecateContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}},{"kind":"Field","name":{"kind":"Name","value":"externalId"}},{"kind":"Field","name":{"kind":"Name","value":"provisionedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastProvisionedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isDeprecated"}},{"kind":"Field","name":{"kind":"Name","value":"deprecatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<DeprecateContractMutation, DeprecateContractMutationVariables>;
export const GetContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<GetContractQuery, GetContractQueryVariables>;
export const ProvisionContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProvisionContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provisionContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}},{"kind":"Field","name":{"kind":"Name","value":"externalId"}},{"kind":"Field","name":{"kind":"Name","value":"provisionedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastProvisionedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<ProvisionContractMutation, ProvisionContractMutationVariables>;
export const UpdateContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContractInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<UpdateContractMutation, UpdateContractMutationVariables>;
export const HealthcheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Healthcheck"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"healthcheck"}}]}}]} as unknown as DocumentNode<HealthcheckQuery, HealthcheckQueryVariables>;
export const IdentityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Identity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuer"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<IdentityQuery, IdentityQueryVariables>;
export const SaveIdentityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveIdentity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveIdentity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuer"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<SaveIdentityMutation, SaveIdentityMutationVariables>;
export const FindIdentitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindIdentities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityWhere"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findIdentities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuer"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<FindIdentitiesQuery, FindIdentitiesQueryVariables>;
export const AcquireLimitedAccessTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcquireLimitedAccessToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AcquireLimitedAccessTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acquireLimitedAccessToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"expires"}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<AcquireLimitedAccessTokenMutation, AcquireLimitedAccessTokenMutationVariables>;
export const FindContractsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindContracts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ContractWhere"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findContracts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"issuances"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"presentations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"presentedAt"}}]}}]}}]}}]} as unknown as DocumentNode<FindContractsQuery, FindContractsQueryVariables>;
export const ContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Contract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"issuances"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"presentations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"presentedAt"}}]}}]}}]}}]} as unknown as DocumentNode<ContractQuery, ContractQueryVariables>;
export const FindIssuancesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindIssuances"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"IssuanceWhere"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findIssuances"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}}]}}]}}]} as unknown as DocumentNode<FindIssuancesQuery, FindIssuancesQueryVariables>;
export const CredentialTypesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CredentialTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<CredentialTypesQuery, CredentialTypesQueryVariables>;
export const CreateIssuanceRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateIssuanceRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"request"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"IssuanceRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createIssuanceRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"Variable","name":{"kind":"Name","value":"request"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IssuanceResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RequestErrorResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateIssuanceRequestMutation, CreateIssuanceRequestMutationVariables>;
export const CreatePresentationRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePresentationRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"request"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PresentationRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPresentationRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"Variable","name":{"kind":"Name","value":"request"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PresentationResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}},{"kind":"Field","name":{"kind":"Name","value":"expiry"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RequestErrorResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"innererror"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"target"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreatePresentationRequestMutation, CreatePresentationRequestMutationVariables>;
export const AcquireLimitedApprovalTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcquireLimitedApprovalToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AcquireLimitedApprovalTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acquireLimitedApprovalToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expires"}}]}}]}}]} as unknown as DocumentNode<AcquireLimitedApprovalTokenMutation, AcquireLimitedApprovalTokenMutationVariables>;
export const GetTemplateParentDataQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTemplateParentDataQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"template"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateParentDataFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateParentDataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]}}]} as unknown as DocumentNode<GetTemplateParentDataQueryQuery, GetTemplateParentDataQueryQueryVariables>;
export const CreateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<CreateTemplateMutation, CreateTemplateMutationVariables>;
export const GetTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"template"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<GetTemplateQuery, GetTemplateQueryVariables>;
export const UpdateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<UpdateTemplateMutation, UpdateTemplateMutationVariables>;
export const CreatePartnerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePartner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePartnerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPartner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreatePartnerMutation, CreatePartnerMutationVariables>;


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

/** Mapping of union types */
export type ResolversUnionTypes<_RefType extends Record<string, unknown>> = {
  BackgroundJobEvent: ( BackgroundJobActiveEvent ) | ( BackgroundJobCompletedEvent ) | ( BackgroundJobErrorEvent ) | ( BackgroundJobProgressEvent );
  IssuanceRequestResponse: ( IssuanceResponse ) | ( RequestErrorResponse );
  PresentationRequestResponse: ( PresentationResponse ) | ( RequestErrorResponse );
};


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AccessTokenResponse: ResolverTypeWrapper<AccessTokenResponse>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  AcquireLimitedAccessTokenInput: AcquireLimitedAccessTokenInput;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  AcquireLimitedApprovalTokenInput: AcquireLimitedApprovalTokenInput;
  ActionApprovalRequestInput: ActionApprovalRequestInput;
  ActionedApprovalData: ResolverTypeWrapper<ActionedApprovalData>;
  ActionedBy: ResolverTypeWrapper<ActionedBy>;
  ApprovalRequest: ResolverTypeWrapper<ApprovalRequestEntity>;
  ApprovalRequestInput: ApprovalRequestInput;
  ApprovalRequestPresentationInput: ApprovalRequestPresentationInput;
  ApprovalRequestResponse: ResolverTypeWrapper<ApprovalRequestResponse>;
  ApprovalRequestStatus: ApprovalRequestStatus;
  ApprovalTokenResponse: ResolverTypeWrapper<ApprovalTokenResponse>;
  Authority: ResolverTypeWrapper<Authority>;
  BackgroundJobActiveEvent: ResolverTypeWrapper<BackgroundJobActiveEvent>;
  BackgroundJobCompletedEvent: ResolverTypeWrapper<BackgroundJobCompletedEvent>;
  BackgroundJobErrorEvent: ResolverTypeWrapper<BackgroundJobErrorEvent>;
  BackgroundJobEvent: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['BackgroundJobEvent']>;
  BackgroundJobEventData: ResolverTypeWrapper<Omit<BackgroundJobEventData, 'event' | 'user'> & { event: ResolversTypes['BackgroundJobEvent'], user?: Maybe<ResolversTypes['User']> }>;
  BackgroundJobEventWhere: BackgroundJobEventWhere;
  BackgroundJobProgressEvent: ResolverTypeWrapper<BackgroundJobProgressEvent>;
  BackgroundJobStatus: BackgroundJobStatus;
  CacheControlScope: CacheControlScope;
  Callback: Callback;
  ConfigurationValidation: ConfigurationValidation;
  Contract: ResolverTypeWrapper<ContractEntity>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ContractCount: ResolverTypeWrapper<Omit<ContractCount, 'contract'> & { contract: ResolversTypes['Contract'] }>;
  ContractDisplayClaim: ResolverTypeWrapper<ContractDisplayClaim>;
  ContractDisplayClaimInput: ContractDisplayClaimInput;
  ContractDisplayConsent: ResolverTypeWrapper<ContractDisplayConsent>;
  ContractDisplayConsentInput: ContractDisplayConsentInput;
  ContractDisplayCredential: ResolverTypeWrapper<ContractDisplayCredential>;
  ContractDisplayCredentialInput: ContractDisplayCredentialInput;
  ContractDisplayCredentialLogo: ResolverTypeWrapper<ContractDisplayCredentialLogo>;
  ContractDisplayCredentialLogoInput: ContractDisplayCredentialLogoInput;
  ContractDisplayModel: ResolverTypeWrapper<ContractDisplayModel>;
  ContractDisplayModelInput: ContractDisplayModelInput;
  ContractInput: ContractInput;
  ContractIssuanceWeeklyAverageWhere: ContractIssuanceWeeklyAverageWhere;
  ContractIssuanceWhere: ContractIssuanceWhere;
  ContractOrderBy: ContractOrderBy;
  ContractPresentationWeeklyAverageWhere: ContractPresentationWeeklyAverageWhere;
  ContractPresentationWhere: ContractPresentationWhere;
  ContractWhere: ContractWhere;
  CreatePartnerInput: CreatePartnerInput;
  CreatePresentationRequestForApprovalInput: CreatePresentationRequestForApprovalInput;
  CreateUpdateTemplateDisplayClaimInput: CreateUpdateTemplateDisplayClaimInput;
  CreateUpdateTemplateDisplayConsentInput: CreateUpdateTemplateDisplayConsentInput;
  CreateUpdateTemplateDisplayCredentialInput: CreateUpdateTemplateDisplayCredentialInput;
  CreateUpdateTemplateDisplayCredentialLogoInput: CreateUpdateTemplateDisplayCredentialLogoInput;
  CreateUpdateTemplateDisplayModelInput: CreateUpdateTemplateDisplayModelInput;
  CredentialTypesWhere: CredentialTypesWhere;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DidDocumentStatus: DidDocumentStatus;
  Discovery: ResolverTypeWrapper<Discovery>;
  EmailAddress: ResolverTypeWrapper<Scalars['EmailAddress']['output']>;
  FaceCheckPhotoSupport: FaceCheckPhotoSupport;
  FaceCheckResult: ResolverTypeWrapper<FaceCheckResult>;
  FaceCheckValidation: ResolverTypeWrapper<FaceCheckValidation>;
  FaceCheckValidationInput: FaceCheckValidationInput;
  Features: ResolverTypeWrapper<Features>;
  HexColorCode: ResolverTypeWrapper<Scalars['HexColorCode']['output']>;
  Identity: ResolverTypeWrapper<IdentityEntity>;
  IdentityInput: IdentityInput;
  IdentityIssuanceWhere: IdentityIssuanceWhere;
  IdentityIssuer: ResolverTypeWrapper<IdentityIssuer>;
  IdentityOrderBy: IdentityOrderBy;
  IdentityPresentationWhere: IdentityPresentationWhere;
  IdentityWhere: IdentityWhere;
  Issuance: ResolverTypeWrapper<IssuanceEntity>;
  IssuanceCallbackEvent: ResolverTypeWrapper<IssuanceCallbackEvent>;
  IssuanceEventData: ResolverTypeWrapper<Omit<IssuanceEventData, 'issuance'> & { issuance?: Maybe<ResolversTypes['Issuance']> }>;
  IssuanceEventWhere: IssuanceEventWhere;
  IssuanceOrderBy: IssuanceOrderBy;
  IssuancePresentationWhere: IssuancePresentationWhere;
  IssuanceRequestInput: IssuanceRequestInput;
  IssuanceRequestResponse: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['IssuanceRequestResponse']>;
  IssuanceRequestStatus: IssuanceRequestStatus;
  IssuanceResponse: ResolverTypeWrapper<IssuanceResponse>;
  IssuanceStatus: IssuanceStatus;
  IssuanceWhere: IssuanceWhere;
  IssuerIdentifierInput: IssuerIdentifierInput;
  JSONObject: ResolverTypeWrapper<Scalars['JSONObject']['output']>;
  Locale: ResolverTypeWrapper<Scalars['Locale']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  NetworkContract: ResolverTypeWrapper<NetworkContract>;
  NetworkIssuer: ResolverTypeWrapper<NetworkIssuer>;
  NetworkIssuersWhere: NetworkIssuersWhere;
  NonNegativeInt: ResolverTypeWrapper<Scalars['NonNegativeInt']['output']>;
  OrderDirection: OrderDirection;
  Partner: ResolverTypeWrapper<PartnerEntity>;
  PartnerOrderBy: PartnerOrderBy;
  PartnerPresentationWhere: PartnerPresentationWhere;
  PartnerWhere: PartnerWhere;
  Pin: Pin;
  PositiveFloat: ResolverTypeWrapper<Scalars['PositiveFloat']['output']>;
  PositiveInt: ResolverTypeWrapper<Scalars['PositiveInt']['output']>;
  Presentation: ResolverTypeWrapper<PresentationEntity>;
  PresentationCallbackEvent: ResolverTypeWrapper<PresentationCallbackEvent>;
  PresentationEvent: ResolverTypeWrapper<PresentationEvent>;
  PresentationEventData: ResolverTypeWrapper<Omit<PresentationEventData, 'presentation'> & { presentation?: Maybe<ResolversTypes['Presentation']> }>;
  PresentationEventWhere: PresentationEventWhere;
  PresentationOrderBy: PresentationOrderBy;
  PresentationRequestInput: PresentationRequestInput;
  PresentationRequestRegistration: PresentationRequestRegistration;
  PresentationRequestResponse: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['PresentationRequestResponse']>;
  PresentationRequestStatus: PresentationRequestStatus;
  PresentationResponse: ResolverTypeWrapper<PresentationResponse>;
  PresentationWhere: PresentationWhere;
  PresentedCredential: ResolverTypeWrapper<PresentedCredential>;
  Query: ResolverTypeWrapper<{}>;
  RequestConfiguration: RequestConfiguration;
  RequestConfigurationValidation: ResolverTypeWrapper<RequestConfigurationValidation>;
  RequestCredential: RequestCredential;
  RequestError: ResolverTypeWrapper<RequestError>;
  RequestErrorResponse: ResolverTypeWrapper<RequestErrorResponse>;
  RequestErrorWithInner: ResolverTypeWrapper<RequestErrorWithInner>;
  RequestInnerError: ResolverTypeWrapper<RequestInnerError>;
  RequestedConfiguration: ResolverTypeWrapper<RequestedConfiguration>;
  RequestedCredential: ResolverTypeWrapper<RequestedCredential>;
  RequestedCredentialSpecificationInput: RequestedCredentialSpecificationInput;
  Subscription: ResolverTypeWrapper<{}>;
  Template: ResolverTypeWrapper<TemplateEntity>;
  TemplateDisplayClaim: ResolverTypeWrapper<TemplateDisplayClaim>;
  TemplateDisplayConsent: ResolverTypeWrapper<TemplateDisplayConsent>;
  TemplateDisplayCredential: ResolverTypeWrapper<TemplateDisplayCredential>;
  TemplateDisplayCredentialLogo: ResolverTypeWrapper<TemplateDisplayCredentialLogo>;
  TemplateDisplayModel: ResolverTypeWrapper<TemplateDisplayModel>;
  TemplateInput: TemplateInput;
  TemplateParentData: ResolverTypeWrapper<TemplateParentData>;
  TemplateWhere: TemplateWhere;
  TenantIdentity: ResolverTypeWrapper<TenantIdentity>;
  TenantIdentityWhere: TenantIdentityWhere;
  URL: ResolverTypeWrapper<Scalars['URL']['output']>;
  UUID: ResolverTypeWrapper<Scalars['UUID']['output']>;
  UpdatePartnerInput: UpdatePartnerInput;
  User: ResolverTypeWrapper<UserEntity>;
  UserCount: ResolverTypeWrapper<Omit<UserCount, 'user'> & { user: ResolversTypes['User'] }>;
  UserIssuanceWhere: UserIssuanceWhere;
  UserOrderBy: UserOrderBy;
  UserPresentationWhere: UserPresentationWhere;
  UserWhere: UserWhere;
  Void: ResolverTypeWrapper<Scalars['Void']['output']>;
  WebDidModel: ResolverTypeWrapper<WebDidModel>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AccessTokenResponse: AccessTokenResponse;
  String: Scalars['String']['output'];
  AcquireLimitedAccessTokenInput: AcquireLimitedAccessTokenInput;
  Boolean: Scalars['Boolean']['output'];
  ID: Scalars['ID']['output'];
  AcquireLimitedApprovalTokenInput: AcquireLimitedApprovalTokenInput;
  ActionApprovalRequestInput: ActionApprovalRequestInput;
  ActionedApprovalData: ActionedApprovalData;
  ActionedBy: ActionedBy;
  ApprovalRequest: ApprovalRequestEntity;
  ApprovalRequestInput: ApprovalRequestInput;
  ApprovalRequestPresentationInput: ApprovalRequestPresentationInput;
  ApprovalRequestResponse: ApprovalRequestResponse;
  ApprovalTokenResponse: ApprovalTokenResponse;
  Authority: Authority;
  BackgroundJobActiveEvent: BackgroundJobActiveEvent;
  BackgroundJobCompletedEvent: BackgroundJobCompletedEvent;
  BackgroundJobErrorEvent: BackgroundJobErrorEvent;
  BackgroundJobEvent: ResolversUnionTypes<ResolversParentTypes>['BackgroundJobEvent'];
  BackgroundJobEventData: Omit<BackgroundJobEventData, 'event' | 'user'> & { event: ResolversParentTypes['BackgroundJobEvent'], user?: Maybe<ResolversParentTypes['User']> };
  BackgroundJobEventWhere: BackgroundJobEventWhere;
  BackgroundJobProgressEvent: BackgroundJobProgressEvent;
  Callback: Callback;
  ConfigurationValidation: ConfigurationValidation;
  Contract: ContractEntity;
  Int: Scalars['Int']['output'];
  Float: Scalars['Float']['output'];
  ContractCount: Omit<ContractCount, 'contract'> & { contract: ResolversParentTypes['Contract'] };
  ContractDisplayClaim: ContractDisplayClaim;
  ContractDisplayClaimInput: ContractDisplayClaimInput;
  ContractDisplayConsent: ContractDisplayConsent;
  ContractDisplayConsentInput: ContractDisplayConsentInput;
  ContractDisplayCredential: ContractDisplayCredential;
  ContractDisplayCredentialInput: ContractDisplayCredentialInput;
  ContractDisplayCredentialLogo: ContractDisplayCredentialLogo;
  ContractDisplayCredentialLogoInput: ContractDisplayCredentialLogoInput;
  ContractDisplayModel: ContractDisplayModel;
  ContractDisplayModelInput: ContractDisplayModelInput;
  ContractInput: ContractInput;
  ContractIssuanceWeeklyAverageWhere: ContractIssuanceWeeklyAverageWhere;
  ContractIssuanceWhere: ContractIssuanceWhere;
  ContractPresentationWeeklyAverageWhere: ContractPresentationWeeklyAverageWhere;
  ContractPresentationWhere: ContractPresentationWhere;
  ContractWhere: ContractWhere;
  CreatePartnerInput: CreatePartnerInput;
  CreatePresentationRequestForApprovalInput: CreatePresentationRequestForApprovalInput;
  CreateUpdateTemplateDisplayClaimInput: CreateUpdateTemplateDisplayClaimInput;
  CreateUpdateTemplateDisplayConsentInput: CreateUpdateTemplateDisplayConsentInput;
  CreateUpdateTemplateDisplayCredentialInput: CreateUpdateTemplateDisplayCredentialInput;
  CreateUpdateTemplateDisplayCredentialLogoInput: CreateUpdateTemplateDisplayCredentialLogoInput;
  CreateUpdateTemplateDisplayModelInput: CreateUpdateTemplateDisplayModelInput;
  CredentialTypesWhere: CredentialTypesWhere;
  DateTime: Scalars['DateTime']['output'];
  Discovery: Discovery;
  EmailAddress: Scalars['EmailAddress']['output'];
  FaceCheckResult: FaceCheckResult;
  FaceCheckValidation: FaceCheckValidation;
  FaceCheckValidationInput: FaceCheckValidationInput;
  Features: Features;
  HexColorCode: Scalars['HexColorCode']['output'];
  Identity: IdentityEntity;
  IdentityInput: IdentityInput;
  IdentityIssuanceWhere: IdentityIssuanceWhere;
  IdentityIssuer: IdentityIssuer;
  IdentityPresentationWhere: IdentityPresentationWhere;
  IdentityWhere: IdentityWhere;
  Issuance: IssuanceEntity;
  IssuanceCallbackEvent: IssuanceCallbackEvent;
  IssuanceEventData: Omit<IssuanceEventData, 'issuance'> & { issuance?: Maybe<ResolversParentTypes['Issuance']> };
  IssuanceEventWhere: IssuanceEventWhere;
  IssuancePresentationWhere: IssuancePresentationWhere;
  IssuanceRequestInput: IssuanceRequestInput;
  IssuanceRequestResponse: ResolversUnionTypes<ResolversParentTypes>['IssuanceRequestResponse'];
  IssuanceResponse: IssuanceResponse;
  IssuanceWhere: IssuanceWhere;
  IssuerIdentifierInput: IssuerIdentifierInput;
  JSONObject: Scalars['JSONObject']['output'];
  Locale: Scalars['Locale']['output'];
  Mutation: {};
  NetworkContract: NetworkContract;
  NetworkIssuer: NetworkIssuer;
  NetworkIssuersWhere: NetworkIssuersWhere;
  NonNegativeInt: Scalars['NonNegativeInt']['output'];
  Partner: PartnerEntity;
  PartnerPresentationWhere: PartnerPresentationWhere;
  PartnerWhere: PartnerWhere;
  Pin: Pin;
  PositiveFloat: Scalars['PositiveFloat']['output'];
  PositiveInt: Scalars['PositiveInt']['output'];
  Presentation: PresentationEntity;
  PresentationCallbackEvent: PresentationCallbackEvent;
  PresentationEvent: PresentationEvent;
  PresentationEventData: Omit<PresentationEventData, 'presentation'> & { presentation?: Maybe<ResolversParentTypes['Presentation']> };
  PresentationEventWhere: PresentationEventWhere;
  PresentationRequestInput: PresentationRequestInput;
  PresentationRequestRegistration: PresentationRequestRegistration;
  PresentationRequestResponse: ResolversUnionTypes<ResolversParentTypes>['PresentationRequestResponse'];
  PresentationResponse: PresentationResponse;
  PresentationWhere: PresentationWhere;
  PresentedCredential: PresentedCredential;
  Query: {};
  RequestConfiguration: RequestConfiguration;
  RequestConfigurationValidation: RequestConfigurationValidation;
  RequestCredential: RequestCredential;
  RequestError: RequestError;
  RequestErrorResponse: RequestErrorResponse;
  RequestErrorWithInner: RequestErrorWithInner;
  RequestInnerError: RequestInnerError;
  RequestedConfiguration: RequestedConfiguration;
  RequestedCredential: RequestedCredential;
  RequestedCredentialSpecificationInput: RequestedCredentialSpecificationInput;
  Subscription: {};
  Template: TemplateEntity;
  TemplateDisplayClaim: TemplateDisplayClaim;
  TemplateDisplayConsent: TemplateDisplayConsent;
  TemplateDisplayCredential: TemplateDisplayCredential;
  TemplateDisplayCredentialLogo: TemplateDisplayCredentialLogo;
  TemplateDisplayModel: TemplateDisplayModel;
  TemplateInput: TemplateInput;
  TemplateParentData: TemplateParentData;
  TemplateWhere: TemplateWhere;
  TenantIdentity: TenantIdentity;
  TenantIdentityWhere: TenantIdentityWhere;
  URL: Scalars['URL']['output'];
  UUID: Scalars['UUID']['output'];
  UpdatePartnerInput: UpdatePartnerInput;
  User: UserEntity;
  UserCount: Omit<UserCount, 'user'> & { user: ResolversParentTypes['User'] };
  UserIssuanceWhere: UserIssuanceWhere;
  UserPresentationWhere: UserPresentationWhere;
  UserWhere: UserWhere;
  Void: Scalars['Void']['output'];
  WebDidModel: WebDidModel;
};

export type CacheControlDirectiveArgs = {
  inheritMaxAge?: Maybe<Scalars['Boolean']['input']>;
  maxAge?: Maybe<Scalars['Int']['input']>;
  scope?: Maybe<CacheControlScope>;
};

export type CacheControlDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = CacheControlDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ConstraintDirectiveArgs = {
  contains?: Maybe<Scalars['String']['input']>;
  endsWith?: Maybe<Scalars['String']['input']>;
  exclusiveMax?: Maybe<Scalars['Float']['input']>;
  exclusiveMin?: Maybe<Scalars['Float']['input']>;
  format?: Maybe<Scalars['String']['input']>;
  max?: Maybe<Scalars['Float']['input']>;
  maxLength?: Maybe<Scalars['Int']['input']>;
  min?: Maybe<Scalars['Float']['input']>;
  minLength?: Maybe<Scalars['Int']['input']>;
  multipleOf?: Maybe<Scalars['Float']['input']>;
  notContains?: Maybe<Scalars['String']['input']>;
  pattern?: Maybe<Scalars['String']['input']>;
  startsWith?: Maybe<Scalars['String']['input']>;
  uniqueTypeName?: Maybe<Scalars['String']['input']>;
};

export type ConstraintDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = ConstraintDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AccessTokenResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AccessTokenResponse'] = ResolversParentTypes['AccessTokenResponse']> = {
  expires?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActionedApprovalDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ActionedApprovalData'] = ResolversParentTypes['ActionedApprovalData']> = {
  actionedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  actionedBy?: Resolver<Maybe<ResolversTypes['ActionedBy']>, ParentType, ContextType>;
  actionedComment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  approvalRequestId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  callbackSecret?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  correlationId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  isApproved?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  requestData?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActionedByResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ActionedBy'] = ResolversParentTypes['ActionedBy']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ApprovalRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ApprovalRequest'] = ResolversParentTypes['ApprovalRequest']> = {
  actionedComment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  correlationId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isApproved?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  presentation?: Resolver<Maybe<ResolversTypes['Presentation']>, ParentType, ContextType>;
  presentationRequest?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  purpose?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  referenceUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requestData?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  requestType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  requestedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ApprovalRequestStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ApprovalRequestResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ApprovalRequestResponse'] = ResolversParentTypes['ApprovalRequestResponse']> = {
  callbackSecret?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  portalUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ApprovalTokenResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ApprovalTokenResponse'] = ResolversParentTypes['ApprovalTokenResponse']> = {
  expires?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthorityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Authority'] = ResolversParentTypes['Authority']> = {
  didModel?: Resolver<ResolversTypes['WebDidModel'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  linkedDomainsVerified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BackgroundJobActiveEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BackgroundJobActiveEvent'] = ResolversParentTypes['BackgroundJobActiveEvent']> = {
  status?: Resolver<ResolversTypes['BackgroundJobStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BackgroundJobCompletedEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BackgroundJobCompletedEvent'] = ResolversParentTypes['BackgroundJobCompletedEvent']> = {
  result?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['BackgroundJobStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BackgroundJobErrorEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BackgroundJobErrorEvent'] = ResolversParentTypes['BackgroundJobErrorEvent']> = {
  error?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['BackgroundJobStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BackgroundJobEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BackgroundJobEvent'] = ResolversParentTypes['BackgroundJobEvent']> = {
  __resolveType: TypeResolveFn<'BackgroundJobActiveEvent' | 'BackgroundJobCompletedEvent' | 'BackgroundJobErrorEvent' | 'BackgroundJobProgressEvent', ParentType, ContextType>;
};

export type BackgroundJobEventDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BackgroundJobEventData'] = ResolversParentTypes['BackgroundJobEventData']> = {
  event?: Resolver<ResolversTypes['BackgroundJobEvent'], ParentType, ContextType>;
  jobId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  jobName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BackgroundJobProgressEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BackgroundJobProgressEvent'] = ResolversParentTypes['BackgroundJobProgressEvent']> = {
  progress?: Resolver<ResolversTypes['PositiveInt'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['BackgroundJobStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContractResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Contract'] = ResolversParentTypes['Contract']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  credentialTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  deprecatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  deprecatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  display?: Resolver<ResolversTypes['ContractDisplayModel'], ParentType, ContextType>;
  externalId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  faceCheckSupport?: Resolver<ResolversTypes['FaceCheckPhotoSupport'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isDeprecated?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isPublic?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  issuanceCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  issuanceWeeklyAverage?: Resolver<ResolversTypes['Float'], ParentType, ContextType, RequireFields<ContractIssuanceWeeklyAverageArgs, 'where'>>;
  issuances?: Resolver<Array<ResolversTypes['Issuance']>, ParentType, ContextType, Partial<ContractIssuancesArgs>>;
  lastProvisionedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  lastProvisionedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presentationWeeklyAverage?: Resolver<ResolversTypes['Float'], ParentType, ContextType, RequireFields<ContractPresentationWeeklyAverageArgs, 'where'>>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, Partial<ContractPresentationsArgs>>;
  provisionedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  provisionedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  template?: Resolver<Maybe<ResolversTypes['Template']>, ParentType, ContextType>;
  templateData?: Resolver<Maybe<ResolversTypes['TemplateParentData']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  validityIntervalInSeconds?: Resolver<ResolversTypes['PositiveInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContractCountResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContractCount'] = ResolversParentTypes['ContractCount']> = {
  contract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType>;
  count?: Resolver<ResolversTypes['NonNegativeInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContractDisplayClaimResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContractDisplayClaim'] = ResolversParentTypes['ContractDisplayClaim']> = {
  claim?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContractDisplayConsentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContractDisplayConsent'] = ResolversParentTypes['ContractDisplayConsent']> = {
  instructions?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContractDisplayCredentialResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContractDisplayCredential'] = ResolversParentTypes['ContractDisplayCredential']> = {
  backgroundColor?: Resolver<ResolversTypes['HexColorCode'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  issuedBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  logo?: Resolver<ResolversTypes['ContractDisplayCredentialLogo'], ParentType, ContextType>;
  textColor?: Resolver<ResolversTypes['HexColorCode'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContractDisplayCredentialLogoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContractDisplayCredentialLogo'] = ResolversParentTypes['ContractDisplayCredentialLogo']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContractDisplayModelResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ContractDisplayModel'] = ResolversParentTypes['ContractDisplayModel']> = {
  card?: Resolver<ResolversTypes['ContractDisplayCredential'], ParentType, ContextType>;
  claims?: Resolver<Array<ResolversTypes['ContractDisplayClaim']>, ParentType, ContextType>;
  consent?: Resolver<ResolversTypes['ContractDisplayConsent'], ParentType, ContextType>;
  locale?: Resolver<ResolversTypes['Locale'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DiscoveryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Discovery'] = ResolversParentTypes['Discovery']> = {
  features?: Resolver<ResolversTypes['Features'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface EmailAddressScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['EmailAddress'], any> {
  name: 'EmailAddress';
}

export type FaceCheckResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FaceCheckResult'] = ResolversParentTypes['FaceCheckResult']> = {
  matchConfidenceScore?: Resolver<ResolversTypes['PositiveFloat'], ParentType, ContextType>;
  sourcePhotoQuality?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FaceCheckValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FaceCheckValidation'] = ResolversParentTypes['FaceCheckValidation']> = {
  matchConfidenceThreshold?: Resolver<Maybe<ResolversTypes['PositiveInt']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FeaturesResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Features'] = ResolversParentTypes['Features']> = {
  devToolsEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  findTenantIdentities?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface HexColorCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['HexColorCode'], any> {
  name: 'HexColorCode';
}

export type IdentityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Identity'] = ResolversParentTypes['Identity']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  identifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  issuanceCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  issuances?: Resolver<Array<ResolversTypes['Issuance']>, ParentType, ContextType, Partial<IdentityIssuancesArgs>>;
  issuer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  issuerLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, Partial<IdentityPresentationsArgs>>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IdentityIssuerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['IdentityIssuer'] = ResolversParentTypes['IdentityIssuer']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IssuanceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Issuance'] = ResolversParentTypes['Issuance']> = {
  contract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType>;
  credentialExpiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  hasFaceCheckPhoto?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>;
  isRevoked?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  issuedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  issuedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, Partial<IssuancePresentationsArgs>>;
  revokedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  revokedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['IssuanceStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IssuanceCallbackEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['IssuanceCallbackEvent'] = ResolversParentTypes['IssuanceCallbackEvent']> = {
  error?: Resolver<Maybe<ResolversTypes['RequestError']>, ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  requestStatus?: Resolver<ResolversTypes['IssuanceRequestStatus'], ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IssuanceEventDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['IssuanceEventData'] = ResolversParentTypes['IssuanceEventData']> = {
  event?: Resolver<ResolversTypes['IssuanceCallbackEvent'], ParentType, ContextType>;
  issuance?: Resolver<Maybe<ResolversTypes['Issuance']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IssuanceRequestResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['IssuanceRequestResponse'] = ResolversParentTypes['IssuanceRequestResponse']> = {
  __resolveType: TypeResolveFn<'IssuanceResponse' | 'RequestErrorResponse', ParentType, ContextType>;
};

export type IssuanceResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['IssuanceResponse'] = ResolversParentTypes['IssuanceResponse']> = {
  expiry?: Resolver<ResolversTypes['PositiveInt'], ParentType, ContextType>;
  qrCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSONObject'], any> {
  name: 'JSONObject';
}

export interface LocaleScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Locale'], any> {
  name: 'Locale';
}

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  acquireLimitedAccessToken?: Resolver<ResolversTypes['AccessTokenResponse'], ParentType, ContextType, RequireFields<MutationAcquireLimitedAccessTokenArgs, 'input'>>;
  acquireLimitedApprovalToken?: Resolver<ResolversTypes['ApprovalTokenResponse'], ParentType, ContextType, RequireFields<MutationAcquireLimitedApprovalTokenArgs, 'input'>>;
  actionApprovalRequest?: Resolver<ResolversTypes['ApprovalRequest'], ParentType, ContextType, RequireFields<MutationActionApprovalRequestArgs, 'id' | 'input'>>;
  createApprovalRequest?: Resolver<ResolversTypes['ApprovalRequestResponse'], ParentType, ContextType, RequireFields<MutationCreateApprovalRequestArgs, 'request'>>;
  createContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationCreateContractArgs, 'input'>>;
  createIssuanceRequest?: Resolver<ResolversTypes['IssuanceRequestResponse'], ParentType, ContextType, RequireFields<MutationCreateIssuanceRequestArgs, 'request'>>;
  createPartner?: Resolver<ResolversTypes['Partner'], ParentType, ContextType, RequireFields<MutationCreatePartnerArgs, 'input'>>;
  createPresentationRequest?: Resolver<ResolversTypes['PresentationRequestResponse'], ParentType, ContextType, RequireFields<MutationCreatePresentationRequestArgs, 'request'>>;
  createPresentationRequestForApproval?: Resolver<ResolversTypes['PresentationRequestResponse'], ParentType, ContextType, RequireFields<MutationCreatePresentationRequestForApprovalArgs, 'approvalRequestId'>>;
  createTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationCreateTemplateArgs, 'input'>>;
  deleteContract?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<MutationDeleteContractArgs, 'id'>>;
  deleteTemplate?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<MutationDeleteTemplateArgs, 'id'>>;
  deprecateContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationDeprecateContractArgs, 'id'>>;
  provisionContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationProvisionContractArgs, 'id'>>;
  revokeContractIssuances?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRevokeContractIssuancesArgs, 'contractId'>>;
  revokeIdentityIssuances?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRevokeIdentityIssuancesArgs, 'identityId'>>;
  revokeIssuance?: Resolver<ResolversTypes['Issuance'], ParentType, ContextType, RequireFields<MutationRevokeIssuanceArgs, 'id'>>;
  revokeIssuances?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRevokeIssuancesArgs, 'ids'>>;
  revokeUserIssuances?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRevokeUserIssuancesArgs, 'userId'>>;
  saveIdentity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType, RequireFields<MutationSaveIdentityArgs, 'input'>>;
  updateContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationUpdateContractArgs, 'id' | 'input'>>;
  updatePartner?: Resolver<ResolversTypes['Partner'], ParentType, ContextType, RequireFields<MutationUpdatePartnerArgs, 'id' | 'input'>>;
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

export interface NonNegativeIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NonNegativeInt'], any> {
  name: 'NonNegativeInt';
}

export type PartnerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Partner'] = ResolversParentTypes['Partner']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  credentialTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  did?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  issuerId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  linkedDomainUrls?: Resolver<Maybe<Array<ResolversTypes['URL']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, Partial<PartnerPresentationsArgs>>;
  tenantId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface PositiveFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PositiveFloat'], any> {
  name: 'PositiveFloat';
}

export interface PositiveIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PositiveInt'], any> {
  name: 'PositiveInt';
}

export type PresentationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Presentation'] = ResolversParentTypes['Presentation']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  identity?: Resolver<Maybe<ResolversTypes['Identity']>, ParentType, ContextType>;
  issuances?: Resolver<Array<ResolversTypes['Issuance']>, ParentType, ContextType>;
  partners?: Resolver<Array<ResolversTypes['Partner']>, ParentType, ContextType>;
  presentedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  presentedCredentials?: Resolver<Array<ResolversTypes['PresentedCredential']>, ParentType, ContextType>;
  requestedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  requestedCredentials?: Resolver<Array<ResolversTypes['RequestedCredential']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PresentationCallbackEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PresentationCallbackEvent'] = ResolversParentTypes['PresentationCallbackEvent']> = {
  error?: Resolver<Maybe<ResolversTypes['RequestError']>, ParentType, ContextType>;
  receipt?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  requestStatus?: Resolver<ResolversTypes['PresentationRequestStatus'], ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subject?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  verifiedCredentialsData?: Resolver<Maybe<Array<ResolversTypes['PresentedCredential']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PresentationEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PresentationEvent'] = ResolversParentTypes['PresentationEvent']> = {
  claims?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  clientName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  credentialTypes?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  issuers?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PresentationEventDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PresentationEventData'] = ResolversParentTypes['PresentationEventData']> = {
  event?: Resolver<ResolversTypes['PresentationCallbackEvent'], ParentType, ContextType>;
  presentation?: Resolver<Maybe<ResolversTypes['Presentation']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PresentationRequestResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PresentationRequestResponse'] = ResolversParentTypes['PresentationRequestResponse']> = {
  __resolveType: TypeResolveFn<'PresentationResponse' | 'RequestErrorResponse', ParentType, ContextType>;
};

export type PresentationResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PresentationResponse'] = ResolversParentTypes['PresentationResponse']> = {
  expiry?: Resolver<ResolversTypes['PositiveInt'], ParentType, ContextType>;
  qrCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PresentedCredentialResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PresentedCredential'] = ResolversParentTypes['PresentedCredential']> = {
  claims?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  credentialState?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  domainValidation?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  faceCheck?: Resolver<Maybe<ResolversTypes['FaceCheckResult']>, ParentType, ContextType>;
  issuer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  actionedApprovalData?: Resolver<Maybe<ResolversTypes['ActionedApprovalData']>, ParentType, ContextType, RequireFields<QueryActionedApprovalDataArgs, 'id'>>;
  approvalRequest?: Resolver<ResolversTypes['ApprovalRequest'], ParentType, ContextType, RequireFields<QueryApprovalRequestArgs, 'id'>>;
  authority?: Resolver<ResolversTypes['Authority'], ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<QueryContractArgs, 'id'>>;
  credentialTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, Partial<QueryCredentialTypesArgs>>;
  discovery?: Resolver<ResolversTypes['Discovery'], ParentType, ContextType>;
  findContracts?: Resolver<Array<ResolversTypes['Contract']>, ParentType, ContextType, Partial<QueryFindContractsArgs>>;
  findIdentities?: Resolver<Array<ResolversTypes['Identity']>, ParentType, ContextType, RequireFields<QueryFindIdentitiesArgs, 'limit'>>;
  findIssuances?: Resolver<Array<ResolversTypes['Issuance']>, ParentType, ContextType, RequireFields<QueryFindIssuancesArgs, 'limit'>>;
  findNetworkIssuers?: Resolver<Array<ResolversTypes['NetworkIssuer']>, ParentType, ContextType, RequireFields<QueryFindNetworkIssuersArgs, 'where'>>;
  findPartners?: Resolver<Array<ResolversTypes['Partner']>, ParentType, ContextType, RequireFields<QueryFindPartnersArgs, 'limit'>>;
  findPresentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, RequireFields<QueryFindPresentationsArgs, 'limit'>>;
  findTemplates?: Resolver<Array<ResolversTypes['Template']>, ParentType, ContextType, Partial<QueryFindTemplatesArgs>>;
  findTenantIdentities?: Resolver<Array<ResolversTypes['TenantIdentity']>, ParentType, ContextType, RequireFields<QueryFindTenantIdentitiesArgs, 'limit' | 'where'>>;
  findUsers?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryFindUsersArgs, 'limit'>>;
  healthcheck?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType>;
  identities?: Resolver<Array<Maybe<ResolversTypes['Identity']>>, ParentType, ContextType, Partial<QueryIdentitiesArgs>>;
  identitiesByIdentifiers?: Resolver<Array<Maybe<ResolversTypes['Identity']>>, ParentType, ContextType, Partial<QueryIdentitiesByIdentifiersArgs>>;
  identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType, RequireFields<QueryIdentityArgs, 'id'>>;
  identityIssuers?: Resolver<Array<ResolversTypes['IdentityIssuer']>, ParentType, ContextType>;
  issuance?: Resolver<ResolversTypes['Issuance'], ParentType, ContextType, RequireFields<QueryIssuanceArgs, 'id'>>;
  issuanceCount?: Resolver<ResolversTypes['NonNegativeInt'], ParentType, ContextType, Partial<QueryIssuanceCountArgs>>;
  issuanceCountByContract?: Resolver<Array<ResolversTypes['ContractCount']>, ParentType, ContextType, Partial<QueryIssuanceCountByContractArgs>>;
  issuanceCountByUser?: Resolver<Array<ResolversTypes['UserCount']>, ParentType, ContextType, Partial<QueryIssuanceCountByUserArgs>>;
  networkContracts?: Resolver<Array<ResolversTypes['NetworkContract']>, ParentType, ContextType, RequireFields<QueryNetworkContractsArgs, 'issuerId' | 'tenantId'>>;
  partner?: Resolver<ResolversTypes['Partner'], ParentType, ContextType, RequireFields<QueryPartnerArgs, 'id'>>;
  presentation?: Resolver<ResolversTypes['Presentation'], ParentType, ContextType, RequireFields<QueryPresentationArgs, 'id'>>;
  presentationCount?: Resolver<ResolversTypes['NonNegativeInt'], ParentType, ContextType, Partial<QueryPresentationCountArgs>>;
  presentationCountByContract?: Resolver<Array<ResolversTypes['ContractCount']>, ParentType, ContextType, Partial<QueryPresentationCountByContractArgs>>;
  presentationCountByUser?: Resolver<Array<ResolversTypes['UserCount']>, ParentType, ContextType, Partial<QueryPresentationCountByUserArgs>>;
  template?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<QueryTemplateArgs, 'id'>>;
  templateCombinedData?: Resolver<ResolversTypes['TemplateParentData'], ParentType, ContextType, RequireFields<QueryTemplateCombinedDataArgs, 'templateId'>>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
};

export type RequestConfigurationValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestConfigurationValidation'] = ResolversParentTypes['RequestConfigurationValidation']> = {
  allowRevoked?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  faceCheck?: Resolver<Maybe<ResolversTypes['FaceCheckValidation']>, ParentType, ContextType>;
  validateLinkedDomain?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RequestErrorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestError'] = ResolversParentTypes['RequestError']> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RequestErrorResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestErrorResponse'] = ResolversParentTypes['RequestErrorResponse']> = {
  date?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  error?: Resolver<ResolversTypes['RequestErrorWithInner'], ParentType, ContextType>;
  mscv?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RequestErrorWithInnerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestErrorWithInner'] = ResolversParentTypes['RequestErrorWithInner']> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  innererror?: Resolver<ResolversTypes['RequestInnerError'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RequestInnerErrorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestInnerError'] = ResolversParentTypes['RequestInnerError']> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  target?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RequestedConfigurationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestedConfiguration'] = ResolversParentTypes['RequestedConfiguration']> = {
  validation?: Resolver<Maybe<ResolversTypes['RequestConfigurationValidation']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RequestedCredentialResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestedCredential'] = ResolversParentTypes['RequestedCredential']> = {
  acceptedIssuers?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  configuration?: Resolver<Maybe<ResolversTypes['RequestedConfiguration']>, ParentType, ContextType>;
  purpose?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  backgroundJobEvent?: SubscriptionResolver<ResolversTypes['BackgroundJobEventData'], "backgroundJobEvent", ParentType, ContextType, Partial<SubscriptionBackgroundJobEventArgs>>;
  issuanceEvent?: SubscriptionResolver<ResolversTypes['IssuanceEventData'], "issuanceEvent", ParentType, ContextType, Partial<SubscriptionIssuanceEventArgs>>;
  presentationEvent?: SubscriptionResolver<ResolversTypes['PresentationEventData'], "presentationEvent", ParentType, ContextType, Partial<SubscriptionPresentationEventArgs>>;
};

export type TemplateResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Template'] = ResolversParentTypes['Template']> = {
  children?: Resolver<Array<ResolversTypes['Template']>, ParentType, ContextType>;
  combinedData?: Resolver<Maybe<ResolversTypes['TemplateParentData']>, ParentType, ContextType>;
  contracts?: Resolver<Array<ResolversTypes['Contract']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  credentialTypes?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  display?: Resolver<Maybe<ResolversTypes['TemplateDisplayModel']>, ParentType, ContextType>;
  faceCheckSupport?: Resolver<Maybe<ResolversTypes['FaceCheckPhotoSupport']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isPublic?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Template']>, ParentType, ContextType>;
  parentData?: Resolver<Maybe<ResolversTypes['TemplateParentData']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
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
  credentialTypes?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  display?: Resolver<Maybe<ResolversTypes['TemplateDisplayModel']>, ParentType, ContextType>;
  faceCheckSupport?: Resolver<Maybe<ResolversTypes['FaceCheckPhotoSupport']>, ParentType, ContextType>;
  isPublic?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  validityIntervalInSeconds?: Resolver<Maybe<ResolversTypes['PositiveInt']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TenantIdentityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TenantIdentity'] = ResolversParentTypes['TenantIdentity']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  issuer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['URL'], any> {
  name: 'URL';
}

export interface UuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['UUID'], any> {
  name: 'UUID';
}

export type UserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isApp?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  issuances?: Resolver<Array<ResolversTypes['Issuance']>, ParentType, ContextType, Partial<UserIssuancesArgs>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, Partial<UserPresentationsArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserCountResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserCount'] = ResolversParentTypes['UserCount']> = {
  count?: Resolver<ResolversTypes['NonNegativeInt'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface VoidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Void'], any> {
  name: 'Void';
}

export type WebDidModelResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WebDidModel'] = ResolversParentTypes['WebDidModel']> = {
  did?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  didDocumentStatus?: Resolver<ResolversTypes['DidDocumentStatus'], ParentType, ContextType>;
  linkedDomainUrls?: Resolver<Array<ResolversTypes['URL']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  AccessTokenResponse?: AccessTokenResponseResolvers<ContextType>;
  ActionedApprovalData?: ActionedApprovalDataResolvers<ContextType>;
  ActionedBy?: ActionedByResolvers<ContextType>;
  ApprovalRequest?: ApprovalRequestResolvers<ContextType>;
  ApprovalRequestResponse?: ApprovalRequestResponseResolvers<ContextType>;
  ApprovalTokenResponse?: ApprovalTokenResponseResolvers<ContextType>;
  Authority?: AuthorityResolvers<ContextType>;
  BackgroundJobActiveEvent?: BackgroundJobActiveEventResolvers<ContextType>;
  BackgroundJobCompletedEvent?: BackgroundJobCompletedEventResolvers<ContextType>;
  BackgroundJobErrorEvent?: BackgroundJobErrorEventResolvers<ContextType>;
  BackgroundJobEvent?: BackgroundJobEventResolvers<ContextType>;
  BackgroundJobEventData?: BackgroundJobEventDataResolvers<ContextType>;
  BackgroundJobProgressEvent?: BackgroundJobProgressEventResolvers<ContextType>;
  Contract?: ContractResolvers<ContextType>;
  ContractCount?: ContractCountResolvers<ContextType>;
  ContractDisplayClaim?: ContractDisplayClaimResolvers<ContextType>;
  ContractDisplayConsent?: ContractDisplayConsentResolvers<ContextType>;
  ContractDisplayCredential?: ContractDisplayCredentialResolvers<ContextType>;
  ContractDisplayCredentialLogo?: ContractDisplayCredentialLogoResolvers<ContextType>;
  ContractDisplayModel?: ContractDisplayModelResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Discovery?: DiscoveryResolvers<ContextType>;
  EmailAddress?: GraphQLScalarType;
  FaceCheckResult?: FaceCheckResultResolvers<ContextType>;
  FaceCheckValidation?: FaceCheckValidationResolvers<ContextType>;
  Features?: FeaturesResolvers<ContextType>;
  HexColorCode?: GraphQLScalarType;
  Identity?: IdentityResolvers<ContextType>;
  IdentityIssuer?: IdentityIssuerResolvers<ContextType>;
  Issuance?: IssuanceResolvers<ContextType>;
  IssuanceCallbackEvent?: IssuanceCallbackEventResolvers<ContextType>;
  IssuanceEventData?: IssuanceEventDataResolvers<ContextType>;
  IssuanceRequestResponse?: IssuanceRequestResponseResolvers<ContextType>;
  IssuanceResponse?: IssuanceResponseResolvers<ContextType>;
  JSONObject?: GraphQLScalarType;
  Locale?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  NetworkContract?: NetworkContractResolvers<ContextType>;
  NetworkIssuer?: NetworkIssuerResolvers<ContextType>;
  NonNegativeInt?: GraphQLScalarType;
  Partner?: PartnerResolvers<ContextType>;
  PositiveFloat?: GraphQLScalarType;
  PositiveInt?: GraphQLScalarType;
  Presentation?: PresentationResolvers<ContextType>;
  PresentationCallbackEvent?: PresentationCallbackEventResolvers<ContextType>;
  PresentationEvent?: PresentationEventResolvers<ContextType>;
  PresentationEventData?: PresentationEventDataResolvers<ContextType>;
  PresentationRequestResponse?: PresentationRequestResponseResolvers<ContextType>;
  PresentationResponse?: PresentationResponseResolvers<ContextType>;
  PresentedCredential?: PresentedCredentialResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RequestConfigurationValidation?: RequestConfigurationValidationResolvers<ContextType>;
  RequestError?: RequestErrorResolvers<ContextType>;
  RequestErrorResponse?: RequestErrorResponseResolvers<ContextType>;
  RequestErrorWithInner?: RequestErrorWithInnerResolvers<ContextType>;
  RequestInnerError?: RequestInnerErrorResolvers<ContextType>;
  RequestedConfiguration?: RequestedConfigurationResolvers<ContextType>;
  RequestedCredential?: RequestedCredentialResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Template?: TemplateResolvers<ContextType>;
  TemplateDisplayClaim?: TemplateDisplayClaimResolvers<ContextType>;
  TemplateDisplayConsent?: TemplateDisplayConsentResolvers<ContextType>;
  TemplateDisplayCredential?: TemplateDisplayCredentialResolvers<ContextType>;
  TemplateDisplayCredentialLogo?: TemplateDisplayCredentialLogoResolvers<ContextType>;
  TemplateDisplayModel?: TemplateDisplayModelResolvers<ContextType>;
  TemplateParentData?: TemplateParentDataResolvers<ContextType>;
  TenantIdentity?: TenantIdentityResolvers<ContextType>;
  URL?: GraphQLScalarType;
  UUID?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  UserCount?: UserCountResolvers<ContextType>;
  Void?: GraphQLScalarType;
  WebDidModel?: WebDidModelResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = GraphQLContext> = {
  cacheControl?: CacheControlDirectiveResolver<any, any, ContextType>;
  constraint?: ConstraintDirectiveResolver<any, any, ContextType>;
};
