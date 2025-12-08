/* eslint-disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { TemplateEntity } from '../features/templates/entities/template-entity';
import { ContractEntity } from '../features/contracts/entities/contract-entity';
import { UserEntity } from '../features/users/entities/user-entity';
import { IssuanceEntity } from '../features/issuance/entities/issuance-entity';
import { PresentationEntity } from '../features/presentation/entities/presentation-entity';
import { IdentityEntity } from '../features/identity/entities/identity-entity';
import { IdentityStoreEntity } from '../features/identity-store/entities/identity-store-entity';
import { PartnerEntity } from '../features/partners/entities/partner-entity';
import { ApprovalRequestEntity } from '../features/approval-request/entities/approval-request-entity';
import { AsyncIssuanceEntity } from '../features/async-issuance/entities/async-issuance-entity';
import { CommunicationEntity } from '../features/communication/entities/communication-entity';
import { OidcClientEntity } from '../features/oidc-provider/entities/oidc-client-entity';
import { OidcResourceEntity } from '../features/oidc-provider/entities/oidc-resource-entity';
import { OidcClientResourceEntity } from '../features/oidc-provider/entities/oidc-client-resource-entity';
import { OidcClaimMappingEntity } from '../features/oidc-provider/entities/oidc-claim-mapping-entity';
import { BrandingEntity } from '../features/branding/entities/branding-entity';
import { WalletEntity } from '../features/wallet/entities/wallet-entity';
import { ApplicationLabelConfigEntity } from '../features/instance-configs/entities/application-label-config-entity';
import { CorsOriginConfigEntity } from '../features/instance-configs/entities/cors-origins-config-entity';
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
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: unknown; output: unknown; }
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
  /** Defines the callback for credential issuance or presentation operations made via the limited access token. */
  callback?: InputMaybe<Callback>;
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

/** Input for acquiring a limited token for photo capture. */
export type AcquireLimitedPhotoCaptureTokenInput = {
  /** The ID of the photo capture request to which access will be limited. */
  photoCaptureRequestId: Scalars['UUID']['input'];
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
  /** The person, if known, who approved/rejected the approval request or the app that cancelled the approval request. */
  actionedBy?: Maybe<ActionedBy>;
  /** Optional comment on approval or rejection of this request. */
  actionedComment?: Maybe<Scalars['String']['output']>;
  /** The ID of the approval request that was actioned. */
  approvalRequestId: Scalars['ID']['output'];
  /** A unique secret that can be used to verify the authenticity of the callback. */
  callbackSecret: Scalars['String']['output'];
  /** The optional originating source entity ID of the artifact requiring approval. */
  correlationId?: Maybe<Scalars['ID']['output']>;
  /** Optional additional data that is useful for / relevant to the approval; the schema of which would vary by type. */
  requestData?: Maybe<Scalars['JSONObject']['output']>;
  /** Arbitrary state value which was optionally included in the approval request callback definition. */
  state?: Maybe<Scalars['String']['output']>;
  /** The current status of the approval request. */
  status: ApprovalRequestStatus;
};

/** The details of the person who actioned the approval request */
export type ActionedBy = {
  __typename?: 'ActionedBy';
  /** The id of this identity */
  id: Scalars['ID']['output'];
  /** The name of the identity */
  name: Scalars['String']['output'];
};

/** Android-specific presentation request using OpenID4VP protocol. */
export type AndroidPresentationRequest = {
  __typename?: 'AndroidPresentationRequest';
  /** The protocol identifier for OpenID4VP. */
  openId4VpProtocol: Scalars['String']['output'];
  /** The OpenID4VP request as a JSON string, ready for use with the Digital Credential API. */
  openId4VpRequest: Scalars['String']['output'];
};

/** Apple-specific presentation request using ISO18013-7 protocol. */
export type ApplePresentationRequest = {
  __typename?: 'ApplePresentationRequest';
  /** The device request as a base64-encoded string. */
  deviceRequest: Scalars['String']['output'];
  /** Encryption information for the response as a base64-encoded string. */
  encryptionInfo: Scalars['String']['output'];
};

/** A human-friendly label for a specific application (by identifier) */
export type ApplicationLabelConfig = {
  __typename?: 'ApplicationLabelConfig';
  /** The local ID of the label config */
  id: Scalars['ID']['output'];
  /** A unique identifier for the application (typically an object ID) */
  identifier: Scalars['String']['output'];
  /** A human-friendly label for this application */
  name: Scalars['String']['output'];
};

/** Input payload for a application label config */
export type ApplicationLabelConfigInput = {
  /** A unique identifier for the application (typically an object ID) */
  identifier: Scalars['String']['input'];
  /** A human-friendly label for the application */
  name: Scalars['String']['input'];
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
  /** Optional additional data that is useful for / relevant to the approval; the schema of which would vary by type. */
  requestData?: Maybe<Scalars['JSONObject']['output']>;
  /** The type of approval request, useful for partitioning and filtering different types of approval requests. */
  requestType: Scalars['String']['output'];
  /** When the approval request was created. */
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
  /** Callback will be invoked when the approval request is actioned (i.e. approved, rejected, or cancelled). */
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
  /** Purpose for requesting approval. Markdown is supported. */
  purpose: Scalars['String']['input'];
  /** Optional URL to the artifact for approval. */
  referenceUrl?: InputMaybe<Scalars['String']['input']>;
  /** Optional additional data that is useful for / relevant to the approval; the schema of which would vary by type. */
  requestData?: InputMaybe<Scalars['JSONObject']['input']>;
  /** The type of approval request, useful for partitioning and filtering different types of approval requests. */
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
  Cancelled = 'cancelled',
  Expired = 'expired',
  Pending = 'pending',
  Rejected = 'rejected'
}

/** Fields that can be used for sorting approval requests by. */
export enum ApprovalRequestsOrderBy {
  /** The timestamp when the approval request was created. */
  RequestedAt = 'requestedAt'
}

/** Represents the criteria for filtering approval requests. */
export type ApprovalRequestsWhere = {
  /** Returns approval requests with the specified type. */
  requestType?: InputMaybe<Scalars['String']['input']>;
  /** Returns approval requests requested by the specified user (application or person). */
  requestedById?: InputMaybe<Scalars['ID']['input']>;
  /** Returns approval requests with the requested credential type. */
  requestedCredentialType?: InputMaybe<Scalars['String']['input']>;
  /** Returns approval requests requested after this point. */
  requestedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** Returns approval requests requested before this point. */
  requestedTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** Returns approval requests with the specified status. */
  status?: InputMaybe<ApprovalRequestStatus>;
};

/** A limited approval token response. */
export type ApprovalTokenResponse = {
  __typename?: 'ApprovalTokenResponse';
  expires: Scalars['DateTime']['output'];
  token: Scalars['String']['output'];
};

/** An async issuance issuee contact information. */
export type AsyncIssuanceContact = {
  __typename?: 'AsyncIssuanceContact';
  /** How the issuance notification should be sent. When not set, no issuance notification is sent. */
  notification?: Maybe<Contact>;
  /** How the OTP verification code should be sent. When not set, the async issuance can *only* be redeemed by signing-in to the Concierge with an existing credential. */
  verification?: Maybe<Contact>;
};

/** Input defining an async issuance issuee contact information. */
export type AsyncIssuanceContactInput = {
  /** How the issuance notification should be sent. When not set, no issuance notification is sent. */
  notification?: InputMaybe<ContactInput>;
  /** How the OTP verification code should be sent. When not set, the async issuance can *only* be redeemed by signing-in to the Concierge with an existing credential. */
  verification?: InputMaybe<ContactInput>;
};

/** Represents an error returned by the create async issuance request. */
export type AsyncIssuanceErrorResponse = {
  __typename?: 'AsyncIssuanceErrorResponse';
  /**
   * A collection of errors with each entry corresponding to each item of the async issuance request input.
   *
   * Items of note:
   *
   * - The return order of the errors matches the order of the input requests.
   * - Where there is a mix of valid and invalid requests, a null is used to represent a potentially successful request.
   */
  errors: Array<Maybe<Scalars['String']['output']>>;
};

/** The async issuance request. */
export type AsyncIssuanceRequest = {
  __typename?: 'AsyncIssuanceRequest';
  /** The communications that have been sent for this async issuance request. */
  communications: Array<Communication>;
  /** The contract to be issued. */
  contract: Contract;
  /** When the async issuance request was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the async issuance request. */
  createdBy: User;
  /**
   * The point in the future which the issuees can no longer complete the issuance process.
   *
   * Items of note:
   *
   * - The period started upon receipt of the request.
   */
  expiresOn: Scalars['DateTime']['output'];
  /** The expiry setting for this async issuance request. */
  expiry: AsyncIssuanceRequestExpiry;
  /**
   * When set, the reason this async issuance request failed to issue.
   *
   * Items to note:
   *
   * - The reason is only available when the status is `failed`.
   */
  failureReason?: Maybe<Scalars['String']['output']>;
  /**
   * Indicates whether this async issuance request has contact notification details set, indicating whether issuance notifications will be sent.
   *
   * Items of note:
   *
   * - This field will only return a value while the issuance is pending.
   * - This field value is derived from contact data, therefore is relatively expensive to query and can only be queried for single async issuance request at a time.
   */
  hasContactNotificationSet?: Maybe<Scalars['Boolean']['output']>;
  /**
   * Indicates whether this async issuance request has contact verification details set, indicating whether issuance via OTP verification is supported.
   *
   * Items of note:
   *
   * - This field will only return a value while the issuance is pending.
   * - This field value is derived from contact data, therefore is relatively expensive to query and can only be queried for single async issuance request at a time.
   */
  hasContactVerificationSet?: Maybe<Scalars['Boolean']['output']>;
  /** The ID of the async issuance request. */
  id: Scalars['ID']['output'];
  /** The issuee identity */
  identity: Identity;
  /**
   * A flag indicating if the status of the async issuance request is final.
   *
   * Items to note:
   *
   * - When set to `true`, the status will not change and no further actions can be taken on the async issuance request.
   */
  isStatusFinal: Scalars['Boolean']['output'];
  /**
   * The issuance.
   *
   * Items of note:
   *
   * - When not set, the issuance has not been successfully claimed by the issuee.
   */
  issuance?: Maybe<Issuance>;
  /**
   * When set to true, the issuee is required to capture their photo during the issuance process.
   *
   * Items of note:
   *
   * - This field will only return a value while the issuance is pending.
   * - This field value is derived from contact data, therefore is relatively expensive to query and can only be queried for single async issuance request at a time.
   */
  photoCapture?: Maybe<Scalars['Boolean']['output']>;
  /** The status of the async issuance request. */
  status: AsyncIssuanceRequestStatus;
  /** When the async issuance request was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the async issuance request. */
  updatedBy?: Maybe<User>;
};


/** The async issuance request. */
export type AsyncIssuanceRequestCommunicationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<CommunicationOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<CommunicationWhere>;
};

/** A time period for the expiry of an async issuance request. */
export enum AsyncIssuanceRequestExpiry {
  OneDay = 'oneDay',
  OneMonth = 'oneMonth',
  OneWeek = 'oneWeek',
  ThreeDays = 'threeDays',
  ThreeMonths = 'threeMonths',
  TwoWeeks = 'twoWeeks'
}

/** Represents the input required for creating an async issuance request. */
export type AsyncIssuanceRequestInput = {
  /** The callback to register. */
  callback?: InputMaybe<Callback>;
  /**
   * The collection of assertions made about the subject in the verifiable credential.
   *
   * Item of note:
   *
   * - You must fulfill the contract claims definition. Review contract creation for more information.
   */
  claims?: InputMaybe<Scalars['JSONObject']['input']>;
  /** The issuee's contact information for notification and OTP verification. When not set, no issuance notification is sent and the issuance can *only* be redeemed by signing-in to the Concierge with an existing credential. */
  contact?: InputMaybe<AsyncIssuanceContactInput>;
  /** The ID of the contract you wish to issue. */
  contractId: Scalars['UUID']['input'];
  /**
   * Setting the expiration data allows for explicitly control over credential expiry, regardless of when it is issued.
   *
   * Items of note:
   *
   *  - The date must be in ISO format.
   */
  expirationDate?: InputMaybe<Scalars['DateTime']['input']>;
  /**
   * The point in the future which the issuees can no longer complete the issuance process.
   *
   * Items to note:
   *
   *  - The period starts upon receipt of the request.
   *  - No further issuances are possible once expired.
   *  - Data associated with a request is automatically removed upon issuance or expiry.
   */
  expiry: AsyncIssuanceRequestExpiry;
  /**
   * The issuee's photo for use with face check presentation verification.
   *
   * Items of note:
   *
   *  - _Optional:_ When no photo is set and the contract does not require one, the issuance process does not require a photo.
   *  - The photo is displayed via the authenticator app.
   *  - The photo must be encoded using the [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) format, and the base-64 encoded image must be of a JPEG type.
   *  - Image data can only be provided by a single source, either from the faceCheckPhoto or the photoCapture fields.
   *  - When the contract **requires** face check, either the **faceCheckPhoto** or the **photoCapture** property must be set.
   *  - When the contract **requires no** face check, neither the **faceCheckPhoto** nor the **photoCapture** property can be set.
   */
  faceCheckPhoto?: InputMaybe<Scalars['String']['input']>;
  /**
   * The identity to issue to.
   *
   * Items of note:
   *
   * - _Required_ When not using the identityId property
   */
  identity?: InputMaybe<IdentityInput>;
  /**
   * The ID of the identity to issue to.
   *
   *  Items of note:
   *
   *   - _Required_ When not using the identity property.
   */
  identityId?: InputMaybe<Scalars['UUID']['input']>;
  /**
   * When set to true, the issuee is required to capture their photo during the issuance process.
   *
   * Items of note:
   *
   * - _Optional:_ When no photo capture is set and the contract does not require one, the issuance process does not require a photo.
   * - The captured photo is displayed via the authenticator app.
   * - Image data can only be provided by a single source, either from the faceCheckPhoto or the photoCapture fields.
   * - When the contract **requires** face check, either the **faceCheckPhoto** or the **photoCapture** property must be set.
   * - When the contract **requires no** face check, neither the **faceCheckPhoto** nor the **photoCapture** property can be set.
   */
  photoCapture?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * The URL to redirect the issuee to after the issuance process is completed.
   *
   * Items of note:
   *
   * - _Optional:_ When no redirect URL is set, the issuee will remain on the success page.
   */
  postIssuanceRedirectUrl?: InputMaybe<Scalars['URL']['input']>;
};

/** The createAsyncIssuanceRequest mutation response. Either a successful response or a validation error response. */
export type AsyncIssuanceRequestResponse = AsyncIssuanceErrorResponse | AsyncIssuanceResponse;

/** The status of the async issuance request. */
export enum AsyncIssuanceRequestStatus {
  /** The issuance request has been cancelled. */
  Cancelled = 'cancelled',
  /** The issuance request has expired. */
  Expired = 'expired',
  /** The issuance failed, refer to the failure reason in the issuance request. */
  Failed = 'failed',
  /** The issuance has been successfully claimed by the issuee. */
  Issued = 'issued',
  /** Issuance request is pending. */
  Pending = 'pending'
}

/** Fields that can be used for sorting async issuance requests by. */
export enum AsyncIssuanceRequestsOrderBy {
  /** The timestamp when the async issuance request was created. */
  CreatedAt = 'createdAt'
}

/** Represents the criteria for filtering async issuances requests. */
export type AsyncIssuanceRequestsWhere = {
  /** Return async issuance requests for the specified contract. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** Return async issuance requests created by the specified user. */
  createdById?: InputMaybe<Scalars['ID']['input']>;
  /** Return async issuance requests created after this point. */
  createdFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** Return async issuance requests created before this point. */
  createdTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** Return async issuance requests for the specified identity. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** Return async issuance requests for the specified identity store. */
  identityStoreId?: InputMaybe<Scalars['ID']['input']>;
  /** Return async issuance requests with the specified status. */
  status?: InputMaybe<AsyncIssuanceRequestStatus>;
};

/** The response of an async issuance request. */
export type AsyncIssuanceResponse = {
  __typename?: 'AsyncIssuanceResponse';
  /**
   * Request Ids collections contains an autogenerated request ID for each async issuance request.
   *
   * Items to note:
   *
   * - The return order of the request IDs matches the order of the input requests.
   */
  asyncIssuanceRequestIds: Array<Scalars['ID']['output']>;
};

/** A limited async issuance token response. */
export type AsyncIssuanceTokenResponse = {
  __typename?: 'AsyncIssuanceTokenResponse';
  expires: Scalars['DateTime']['output'];
  /**
   * The photo capture request ID to use with photo capture operations prior to issuance. This will be set if the async issuance was created with `photoCapture` set to true.
   *
   * When this field is set:
   *
   * - A photo must be captured prior to calling `Mutation.createIssuanceRequestForAsyncIssuance`.
   * - The async issuance token can used for photo capture operations: `Mutation.capturePhoto`, `Subscription.photoCaptureEvent` and `Query.photoCaptureStatus`.
   */
  photoCaptureRequestId?: Maybe<Scalars['String']['output']>;
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

/** The type of VC authority hosting. */
export enum AuthorityHosting {
  CustomerHosted = 'CustomerHosted',
  VoHosted = 'VoHosted',
  VoHostedCustomerDns = 'VoHostedCustomerDns'
}

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

/** Defines the branding configuration for VO applications. */
export type Branding = {
  __typename?: 'Branding';
  /** When the branding was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the branding */
  createdBy: User;
  /** The branding configuration data. */
  data?: Maybe<Scalars['JSONObject']['output']>;
  /** The ID of the branding configuration. */
  id: Scalars['ID']['output'];
  /** The name of the platform this branding is for */
  name: Scalars['String']['output'];
  /** When the branding was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the branding. */
  updatedBy?: Maybe<User>;
};

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

/**
 * A constraint to apply to one claim in the verifiable credential.
 * Choose one operator of `values`, `contains` or `startsWith`.
 */
export type ClaimConstraint = {
  /** Name of the claim for the constraint. This is the claim name in the verifiable credential. See outputClaim in claimMapping type. */
  claimName: Scalars['String']['input'];
  /** The constraint evaluates to true if the claim value contains the specified value. */
  contains?: InputMaybe<Scalars['String']['input']>;
  /** The constraint evaluates to true if the claim value starts with the specified value. */
  startsWith?: InputMaybe<Scalars['String']['input']>;
  /** Set of values that should match the claim value. If you specify multiple values, like ["red", "green", "blue"] it is a match if the claim value in the credential has any of the values in the collection. */
  values?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** The type of the claim, providing validation of the claim value. */
export enum ClaimType {
  /** The claim value is a boolean value encoded as `true` or `false`. */
  Boolean = 'boolean',
  /** The claim value is a date string in full-date ISO 8601 format: `YYYY-MM-DD`. */
  Date = 'date',
  /** The claim value is a date-time string in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`. */
  DateTime = 'dateTime',
  /** The claim value is an email address. */
  Email = 'email',
  /** The claim value is a JPEG image encoded as a base64 encoded [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs). */
  Image = 'image',
  /** The claim value is one of a list of strings specified via the claim `validation` field. */
  List = 'list',
  /** The claim value is a numeric type, supporting both integers and decimals (encoded as a string). */
  Number = 'number',
  /** The claim value is a phone number in international E.164 format. */
  Phone = 'phone',
  /** The claim value matches a regex pattern. */
  Regex = 'regex',
  /** The claim value is text. */
  Text = 'text',
  /** The claim value is a URL. */
  Url = 'url'
}

/** Validation definition for the claim value, according to the claim type. */
export type ClaimValidation = ListValidation | NumberValidation | RegexValidation | TextValidation;

/** Provides additional validation input for the defined claim type. */
export type ClaimValidationInput =
  { list: ListValidationInput; number?: never; regex?: never; text?: never; }
  |  { list?: never; number: NumberValidationInput; regex?: never; text?: never; }
  |  { list?: never; number?: never; regex: RegexValidationInput; text?: never; }
  |  { list?: never; number?: never; regex?: never; text: TextValidationInput; };

/** Client credentials input, e.g. for a MS Graph client or VC Authority client */
export type ClientCredentialsInput = {
  /** The client ID. */
  clientId: Scalars['UUID']['input'];
  /** The client secret. */
  clientSecret: Scalars['String']['input'];
};

/** Record of a communication sent to a recipient. */
export type Communication = {
  __typename?: 'Communication';
  /** The contact method used to send the communication. */
  contactMethod: ContactMethod;
  /** The user (Person or Application) whose action resulted in the communication. */
  createdBy: User;
  /** The error while sending the communication, if any. */
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** The purpose of the communication. */
  purpose: CommunicationPurpose;
  /** The recipient of the communication. */
  recipient: Identity;
  /** When the communication was sent. */
  sentAt: Scalars['DateTime']['output'];
};

/** Fields that can be used for sorting communications. */
export enum CommunicationOrderBy {
  /** The name of the communication recipient. */
  RecipientName = 'recipientName',
  /** When the communication was sent. */
  SentAt = 'sentAt'
}

/** The possible communication purposes. */
export enum CommunicationPurpose {
  Issuance = 'issuance',
  Verification = 'verification'
}

/** The possible statuses of a communication. */
export enum CommunicationStatus {
  Failed = 'failed',
  Sent = 'sent'
}

/** Defines the filter criteria used to find communications. */
export type CommunicationWhere = {
  /** The ID of the async issuance request that the communication is related to. */
  asyncIssuanceRequestId?: InputMaybe<Scalars['ID']['input']>;
  /** The contact method of the communication. */
  contactMethod?: InputMaybe<ContactMethod>;
  /** The ID of the user (Person or Application) whose action resulted in the communication. */
  createdById?: InputMaybe<Scalars['ID']['input']>;
  /** The purpose of the communication. */
  purpose?: InputMaybe<CommunicationPurpose>;
  /** The ID of the recipient of the communication. */
  recipientId?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the sentAt period to include. */
  sentFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the sentAt period to include. */
  sentTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** The status of the communication. */
  status?: InputMaybe<CommunicationStatus>;
};

/** Defines the input to create or update a concierge branding configuration. */
export type ConciergeBrandingInput = {
  /** The branding configuration data. */
  data: Scalars['JSONObject']['input'];
};

/** Branding fields for the concierge OIDC client. */
export type ConciergeClientBrandingInput = {
  /** The background color for concierge authentication screens. */
  backgroundColor?: InputMaybe<Scalars['String']['input']>;
  /** The background image for concierge authentication screens. */
  backgroundImage?: InputMaybe<Scalars['URL']['input']>;
  /** The logo displayed during concierge authentication. */
  logo?: InputMaybe<Scalars['URL']['input']>;
  /** The display name shown in concierge flows. */
  name?: InputMaybe<Scalars['String']['input']>;
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

/** The available constraint operators */
export enum ConstraintOperator {
  Contains = 'contains',
  Equals = 'equals',
  StartsWith = 'startsWith',
  Unknown = 'unknown'
}

/** Represents the contact information. */
export type Contact = {
  __typename?: 'Contact';
  /** The method of contact. */
  method: ContactMethod;
  /** The value of the contact method, either an email address or phone number for SMS. */
  value: Scalars['String']['output'];
};

/** Input defining the contact information. */
export type ContactInput = {
  /** The method of contact. */
  method: ContactMethod;
  /**
   * The value of the contact method, either an email address or phone number for SMS.
   *
   * Item of note:
   *
   * - For phone numbers, the value must be in international E.164 format.
   * - Email addresses to the following domains will be ignored and are meant for use while testing.
   *   - `@example.com`
   *   - `@example.org`
   *   - `@example.net`
   *   - `@example.edu`
   * - SMS messages to the following numbers will be ignore and are meant for use while testing.
   *   - `+61491570006` (AU)
   *   - `+61491570157`
   *   - `+61491570737`
   *   - `+61491573087`
   *   - `+61491578957`
   *   - `+15005550109` (US)
   *   - `+15005550119`
   *   - `+15005550129`
   *   - `+15005550139`
   *   - `+15005550149`
   *   - `+447709000018` (UK)
   *   - `+447709000028`
   *   - `+447709000038`
   *   - `+447709000048`
   *   - `+447709000058`
   */
  value: Scalars['String']['input'];
};

/** The possible contact methods. */
export enum ContactMethod {
  Email = 'email',
  Sms = 'sms'
}

/** Defines a contract that can be used to issue credentials */
export type Contract = {
  __typename?: 'Contract';
  /** Returns the async issuance requests for this contract, optionally matching the specified criteria. */
  asyncIssuanceRequests: Array<AsyncIssuanceRequest>;
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
  /** The public manifest URL for the contract. */
  manifestUrl?: Maybe<Scalars['String']['output']>;
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
export type ContractAsyncIssuanceRequestsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<ContractAsyncIssuanceRequestsWhere>;
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

/** Represents the criteria for filtering async issuances requests for a contract. */
export type ContractAsyncIssuanceRequestsWhere = {
  /** Return async issuance requests created after this point. */
  createdFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** Return async issuance requests created before this point. */
  createdTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** Return async issuance requests for the specified identity. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** Return async issuance requests with the specified status. */
  status?: InputMaybe<AsyncIssuanceRequestStatus>;
};

/** Represents a count of occurrences of a contract. */
export type ContractCount = {
  __typename?: 'ContractCount';
  /** The contract. */
  contract: Contract;
  /** The number of occurrences of this contract. */
  count: Scalars['NonNegativeInt']['output'];
};

/** Defines a claim included in a verifiable credential. */
export type ContractDisplayClaim = {
  __typename?: 'ContractDisplayClaim';
  /** The name of the claim. */
  claim: Scalars['String']['output'];
  /** The description of the claim. */
  description?: Maybe<Scalars['String']['output']>;
  /** Indicates the value is fixed for this claim when issuing this credential */
  isFixed?: Maybe<Scalars['Boolean']['output']>;
  /** Indicates a value need not be provided for this claim when issuing this credential. */
  isOptional?: Maybe<Scalars['Boolean']['output']>;
  /** The label of the claim. */
  label: Scalars['String']['output'];
  /** The type of the claim. */
  type: ClaimType;
  /** Defines how the value of the claim should be validated. */
  validation?: Maybe<ClaimValidation>;
  /** The value for the claim (optional, provides a default value for this claim). */
  value?: Maybe<Scalars['String']['output']>;
};

/** Defines a claim included in a verifiable credential. */
export type ContractDisplayClaimInput = {
  /** The name of the claim. */
  claim: Scalars['String']['input'];
  /** The description of the claim. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Indicates the value is fixed for this claim when issuing this credential */
  isFixed?: InputMaybe<Scalars['Boolean']['input']>;
  /** Indicates a value need not be provided for this claim when issuing this credential. */
  isOptional?: InputMaybe<Scalars['Boolean']['input']>;
  /** The label of the claim. */
  label: Scalars['String']['input'];
  /** The type of the claim. */
  type: ClaimType;
  /** Defines how the value of the claim should be validated. */
  validation?: InputMaybe<ClaimValidationInput>;
  /** The value for the claim (optional, provides a fixed value for this claim). */
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
 * The display properties of the verifiable credential at the contract level
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
 * The display properties of the verifiable credential at the contract level
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

/** Credential display definitions at the contract level */
export type ContractDisplayModel = {
  __typename?: 'ContractDisplayModel';
  card: ContractDisplayCredential;
  claims: Array<ContractDisplayClaim>;
  consent: ContractDisplayConsent;
  locale: Scalars['Locale']['output'];
};

/** Credential display definitions at the contract level */
export type ContractDisplayModelInput = {
  card: ContractDisplayCredentialInput;
  claims: Array<ContractDisplayClaimInput>;
  consent: ContractDisplayConsentInput;
  locale: Scalars['Locale']['input'];
};

/** Defines the input to import a contract. */
export type ContractImportInput = {
  /** The input to create the contract. */
  contractInput: ContractInput;
  /** The id of the exported contract. */
  id: Scalars['ID']['input'];
};

/** Defines the input to create or update a contract */
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
  /** The name of the contract. */
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

/** Fields that can be used for sorting contracts. */
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
  /** The ID of the OIDC client that requested authentication resulting in the presentation. */
  oidcClientId?: InputMaybe<Scalars['ID']['input']>;
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
  /** The ID of the wallet who presented the credential */
  walletId?: InputMaybe<Scalars['ID']['input']>;
};

/** Defines the filter criteria used to find contracts. */
export type ContractWhere = {
  /** The ID of the user (Person or Application) that created the contract. */
  createdById?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the createdAt period to include. */
  createdFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the createdAt period to include. */
  createdTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** List only the contracts which include any of these credential types. */
  credentialTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The type of face check photo support. */
  faceCheckSupport?: InputMaybe<FaceCheckPhotoSupport>;
  /** List only the contracts whose deprecation status matches the flag. */
  isDeprecated?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only contracts that are or are not provisioned in the Verified Credentials Network. */
  isProvisioned?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only contracts that are or are not published in the Verified Credentials Network. */
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only contracts matching this name. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** List only contracts from this template. */
  templateId?: InputMaybe<Scalars['ID']['input']>;
};

/** A config for allowed CORS origin */
export type CorsOriginConfig = {
  __typename?: 'CorsOriginConfig';
  /** The local ID of the CORS origin config */
  id: Scalars['ID']['output'];
  /** The origin value or regex pattern (e.g. https://example.com or ^https://.*\\.foo\\.com$) */
  origin: Scalars['String']['output'];
};

/** Input payload for a CORS origin config */
export type CorsOriginConfigInput = {
  /** The origin value or regex pattern (e.g. https://example.com or ^https://.*\\.foo\\.com$) */
  origin: Scalars['String']['input'];
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
  /** The name of the claim. */
  claim: Scalars['String']['input'];
  /** The description of the claim. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Indicates the value is fixed for this claim when issuing this credential */
  isFixed?: InputMaybe<Scalars['Boolean']['input']>;
  /** Indicates a value need not be provided for this claim when issuing this credential. */
  isOptional?: InputMaybe<Scalars['Boolean']['input']>;
  /** The label of the claim. */
  label: Scalars['String']['input'];
  /** The type of the claim. */
  type: ClaimType;
  /** Defines how the value of the claim should be validated. */
  validation?: InputMaybe<ClaimValidationInput>;
  /** The value for the claim (optional, provides a fixed value for this claim). */
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

/** Status of the DID docs */
export enum DidDocumentStatus {
  Published = 'published',
  Submitted = 'submitted'
}

/** Returns discoverable information about this API instance */
export type Discovery = {
  __typename?: 'Discovery';
  /** Returns the features enabled for this API instance. */
  features: Features;
  /** Returns the failures that occurred while trying to connect to external services. */
  serviceFailures: ServiceFailures;
  /** Returns the URLs for various features. */
  urls: FeatureUrls;
  /** Returns the version of the API. */
  version: Scalars['String']['output'];
};

/** A config for email sender (override) */
export type EmailSenderConfig = {
  __typename?: 'EmailSenderConfig';
  /** The sender email address to use for emails */
  senderEmail: Scalars['String']['output'];
  /** The sender name to use for emails */
  senderName: Scalars['String']['output'];
};

/** Input payload for an Email Sender config */
export type EmailSenderConfigInput = {
  /** The sender email address to use for emails */
  senderEmail?: InputMaybe<Scalars['String']['input']>;
  /** The sender name to use for emails */
  senderName?: InputMaybe<Scalars['String']['input']>;
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

/** The URLs for various features. */
export type FeatureUrls = {
  __typename?: 'FeatureUrls';
  /** URL of the documentation website */
  docsUrl: Scalars['URL']['output'];
  /** URL of the OIDC authority (when enabled) */
  oidcAuthorityUrl?: Maybe<Scalars['URL']['output']>;
  /** URL of the portal */
  portalUrl: Scalars['URL']['output'];
};

/** Specifies which features are enabled for this API instance. */
export type Features = {
  __typename?: 'Features';
  /** Indicates whether the demo features (presentation demo page, authn demo page, .etc) are available. */
  demoEnabled: Scalars['Boolean']['output'];
  /** Indicates whether the API dev tools (Apollo sandbox, introspection, PKCE) are available. */
  devToolsEnabled: Scalars['Boolean']['output'];
  /** Indicates whether the face check features (i.e. issuing credentials with face check photo, .etc) are available */
  faceCheckEnabled: Scalars['Boolean']['output'];
  /** Indicates whether the API instance is configured to support finding home tenant identities via the findTenantIdentities query. */
  findTenantIdentities: Scalars['Boolean']['output'];
  /** Indicates whether the OIDC provider is available. */
  oidcEnabled: Scalars['Boolean']['output'];
};

/** The security settings for GraphQL operations. */
export type GraphQlSecuritySettings = {
  __typename?: 'GraphQLSecuritySettings';
  maxAliases?: Maybe<Scalars['Int']['output']>;
  maxDepth?: Maybe<Scalars['Int']['output']>;
  maxDirectives?: Maybe<Scalars['Int']['output']>;
  maxTokens?: Maybe<Scalars['Int']['output']>;
};

/** The security settings for GraphQL operations. */
export type GraphQlSecuritySettingsInput = {
  maxAliases?: InputMaybe<Scalars['Int']['input']>;
  maxDepth?: InputMaybe<Scalars['Int']['input']>;
  maxDirectives?: InputMaybe<Scalars['Int']['input']>;
  maxTokens?: InputMaybe<Scalars['Int']['input']>;
};

/** Represents an identity that is issued credentials */
export type Identity = {
  __typename?: 'Identity';
  /** Returns the async issuance requests for this identity, optionally matching the specified criteria. */
  asyncIssuanceRequests: Array<AsyncIssuanceRequest>;
  /** When the identity was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the identity. */
  createdBy: User;
  /** The local id of this identity */
  id: Scalars['ID']['output'];
  /** The unique identifier of the identity in the issuing tenant */
  identifier: Scalars['String']['output'];
  /** The local ID of identity store this identity belongs to */
  identityStoreId: Scalars['String']['output'];
  /** Indicates whether this identity is deletable. Only identities that have no issuances or async issuances can be deleted. */
  isDeletable: Scalars['Boolean']['output'];
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
export type IdentityAsyncIssuanceRequestsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<IdentityAsyncIssuanceRequestsWhere>;
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

/** Represents the criteria for filtering async issuances requests for an identity. */
export type IdentityAsyncIssuanceRequestsWhere = {
  /** Return async issuance requests for the specified contract. */
  contractId?: InputMaybe<Scalars['ID']['input']>;
  /** Return async issuance requests created after this point. */
  createdFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** Return async issuance requests created before this point. */
  createdTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** Return async issuance requests with the specified status. */
  status?: InputMaybe<AsyncIssuanceRequestStatus>;
};

/**
 * Input type representing an identity that is issued credentials.
 * Behavior / backward compatibility:
 * - Supplying (issuer, identifier) will create or update the identity.
 * - If no identity store exists whose identifier == issuer, one is created automatically
 *   (lazy creation) with a derived name and inferred type. With that type being either Entra or Manual.
 * - This keeps existing identity creation and updates flows compatible.
 */
export type IdentityInput = {
  /** The unique identifier of the identity within the issuer (issuer-scoped). */
  identifier: Scalars['String']['input'];
  /**
   * The issuer of the identity.
   * Also serves as the identity store identifier. If an IdentityStore with this
   * identifier does not yet exist it will be created automatically with an inferred
   * type of Entra or Manual.
   */
  issuer: Scalars['String']['input'];
  /** A human-readable name for the identity. */
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

/** Fields that can be used for sorting identities. */
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
  /** The ID of the OIDC client that requested authentication resulting in the presentation. */
  oidcClientId?: InputMaybe<Scalars['ID']['input']>;
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
  /** The ID of the wallet who presented the credential */
  walletId?: InputMaybe<Scalars['ID']['input']>;
};

/** A single identity store configuration */
export type IdentityStore = {
  __typename?: 'IdentityStore';
  /** Optional client ID (e.g. used for identity look ups) */
  clientId?: Maybe<Scalars['String']['output']>;
  /** When this identity store was created */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created this identity store */
  createdBy: User;
  /** The local ID of the identity store */
  id: Scalars['ID']['output'];
  /** A unique identifier for this store */
  identifier: Scalars['String']['output'];
  /** Whether this store represents an Entra tenant from which users or applications will authenticate to Verified Orchestration. */
  isAuthenticationEnabled: Scalars['Boolean']['output'];
  /** A human-friendly name for this store */
  name: Scalars['String']['output'];
  /** When the identity store was suspended. */
  suspendedAt?: Maybe<Scalars['DateTime']['output']>;
  /** What kind of store this is (e.g. 'entra') */
  type: IdentityStoreType;
  /** When this identity store was last updated */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated this identity store */
  updatedBy?: Maybe<User>;
};

/** Input payload for creating an identity store */
export type IdentityStoreInput = {
  /** The optional client ID, used for i.e identity lookups. */
  clientId?: InputMaybe<Scalars['String']['input']>;
  /** The optional client secret, applicable only to confidential clients. */
  clientSecret?: InputMaybe<Scalars['String']['input']>;
  /** A unique identifier for this store */
  identifier: Scalars['String']['input'];
  /** Whether tokens issued from this tenant can be used to authenticate with the VO APIs. */
  isAuthenticationEnabled: Scalars['Boolean']['input'];
  /** A human-friendly name for this store */
  name: Scalars['String']['input'];
  /** What kind of store this is (e.g. 'Entra') */
  type: IdentityStoreType;
};

/** Fields that can be used to sort identity stores */
export enum IdentityStoreOrderBy {
  /** Sort by creation timestamp */
  CreatedAt = 'createdAt',
  /** Sort by identifier */
  Identifier = 'identifier',
  /** Sort by name */
  Name = 'name',
  /** Sort by type */
  Type = 'type'
}

/** The supported identity store types */
export enum IdentityStoreType {
  /** Microsoft Entra ID (Azure AD) */
  Entra = 'Entra',
  /** A manually managed identity store (no external directory backing) */
  Manual = 'Manual'
}

/** Search criteria for identity stores */
export type IdentityStoreWhere = {
  /** Partial match on the identifier */
  identifier?: InputMaybe<Scalars['String']['input']>;
  /** Whether to include deleted identity stores in the results. */
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter by authentication enabled flag */
  isAuthenticationEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only the identity stores which are, or are not, deleted. */
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  /** Partial match on the name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Exact match on the type */
  type?: InputMaybe<Scalars['String']['input']>;
};

/** Defines the searchable fields usable to find identities */
export type IdentityWhere = {
  /** List identities from a specific Identity Store */
  identityStoreId?: InputMaybe<Scalars['ID']['input']>;
  /** List only the identities which can be deleted */
  isDeletable?: InputMaybe<Scalars['Boolean']['input']>;
  /** The issuer of the identity to match */
  issuer?: InputMaybe<Scalars['String']['input']>;
  /** The name of the identity to match */
  name?: InputMaybe<Scalars['String']['input']>;
  /** List only the identities related to a wallet */
  walletId?: InputMaybe<Scalars['ID']['input']>;
};

/** Defines the input for templates and contracts. */
export type ImportInput = {
  /** The contracts to import. */
  contracts?: InputMaybe<Array<ContractImportInput>>;
  /**
   * The templates to import.
   *
   * Must be ordered with parents before their children (i.e. top-down hierarchy).
   */
  templates?: InputMaybe<Array<TemplateImportInput>>;
};

/** An instances of the Verified Orchestration platform */
export type Instance = {
  __typename?: 'Instance';
  /**
   * The type of authority hosting:
   * - VO hosted
   * - VO hosted with customer DNS
   * - Customer hosted, requiring an authority client and authority ID to be configured.
   */
  authorityHosting: AuthorityHosting;
  /** The current instance configuration. */
  configuration?: Maybe<InstanceConfiguration>;
  /** The unique identifier of the instance, forming part of the URL, for example `company.sandbox` or `company`. */
  identifier: Scalars['String']['output'];
};

/** The current configuration of the instance. */
export type InstanceConfiguration = {
  __typename?: 'InstanceConfiguration';
  /** The additional auth tenant IDs for the instance. */
  additionalAuthTenantIds?: Maybe<Array<Scalars['String']['output']>>;
  /** The app OID labels for the instance. */
  appOidLabels?: Maybe<Scalars['JSONObject']['output']>;
  /** The CORS origins for the instance. */
  corsOrigins?: Maybe<Array<Scalars['String']['output']>>;
  /** The GraphQL security settings for the instance. */
  graphQLSecuritySettings?: Maybe<GraphQlSecuritySettings>;
  /** The identity issuer labels for the instance. */
  identityIssuerLabels?: Maybe<Scalars['JSONObject']['output']>;
};

/** The new or updated configuration of the instance. */
export type InstanceConfigurationInput = {
  /**
   * The additional auth tenant IDs for the instance.
   * For updates, when set to `null` (or not set), any existing value will be retained.
   * To remove the value, set to an empty array.
   */
  additionalAuthTenantIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /**
   * The app OID labels for the instance.
   * For updates, when set to `null` (or not set), any existing value will be retained.
   * To remove the value, set to an empty object.
   */
  appOidLabels?: InputMaybe<Scalars['JSONObject']['input']>;
  /**
   * The CORS origins for the instance.
   * For updates, when set to `null` (or not set), any existing value will be retained.
   * To remove the value, set to an empty array.
   */
  corsOrigins?: InputMaybe<Array<Scalars['String']['input']>>;
  /**
   * The GraphQL security settings for the instance.
   * For updates, when set to `null` (or not set), any existing value will be retained.
   * To remove all GraphQL security settings and use the defaults, set to an empty object.
   */
  graphQLSecuritySettings?: InputMaybe<GraphQlSecuritySettingsInput>;
  /**
   * The identity issuer labels for the instance.
   * For updates, when set to `null` (or not set), any existing value will be retained.
   * To remove the value, set to an empty object.
   */
  identityIssuerLabels?: InputMaybe<Scalars['JSONObject']['input']>;
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

/** Fields that can be used for sorting issuances. */
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
  /** The ID of the OIDC client that requested authentication resulting in the presentation. */
  oidcClientId?: InputMaybe<Scalars['ID']['input']>;
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
  /** The ID of the wallet who presented the credential */
  walletId?: InputMaybe<Scalars['ID']['input']>;
};

/**
 * The issuance request payload contains information about your verifiable credentials issuance request.
 *
 * The following example demonstrates an issuance request by using a PIN code flow with user claims, such as first name and last name.
 *
 * ```json
 * {
 *   "contractId": "01910769-c6e8-7d2a-9ecd-1f2bcb7f62ba"
 *   "identityId": "8ae15985-0d43-40f8-a52e-b51399a0de12"
 *   "includeQRCode": true,
 *   "claims": {
 *     "firstName": "John",
 *     "lastName": "Doe"
 *   },
 *   "pin": {
 *     "value": "1234"
 *   }
 * }
 * ```
 *
 * The result of this request returns a URL and optional QR code to start the issuance process.
 */
export type IssuanceRequestInput = {
  /** The callback to register. */
  callback?: InputMaybe<Callback>;
  /**
   * The collection of assertions made about the subject in the verifiable credential.
   *
   * Item of note:
   *
   * - You must fulfill the contract claims definition. Review contract creation for more information.
   */
  claims?: InputMaybe<Scalars['JSONObject']['input']>;
  /** The ID of the contract you wish to issue. */
  contractId: Scalars['ID']['input'];
  /**
   * Setting the expiration data allows for explicitly control over credential expiry, regardless of when it is issued.
   *
   * Item of note:
   *
   * - The date must be in ISO format.
   */
  expirationDate?: InputMaybe<Scalars['DateTime']['input']>;
  /**
   * The issuee's photo for use with face check presentation verification.
   *
   * Items of note:
   *
   * - _Optional:_ When no photo is set and the contract does not require one, the issuance process does not require a photo.
   * - The photo is displayed via the authenticator app.
   * - The image content type and encoding must be: `image/jpg;base64`.
   * - Image data can only be provided by a single source, either from the faceCheckPhoto or the photoCaptureRequestId fields.
   * - When the contract **requires** face check, either the **faceCheckPhoto** or the **photoCaptureRequestId** property must be set.
   * - When the contract **requires no** face check, neither the **faceCheckPhoto** nor the **photoCaptureRequestId** property can be set.
   */
  faceCheckPhoto?: InputMaybe<Scalars['String']['input']>;
  /**
   * The identity you wish to issue to.
   *
   * Item of note:
   *
   * - _Optional:_ When issuing using a limited access token or the identityId property.
   */
  identity?: InputMaybe<IdentityInput>;
  /**
   * The ID of the identity you wish to issue to.
   *
   * Item of note:
   *
   * - _Optional:_ When issuing using a limited access token or the identity property.
   */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * A flag to specify whether a QR Code is included in the response of the request.
   *
   * Items of note:
   *
   * - The Possible values are true (default) or false.
   * - Present the QR code and ask the user to scan it.
   * - Scanning the QR code launches the authenticator app with this issuance request.
   * - When not using the QR Code, use the return url property to render a deep link.
   */
  includeQRCode?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * The ID of the photo capture request.
   *
   * Items of note:
   *
   * - _Optional:_ When no photo capture is set and the contract does not require one, the issuance process does not require a photo.
   * - The captured photo is displayed via the authenticator app.
   * - Image data can only be provided by a single source, either from the faceCheckPhoto or the photoCaptureRequestId fields.
   * - When the contract **requires** face check, either the **faceCheckPhoto** or the **photoCaptureRequestId** property must be set.
   * - When the contract **requires no** face check, neither the **faceCheckPhoto** nor the **photoCaptureRequestId** property can be set.
   * - A photo capture request is only valid for a single issuance.
   */
  photoCaptureRequestId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * The PIN code required for the issuance.
   *
   * Item of note:
   *
   * - _Optional:_ When no PIN is set, the issuance process does not require a PIN.
   */
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
 * Represents a successful issuance.
 * When your app receives the response, the app needs to present the QR code to the user.
 * The user scans the QR code, which opens the authenticator app and starts the issuance process.
 */
export type IssuanceResponse = {
  __typename?: 'IssuanceResponse';
  /** Indicates when the response will expire. */
  expiry: Scalars['PositiveInt']['output'];
  /**
   * The URL to redirect the issuee to after the issuance process is completed.
   *
   * Items of note:
   *
   * - _Optional:_ When no redirect URL is set, the issuee will remain on the success page.
   */
  postIssuanceRedirectUrl?: Maybe<Scalars['URL']['output']>;
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
  /** List issuances by identity. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** List issuances by identity store. */
  identityStoreId?: InputMaybe<Scalars['ID']['input']>;
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

/** List claim validation. */
export type ListValidation = {
  __typename?: 'ListValidation';
  /** The list of valid values for the claim. */
  values: Array<Scalars['String']['output']>;
};

/** List claim validation. */
export type ListValidationInput = {
  /** The list of valid values for the claim. */
  values: Array<Scalars['String']['input']>;
};

/** X.509 certificate validation details from the mDoc issuer authentication. */
export type MDocCertificateValidation = {
  __typename?: 'MDocCertificateValidation';
  /** Whether the certificate chain validation succeeded. */
  isValid: Scalars['Boolean']['output'];
  /** The issuer distinguished name from the leaf certificate. */
  issuer: Scalars['String']['output'];
  /** Certificate serial number (hex format with colon separators). */
  serialNumber: Scalars['String']['output'];
  /** The subject distinguished name from the leaf certificate. */
  subject: Scalars['String']['output'];
  /** Certificate validity period. */
  validity: MDocCertificateValidity;
};

/** Certificate validity period. */
export type MDocCertificateValidity = {
  __typename?: 'MDocCertificateValidity';
  /** Certificate not valid after this date. */
  notAfter: Scalars['DateTime']['output'];
  /** Certificate not valid before this date. */
  notBefore: Scalars['DateTime']['output'];
};

/**
 * A single claim from an mDoc credential.
 * Represents an IssuerSignedItem from the mDoc specification.
 */
export type MDocClaim = {
  __typename?: 'MDocClaim';
  /** The identifier of the data element (claim name). */
  elementIdentifier: Scalars['String']['output'];
  /**
   * The value of the data element (claim value).
   * Can be any JSON-compatible type (string, number, boolean, object, array, null).
   */
  elementValue?: Maybe<Scalars['JSON']['output']>;
};

/** Input for specifying an mDoc claim path. */
export type MDocClaimPathInput = {
  /**
   * Optional flag indicating whether the verifier intends to retain the claim data.
   * When true, signals to the wallet that the verifier plans to store this claim.
   */
  intentToRetain?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * The path to the claim in the mDoc (e.g., ["org.iso.18013.5.1", "family_name"]).
   * The first element is typically the namespace, and the second is the claim name.
   */
  path: Array<Scalars['String']['input']>;
  /**
   * Optional flag indicating whether this claim should be used for identity creation/lookup.
   * When true, this claim's value will be included in the hash used to create or find an identity.
   * The identity will be created/found during processMDocPresentationResponse using:
   * - identifier: hash of all claims marked with useForIdentity=true (sorted by path)
   * - issuer: the docType of the presentation
   */
  useForIdentity?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Diagnostic information from the mDoc presentation response processing. */
export type MDocDiagnostics = {
  __typename?: 'MDocDiagnostics';
  /** The decoded device response (as JSON string) */
  deviceResponse?: Maybe<Scalars['String']['output']>;
  /** The full decrypted JWT response (as JSON string) */
  response?: Maybe<Scalars['String']['output']>;
  /** Comprehensive validation results showing all checks performed according to ISO 18013-5. */
  validation: MDocValidationResults;
};

/**
 * Digest validation result for a single claim.
 * Per ISO 18013-5 section 9.1.2.5, each IssuerSignedItem has a corresponding digest in the MSO
 * that must be validated to ensure data integrity.
 */
export type MDocDigestValidation = {
  __typename?: 'MDocDigestValidation';
  /** The digest ID used to match the digest in the MSO. */
  digestID: Scalars['Int']['output'];
  /** The element identifier (claim name). */
  elementIdentifier: Scalars['String']['output'];
  /** Whether the digest validation passed. */
  isValid: Scalars['Boolean']['output'];
  /** The namespace (e.g., "org.iso.18013.5.1"). */
  namespace: Scalars['String']['output'];
};

/**
 * An mDoc document returned in the presentation response.
 * Contains the document type and the issuer-signed claims organized by namespace.
 */
export type MDocDocument = {
  __typename?: 'MDocDocument';
  /** The document type (e.g., "org.iso.18013.5.1.mDL" for mobile driver's license). */
  docType: Scalars['String']['output'];
  /** The namespaces containing the issuer-signed claims. */
  namespaces: Array<MDocNamespace>;
};

/**
 * Validation results for a single mDoc document.
 * Documents all validation steps performed according to ISO 18013-5 section 9.3.1.
 */
export type MDocDocumentValidation = {
  __typename?: 'MDocDocumentValidation';
  /** X.509 certificate chain validation details (ISO 18013-5 section 9.3.3). */
  certificate: MDocCertificateValidation;
  /** The digest algorithm used in the MSO (e.g., "SHA-256", "SHA-384", "SHA-512"). */
  digestAlgorithm: Scalars['String']['output'];
  /** Digest validation results for each claim (ISO 18013-5 section 9.3.1 step 3). */
  digestValidations: Array<MDocDigestValidation>;
  /** The doc type that was validated. */
  docType: Scalars['String']['output'];
  /** Whether the docType matches between request and response (ISO 18013-5 section 9.3.1 step 4). */
  docTypeMatches: Scalars['Boolean']['output'];
  /** Overall validation status - true if all checks passed for this document. */
  isValid: Scalars['Boolean']['output'];
  /**
   * Whether the mDoc is currently within its validity period.
   * Checks that current time is between validFrom and validUntil.
   */
  isWithinValidityPeriod: Scalars['Boolean']['output'];
  /** MSO validity information (ISO 18013-5 section 9.3.1 step 5). */
  msoValidityInfo: MDocMsoValidityInfo;
  /** The received doc type from the MSO. */
  receivedDocType: Scalars['String']['output'];
  /** The requested doc type. */
  requestedDocType: Scalars['String']['output'];
  /** COSE_Sign1 signature verification status (ISO 18013-5 section 9.3.1 step 2). */
  signatureVerified: Scalars['Boolean']['output'];
};

/**
 * Mobile Security Object (MSO) validity information.
 * Per ISO 18013-5, the MSO contains validity period information for the mDoc credential.
 */
export type MDocMsoValidityInfo = {
  __typename?: 'MDocMsoValidityInfo';
  /** Optional expected update date. */
  expectedUpdate?: Maybe<Scalars['DateTime']['output']>;
  /** When the MSO was signed by the issuer. */
  signed: Scalars['DateTime']['output'];
  /** The mDoc is valid from this date. */
  validFrom: Scalars['DateTime']['output'];
  /** The mDoc is valid until this date. */
  validUntil: Scalars['DateTime']['output'];
};

/**
 * A namespace containing a collection of claims from an mDoc credential.
 * Each namespace groups related claims together (e.g., "org.iso.18013.5.1" for driver's license data).
 */
export type MDocNamespace = {
  __typename?: 'MDocNamespace';
  /** The claims contained within this namespace. */
  claims: Array<MDocClaim>;
  /** The namespace identifier (e.g., "org.iso.18013.5.1"). */
  namespace: Scalars['String']['output'];
};

/** The platform that generated the mDoc presentation response. */
export enum MDocPlatform {
  /** Android using OpenID4VP protocol */
  Android = 'android',
  /** Apple using ISO18013-7 protocol */
  Apple = 'apple'
}

/** Input for creating an mDoc presentation request. */
export type MDocPresentationRequestInput = {
  /** Optional callback configuration for receiving presentation responses. */
  callback?: InputMaybe<Callback>;
  /** A display name of the verifier. This name will be presented to the user. */
  clientName: Scalars['String']['input'];
  /** The mDoc document type to request (e.g., "org.iso.18013.5.1.mDL" for mobile driver's license). */
  docType: Scalars['String']['input'];
  /** The identity who will present (alternatively use the identityId property, if known). */
  identity?: InputMaybe<IdentityInput>;
  /** The ID of the identity who will present (alternatively use the identity property). */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * The claims to request from the mDoc credential.
   * Each claim is specified as a path array (e.g., ["org.iso.18013.5.1", "family_name"]).
   */
  requestedClaims: Array<MDocClaimPathInput>;
  /**
   * Optional signing configuration for the request. If provided, the request will be signed
   * using a generated X.509 certificate and include the expected_origins for security validation.
   * If not provided, the request will be unsigned.
   */
  signing?: InputMaybe<MDocRequestSigningInput>;
};

export type MDocPresentationRequestResponse = MDocPresentationResponse | RequestErrorResponse;

/** Successful mDoc presentation request response. */
export type MDocPresentationResponse = {
  __typename?: 'MDocPresentationResponse';
  /** The Android/Google-specific request data. */
  androidRequest: AndroidPresentationRequest;
  /** The Apple-specific request data. */
  appleRequest: ApplePresentationRequest;
  /** Indicates when the response will expire. */
  expiry: Scalars['PositiveInt']['output'];
  /** An autogenerated request ID for tracking this presentation request. */
  requestId: Scalars['ID']['output'];
};

/** Input for processing an mDoc presentation response from a wallet. */
export type MDocPresentationResponseInput = {
  /** The platform that generated the response (android or apple). */
  platform: MDocPlatform;
  /** The request ID that was returned from createMDocPresentationRequest. */
  requestId: Scalars['ID']['input'];
  /** The encrypted presentation response from the wallet (as a JWE string for Android/OpenID4VP). */
  response: Scalars['String']['input'];
};

/** The processed and validated mDoc presentation data. */
export type MDocProcessedResponse = {
  __typename?: 'MDocProcessedResponse';
  /**
   * Optional diagnostic information for troubleshooting and debugging.
   * Contains the raw decrypted response and decoded device response.
   */
  diagnostics?: Maybe<MDocDiagnostics>;
  /**
   * The documents presented by the wallet.
   * Typically contains one document, but may contain multiple in some cases.
   */
  documents: Array<MDocDocument>;
  /** The identity ID associated with this presentation (if available). */
  identityId?: Maybe<Scalars['ID']['output']>;
  /** The platform that generated the response. */
  platform: MDocPlatform;
  /** The request ID associated with this presentation. */
  requestId: Scalars['ID']['output'];
};

export type MDocProcessedResponseResult = MDocProcessedResponse | RequestErrorResponse;

/** Configuration for signing an mDoc presentation request. */
export type MDocRequestSigningInput = {
  /**
   * The expected origins that the wallet should validate against.
   * The wallet will compare the request origin to this list to detect replay attacks.
   * Each value should be a fully qualified origin (e.g., "https://example.com").
   * At least one origin must be provided when signing is enabled.
   */
  expectedOrigins: Array<Scalars['String']['input']>;
};

/** Comprehensive validation results for the mDoc device response. */
export type MDocValidationResults = {
  __typename?: 'MDocValidationResults';
  /** When the encrypted response was successfully decrypted. */
  decryptedAt: Scalars['DateTime']['output'];
  /** Validation results for each document in the response. */
  documents: Array<MDocDocumentValidation>;
  /** Overall validation status - true if all checks passed for all documents. */
  isValid: Scalars['Boolean']['output'];
  /** When the validation was performed. */
  validatedAt: Scalars['DateTime']['output'];
};

/** Me is a union type representing all possible authenticated callers. */
export type Me = Identity | User;

/** Returns information about a failure to connect to Microsoft Graph. */
export type MsGraphFailure = {
  __typename?: 'MsGraphFailure';
  error?: Maybe<Scalars['String']['output']>;
  identityStoreId: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Acquires a token for issuance using the verification code.
   *
   * If successful, the token can be used for issuance operations.
   */
  acquireAsyncIssuanceToken: AsyncIssuanceTokenResponse;
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
  /** Acquire a limited photo capture token that can be used to upload a photo for the photo capture request. */
  acquireLimitedPhotoCaptureToken: PhotoCaptureTokenResponse;
  /** Actions an approval request. */
  actionApprovalRequest: ApprovalRequest;
  /** Cancels an existing pending approval request. */
  cancelApprovalRequest?: Maybe<Scalars['Void']['output']>;
  /**
   * Cancel an issuance request.
   *
   * Items of note:
   *
   * - An async issuance request must not have been issued.
   */
  cancelAsyncIssuanceRequest?: Maybe<AsyncIssuanceRequest>;
  /**
   * Cancel one or more async issuance requests.
   *
   * Items of note:
   *
   * - An async issuance request must not have been issued.
   * - Starts a background job for all cancellations and returns that job id.
   */
  cancelAsyncIssuanceRequests: Scalars['ID']['output'];
  /**
   * Captures a photo for the specified photo capture request, ready to be used in a subsequent issuance request.
   * The photo must be a [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) using base64 encoding.
   */
  capturePhoto?: Maybe<Scalars['Void']['output']>;
  /** Creates a new approval request. */
  createApprovalRequest: ApprovalRequestResponse;
  /**
   * Creates one or more async issuance requests.
   *
   * **Critical items** of note:
   *
   * - This mutation has a hard limit of **1000 requests** per call. Verified Orchestration **strongly** recommends implementing a batching strategy when an unknown number of requests will be issued.
   */
  createAsyncIssuanceRequest: AsyncIssuanceRequestResponse;
  /** Creates a new contract */
  createContract: Contract;
  /** Create a new identity store */
  createIdentityStore: IdentityStore;
  /** The result of this request returns a URL and optional QR code to start the issuance process or an error. */
  createIssuanceRequest: IssuanceRequestResponse;
  /**
   * Creates an issuance request for the specified async issuance request.
   *
   * Returns a URL and optional QR code to start the issuance process or an error.
   *
   * Authenticated identities can optionally provide a photo to be used in the issuance as a [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) using base64 encoding.
   */
  createIssuanceRequestForAsyncIssuance: IssuanceRequestResponse;
  /**
   * Creates an mDoc presentation request for use with the Digital Credential API.
   * Returns platform-specific request formats for both Android (OpenID4VP) and Apple (ISO18013-7).
   */
  createMDocPresentationRequest: MDocPresentationRequestResponse;
  /** Creates a new OIDC claim mapping */
  createOidcClaimMapping: OidcClaimMapping;
  /** Creates a new OIDC client */
  createOidcClient: OidcClient;
  /** Creates a new OIDC client resource */
  createOidcClientResource: OidcClient;
  /** Creates a new OIDC resource */
  createOidcResource: OidcResource;
  /** Creates a partner whose credential types can be requested for presentation */
  createPartner: Partner;
  /** Creates a request to support capturing a photo to be used in a subsequent issuance. */
  createPhotoCaptureRequest: PhotoCaptureRequestResponse;
  /** The result of this request returns a URL and optional QR code to start the presentation process or an error. */
  createPresentationRequest: PresentationRequestResponse;
  /** The result of this request returns a QR code with a link to start the presentation process, or an error */
  createPresentationRequestForApproval: PresentationRequestResponse;
  /**
   * Creates a new presentation request for authorization.
   *
   * Item of note:
   * - This operation is only for use by the OIDC provider login UI.
   */
  createPresentationRequestForAuthn: PresentationRequestResponse;
  /** Creates a new template */
  createTemplate: Template;
  /** Deletes an existing concierge branding. */
  deleteConciergeBranding?: Maybe<Scalars['Void']['output']>;
  /** Deletes an existing contract. Only possible when the contract has not yet been provisioned. */
  deleteContract?: Maybe<Scalars['Void']['output']>;
  /** Deletes one or more identities by ID */
  deleteIdentities?: Maybe<Scalars['Void']['output']>;
  /** Deletes the MS Graph client of an instance. */
  deleteInstanceMsGraphClient: Instance;
  /** Deletes an OIDC claim mapping */
  deleteOidcClaimMapping: OidcClaimMapping;
  /** Deletes an OIDC client */
  deleteOidcClient: OidcClient;
  /** Deletes an OIDC client resource */
  deleteOidcClientResource: OidcClient;
  /** Deletes an OIDC resource */
  deleteOidcResource: OidcResource;
  /** Deletes an existing template */
  deleteTemplate?: Maybe<Scalars['Void']['output']>;
  /** Deprecates an existing contract. */
  deprecateContract: Contract;
  /** Generates a secret suitable for an OIDC client. */
  generateOidcClientSecret: Scalars['String']['output'];
  /** Import contracts with associated templates, contracts, or templates. */
  import?: Maybe<Scalars['Void']['output']>;
  /**
   * Processes an mDoc presentation response from a wallet.
   * Validates and decrypts the response, returning the presented credential data.
   */
  processMDocPresentationResponse: MDocProcessedResponseResult;
  /** Provisions or re-provisions a contract into the Verified ID service */
  provisionContract: Contract;
  /**
   * Resend a single async issuance notification for the specified request ID.
   *
   * Items of note:
   *
   * - Synchronous operation that returns the updated asyncIssuanceRequest.
   */
  resendAsyncIssuanceNotification?: Maybe<AsyncIssuanceRequest>;
  /**
   * Resend async issuance notifications for the specified request IDs.
   *
   * Items of note:
   *
   * - Starts a background job for all notifications and returns that job id.
   */
  resendAsyncIssuanceNotifications: Scalars['ID']['output'];
  /** Resumes a previously suspended identity store. */
  resumeIdentityStore: IdentityStore;
  /** Resumes a partner */
  resumePartner: Partner;
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
  /** Revokes existing credentials presented by a wallet. */
  revokeWalletIssuances: Scalars['ID']['output'];
  /** Create or update a concierge branding config. */
  saveConciergeBranding: Branding;
  /** Creates or updates an identity based on its issuer and identifier */
  saveIdentity: Identity;
  /** Saves the MS Graph client configuration of an instance. */
  saveInstanceMsGraphClient: Instance;
  /**
   * Sends a verification code to the issuee.
   *
   * The verification code can then be used to acquire a token for issuance.
   */
  sendAsyncIssuanceVerification: SendAsyncIssuanceVerificationResponse;
  /** Replace all user configurable application label configurations for a given identity stores */
  setApplicationLabelConfigs: Array<ApplicationLabelConfig>;
  /** Replace user configurable CORS origin configurations for the VO API instance */
  setCorsOriginConfigs: Array<CorsOriginConfig>;
  /**
   * Set or update the email sender configuration.
   * Passing null or omitting fields will unset the override and revert to defaults.
   */
  setEmailSenderConfig: EmailSenderConfig;
  /** Suspends an identity store. Use resumeIdentityStore to reactivate. */
  suspendIdentityStore: IdentityStore;
  /** Suspends a partner */
  suspendPartner: Partner;
  /**
   * Runs a test of external services to update the serviceFailures field.
   * This is useful for verification after correcting service integration configuration.
   */
  testServices: Discovery;
  /** Updates an existing pending approval request. */
  updateApprovalRequest?: Maybe<Scalars['Void']['output']>;
  /**
   * Updates the async issuance issuee's contact information.
   *
   * Items of note:
   *
   * - Information can only be updated when the async issuance request is pending.
   */
  updateAsyncIssuanceContact?: Maybe<AsyncIssuanceContact>;
  /** Updates branding for the concierge OIDC client. */
  updateConciergeClientBranding: OidcClient;
  /** Updates an existing contract */
  updateContract: Contract;
  /** Update an existing identity store */
  updateIdentityStore: IdentityStore;
  /** Updates the customer hosted authority client of an instance. */
  updateInstanceAuthorityClient: Instance;
  /** Updates the configuration of an instance. */
  updateInstanceConfiguration: Instance;
  /** Updates an existing OIDC claim mapping */
  updateOidcClaimMapping: OidcClaimMapping;
  /** Updates an existing OIDC client */
  updateOidcClient: OidcClient;
  /** Updates the claim mappings for an OIDC client. */
  updateOidcClientClaimMappings: OidcClient;
  /** Updates an existing OIDC client resource */
  updateOidcClientResource: OidcClient;
  /**
   * Updates an existing OIDC resource.
   *
   * Note:
   * - If scopes are removed from the resource, those scopes will be removed from all clients that have the resource. If no scopes remain on the client resource, the client resource will be deleted.
   */
  updateOidcResource: OidcResource;
  /** Updates the name and credential types of a partner */
  updatePartner: Partner;
  /** Updates an existing template */
  updateTemplate: Template;
};


export type MutationAcquireAsyncIssuanceTokenArgs = {
  asyncIssuanceRequestId: Scalars['UUID']['input'];
  verificationCode: Scalars['String']['input'];
};


export type MutationAcquireLimitedAccessTokenArgs = {
  input: AcquireLimitedAccessTokenInput;
};


export type MutationAcquireLimitedApprovalTokenArgs = {
  input: AcquireLimitedApprovalTokenInput;
};


export type MutationAcquireLimitedPhotoCaptureTokenArgs = {
  input: AcquireLimitedPhotoCaptureTokenInput;
};


export type MutationActionApprovalRequestArgs = {
  id: Scalars['ID']['input'];
  input: ActionApprovalRequestInput;
};


export type MutationCancelApprovalRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCancelAsyncIssuanceRequestArgs = {
  asyncIssuanceRequestId: Scalars['UUID']['input'];
};


export type MutationCancelAsyncIssuanceRequestsArgs = {
  asyncIssuanceRequestIds: Array<Scalars['UUID']['input']>;
};


export type MutationCapturePhotoArgs = {
  photo: Scalars['String']['input'];
  photoCaptureRequestId: Scalars['UUID']['input'];
};


export type MutationCreateApprovalRequestArgs = {
  request: ApprovalRequestInput;
};


export type MutationCreateAsyncIssuanceRequestArgs = {
  request: Array<AsyncIssuanceRequestInput>;
};


export type MutationCreateContractArgs = {
  input: ContractInput;
};


export type MutationCreateIdentityStoreArgs = {
  input: IdentityStoreInput;
};


export type MutationCreateIssuanceRequestArgs = {
  request: IssuanceRequestInput;
};


export type MutationCreateIssuanceRequestForAsyncIssuanceArgs = {
  asyncIssuanceRequestId: Scalars['UUID']['input'];
  photo?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateMDocPresentationRequestArgs = {
  request: MDocPresentationRequestInput;
};


export type MutationCreateOidcClaimMappingArgs = {
  input: OidcClaimMappingInput;
};


export type MutationCreateOidcClientArgs = {
  input: OidcClientInput;
};


export type MutationCreateOidcClientResourceArgs = {
  clientId: Scalars['ID']['input'];
  input: OidcClientResourceInput;
};


export type MutationCreateOidcResourceArgs = {
  input: OidcResourceInput;
};


export type MutationCreatePartnerArgs = {
  input: CreatePartnerInput;
};


export type MutationCreatePhotoCaptureRequestArgs = {
  request: PhotoCaptureRequest;
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


export type MutationDeleteIdentitiesArgs = {
  ids: Array<Scalars['UUID']['input']>;
};


export type MutationDeleteInstanceMsGraphClientArgs = {
  identifier: Scalars['String']['input'];
};


export type MutationDeleteOidcClaimMappingArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteOidcClientArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteOidcClientResourceArgs = {
  clientId: Scalars['ID']['input'];
  resourceId: Scalars['ID']['input'];
};


export type MutationDeleteOidcResourceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeprecateContractArgs = {
  id: Scalars['ID']['input'];
};


export type MutationImportArgs = {
  input: ImportInput;
};


export type MutationProcessMDocPresentationResponseArgs = {
  response: MDocPresentationResponseInput;
};


export type MutationProvisionContractArgs = {
  id: Scalars['ID']['input'];
};


export type MutationResendAsyncIssuanceNotificationArgs = {
  asyncIssuanceRequestId: Scalars['UUID']['input'];
};


export type MutationResendAsyncIssuanceNotificationsArgs = {
  asyncIssuanceRequestIds: Array<Scalars['UUID']['input']>;
};


export type MutationResumeIdentityStoreArgs = {
  id: Scalars['ID']['input'];
};


export type MutationResumePartnerArgs = {
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


export type MutationRevokeWalletIssuancesArgs = {
  walletId: Scalars['ID']['input'];
};


export type MutationSaveConciergeBrandingArgs = {
  input: ConciergeBrandingInput;
};


export type MutationSaveIdentityArgs = {
  input: IdentityInput;
};


export type MutationSaveInstanceMsGraphClientArgs = {
  graphClient: ClientCredentialsInput;
  identifier: Scalars['String']['input'];
};


export type MutationSendAsyncIssuanceVerificationArgs = {
  asyncIssuanceRequestId: Scalars['UUID']['input'];
};


export type MutationSetApplicationLabelConfigsArgs = {
  identityStoreId: Scalars['ID']['input'];
  input: Array<ApplicationLabelConfigInput>;
};


export type MutationSetCorsOriginConfigsArgs = {
  input: Array<CorsOriginConfigInput>;
};


export type MutationSetEmailSenderConfigArgs = {
  input: EmailSenderConfigInput;
};


export type MutationSuspendIdentityStoreArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSuspendPartnerArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateApprovalRequestArgs = {
  id: Scalars['ID']['input'];
  input: UpdateApprovalRequestInput;
};


export type MutationUpdateAsyncIssuanceContactArgs = {
  asyncIssuanceRequestId: Scalars['UUID']['input'];
  contact?: InputMaybe<AsyncIssuanceContactInput>;
};


export type MutationUpdateConciergeClientBrandingArgs = {
  input: ConciergeClientBrandingInput;
};


export type MutationUpdateContractArgs = {
  id: Scalars['ID']['input'];
  input: ContractInput;
};


export type MutationUpdateIdentityStoreArgs = {
  id: Scalars['ID']['input'];
  input: UpdateIdentityStoreInput;
};


export type MutationUpdateInstanceAuthorityClientArgs = {
  authorityClient: ClientCredentialsInput;
  identifier: Scalars['String']['input'];
};


export type MutationUpdateInstanceConfigurationArgs = {
  configuration: InstanceConfigurationInput;
  identifier: Scalars['String']['input'];
};


export type MutationUpdateOidcClaimMappingArgs = {
  id: Scalars['ID']['input'];
  input: OidcClaimMappingInput;
};


export type MutationUpdateOidcClientArgs = {
  id: Scalars['ID']['input'];
  input: OidcClientInput;
};


export type MutationUpdateOidcClientClaimMappingsArgs = {
  claimMappingIds: Array<Scalars['ID']['input']>;
  clientId: Scalars['ID']['input'];
};


export type MutationUpdateOidcClientResourceArgs = {
  clientId: Scalars['ID']['input'];
  input: OidcClientResourceInput;
};


export type MutationUpdateOidcResourceArgs = {
  id: Scalars['ID']['input'];
  input: OidcResourceInput;
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

/** Number claim validation. */
export type NumberValidation = {
  __typename?: 'NumberValidation';
  max?: Maybe<Scalars['Int']['output']>;
  min?: Maybe<Scalars['Int']['output']>;
  precision?: Maybe<Scalars['Int']['output']>;
};

/** Number claim validation. */
export type NumberValidationInput = {
  max?: InputMaybe<Scalars['Int']['input']>;
  min?: InputMaybe<Scalars['Int']['input']>;
  precision?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * The type of OIDC application.
 *
 * Refer to `application_type` in https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
 */
export enum OidcApplicationType {
  /**
   * Native Clients MUST only register redirect_uris using custom URI schemes or loopback URLs using the http scheme; loopback URLs use localhost or the IP loopback literals 127.0.0.1 or [::1] as the hostname.
   *
   * [reference](https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata)
   */
  Native = 'native',
  /** Web clients must register redirect_uris using the https scheme, unless the VO instance has dev tools enabled, where http:localhost may be used. */
  Web = 'web'
}

/** A set of mappings to produce scoped OIDC claims based on credential claims. */
export type OidcClaimMapping = {
  __typename?: 'OidcClaimMapping';
  /** When the mapping was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the mapping. */
  createdBy: User;
  /** The (optional) types of credentials that this claim mapping should be limited to. */
  credentialTypes?: Maybe<Array<Scalars['String']['output']>>;
  /** When the mapping was deleted. */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The unique identifier for the claim mapping. */
  id: Scalars['ID']['output'];
  /** Mappings, each defining the OIDC scope, claim and source credential claim. */
  mappings: Array<ScopedClaimMapping>;
  /** The name of the claim mapping. */
  name: Scalars['String']['output'];
  /** When the mapping was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the mapping. */
  updatedBy?: Maybe<User>;
};

/** Input defining mappings to produce scoped OIDC claims based on credential claims. */
export type OidcClaimMappingInput = {
  /** The optional set of types of credentials that this claim mapping should be limited to. */
  credentialTypes: Array<Scalars['String']['input']>;
  /** Mappings, each defining the OIDC scope, claim and source credential claim. */
  mappings: Array<ScopedClaimMappingInput>;
  /** The name of the claim mapping. */
  name: Scalars['String']['input'];
};

/** Fields that can be used for sorting OIDC claim mappings by. */
export enum OidcClaimMappingOrderBy {
  CreatedAt = 'createdAt',
  Name = 'name',
  UpdatedAt = 'updatedAt'
}

/** Criteria for finding OIDC claim mappings. */
export type OidcClaimMappingWhere = {
  /** The ID of the user (Person or Application) that created the claim mapping. */
  createdById?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the createdAt period to include. */
  createdFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the createdAt period to include. */
  createdTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** List only claim mappings for this credential type. */
  credentialType?: InputMaybe<Scalars['String']['input']>;
  /** List only the claim mappings which are, or are not, deleted. */
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only claim mappings matching this name. */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Represents an OIDC client. */
export type OidcClient = {
  __typename?: 'OidcClient';
  /** Indicates whether the client allows presentations of credentials from any configured partner. */
  allowAnyPartner: Scalars['Boolean']['output'];
  /** The type of OIDC application. */
  applicationType: OidcApplicationType;
  /** The background color, to be displayed during auth interactions, in hexadecimal format. */
  backgroundColor?: Maybe<Scalars['String']['output']>;
  /** The URL of the background image to be displayed during auth interactions, can be an image encoded as a data URL. */
  backgroundImage?: Maybe<Scalars['URL']['output']>;
  /** The claim mappings to be applied to this client. */
  claimMappings: Array<OidcClaimMapping>;
  /** The type of OIDC client. */
  clientType: OidcClientType;
  /** When the client was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the client. */
  createdBy: User;
  /**
   * The types of credentials that can be presented for authentication with this client.
   *
   * Note:
   * - If not specified, any credential type can be presented.
   * - The client can specify the credential type to use for authentication via the `vc_type` auth request parameter.
   * - If values are defined here and the `vc_type` auth request parameter is provided, it is validated to be from this list.
   */
  credentialTypes?: Maybe<Array<Scalars['String']['output']>>;
  /** When the client was deleted. */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  /** The URL of the client logo to be displayed during auth interactions, can be an image encoded as a data URL. */
  logo?: Maybe<Scalars['URL']['output']>;
  /** The name of the client. */
  name: Scalars['String']['output'];
  /** The partners that the client allows presentations of credentials from. */
  partners: Array<Partner>;
  /** The URL of a privacy policy for the client, displayed during auth interactions. */
  policyUrl?: Maybe<Scalars['URL']['output']>;
  /** The post-logout URIs that the client is allowed to use. */
  postLogoutUris: Array<Scalars['URL']['output']>;
  /** Returns the successful credential presentations that were requested for authorization . */
  presentations: Array<Presentation>;
  /** The redirect URIs that the client is allowed to use. */
  redirectUris: Array<Scalars['URL']['output']>;
  /** Indicates this client must use face check with every authentication presentation. */
  requireFaceCheck: Scalars['Boolean']['output'];
  /** The resources that the client has access to, according to the defined resource scopes. */
  resources?: Maybe<Array<OidcClientResource>>;
  /** The URL of the terms of service for the client, displayed during auth interactions. */
  termsOfServiceUrl?: Maybe<Scalars['URL']['output']>;
  /**
   * The unique claim(s) which can be used to derive the subject identifier (sub claim value) from partner credentials (where no unique claim value is known).
   *
   * Note:
   * - This is not needed for authentication using Verified Orchestration credentials, the issuanceId claim is used.
   * - The authentication client also can specify the claim to use via the `vc_unique_claim_for_sub` auth request parameter.
   * - Multiple values can be specified here, if not specified via the client `vc_unique_claim_for_sub` auth request parameter, the first claim that is present in the partner presentation will be used.
   * - If values are defined here and the `vc_unique_claim_for_sub` auth request parameter is provided, it is validated to be from this list.
   */
  uniqueClaimsForSubjectId?: Maybe<Array<Scalars['String']['output']>>;
  /** When the client was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the client. */
  updatedBy?: Maybe<User>;
};


/** Represents an OIDC client. */
export type OidcClientPresentationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<OidcClientPresentationWhere>;
};

/** Input type for creating a new OIDC client. */
export type OidcClientInput = {
  /** Indicates whether the client allows presentations of credentials from any configured partner. */
  allowAnyPartner?: InputMaybe<Scalars['Boolean']['input']>;
  /** The type of OIDC application, `web` is the default. */
  applicationType?: InputMaybe<OidcApplicationType>;
  /** The background color, to be displayed during auth interactions, in hexadecimal format. */
  backgroundColor?: InputMaybe<Scalars['String']['input']>;
  /** The URL of the background image to be displayed during auth interactions, can be an image encoded as a data URL. */
  backgroundImage?: InputMaybe<Scalars['URL']['input']>;
  /** The client secret, only applicable to confidential clients. Optional for update operations (existing secret will be retained when not provided). */
  clientSecret?: InputMaybe<Scalars['String']['input']>;
  /** The type of OIDC client. */
  clientType: OidcClientType;
  /**
   * The types of credentials that can be presented for authentication with this client.
   *
   * Note:
   * - If not specified, any credential type can be presented.
   * - The client can specify the credential type to use for authentication via the `vc_type` auth request parameter.
   * - If values are defined here and the `vc_type` auth request parameter is provided, it is validated to be from this list.
   */
  credentialTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The URL of the client logo to be displayed during auth interactions, can be an image encoded as a data URL. */
  logo?: InputMaybe<Scalars['URL']['input']>;
  /** The name of the client. */
  name: Scalars['String']['input'];
  /** The IDs of the partners that the client allows presentations of credentials from. */
  partnerIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  /** The URL of a privacy policy for the client, displayed during auth interactions. */
  policyUrl?: InputMaybe<Scalars['URL']['input']>;
  /** The post-logout URIs that the client is allowed to use. */
  postLogoutUris: Array<Scalars['URL']['input']>;
  /** The redirect URIs that the client is allowed to use. */
  redirectUris: Array<Scalars['URL']['input']>;
  /** Indicates this client must use face check with every authentication presentation. */
  requireFaceCheck?: InputMaybe<Scalars['Boolean']['input']>;
  /** The URL of the terms of service for the client, displayed during auth interactions. */
  termsOfServiceUrl?: InputMaybe<Scalars['URL']['input']>;
  /**
   * The unique claim(s) which can be used to derive the subject identifier (sub claim value) from partner credentials (where no unique claim value is known).
   *
   * Note:
   * - This is not needed for authentication using Verified Orchestration credentials, the issuanceId claim is used.
   * - The authentication client also can specify the claim to use via the `vc_unique_claim_for_sub` auth request parameter.
   * - Multiple values can be specified here, if not specified via the client `vc_unique_claim_for_sub` auth request parameter, the first claim that is present in the partner presentation will be used.
   * - If values are defined here and the `vc_unique_claim_for_sub` auth request parameter is provided, it is validated to be from this list.
   */
  uniqueClaimsForSubjectId?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Fields that can be used for sorting OIDC clients by. */
export enum OidcClientOrderBy {
  /** When the client was created. */
  CreatedAt = 'createdAt',
  /** The name of the client. */
  Name = 'name',
  /** When the client was last updated. */
  UpdatedAt = 'updatedAt'
}

/** Criteria for filtering presentations. */
export type OidcClientPresentationWhere = {
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
  /** The ID of the OIDC client that requested authentication resulting in the presentation. */
  oidcClientId?: InputMaybe<Scalars['ID']['input']>;
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
  /** The ID of the wallet who presented the credential */
  walletId?: InputMaybe<Scalars['ID']['input']>;
};

/** Represents an OIDC resource that an OIDC client has access to, according to the defined resource scopes. */
export type OidcClientResource = {
  __typename?: 'OidcClientResource';
  /** The resource that the client has access to. */
  resource: OidcResource;
  /** The scopes from the resource that the client may request. */
  resourceScopes: Array<Scalars['String']['output']>;
};

/** Input type for creating a new OIDC client resource, providing access from a client to a resource according to the defined resource scopes. */
export type OidcClientResourceInput = {
  resourceId: Scalars['ID']['input'];
  /** The scopes from the resource that the client may request. */
  resourceScopes: Array<Scalars['String']['input']>;
};

/**
 * The type of OIDC client.
 *
 * Refer to https://www.rfc-editor.org/rfc/rfc6749#section-2.1
 */
export enum OidcClientType {
  /** A client used where secrets cannot be securely stored, e.g. browser-based or mobile authentication. */
  Confidential = 'confidential',
  /** A client used where secrets can be securely stored, e.g. server-side authentication. */
  Public = 'public'
}

/** Criteria for finding OIDC clients. */
export type OidcClientWhere = {
  /** List only the clients which allow any partners. */
  allowAnyPartner?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only resources having this application type. */
  applicationType?: InputMaybe<OidcApplicationType>;
  /** List only resources having this client type. */
  clientType?: InputMaybe<OidcClientType>;
  /** The ID of the user (Person or Application) that created the client. */
  createdById?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the createdAt period to include. */
  createdFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the createdAt period to include. */
  createdTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** Whether to include deleted clients in the results. */
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only the clients which are, or are not, deleted. */
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only clients matching this name. */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Represents an OIDC resource, usually an API, but could be anything accessed from an OIDC client which needs explicit control. */
export type OidcResource = {
  __typename?: 'OidcResource';
  /** When the resource was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The user who created the resource. */
  createdBy: User;
  /** When the client was deleted. */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  /** The name of the resource. */
  name: Scalars['String']['output'];
  /**
   * The URL that uniquely identifies the resource.
   *
   * Note:
   * - The URL can be an API endpoint such as `https://api.example.net` or a resource indicator such as `urn:example:resource-endpoint`.
   */
  resourceIndicator: Scalars['URL']['output'];
  /** Scopes that clients can request, for example `['api:read', 'api:write']`. */
  scopes: Array<Scalars['String']['output']>;
  /** When the resource was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who last updated the resource. */
  updatedBy?: Maybe<User>;
};

/** Input type for creating a new OIDC resource, usually an API, but could be anything accessed from an OIDC client which needs explicit control. */
export type OidcResourceInput = {
  /** The name of the resource. */
  name: Scalars['String']['input'];
  /**
   * The URL that uniquely identifies the resource.
   *
   * Note:
   * - The URL can be an API endpoint such as `https://api.example.net` or a resource indicator such as `urn:example:resource-endpoint`.
   */
  resourceIndicator: Scalars['URL']['input'];
  /** Scopes that clients can request, for example `['api:read', 'api:write']`. */
  scopes: Array<Scalars['String']['input']>;
};

/** Fields that can be used for sorting OIDC resources by. */
export enum OidcResourceOrderBy {
  CreatedAt = 'createdAt',
  Name = 'name',
  ResourceIndicator = 'resourceIndicator',
  UpdatedAt = 'updatedAt'
}

/** Criteria for finding OIDC resources. */
export type OidcResourceWhere = {
  /** The ID of the user (Person or Application) that created the resource. */
  createdById?: InputMaybe<Scalars['ID']['input']>;
  /** The start of the createdAt period to include. */
  createdFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** The end of the createdAt period to include. */
  createdTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** List only the resources which are, or are not, deleted. */
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only resources matching this name. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** List only resources matching this resource indicator. */
  resourceIndicator?: InputMaybe<Scalars['String']['input']>;
};

export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

/** A credential issuer partner trusted by the platform */
export type Partner = {
  __typename?: 'Partner';
  /**
   * Lists the contracts published by this partner
   * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#searching-for-published-credential-types-by-an-issuer
   */
  contracts: Array<NetworkContract>;
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
  /** Returns the successful credential presentations of credentials issued by this partner. */
  presentations: Array<Presentation>;
  /** When the partner was suspended. */
  suspendedAt?: Maybe<Scalars['DateTime']['output']>;
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

/** Fields that can be used for sorting partners. */
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
  /** The ID of the OIDC client that requested authentication resulting in the presentation. */
  oidcClientId?: InputMaybe<Scalars['ID']['input']>;
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
  /** The ID of the wallet who presented the credential */
  walletId?: InputMaybe<Scalars['ID']['input']>;
};

/** Defines the searchable fields usable to find partners */
export type PartnerWhere = {
  /** The type of credential the partner provides. */
  credentialType?: InputMaybe<Scalars['String']['input']>;
  /** Whether to include suspended partners in the results. */
  includeSuspended?: InputMaybe<Scalars['Boolean']['input']>;
  /** List only the partners which are, or are not, suspended. */
  isSuspended?: InputMaybe<Scalars['Boolean']['input']>;
  /** The partial domain url linked to the partner to match */
  linkedDomainUrl?: InputMaybe<Scalars['String']['input']>;
  /** The partial name of the partner to match */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Data for a photo capture event. */
export type PhotoCaptureEventData = {
  __typename?: 'PhotoCaptureEventData';
  status: PhotoCaptureStatus;
};

/**
 * Input required to create a photo capture request.
 * A photo capture can only be used for a single issuance for a single identity.
 */
export type PhotoCaptureRequest = {
  /** The ID of the contract which will be issued with captured photo. */
  contractId: Scalars['UUID']['input'];
  /**
   * The ID of the identity who will be issued a credential with the captured photo.
   *
   * - Not required when issuing using a limited access token
   */
  identityId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The ID, URL and QR code for a photo capture request. */
export type PhotoCaptureRequestResponse = {
  __typename?: 'PhotoCaptureRequestResponse';
  /** The ID of the photo capture request, which can be included in a subsequent issuance request to use the captured photo. */
  id: Scalars['ID']['output'];
  /** The QR code in ([data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) format) which can be scanned to capture a photo. */
  photoCaptureQrCode: Scalars['String']['output'];
  /** The URL which can be opened to capture a photo. */
  photoCaptureUrl: Scalars['URL']['output'];
};

/** The status of the photo capture process. */
export enum PhotoCaptureStatus {
  /** The photo has been successfully captured */
  Complete = 'complete',
  /** The photo capture has not yet started */
  NotStarted = 'not_started',
  /** The photo capture has been started */
  Started = 'started'
}

/** A limited photo capture token response. */
export type PhotoCaptureTokenResponse = {
  __typename?: 'PhotoCaptureTokenResponse';
  expires: Scalars['DateTime']['output'];
  token: Scalars['String']['output'];
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
  /** The requesting OIDC client, if this presentation was made for OIDC authentication. */
  oidcClient?: Maybe<OidcClient>;
  /** The partners who issued the credentials that were presented (which may be none, if the presented credentials were internal) */
  partners: Array<Partner>;
  presentedAt: Scalars['DateTime']['output'];
  /** The credentials that were presented (excluding claims data) */
  presentedCredentials: Array<PresentedCredential>;
  /** The receipt for with this presentation with `vp_token` redacted (to avoid retaining PII info). */
  receipt?: Maybe<Scalars['JSONObject']['output']>;
  /** The platform user (application or person) that requested the credential presentation. */
  requestedBy: User;
  /** The credentials that were requested */
  requestedCredentials: Array<RequestedCredential>;
  /** The wallet associated with this presentation. */
  wallet?: Maybe<Wallet>;
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

/** Fields that can be used for sorting presentations. */
export enum PresentationOrderBy {
  /** The name of the identity who presented the credential. */
  IdentityName = 'identityName',
  /** The timestamp when the credential was presented */
  PresentedAt = 'presentedAt',
  /** The name of the user (Person or Application) that requested & received the presentation data. */
  RequestedByName = 'requestedByName'
}

/**
 * Input type for verifying a presentation receipt.
 * This input contains the raw JWTs (JSON Web Tokens) that serve as cryptographic receipts
 * attesting to the authenticity and integrity of a presentation.
 *
 * Typically, these tokens are generated and returned as part of a credential presentation process.
 */
export type PresentationReceiptInput = {
  /**
   * An optional JWT receipt used for biometric verification (face check) if such a check
   * was performed as part of the presentation.
   */
  faceCheck?: InputMaybe<Scalars['String']['input']>;
  /**
   * The primary JWT receipt for the presentation, known as the id_token.
   * This token contains verifiable claims and must be provided for verification.
   */
  id_token: Scalars['String']['input'];
};

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
   * When provided, a `identityId` constraint will be added to every requested credential.
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
   * The receipt is useful for troubleshooting or if you have the need to get the full details of the payload.
   * There's otherwise no need to set this value to true by default.
   * In the OpenId Connect SIOP request, the receipt contains the ID token from the original request.
   *
   * The receipt is internally redacted before being stored or logged to ensure
   * sensitive values like `vp_token` and credential subjects are not persisted. Only selected fields such as `id_token`
   * and `faceCheck` (if present) are retained.
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
  /** List presentations by identity. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** List presentations by identity store. */
  identityStoreId?: InputMaybe<Scalars['ID']['input']>;
  /** Whether face check validation was requested. */
  isFaceCheckRequested?: InputMaybe<Scalars['Boolean']['input']>;
  /** The issuance that was presented */
  issuanceId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the OIDC client that requested authentication resulting in the presentation. */
  oidcClientId?: InputMaybe<Scalars['ID']['input']>;
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
  /** The ID of the wallet who presented the credential */
  walletId?: InputMaybe<Scalars['ID']['input']>;
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
  /** List all application label configs for a given identity store */
  applicationLabelConfigs: Array<ApplicationLabelConfig>;
  /** Returns an approval request by ID. */
  approvalRequest: ApprovalRequest;
  /** Returns the distinct approval request types that have been used. */
  approvalRequestTypes: Array<Scalars['String']['output']>;
  /**
   * Returns the async issuance issuee contact information.
   *
   * Items of note:
   *
   * - Returns PII information about the issuee. Use with caution. Intended for verification of async issuance requests by admins only.
   * - If the async issuance has been issued, or has expired, this information is no longer available.
   */
  asyncIssuanceContact?: Maybe<AsyncIssuanceContact>;
  /** Returns an async issuance request by ID. */
  asyncIssuanceRequest: AsyncIssuanceRequest;
  /** Returns the details of the configured instance authority */
  authority: Authority;
  /** Returns a branding config for the Concierge or null if no branding has been saved yet. */
  conciergeBranding?: Maybe<Branding>;
  /** Returns a contract by ID */
  contract: Contract;
  /** List all CORS origin configs */
  corsOriginConfigs: Array<CorsOriginConfig>;
  /**
   * Returns a list of credential types, optionally filtered by the given criteria.
   * By default, all credential types are returned.
   */
  credentialTypes: Array<Scalars['String']['output']>;
  discovery: Discovery;
  /**
   * Get the current email sender configuration.
   * Returns null if no override is set.
   */
  emailSenderConfig: EmailSenderConfig;
  /** Returns approval requests, optionally matching the specified criteria. */
  findApprovalRequests: Array<ApprovalRequest>;
  /** Returns async issuance requests, optionally matching the specified criteria. */
  findAsyncIssuanceRequests: Array<AsyncIssuanceRequest>;
  /** Returns communications, optionally matching the specified criteria */
  findCommunications: Array<Communication>;
  /** Returns contracts, optionally matching the specified criteria */
  findContracts: Array<Contract>;
  /** Returns identities, optionally matching the specified criteria */
  findIdentities: Array<Identity>;
  /** Fetch all identity stores */
  findIdentityStores: Array<IdentityStore>;
  /** Returns successful credential issuances, optionally matching the specified criteria. */
  findIssuances: Array<Issuance>;
  /**
   * Finds issuers from the Entra Verified ID network
   * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#searching-for-issuers
   */
  findNetworkIssuers: Array<NetworkIssuer>;
  /** Returns OIDC claim mappings, optionally matching the specified criteria. */
  findOidcClaimMappings: Array<OidcClaimMapping>;
  /** Returns OIDC clients, optionally matching the specified criteria */
  findOidcClients: Array<OidcClient>;
  /** Returns OIDC resources, optionally matching the specified criteria */
  findOidcResources: Array<OidcResource>;
  /** Returns partners, optionally matching the specified criteria */
  findPartners: Array<Partner>;
  /** Returns successful credential presentations, optionally matching the specified criteria. */
  findPresentations: Array<Presentation>;
  /** Returns templates, optionally matching the specified criteria */
  findTemplates: Array<Template>;
  /** Returns home tenant user identities matching the specified criteria */
  findTenantIdentities: Array<TenantIdentity>;
  /** Returns users, optionally matching the specified criteria */
  findUsers: Array<User>;
  /** Returns wallets, optionally matching the specified criteria */
  findWallets: Array<Wallet>;
  /** No-op query to test if the server is up and running. */
  healthcheck?: Maybe<Scalars['Void']['output']>;
  /** Returns a list of identities for the given IDs */
  identities: Array<Maybe<Identity>>;
  /** Returns a list of identities for the given issuer identifiers */
  identitiesByIdentifiers: Array<Maybe<Identity>>;
  /** Returns an identity by ID */
  identity: Identity;
  /** Returns an identity by issuer identifier */
  identityByIdentifier: Identity;
  /** Returns the distinct set of issuers from all identities */
  identityIssuers: Array<IdentityIssuer>;
  /** Fetch an identity store by its ID */
  identityStore?: Maybe<IdentityStore>;
  /** Returns a single instance by identifier. */
  instanceByIdentifier: Instance;
  /** Returns an issuance by ID */
  issuance: Issuance;
  /** Returns the issuance count, optionally matching the specified criteria. */
  issuanceCount: Scalars['NonNegativeInt']['output'];
  /** Returns the issuance count, grouped by Contract, optionally matching the specified criteria. */
  issuanceCountByContract: Array<ContractCount>;
  /** Returns the issuance count, grouped by User, optionally matching the specified criteria. */
  issuanceCountByUser: Array<UserCount>;
  /** Returns the authenticated caller, either a `User` (app or person) or the `Identity` of a credential issuee. */
  me?: Maybe<Me>;
  /**
   * Lists the credential contract types for the specified network issuer
   * See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#searching-for-published-credential-types-by-an-issuer
   */
  networkContracts: Array<NetworkContract>;
  /** Returns a single OIDC claim mapping by ID */
  oidcClaimMapping: OidcClaimMapping;
  /** Returns a single OIDC client by ID */
  oidcClient: OidcClient;
  /** Returns a single OIDC resource by ID */
  oidcResource: OidcResource;
  /** Returns a partner by ID */
  partner: Partner;
  /** Returns a partner by DID */
  partnerByDid?: Maybe<Partner>;
  /**
   * Returns the current status of the specified photo capture request.
   * Note: this query is an alternative to the `photoCaptureEvent` subscription, suitable for polling behaviour.
   */
  photoCaptureStatus: PhotoCaptureEventData;
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
  /**
   * Tests an authority client by attempting to read the specified authority.
   *
   * Returns an error if the test fails.
   */
  testAuthorityClient: Authority;
  /** Test the identity store's graph client configuration */
  testIdentityStoreGraphClient?: Maybe<MsGraphFailure>;
  /**
   * Tests an MS Graph client by attempting to run a top(1) User query.
   *
   * Returns an error if the test fails.
   */
  testMsGraphClient?: Maybe<Scalars['Void']['output']>;
  /** Returns a user by ID */
  user: User;
  /** Verifies the tokens in a presentation's receipt and returns the validity of each. */
  verifyPresentation: VerifyPresentationResult;
  /** Returns a wallet by ID. */
  wallet?: Maybe<Wallet>;
};


export type QueryActionedApprovalDataArgs = {
  id: Scalars['ID']['input'];
};


export type QueryApplicationLabelConfigsArgs = {
  identityStoreId: Scalars['ID']['input'];
};


export type QueryApprovalRequestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAsyncIssuanceContactArgs = {
  asyncIssuanceRequestId: Scalars['UUID']['input'];
};


export type QueryAsyncIssuanceRequestArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryContractArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCredentialTypesArgs = {
  where?: InputMaybe<CredentialTypesWhere>;
};


export type QueryFindApprovalRequestsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<ApprovalRequestsOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ApprovalRequestsWhere>;
};


export type QueryFindAsyncIssuanceRequestsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<AsyncIssuanceRequestsOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<AsyncIssuanceRequestsWhere>;
};


export type QueryFindCommunicationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<CommunicationOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<CommunicationWhere>;
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


export type QueryFindIdentityStoresArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<IdentityStoreOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<IdentityStoreWhere>;
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


export type QueryFindOidcClaimMappingsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<OidcClaimMappingOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<OidcClaimMappingWhere>;
};


export type QueryFindOidcClientsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<OidcClientOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<OidcClientWhere>;
};


export type QueryFindOidcResourcesArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<OidcResourceOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<OidcResourceWhere>;
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


export type QueryFindWalletsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<WalletWhere>;
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


export type QueryIdentityByIdentifierArgs = {
  issuerId: IssuerIdentifierInput;
};


export type QueryIdentityStoreArgs = {
  id: Scalars['ID']['input'];
};


export type QueryInstanceByIdentifierArgs = {
  identifier: Scalars['String']['input'];
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


export type QueryOidcClaimMappingArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOidcClientArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOidcResourceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPartnerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPartnerByDidArgs = {
  did: Scalars['String']['input'];
};


export type QueryPhotoCaptureStatusArgs = {
  photoCaptureRequestId: Scalars['UUID']['input'];
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


export type QueryTestAuthorityClientArgs = {
  authorityClient: ClientCredentialsInput;
  identifier: Scalars['String']['input'];
};


export type QueryTestIdentityStoreGraphClientArgs = {
  identityStoreId: Scalars['ID']['input'];
};


export type QueryTestMsGraphClientArgs = {
  graphClient: ClientCredentialsInput;
  identifier: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryVerifyPresentationArgs = {
  presentedAt: Scalars['String']['input'];
  receipt: PresentationReceiptInput;
};


export type QueryWalletArgs = {
  id: Scalars['ID']['input'];
};

/** Regular expression claim validation. */
export type RegexValidation = {
  __typename?: 'RegexValidation';
  /** The regular expression pattern to validate the claim value. */
  pattern: Scalars['String']['output'];
};

/** Regular expression claim validation. */
export type RegexValidationInput = {
  /** The regular expression pattern to validate the claim value. */
  pattern: Scalars['String']['input'];
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
  /**
   * Optional collection of claim constraints that must be met when a wallet selects the candidate credentials.
   *
   * This enables requesting a credential with specific claim value.
   * Constraints are evaluated with AND logic, i.e. if you specify multiple constraints, all must be met.
   *
   * For each constraint in the collection, you must select one operator of values, contains or startsWith.
   * Values cannot be regular expressions.
   * All comparisons are case-insensitive.
   */
  constraints?: InputMaybe<Array<ClaimConstraint>>;
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

/** A constraint applied to a specific claim in the presentation request. */
export type RequestedClaimConstraint = {
  __typename?: 'RequestedClaimConstraint';
  /** The name of the claim this constraint applies to. */
  claimName: Scalars['String']['output'];
  /** The operator used to evaluate the constraint (e.g. equals, startsWith, contains). */
  operator: ConstraintOperator;
  /** The list of values. Only defined for standard claims like `identityId` and `issuanceId`. */
  values?: Maybe<Array<Scalars['String']['output']>>;
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
  /** The requested constraints of the presentation */
  constraints?: Maybe<Array<RequestedClaimConstraint>>;
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

/** Represents a mapping to produce a single OIDC claim based on a credential claim. */
export type ScopedClaimMapping = {
  __typename?: 'ScopedClaimMapping';
  /** The claim to produce. */
  claim: Scalars['String']['output'];
  /** The source credential claim to use as the value for the claim. */
  credentialClaim: Scalars['String']['output'];
  /** The scope of the claim. */
  scope: Scalars['String']['output'];
};

/** Input defining mapping for a single OIDC claim based on a credential claim. */
export type ScopedClaimMappingInput = {
  /** The claim to produce. */
  claim: Scalars['String']['input'];
  /** The source credential claim to use as the value for the claim. */
  credentialClaim: Scalars['String']['input'];
  /** The scope of the claim. */
  scope: Scalars['String']['input'];
};

/** The response for sending an async issuance verification code. */
export type SendAsyncIssuanceVerificationResponse = {
  __typename?: 'SendAsyncIssuanceVerificationResponse';
  /** The method by which the verification code was sent, or `null` if verification is not set (the async issuance can *only* be redeemed by signing in to the Concierge with an existing credential credential authentication). */
  method?: Maybe<ContactMethod>;
};

/**
 * The failures that occurred while trying to connect to external services.
 *
 * Note: Services are checked every 5 minutes, so this may not reflect the current state of the service.
 */
export type ServiceFailures = {
  __typename?: 'ServiceFailures';
  msGraph?: Maybe<Array<MsGraphFailure>>;
  verifiedId?: Maybe<Scalars['String']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Returns event data when the background job progresses from being queued to completed or failed */
  backgroundJobEvent: BackgroundJobEventData;
  /** Returns event data when an issuance callback is received */
  issuanceEvent: IssuanceEventData;
  /** Returns events for the specified photo capture request. */
  photoCaptureEvent: PhotoCaptureEventData;
  /** Returns event data when an presentation callback is received */
  presentationEvent: PresentationEventData;
};


export type SubscriptionBackgroundJobEventArgs = {
  where?: InputMaybe<BackgroundJobEventWhere>;
};


export type SubscriptionIssuanceEventArgs = {
  where?: InputMaybe<IssuanceEventWhere>;
};


export type SubscriptionPhotoCaptureEventArgs = {
  photoCaptureRequestId: Scalars['UUID']['input'];
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
  /** The name of the claim. */
  claim: Scalars['String']['output'];
  /** The description of the claim. */
  description?: Maybe<Scalars['String']['output']>;
  /** Indicates the value is fixed for this claim when issuing this credential */
  isFixed?: Maybe<Scalars['Boolean']['output']>;
  /** Indicates a value need not be provided for this claim when issuing this credential. */
  isOptional?: Maybe<Scalars['Boolean']['output']>;
  /** The label of the claim. */
  label: Scalars['String']['output'];
  /** The type of the claim. */
  type: ClaimType;
  /** Defines how the value of the claim should be validated. */
  validation?: Maybe<ClaimValidation>;
  /** The value for the claim (optional, provides a fixed value for this claim). */
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

/** Defines the input to import a template. */
export type TemplateImportInput = {
  /** The id of the exported template. */
  id: Scalars['ID']['input'];
  /** The input to create the template. */
  templateInput: TemplateInput;
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

/** Defines the filter criteria used to find templates */
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
  /** The ID of the identity store to filter by */
  identityStoreId: Scalars['ID']['input'];
  /** The partial name of the user to match */
  nameStartsWith: Scalars['String']['input'];
};

/** Text claim validation. */
export type TextValidation = {
  __typename?: 'TextValidation';
  maxLength?: Maybe<Scalars['PositiveInt']['output']>;
  minLength?: Maybe<Scalars['PositiveInt']['output']>;
};

/** Text claim validation. */
export type TextValidationInput = {
  maxLength?: InputMaybe<Scalars['PositiveInt']['input']>;
  minLength?: InputMaybe<Scalars['PositiveInt']['input']>;
};

/** The input for updating an existing approval request. */
export type UpdateApprovalRequestInput = {
  /** Purpose for requesting approval. Markdown is supported. */
  purpose: Scalars['String']['input'];
  /** Optional additional data that is useful for / relevant to the approval; the schema of which would vary by type. */
  requestData?: InputMaybe<Scalars['JSONObject']['input']>;
};

/** Update payload for updating an identity store */
export type UpdateIdentityStoreInput = {
  /** The optional client ID, used for i.e identity lookups. */
  clientId?: InputMaybe<Scalars['String']['input']>;
  /** The optional client secret, applicable only to confidential clients. */
  clientSecret?: InputMaybe<Scalars['String']['input']>;
  /** Whether users in this store are allowed to authenticate (i.e. log in) */
  isAuthenticationEnabled: Scalars['Boolean']['input'];
  /** A human-friendly name for this store */
  name: Scalars['String']['input'];
  /** What kind of store this is (e.g. 'entra') */
  type: IdentityStoreType;
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

/** Fields that can be used for sorting users. */
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
  /** The ID of the OIDC client that requested authentication resulting in the presentation. */
  oidcClientId?: InputMaybe<Scalars['ID']['input']>;
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
  /** The ID of the wallet who presented the credential */
  walletId?: InputMaybe<Scalars['ID']['input']>;
};

/** Defines the searchable fields usable to find users */
export type UserWhere = {
  /**
   * The email of the user to match
   * Note: only relevant for users who are people, applications don't have an email
   */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Matches users that are applications (or not - people) */
  isApp?: InputMaybe<Scalars['Boolean']['input']>;
  /** The name of the user to match */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Verification result for a Presentation's receipt tokens. */
export type VerifyPresentationResult = {
  __typename?: 'VerifyPresentationResult';
  /**
   * True if the faceCheck token in the receipt is valid, false if verification fails.
   * Null if no faceCheck token is present.
   */
  faceCheckValid?: Maybe<Scalars['Boolean']['output']>;
  /** True if the id_token in the receipt is valid, false if verification fails. */
  idTokenValid: Scalars['Boolean']['output'];
};

/** Represents a wallet entity, uniquely identified by a decentralized identifier (DID). */
export type Wallet = {
  __typename?: 'Wallet';
  /** The first time this wallet was used in a presentation. */
  firstUsed: Scalars['DateTime']['output'];
  /** The local id for this wallet. */
  id: Scalars['ID']['output'];
  /** The last time this wallet was used in a presentation. */
  lastUsed: Scalars['DateTime']['output'];
  /** Returns the successful credential presentations for this wallet. */
  presentations: Array<Presentation>;
  /** The DID associated with this wallet */
  subject: Scalars['String']['output'];
};


/** Represents a wallet entity, uniquely identified by a decentralized identifier (DID). */
export type WalletPresentationsArgs = {
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  where?: InputMaybe<WalletPresentationWhere>;
};

/** Criteria for filtering presentations. */
export type WalletPresentationWhere = {
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
  /** The ID of the OIDC client that requested authentication resulting in the presentation. */
  oidcClientId?: InputMaybe<Scalars['ID']['input']>;
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
  /** The ID of the wallet who presented the credential */
  walletId?: InputMaybe<Scalars['ID']['input']>;
};

/** Represents the criteria for filtering Wallets */
export type WalletWhere = {
  /** Returns wallets with the specified ID. */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** Returns wallets linked to the specified identity. */
  identityId?: InputMaybe<Scalars['ID']['input']>;
  /** Returns wallets with the specified subject DID. */
  subject?: InputMaybe<Scalars['String']['input']>;
};

/** DID information for the Web model */
export type WebDidModel = {
  __typename?: 'WebDidModel';
  did: Scalars['ID']['output'];
  didDocumentStatus: DidDocumentStatus;
  linkedDomainUrls: Array<Scalars['URL']['output']>;
};

export type CancelApprovalRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type CancelApprovalRequestMutation = { __typename?: 'Mutation', cancelApprovalRequest?: null | undefined | void | null };

export type ApprovalRequestQueryVariables = Exact<{
  approvalRequestId: Scalars['ID']['input'];
}>;


export type ApprovalRequestQuery = { __typename?: 'Query', approvalRequest: { __typename?: 'ApprovalRequest', id: string, requestedAt: Date, expiresAt: Date, requestType: string, correlationId?: string | null, referenceUrl?: string | null, purpose: string, requestData?: Record<string, unknown> | null, actionedComment?: string | null, status: ApprovalRequestStatus } };

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


export type FindActionedApprovalDataQuery = { __typename?: 'Query', actionedApprovalData?: { __typename?: 'ActionedApprovalData', approvalRequestId: string, correlationId?: string | null, requestData?: Record<string, unknown> | null, state?: string | null, status: ApprovalRequestStatus, actionedComment?: string | null, actionedAt: Date, callbackSecret: string, actionedBy?: { __typename?: 'ActionedBy', id: string, name: string } | null } | null };

export type UpdateApprovalRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateApprovalRequestInput;
}>;


export type UpdateApprovalRequestMutation = { __typename?: 'Mutation', updateApprovalRequest?: null | undefined | void | null };

export type CancelAsyncIssuanceRequestMutationVariables = Exact<{
  asyncIssuanceRequestId: Scalars['UUID']['input'];
}>;


export type CancelAsyncIssuanceRequestMutation = { __typename?: 'Mutation', cancelAsyncIssuanceRequest?: { __typename?: 'AsyncIssuanceRequest', id: string, status: AsyncIssuanceRequestStatus, isStatusFinal: boolean, failureReason?: string | null, expiry: AsyncIssuanceRequestExpiry, expiresOn: Date, createdAt: Date, updatedAt?: Date | null, identity: { __typename?: 'Identity', id: string }, issuance?: { __typename?: 'Issuance', id: string } | null, createdBy: { __typename?: 'User', id: string }, updatedBy?: { __typename?: 'User', id: string } | null } | null };

export type CreateAsyncIssuanceRequestMutationVariables = Exact<{
  request: Array<AsyncIssuanceRequestInput> | AsyncIssuanceRequestInput;
}>;


export type CreateAsyncIssuanceRequestMutation = { __typename?: 'Mutation', createAsyncIssuanceRequest: { __typename: 'AsyncIssuanceErrorResponse', errors: Array<string | null> } | { __typename: 'AsyncIssuanceResponse', asyncIssuanceRequestIds: Array<string> } };

export type CreateIssuanceRequestForAsyncIssuanceMutationVariables = Exact<{
  asyncIssuanceRequestId: Scalars['UUID']['input'];
}>;


export type CreateIssuanceRequestForAsyncIssuanceMutation = { __typename?: 'Mutation', createIssuanceRequestForAsyncIssuance: { __typename: 'IssuanceResponse', requestId: string, url: string, qrCode?: string | null } | { __typename: 'RequestErrorResponse', requestId: string, date: Date, mscv: string, error: { __typename?: 'RequestErrorWithInner', code: string, message: string, innererror: { __typename?: 'RequestInnerError', code: string, message: string, target?: string | null } } } };

export type AsyncIssuanceRequestFragmentFragment = { __typename?: 'AsyncIssuanceRequest', id: string, status: AsyncIssuanceRequestStatus, isStatusFinal: boolean, failureReason?: string | null, expiry: AsyncIssuanceRequestExpiry, expiresOn: Date, createdAt: Date, updatedAt?: Date | null, identity: { __typename?: 'Identity', id: string }, issuance?: { __typename?: 'Issuance', id: string } | null, createdBy: { __typename?: 'User', id: string }, updatedBy?: { __typename?: 'User', id: string } | null };

export type GetAsyncIssuanceQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type GetAsyncIssuanceQuery = { __typename?: 'Query', asyncIssuanceRequest: { __typename?: 'AsyncIssuanceRequest', id: string, status: AsyncIssuanceRequestStatus, isStatusFinal: boolean, failureReason?: string | null, expiry: AsyncIssuanceRequestExpiry, expiresOn: Date, createdAt: Date, updatedAt?: Date | null, identity: { __typename?: 'Identity', id: string }, issuance?: { __typename?: 'Issuance', id: string } | null, createdBy: { __typename?: 'User', id: string }, updatedBy?: { __typename?: 'User', id: string } | null } };

export type ResendAsyncIssuanceNotificationMutationVariables = Exact<{
  asyncIssuanceRequestId: Scalars['UUID']['input'];
}>;


export type ResendAsyncIssuanceNotificationMutation = { __typename?: 'Mutation', resendAsyncIssuanceNotification?: { __typename?: 'AsyncIssuanceRequest', id: string, status: AsyncIssuanceRequestStatus, isStatusFinal: boolean, failureReason?: string | null, expiry: AsyncIssuanceRequestExpiry, expiresOn: Date, createdAt: Date, updatedAt?: Date | null, identity: { __typename?: 'Identity', id: string }, issuance?: { __typename?: 'Issuance', id: string } | null, createdBy: { __typename?: 'User', id: string }, updatedBy?: { __typename?: 'User', id: string } | null } | null };

export type UpdateAsyncIssuanceContactMutationVariables = Exact<{
  asyncIssuanceRequestId: Scalars['UUID']['input'];
  contact: AsyncIssuanceContactInput;
}>;


export type UpdateAsyncIssuanceContactMutation = { __typename?: 'Mutation', updateAsyncIssuanceContact?: { __typename?: 'AsyncIssuanceContact', notification?: { __typename?: 'Contact', value: string, method: ContactMethod } | null, verification?: { __typename?: 'Contact', value: string, method: ContactMethod } | null } | null };

export type ConciergeBrandingQueryVariables = Exact<{ [key: string]: never; }>;


export type ConciergeBrandingQuery = { __typename?: 'Query', conciergeBranding?: { __typename?: 'Branding', data?: Record<string, unknown> | null } | null };

export type SaveConciergeBrandingMutationVariables = Exact<{
  input: ConciergeBrandingInput;
}>;


export type SaveConciergeBrandingMutation = { __typename?: 'Mutation', saveConciergeBranding: { __typename?: 'Branding', id: string } };

export type DeleteConciergeBrandingMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteConciergeBrandingMutation = { __typename?: 'Mutation', deleteConciergeBranding?: null | undefined | void | null };

export type ContractFragmentFragment = { __typename?: 'Contract', id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> } };

export type CreateContractMutationVariables = Exact<{
  input: ContractInput;
}>;


export type CreateContractMutation = { __typename?: 'Mutation', createContract: { __typename?: 'Contract', id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> } } };

export type DeprecateContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeprecateContractMutation = { __typename?: 'Mutation', deprecateContract: { __typename?: 'Contract', externalId?: string | null, provisionedAt?: Date | null, lastProvisionedAt?: Date | null, isDeprecated?: boolean | null, deprecatedAt?: Date | null, id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> } } };

export type GetContractQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetContractQuery = { __typename?: 'Query', contract: { __typename?: 'Contract', id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> } } };

export type ProvisionContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ProvisionContractMutation = { __typename?: 'Mutation', provisionContract: { __typename?: 'Contract', externalId?: string | null, provisionedAt?: Date | null, lastProvisionedAt?: Date | null, id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> } } };

export type UpdateContractMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ContractInput;
}>;


export type UpdateContractMutation = { __typename?: 'Mutation', updateContract: { __typename?: 'Contract', id: string, name: string, description: string, credentialTypes: Array<string>, isPublic: boolean, validityIntervalInSeconds: number, template?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display: { __typename?: 'ContractDisplayModel', locale: string, card: { __typename?: 'ContractDisplayCredential', title: string, issuedBy: string, backgroundColor: string, textColor: string, description: string, logo: { __typename?: 'ContractDisplayCredentialLogo', uri: string, image: string, description: string } }, consent: { __typename?: 'ContractDisplayConsent', title?: string | null, instructions?: string | null }, claims: Array<{ __typename?: 'ContractDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> } } };

export type HealthcheckQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthcheckQuery = { __typename?: 'Query', healthcheck?: null | undefined | void | null };

export type IdentityStoreFieldsFragment = { __typename?: 'IdentityStore', id: string, identifier: string, name: string, type: IdentityStoreType, isAuthenticationEnabled: boolean, clientId?: string | null, suspendedAt?: Date | null };

export type CreateIdentityStoreMutationVariables = Exact<{
  input: IdentityStoreInput;
}>;


export type CreateIdentityStoreMutation = { __typename?: 'Mutation', createIdentityStore: { __typename?: 'IdentityStore', id: string, identifier: string, name: string, type: IdentityStoreType, isAuthenticationEnabled: boolean, clientId?: string | null, suspendedAt?: Date | null } };

export type UpdateIdentityStoreMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateIdentityStoreInput;
}>;


export type UpdateIdentityStoreMutation = { __typename?: 'Mutation', updateIdentityStore: { __typename?: 'IdentityStore', id: string, identifier: string, name: string, type: IdentityStoreType, isAuthenticationEnabled: boolean, clientId?: string | null, suspendedAt?: Date | null } };

export type SuspendIdentityStoreMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SuspendIdentityStoreMutation = { __typename?: 'Mutation', suspendIdentityStore: { __typename?: 'IdentityStore', id: string, identifier: string, name: string, type: IdentityStoreType, isAuthenticationEnabled: boolean, clientId?: string | null, suspendedAt?: Date | null } };

export type ResumeIdentityStoreMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ResumeIdentityStoreMutation = { __typename?: 'Mutation', resumeIdentityStore: { __typename?: 'IdentityStore', id: string, identifier: string, name: string, type: IdentityStoreType, isAuthenticationEnabled: boolean, clientId?: string | null, suspendedAt?: Date | null } };

export type FindIdentityStoresQueryVariables = Exact<{ [key: string]: never; }>;


export type FindIdentityStoresQuery = { __typename?: 'Query', findIdentityStores: Array<{ __typename?: 'IdentityStore', id: string, identifier: string, name: string, type: IdentityStoreType, isAuthenticationEnabled: boolean, clientId?: string | null, suspendedAt?: Date | null }> };

export type FindIdentityStoresWithWhereQueryVariables = Exact<{
  where?: InputMaybe<IdentityStoreWhere>;
}>;


export type FindIdentityStoresWithWhereQuery = { __typename?: 'Query', findIdentityStores: Array<{ __typename?: 'IdentityStore', id: string, identifier: string, name: string, type: IdentityStoreType, isAuthenticationEnabled: boolean, clientId?: string | null, suspendedAt?: Date | null }> };

export type IdentityStoreByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type IdentityStoreByIdQuery = { __typename?: 'Query', identityStore?: { __typename?: 'IdentityStore', id: string, identifier: string, name: string, type: IdentityStoreType, isAuthenticationEnabled: boolean, clientId?: string | null, suspendedAt?: Date | null } | null };

export type IdentityQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type IdentityQuery = { __typename?: 'Query', identity: { __typename?: 'Identity', id: string, issuer: string, identifier: string, name: string } };

export type FindIdentitiesQueryVariables = Exact<{
  where?: InputMaybe<IdentityWhere>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
}>;


export type FindIdentitiesQuery = { __typename?: 'Query', findIdentities: Array<{ __typename?: 'Identity', id: string, issuer: string, identifier: string, name: string }> };

export type SaveIdentityMutationVariables = Exact<{
  input: IdentityInput;
}>;


export type SaveIdentityMutation = { __typename?: 'Mutation', saveIdentity: { __typename?: 'Identity', id: string, issuer: string, identifier: string, name: string } };

export type DeleteIdentitiesMutationVariables = Exact<{
  ids: Array<Scalars['UUID']['input']> | Scalars['UUID']['input'];
}>;


export type DeleteIdentitiesMutation = { __typename?: 'Mutation', deleteIdentities?: null | undefined | void | null };

export type ImportMutationVariables = Exact<{
  input: ImportInput;
}>;


export type ImportMutation = { __typename?: 'Mutation', import?: null | undefined | void | null };

export type GetApplicationLabelConfigsQueryVariables = Exact<{
  identityStoreId: Scalars['ID']['input'];
}>;


export type GetApplicationLabelConfigsQuery = { __typename?: 'Query', applicationLabelConfigs: Array<{ __typename?: 'ApplicationLabelConfig', id: string, identifier: string, name: string }> };

export type SetApplicationLabelConfigsMutationVariables = Exact<{
  identityStoreId: Scalars['ID']['input'];
  input: Array<ApplicationLabelConfigInput> | ApplicationLabelConfigInput;
}>;


export type SetApplicationLabelConfigsMutation = { __typename?: 'Mutation', setApplicationLabelConfigs: Array<{ __typename?: 'ApplicationLabelConfig', id: string, identifier: string, name: string }> };

export type GetCorsOriginConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCorsOriginConfigsQuery = { __typename?: 'Query', corsOriginConfigs: Array<{ __typename?: 'CorsOriginConfig', id: string, origin: string }> };

export type SetCorsOriginConfigsMutationVariables = Exact<{
  input: Array<CorsOriginConfigInput> | CorsOriginConfigInput;
}>;


export type SetCorsOriginConfigsMutation = { __typename?: 'Mutation', setCorsOriginConfigs: Array<{ __typename?: 'CorsOriginConfig', id: string, origin: string }> };

export type GetEmailSenderConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmailSenderConfigQuery = { __typename?: 'Query', emailSenderConfig: { __typename?: 'EmailSenderConfig', senderName: string, senderEmail: string } };

export type SetEmailSenderConfigMutationVariables = Exact<{
  input: EmailSenderConfigInput;
}>;


export type SetEmailSenderConfigMutation = { __typename?: 'Mutation', setEmailSenderConfig: { __typename?: 'EmailSenderConfig', senderName: string, senderEmail: string } };

export type CreateIssuanceRequestMutationVariables = Exact<{
  request: IssuanceRequestInput;
}>;


export type CreateIssuanceRequestMutation = { __typename?: 'Mutation', createIssuanceRequest: { __typename?: 'IssuanceResponse', requestId: string, url: string, qrCode?: string | null } | { __typename?: 'RequestErrorResponse', error: { __typename?: 'RequestErrorWithInner', code: string, message: string } } };

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

export type CreatePresentationRequestMutationVariables = Exact<{
  request: PresentationRequestInput;
}>;


export type CreatePresentationRequestMutation = { __typename?: 'Mutation', createPresentationRequest: { __typename?: 'PresentationResponse', requestId: string, url: string, qrCode?: string | null, expiry: number } | { __typename?: 'RequestErrorResponse', error: { __typename?: 'RequestErrorWithInner', code: string, message: string, innererror: { __typename?: 'RequestInnerError', code: string, message: string, target?: string | null } } } };

export type AcquireLimitedApprovalTokenMutationVariables = Exact<{
  input: AcquireLimitedApprovalTokenInput;
}>;


export type AcquireLimitedApprovalTokenMutation = { __typename?: 'Mutation', acquireLimitedApprovalToken: { __typename?: 'ApprovalTokenResponse', token: string, expires: Date } };

export type AcquireLimitedPhotoCaptureTokenMutationVariables = Exact<{
  input: AcquireLimitedPhotoCaptureTokenInput;
}>;


export type AcquireLimitedPhotoCaptureTokenMutation = { __typename?: 'Mutation', acquireLimitedPhotoCaptureToken: { __typename?: 'PhotoCaptureTokenResponse', token: string, expires: Date } };

export type OidcClientFragmentFragment = { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null };

export type CreateOidcClientMutationVariables = Exact<{
  input: OidcClientInput;
}>;


export type CreateOidcClientMutation = { __typename?: 'Mutation', createOidcClient: { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type UpdateOidcClientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: OidcClientInput;
}>;


export type UpdateOidcClientMutation = { __typename?: 'Mutation', updateOidcClient: { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type DeleteOidcClientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteOidcClientMutation = { __typename?: 'Mutation', deleteOidcClient: { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type FindOidcClientsQueryVariables = Exact<{
  where?: InputMaybe<OidcClientWhere>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<OidcClientOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type FindOidcClientsQuery = { __typename?: 'Query', findOidcClients: Array<{ __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null }> };

export type OidcClientQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type OidcClientQuery = { __typename?: 'Query', oidcClient: { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type OidcResourceFragmentFragment = { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string>, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null };

export type CreateOidcResourceMutationVariables = Exact<{
  input: OidcResourceInput;
}>;


export type CreateOidcResourceMutation = { __typename?: 'Mutation', createOidcResource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string>, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type UpdateOidcResourceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: OidcResourceInput;
}>;


export type UpdateOidcResourceMutation = { __typename?: 'Mutation', updateOidcResource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string>, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type DeleteOidcResourceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteOidcResourceMutation = { __typename?: 'Mutation', deleteOidcResource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string>, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type FindOidcResourcesQueryVariables = Exact<{
  where?: InputMaybe<OidcResourceWhere>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<OidcResourceOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type FindOidcResourcesQuery = { __typename?: 'Query', findOidcResources: Array<{ __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string>, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null }> };

export type OidcResourceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type OidcResourceQuery = { __typename?: 'Query', oidcResource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string>, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type UpdateConciergeClientBrandingMutationVariables = Exact<{
  input: ConciergeClientBrandingInput;
}>;


export type UpdateConciergeClientBrandingMutation = { __typename?: 'Mutation', updateConciergeClientBranding: { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type CreateOidcClientResourceMutationVariables = Exact<{
  clientId: Scalars['ID']['input'];
  input: OidcClientResourceInput;
}>;


export type CreateOidcClientResourceMutation = { __typename?: 'Mutation', createOidcClientResource: { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type UpdateOidcClientResourceMutationVariables = Exact<{
  clientId: Scalars['ID']['input'];
  input: OidcClientResourceInput;
}>;


export type UpdateOidcClientResourceMutation = { __typename?: 'Mutation', updateOidcClientResource: { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type DeleteOidcClientResourceMutationVariables = Exact<{
  clientId: Scalars['ID']['input'];
  resourceId: Scalars['ID']['input'];
}>;


export type DeleteOidcClientResourceMutation = { __typename?: 'Mutation', deleteOidcClientResource: { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type OidcClaimMappingFragmentFragment = { __typename?: 'OidcClaimMapping', id: string, name: string, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, mappings: Array<{ __typename?: 'ScopedClaimMapping', scope: string, claim: string, credentialClaim: string }>, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null };

export type OidcClaimMappingQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type OidcClaimMappingQuery = { __typename?: 'Query', oidcClaimMapping: { __typename?: 'OidcClaimMapping', id: string, name: string, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, mappings: Array<{ __typename?: 'ScopedClaimMapping', scope: string, claim: string, credentialClaim: string }>, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type FindOidcClaimMappingsQueryVariables = Exact<{
  where?: InputMaybe<OidcClaimMappingWhere>;
  offset?: InputMaybe<Scalars['PositiveInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<OidcClaimMappingOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type FindOidcClaimMappingsQuery = { __typename?: 'Query', findOidcClaimMappings: Array<{ __typename?: 'OidcClaimMapping', id: string, name: string, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, mappings: Array<{ __typename?: 'ScopedClaimMapping', scope: string, claim: string, credentialClaim: string }>, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null }> };

export type CreateOidcClaimMappingMutationVariables = Exact<{
  input: OidcClaimMappingInput;
}>;


export type CreateOidcClaimMappingMutation = { __typename?: 'Mutation', createOidcClaimMapping: { __typename?: 'OidcClaimMapping', id: string, name: string, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, mappings: Array<{ __typename?: 'ScopedClaimMapping', scope: string, claim: string, credentialClaim: string }>, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type UpdateOidcClaimMappingMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: OidcClaimMappingInput;
}>;


export type UpdateOidcClaimMappingMutation = { __typename?: 'Mutation', updateOidcClaimMapping: { __typename?: 'OidcClaimMapping', id: string, name: string, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, mappings: Array<{ __typename?: 'ScopedClaimMapping', scope: string, claim: string, credentialClaim: string }>, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type DeleteOidcClaimMappingMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteOidcClaimMappingMutation = { __typename?: 'Mutation', deleteOidcClaimMapping: { __typename?: 'OidcClaimMapping', id: string, name: string, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, mappings: Array<{ __typename?: 'ScopedClaimMapping', scope: string, claim: string, credentialClaim: string }>, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type UpdateOidcClientClaimMappingsMutationVariables = Exact<{
  clientId: Scalars['ID']['input'];
  claimMappingIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type UpdateOidcClientClaimMappingsMutation = { __typename?: 'Mutation', updateOidcClientClaimMappings: { __typename?: 'OidcClient', id: string, name: string, applicationType: OidcApplicationType, clientType: OidcClientType, logo?: string | null, backgroundColor?: string | null, backgroundImage?: string | null, policyUrl?: string | null, termsOfServiceUrl?: string | null, redirectUris: Array<string>, postLogoutUris: Array<string>, requireFaceCheck: boolean, allowAnyPartner: boolean, uniqueClaimsForSubjectId?: Array<string> | null, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, claimMappings: Array<{ __typename?: 'OidcClaimMapping', id: string, name: string, credentialTypes?: Array<string> | null, createdAt: Date, updatedAt?: Date | null, deletedAt?: Date | null, mappings: Array<{ __typename?: 'ScopedClaimMapping', scope: string, claim: string, credentialClaim: string }>, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null }>, partners: Array<{ __typename?: 'Partner', id: string, name: string, did: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null }>, resources?: Array<{ __typename?: 'OidcClientResource', resourceScopes: Array<string>, resource: { __typename?: 'OidcResource', id: string, name: string, resourceIndicator: string, scopes: Array<string> } }> | null, createdBy: { __typename?: 'User', id: string, name: string }, updatedBy?: { __typename?: 'User', id: string, name: string } | null } };

export type DiscoveryQueryVariables = Exact<{ [key: string]: never; }>;


export type DiscoveryQuery = { __typename?: 'Query', discovery: { __typename?: 'Discovery', version: string } };

export type AuthorityQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorityQuery = { __typename?: 'Query', authority: { __typename?: 'Authority', id: string } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'Identity', presentations: Array<{ __typename?: 'Presentation', id: string }>, issuances: Array<{ __typename?: 'Issuance', id: string }>, asyncIssuanceRequests: Array<{ __typename?: 'AsyncIssuanceRequest', id: string }> } | { __typename?: 'User' } | null };

export type AsyncIssuanceRequestQueryVariables = Exact<{
  asyncIssuanceRequestId: Scalars['UUID']['input'];
}>;


export type AsyncIssuanceRequestQuery = { __typename?: 'Query', asyncIssuanceRequest: { __typename?: 'AsyncIssuanceRequest', id: string } };

export type CreatePartnerIdentityTestMutationVariables = Exact<{
  input: CreatePartnerInput;
}>;


export type CreatePartnerIdentityTestMutation = { __typename?: 'Mutation', createPartner: { __typename?: 'Partner', id: string, did: string, name: string } };

export type PartnerFieldsFragment = { __typename?: 'Partner', id: string, did: string, tenantId?: string | null, issuerId?: string | null, name: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null, suspendedAt?: Date | null };

export type CreatePartnerMutationVariables = Exact<{
  input: CreatePartnerInput;
}>;


export type CreatePartnerMutation = { __typename?: 'Mutation', createPartner: { __typename?: 'Partner', id: string, did: string, tenantId?: string | null, issuerId?: string | null, name: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null, suspendedAt?: Date | null } };

export type UpdatePartnerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdatePartnerInput;
}>;


export type UpdatePartnerMutation = { __typename?: 'Mutation', updatePartner: { __typename?: 'Partner', id: string, did: string, tenantId?: string | null, issuerId?: string | null, name: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null, suspendedAt?: Date | null } };

export type SuspendPartnerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SuspendPartnerMutation = { __typename?: 'Mutation', suspendPartner: { __typename?: 'Partner', id: string, did: string, tenantId?: string | null, issuerId?: string | null, name: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null, suspendedAt?: Date | null } };

export type ResumePartnerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ResumePartnerMutation = { __typename?: 'Mutation', resumePartner: { __typename?: 'Partner', id: string, did: string, tenantId?: string | null, issuerId?: string | null, name: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null, suspendedAt?: Date | null } };

export type PartnerByDidQueryVariables = Exact<{
  did: Scalars['String']['input'];
}>;


export type PartnerByDidQuery = { __typename?: 'Query', partnerByDid?: { __typename?: 'Partner', id: string, did: string, tenantId?: string | null, issuerId?: string | null, name: string, credentialTypes: Array<string>, linkedDomainUrls?: Array<string> | null, suspendedAt?: Date | null } | null };

export type CreatePhotoCaptureRequestMutationVariables = Exact<{
  request: PhotoCaptureRequest;
}>;


export type CreatePhotoCaptureRequestMutation = { __typename?: 'Mutation', createPhotoCaptureRequest: { __typename?: 'PhotoCaptureRequestResponse', id: string, photoCaptureUrl: string, photoCaptureQrCode: string } };

export type CapturePhotoMutationVariables = Exact<{
  photoCaptureRequestId: Scalars['UUID']['input'];
  photo: Scalars['String']['input'];
}>;


export type CapturePhotoMutation = { __typename?: 'Mutation', capturePhoto?: null | undefined | void | null };

export type PhotoCaptureStatusQueryVariables = Exact<{
  photoCaptureRequestId: Scalars['UUID']['input'];
}>;


export type PhotoCaptureStatusQuery = { __typename?: 'Query', photoCaptureStatus: { __typename?: 'PhotoCaptureEventData', status: PhotoCaptureStatus } };

export type TemplateParentDataFragmentFragment = { __typename?: 'Template', parentData?: { __typename?: 'TemplateParentData', isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> | null } | null } | null };

export type GetTemplateParentDataQueryQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTemplateParentDataQueryQuery = { __typename?: 'Query', template: { __typename?: 'Template', parentData?: { __typename?: 'TemplateParentData', isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> | null } | null } | null } };

export type TemplateFragmentFragment = { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, parent?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> | null } | null };

export type CreateTemplateMutationVariables = Exact<{
  input: TemplateInput;
}>;


export type CreateTemplateMutation = { __typename?: 'Mutation', createTemplate: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, parent?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> | null } | null } };

export type GetTemplateQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTemplateQuery = { __typename?: 'Query', template: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, parent?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> | null } | null } };

export type UpdateTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: TemplateInput;
}>;


export type UpdateTemplateMutation = { __typename?: 'Mutation', updateTemplate: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null, credentialTypes?: Array<string> | null, parent?: { __typename?: 'Template', id: string, name: string, description: string, isPublic?: boolean | null, validityIntervalInSeconds?: number | null } | null, display?: { __typename?: 'TemplateDisplayModel', locale?: string | null, card?: { __typename?: 'TemplateDisplayCredential', title?: string | null, issuedBy?: string | null, backgroundColor?: string | null, textColor?: string | null, description?: string | null, logo?: { __typename?: 'TemplateDisplayCredentialLogo', uri?: string | null, image?: string | null, description?: string | null } | null } | null, consent?: { __typename?: 'TemplateDisplayConsent', title?: string | null, instructions?: string | null } | null, claims?: Array<{ __typename?: 'TemplateDisplayClaim', label: string, claim: string, type: ClaimType, description?: string | null, value?: string | null }> | null } | null } };

export type FindWalletsQueryVariables = Exact<{
  where?: InputMaybe<WalletWhere>;
}>;


export type FindWalletsQuery = { __typename?: 'Query', findWallets: Array<{ __typename?: 'Wallet', firstUsed: Date, lastUsed: Date, subject: string, presentations: Array<{ __typename?: 'Presentation', identity?: { __typename?: 'Identity', id: string } | null }> }> };

export type CreatePartnerShieldTestMutationVariables = Exact<{
  input: CreatePartnerInput;
}>;


export type CreatePartnerShieldTestMutation = { __typename?: 'Mutation', createPartner: { __typename?: 'Partner', id: string } };

export const AsyncIssuanceRequestFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AsyncIssuanceRequestFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AsyncIssuanceRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isStatusFinal"}},{"kind":"Field","name":{"kind":"Name","value":"failureReason"}},{"kind":"Field","name":{"kind":"Name","value":"expiry"}},{"kind":"Field","name":{"kind":"Name","value":"expiresOn"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"identity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"issuance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AsyncIssuanceRequestFragmentFragment, unknown>;
export const ContractFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<ContractFragmentFragment, unknown>;
export const IdentityStoreFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IdentityStoreFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStore"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthenticationEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<IdentityStoreFieldsFragment, unknown>;
export const OidcClientFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<OidcClientFragmentFragment, unknown>;
export const OidcResourceFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcResourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<OidcResourceFragmentFragment, unknown>;
export const OidcClaimMappingFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClaimMappingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMapping"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"mappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"credentialClaim"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<OidcClaimMappingFragmentFragment, unknown>;
export const PartnerFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartnerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Partner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"issuerId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<PartnerFieldsFragment, unknown>;
export const TemplateParentDataFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateParentDataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]}}]} as unknown as DocumentNode<TemplateParentDataFragmentFragment, unknown>;
export const TemplateFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<TemplateFragmentFragment, unknown>;
export const CancelApprovalRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelApprovalRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelApprovalRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<CancelApprovalRequestMutation, CancelApprovalRequestMutationVariables>;
export const ApprovalRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ApprovalRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approvalRequestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvalRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approvalRequestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requestedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"requestType"}},{"kind":"Field","name":{"kind":"Name","value":"correlationId"}},{"kind":"Field","name":{"kind":"Name","value":"referenceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"requestData"}},{"kind":"Field","name":{"kind":"Name","value":"actionedComment"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ApprovalRequestQuery, ApprovalRequestQueryVariables>;
export const CreateApprovalRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateApprovalRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ApprovalRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createApprovalRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"portalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"callbackSecret"}}]}}]}}]} as unknown as DocumentNode<CreateApprovalRequestMutation, CreateApprovalRequestMutationVariables>;
export const ActionApprovalRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActionApprovalRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ActionApprovalRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actionApprovalRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isApproved"}},{"kind":"Field","name":{"kind":"Name","value":"actionedComment"}}]}}]}}]} as unknown as DocumentNode<ActionApprovalRequestMutation, ActionApprovalRequestMutationVariables>;
export const FindActionedApprovalDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindActionedApprovalData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actionedApprovalData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvalRequestId"}},{"kind":"Field","name":{"kind":"Name","value":"correlationId"}},{"kind":"Field","name":{"kind":"Name","value":"requestData"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"actionedComment"}},{"kind":"Field","name":{"kind":"Name","value":"actionedAt"}},{"kind":"Field","name":{"kind":"Name","value":"actionedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"callbackSecret"}}]}}]}}]} as unknown as DocumentNode<FindActionedApprovalDataQuery, FindActionedApprovalDataQueryVariables>;
export const UpdateApprovalRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateApprovalRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateApprovalRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateApprovalRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<UpdateApprovalRequestMutation, UpdateApprovalRequestMutationVariables>;
export const CancelAsyncIssuanceRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelAsyncIssuanceRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelAsyncIssuanceRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"asyncIssuanceRequestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AsyncIssuanceRequestFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AsyncIssuanceRequestFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AsyncIssuanceRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isStatusFinal"}},{"kind":"Field","name":{"kind":"Name","value":"failureReason"}},{"kind":"Field","name":{"kind":"Name","value":"expiry"}},{"kind":"Field","name":{"kind":"Name","value":"expiresOn"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"identity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"issuance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CancelAsyncIssuanceRequestMutation, CancelAsyncIssuanceRequestMutationVariables>;
export const CreateAsyncIssuanceRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAsyncIssuanceRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"request"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AsyncIssuanceRequestInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAsyncIssuanceRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"Variable","name":{"kind":"Name","value":"request"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AsyncIssuanceResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"asyncIssuanceRequestIds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AsyncIssuanceErrorResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAsyncIssuanceRequestMutation, CreateAsyncIssuanceRequestMutationVariables>;
export const CreateIssuanceRequestForAsyncIssuanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateIssuanceRequestForAsyncIssuance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createIssuanceRequestForAsyncIssuance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"asyncIssuanceRequestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IssuanceResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RequestErrorResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"mscv"}},{"kind":"Field","name":{"kind":"Name","value":"error"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"innererror"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"target"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateIssuanceRequestForAsyncIssuanceMutation, CreateIssuanceRequestForAsyncIssuanceMutationVariables>;
export const GetAsyncIssuanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAsyncIssuance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"asyncIssuanceRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AsyncIssuanceRequestFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AsyncIssuanceRequestFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AsyncIssuanceRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isStatusFinal"}},{"kind":"Field","name":{"kind":"Name","value":"failureReason"}},{"kind":"Field","name":{"kind":"Name","value":"expiry"}},{"kind":"Field","name":{"kind":"Name","value":"expiresOn"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"identity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"issuance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<GetAsyncIssuanceQuery, GetAsyncIssuanceQueryVariables>;
export const ResendAsyncIssuanceNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendAsyncIssuanceNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendAsyncIssuanceNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"asyncIssuanceRequestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AsyncIssuanceRequestFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AsyncIssuanceRequestFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AsyncIssuanceRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isStatusFinal"}},{"kind":"Field","name":{"kind":"Name","value":"failureReason"}},{"kind":"Field","name":{"kind":"Name","value":"expiry"}},{"kind":"Field","name":{"kind":"Name","value":"expiresOn"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"identity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"issuance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ResendAsyncIssuanceNotificationMutation, ResendAsyncIssuanceNotificationMutationVariables>;
export const UpdateAsyncIssuanceContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAsyncIssuanceContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contact"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AsyncIssuanceContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAsyncIssuanceContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"asyncIssuanceRequestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}}},{"kind":"Argument","name":{"kind":"Name","value":"contact"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contact"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"method"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"method"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAsyncIssuanceContactMutation, UpdateAsyncIssuanceContactMutationVariables>;
export const ConciergeBrandingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ConciergeBranding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"conciergeBranding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}}]} as unknown as DocumentNode<ConciergeBrandingQuery, ConciergeBrandingQueryVariables>;
export const SaveConciergeBrandingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveConciergeBranding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConciergeBrandingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveConciergeBranding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SaveConciergeBrandingMutation, SaveConciergeBrandingMutationVariables>;
export const DeleteConciergeBrandingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteConciergeBranding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteConciergeBranding"}}]}}]} as unknown as DocumentNode<DeleteConciergeBrandingMutation, DeleteConciergeBrandingMutationVariables>;
export const CreateContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContractInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<CreateContractMutation, CreateContractMutationVariables>;
export const DeprecateContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeprecateContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deprecateContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}},{"kind":"Field","name":{"kind":"Name","value":"externalId"}},{"kind":"Field","name":{"kind":"Name","value":"provisionedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastProvisionedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isDeprecated"}},{"kind":"Field","name":{"kind":"Name","value":"deprecatedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<DeprecateContractMutation, DeprecateContractMutationVariables>;
export const GetContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<GetContractQuery, GetContractQueryVariables>;
export const ProvisionContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProvisionContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provisionContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}},{"kind":"Field","name":{"kind":"Name","value":"externalId"}},{"kind":"Field","name":{"kind":"Name","value":"provisionedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastProvisionedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<ProvisionContractMutation, ProvisionContractMutationVariables>;
export const UpdateContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContractInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ContractFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ContractFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Contract"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}}]} as unknown as DocumentNode<UpdateContractMutation, UpdateContractMutationVariables>;
export const HealthcheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Healthcheck"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"healthcheck"}}]}}]} as unknown as DocumentNode<HealthcheckQuery, HealthcheckQueryVariables>;
export const CreateIdentityStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateIdentityStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStoreInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createIdentityStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IdentityStoreFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IdentityStoreFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStore"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthenticationEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<CreateIdentityStoreMutation, CreateIdentityStoreMutationVariables>;
export const UpdateIdentityStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateIdentityStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateIdentityStoreInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateIdentityStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IdentityStoreFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IdentityStoreFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStore"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthenticationEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<UpdateIdentityStoreMutation, UpdateIdentityStoreMutationVariables>;
export const SuspendIdentityStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SuspendIdentityStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"suspendIdentityStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IdentityStoreFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IdentityStoreFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStore"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthenticationEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<SuspendIdentityStoreMutation, SuspendIdentityStoreMutationVariables>;
export const ResumeIdentityStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResumeIdentityStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resumeIdentityStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IdentityStoreFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IdentityStoreFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStore"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthenticationEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<ResumeIdentityStoreMutation, ResumeIdentityStoreMutationVariables>;
export const FindIdentityStoresDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindIdentityStores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findIdentityStores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IdentityStoreFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IdentityStoreFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStore"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthenticationEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<FindIdentityStoresQuery, FindIdentityStoresQueryVariables>;
export const FindIdentityStoresWithWhereDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindIdentityStoresWithWhere"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStoreWhere"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findIdentityStores"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IdentityStoreFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IdentityStoreFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStore"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthenticationEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<FindIdentityStoresWithWhereQuery, FindIdentityStoresWithWhereQueryVariables>;
export const IdentityStoreByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IdentityStoreById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identityStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IdentityStoreFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IdentityStoreFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityStore"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthenticationEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<IdentityStoreByIdQuery, IdentityStoreByIdQueryVariables>;
export const IdentityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Identity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuer"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<IdentityQuery, IdentityQueryVariables>;
export const FindIdentitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindIdentities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityWhere"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findIdentities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuer"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<FindIdentitiesQuery, FindIdentitiesQueryVariables>;
export const SaveIdentityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveIdentity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"IdentityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveIdentity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuer"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<SaveIdentityMutation, SaveIdentityMutationVariables>;
export const DeleteIdentitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteIdentities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteIdentities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<DeleteIdentitiesMutation, DeleteIdentitiesMutationVariables>;
export const ImportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Import"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ImportInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"import"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ImportMutation, ImportMutationVariables>;
export const GetApplicationLabelConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetApplicationLabelConfigs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identityStoreId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applicationLabelConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"identityStoreId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identityStoreId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetApplicationLabelConfigsQuery, GetApplicationLabelConfigsQueryVariables>;
export const SetApplicationLabelConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetApplicationLabelConfigs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identityStoreId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ApplicationLabelConfigInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setApplicationLabelConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"identityStoreId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identityStoreId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<SetApplicationLabelConfigsMutation, SetApplicationLabelConfigsMutationVariables>;
export const GetCorsOriginConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCorsOriginConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"corsOriginConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}}]}}]}}]} as unknown as DocumentNode<GetCorsOriginConfigsQuery, GetCorsOriginConfigsQueryVariables>;
export const SetCorsOriginConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetCorsOriginConfigs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CorsOriginConfigInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setCorsOriginConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}}]}}]}}]} as unknown as DocumentNode<SetCorsOriginConfigsMutation, SetCorsOriginConfigsMutationVariables>;
export const GetEmailSenderConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailSenderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"emailSenderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"senderName"}},{"kind":"Field","name":{"kind":"Name","value":"senderEmail"}}]}}]}}]} as unknown as DocumentNode<GetEmailSenderConfigQuery, GetEmailSenderConfigQueryVariables>;
export const SetEmailSenderConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetEmailSenderConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EmailSenderConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setEmailSenderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"senderName"}},{"kind":"Field","name":{"kind":"Name","value":"senderEmail"}}]}}]}}]} as unknown as DocumentNode<SetEmailSenderConfigMutation, SetEmailSenderConfigMutationVariables>;
export const CreateIssuanceRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateIssuanceRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"request"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"IssuanceRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createIssuanceRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"Variable","name":{"kind":"Name","value":"request"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IssuanceResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RequestErrorResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateIssuanceRequestMutation, CreateIssuanceRequestMutationVariables>;
export const AcquireLimitedAccessTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcquireLimitedAccessToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AcquireLimitedAccessTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acquireLimitedAccessToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"expires"}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<AcquireLimitedAccessTokenMutation, AcquireLimitedAccessTokenMutationVariables>;
export const FindContractsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindContracts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ContractWhere"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findContracts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"issuances"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"presentations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"presentedAt"}}]}}]}}]}}]} as unknown as DocumentNode<FindContractsQuery, FindContractsQueryVariables>;
export const ContractDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Contract"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contract"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"issuances"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"presentations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forIdentityId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"presentedAt"}}]}}]}}]}}]} as unknown as DocumentNode<ContractQuery, ContractQueryVariables>;
export const FindIssuancesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindIssuances"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"IssuanceWhere"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findIssuances"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}}]}}]}}]} as unknown as DocumentNode<FindIssuancesQuery, FindIssuancesQueryVariables>;
export const CredentialTypesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CredentialTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<CredentialTypesQuery, CredentialTypesQueryVariables>;
export const CreatePresentationRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePresentationRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"request"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PresentationRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPresentationRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"Variable","name":{"kind":"Name","value":"request"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PresentationResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}},{"kind":"Field","name":{"kind":"Name","value":"expiry"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RequestErrorResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"innererror"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"target"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreatePresentationRequestMutation, CreatePresentationRequestMutationVariables>;
export const AcquireLimitedApprovalTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcquireLimitedApprovalToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AcquireLimitedApprovalTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acquireLimitedApprovalToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expires"}}]}}]}}]} as unknown as DocumentNode<AcquireLimitedApprovalTokenMutation, AcquireLimitedApprovalTokenMutationVariables>;
export const AcquireLimitedPhotoCaptureTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcquireLimitedPhotoCaptureToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AcquireLimitedPhotoCaptureTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acquireLimitedPhotoCaptureToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expires"}}]}}]}}]} as unknown as DocumentNode<AcquireLimitedPhotoCaptureTokenMutation, AcquireLimitedPhotoCaptureTokenMutationVariables>;
export const CreateOidcClientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOidcClient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClientInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOidcClient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<CreateOidcClientMutation, CreateOidcClientMutationVariables>;
export const UpdateOidcClientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOidcClient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClientInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOidcClient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<UpdateOidcClientMutation, UpdateOidcClientMutationVariables>;
export const DeleteOidcClientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteOidcClient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteOidcClient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<DeleteOidcClientMutation, DeleteOidcClientMutationVariables>;
export const FindOidcClientsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindOidcClients"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClientWhere"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClientOrderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findOidcClients"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<FindOidcClientsQuery, FindOidcClientsQueryVariables>;
export const OidcClientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OidcClient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oidcClient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<OidcClientQuery, OidcClientQueryVariables>;
export const CreateOidcResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOidcResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOidcResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcResourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcResourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<CreateOidcResourceMutation, CreateOidcResourceMutationVariables>;
export const UpdateOidcResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOidcResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOidcResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcResourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcResourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<UpdateOidcResourceMutation, UpdateOidcResourceMutationVariables>;
export const DeleteOidcResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteOidcResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteOidcResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcResourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcResourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<DeleteOidcResourceMutation, DeleteOidcResourceMutationVariables>;
export const FindOidcResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindOidcResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResourceWhere"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResourceOrderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findOidcResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcResourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcResourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<FindOidcResourcesQuery, FindOidcResourcesQueryVariables>;
export const OidcResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OidcResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oidcResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcResourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcResourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<OidcResourceQuery, OidcResourceQueryVariables>;
export const UpdateConciergeClientBrandingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateConciergeClientBranding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConciergeClientBrandingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateConciergeClientBranding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<UpdateConciergeClientBrandingMutation, UpdateConciergeClientBrandingMutationVariables>;
export const CreateOidcClientResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOidcClientResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClientResourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOidcClientResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"clientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<CreateOidcClientResourceMutation, CreateOidcClientResourceMutationVariables>;
export const UpdateOidcClientResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOidcClientResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClientResourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOidcClientResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"clientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<UpdateOidcClientResourceMutation, UpdateOidcClientResourceMutationVariables>;
export const DeleteOidcClientResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteOidcClientResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteOidcClientResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"clientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}}},{"kind":"Argument","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<DeleteOidcClientResourceMutation, DeleteOidcClientResourceMutationVariables>;
export const OidcClaimMappingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OidcClaimMapping"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oidcClaimMapping"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClaimMappingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClaimMappingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMapping"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"mappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"credentialClaim"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<OidcClaimMappingQuery, OidcClaimMappingQueryVariables>;
export const FindOidcClaimMappingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindOidcClaimMappings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMappingWhere"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PositiveInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMappingOrderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findOidcClaimMappings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClaimMappingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClaimMappingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMapping"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"mappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"credentialClaim"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<FindOidcClaimMappingsQuery, FindOidcClaimMappingsQueryVariables>;
export const CreateOidcClaimMappingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOidcClaimMapping"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMappingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOidcClaimMapping"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClaimMappingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClaimMappingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMapping"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"mappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"credentialClaim"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<CreateOidcClaimMappingMutation, CreateOidcClaimMappingMutationVariables>;
export const UpdateOidcClaimMappingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOidcClaimMapping"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMappingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOidcClaimMapping"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClaimMappingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClaimMappingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMapping"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"mappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"credentialClaim"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<UpdateOidcClaimMappingMutation, UpdateOidcClaimMappingMutationVariables>;
export const DeleteOidcClaimMappingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteOidcClaimMapping"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteOidcClaimMapping"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClaimMappingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClaimMappingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMapping"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"mappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"credentialClaim"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<DeleteOidcClaimMappingMutation, DeleteOidcClaimMappingMutationVariables>;
export const UpdateOidcClientClaimMappingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOidcClientClaimMappings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"claimMappingIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOidcClientClaimMappings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"clientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}}},{"kind":"Argument","name":{"kind":"Name","value":"claimMappingIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"claimMappingIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClientFragment"}},{"kind":"Field","name":{"kind":"Name","value":"claimMappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OidcClaimMappingFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClientFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"clientType"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImage"}},{"kind":"Field","name":{"kind":"Name","value":"policyUrl"}},{"kind":"Field","name":{"kind":"Name","value":"termsOfServiceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"applicationType"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUris"}},{"kind":"Field","name":{"kind":"Name","value":"postLogoutUris"}},{"kind":"Field","name":{"kind":"Name","value":"requireFaceCheck"}},{"kind":"Field","name":{"kind":"Name","value":"allowAnyPartner"}},{"kind":"Field","name":{"kind":"Name","value":"partners"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uniqueClaimsForSubjectId"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"resourceIndicator"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceScopes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OidcClaimMappingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OidcClaimMapping"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"mappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"credentialClaim"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]} as unknown as DocumentNode<UpdateOidcClientClaimMappingsMutation, UpdateOidcClientClaimMappingsMutationVariables>;
export const DiscoveryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Discovery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"discovery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<DiscoveryQuery, DiscoveryQueryVariables>;
export const AuthorityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Authority"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authority"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AuthorityQuery, AuthorityQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Identity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"presentations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"issuances"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"asyncIssuanceRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const AsyncIssuanceRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AsyncIssuanceRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"asyncIssuanceRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"asyncIssuanceRequestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AsyncIssuanceRequestQuery, AsyncIssuanceRequestQueryVariables>;
export const CreatePartnerIdentityTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePartnerIdentityTest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePartnerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPartner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreatePartnerIdentityTestMutation, CreatePartnerIdentityTestMutationVariables>;
export const CreatePartnerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePartner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePartnerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPartner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PartnerFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartnerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Partner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"issuerId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<CreatePartnerMutation, CreatePartnerMutationVariables>;
export const UpdatePartnerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePartner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePartnerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePartner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PartnerFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartnerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Partner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"issuerId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<UpdatePartnerMutation, UpdatePartnerMutationVariables>;
export const SuspendPartnerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SuspendPartner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"suspendPartner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PartnerFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartnerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Partner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"issuerId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<SuspendPartnerMutation, SuspendPartnerMutationVariables>;
export const ResumePartnerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResumePartner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resumePartner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PartnerFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartnerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Partner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"issuerId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<ResumePartnerMutation, ResumePartnerMutationVariables>;
export const PartnerByDidDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PartnerByDid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"did"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"partnerByDid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"did"},"value":{"kind":"Variable","name":{"kind":"Name","value":"did"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PartnerFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartnerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Partner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"issuerId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}},{"kind":"Field","name":{"kind":"Name","value":"linkedDomainUrls"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedAt"}}]}}]} as unknown as DocumentNode<PartnerByDidQuery, PartnerByDidQueryVariables>;
export const CreatePhotoCaptureRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePhotoCaptureRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"request"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PhotoCaptureRequest"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPhotoCaptureRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"Variable","name":{"kind":"Name","value":"request"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"photoCaptureUrl"}},{"kind":"Field","name":{"kind":"Name","value":"photoCaptureQrCode"}}]}}]}}]} as unknown as DocumentNode<CreatePhotoCaptureRequestMutation, CreatePhotoCaptureRequestMutationVariables>;
export const CapturePhotoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CapturePhoto"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"photoCaptureRequestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"photo"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"capturePhoto"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"photoCaptureRequestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"photoCaptureRequestId"}}},{"kind":"Argument","name":{"kind":"Name","value":"photo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"photo"}}}]}]}}]} as unknown as DocumentNode<CapturePhotoMutation, CapturePhotoMutationVariables>;
export const PhotoCaptureStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PhotoCaptureStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"photoCaptureRequestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"photoCaptureStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"photoCaptureRequestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"photoCaptureRequestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<PhotoCaptureStatusQuery, PhotoCaptureStatusQueryVariables>;
export const GetTemplateParentDataQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTemplateParentDataQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"template"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateParentDataFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateParentDataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]}}]} as unknown as DocumentNode<GetTemplateParentDataQueryQuery, GetTemplateParentDataQueryQueryVariables>;
export const CreateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<CreateTemplateMutation, CreateTemplateMutationVariables>;
export const GetTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"template"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<GetTemplateQuery, GetTemplateQueryVariables>;
export const UpdateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TemplateFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TemplateFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Template"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"display"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"issuedBy"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"textColor"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"consent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"validityIntervalInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"credentialTypes"}}]}}]} as unknown as DocumentNode<UpdateTemplateMutation, UpdateTemplateMutationVariables>;
export const FindWalletsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindWallets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"WalletWhere"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findWallets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstUsed"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsed"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"presentations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<FindWalletsQuery, FindWalletsQueryVariables>;
export const CreatePartnerShieldTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePartnerShieldTest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePartnerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPartner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreatePartnerShieldTestMutation, CreatePartnerShieldTestMutationVariables>;


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
  AsyncIssuanceRequestResponse: ( AsyncIssuanceErrorResponse ) | ( AsyncIssuanceResponse );
  BackgroundJobEvent: ( BackgroundJobActiveEvent ) | ( BackgroundJobCompletedEvent ) | ( BackgroundJobErrorEvent ) | ( BackgroundJobProgressEvent );
  ClaimValidation: ( ListValidation ) | ( NumberValidation ) | ( RegexValidation ) | ( TextValidation );
  IssuanceRequestResponse: ( IssuanceResponse ) | ( RequestErrorResponse );
  MDocPresentationRequestResponse: ( MDocPresentationResponse ) | ( RequestErrorResponse );
  MDocProcessedResponseResult: ( MDocProcessedResponse ) | ( RequestErrorResponse );
  Me: ( IdentityEntity ) | ( UserEntity );
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
  AcquireLimitedPhotoCaptureTokenInput: AcquireLimitedPhotoCaptureTokenInput;
  ActionApprovalRequestInput: ActionApprovalRequestInput;
  ActionedApprovalData: ResolverTypeWrapper<ActionedApprovalData>;
  ActionedBy: ResolverTypeWrapper<ActionedBy>;
  AndroidPresentationRequest: ResolverTypeWrapper<AndroidPresentationRequest>;
  ApplePresentationRequest: ResolverTypeWrapper<ApplePresentationRequest>;
  ApplicationLabelConfig: ResolverTypeWrapper<ApplicationLabelConfigEntity>;
  ApplicationLabelConfigInput: ApplicationLabelConfigInput;
  ApprovalRequest: ResolverTypeWrapper<ApprovalRequestEntity>;
  ApprovalRequestInput: ApprovalRequestInput;
  ApprovalRequestPresentationInput: ApprovalRequestPresentationInput;
  ApprovalRequestResponse: ResolverTypeWrapper<ApprovalRequestResponse>;
  ApprovalRequestStatus: ApprovalRequestStatus;
  ApprovalRequestsOrderBy: ApprovalRequestsOrderBy;
  ApprovalRequestsWhere: ApprovalRequestsWhere;
  ApprovalTokenResponse: ResolverTypeWrapper<ApprovalTokenResponse>;
  AsyncIssuanceContact: ResolverTypeWrapper<AsyncIssuanceContact>;
  AsyncIssuanceContactInput: AsyncIssuanceContactInput;
  AsyncIssuanceErrorResponse: ResolverTypeWrapper<AsyncIssuanceErrorResponse>;
  AsyncIssuanceRequest: ResolverTypeWrapper<AsyncIssuanceEntity>;
  AsyncIssuanceRequestExpiry: AsyncIssuanceRequestExpiry;
  AsyncIssuanceRequestInput: AsyncIssuanceRequestInput;
  AsyncIssuanceRequestResponse: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['AsyncIssuanceRequestResponse']>;
  AsyncIssuanceRequestStatus: AsyncIssuanceRequestStatus;
  AsyncIssuanceRequestsOrderBy: AsyncIssuanceRequestsOrderBy;
  AsyncIssuanceRequestsWhere: AsyncIssuanceRequestsWhere;
  AsyncIssuanceResponse: ResolverTypeWrapper<AsyncIssuanceResponse>;
  AsyncIssuanceTokenResponse: ResolverTypeWrapper<AsyncIssuanceTokenResponse>;
  Authority: ResolverTypeWrapper<Authority>;
  AuthorityHosting: AuthorityHosting;
  BackgroundJobActiveEvent: ResolverTypeWrapper<BackgroundJobActiveEvent>;
  BackgroundJobCompletedEvent: ResolverTypeWrapper<BackgroundJobCompletedEvent>;
  BackgroundJobErrorEvent: ResolverTypeWrapper<BackgroundJobErrorEvent>;
  BackgroundJobEvent: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['BackgroundJobEvent']>;
  BackgroundJobEventData: ResolverTypeWrapper<Omit<BackgroundJobEventData, 'event' | 'user'> & { event: ResolversTypes['BackgroundJobEvent'], user?: Maybe<ResolversTypes['User']> }>;
  BackgroundJobEventWhere: BackgroundJobEventWhere;
  BackgroundJobProgressEvent: ResolverTypeWrapper<BackgroundJobProgressEvent>;
  BackgroundJobStatus: BackgroundJobStatus;
  Branding: ResolverTypeWrapper<BrandingEntity>;
  CacheControlScope: CacheControlScope;
  Callback: Callback;
  ClaimConstraint: ClaimConstraint;
  ClaimType: ClaimType;
  ClaimValidation: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ClaimValidation']>;
  ClaimValidationInput: ClaimValidationInput;
  ClientCredentialsInput: ClientCredentialsInput;
  Communication: ResolverTypeWrapper<CommunicationEntity>;
  CommunicationOrderBy: CommunicationOrderBy;
  CommunicationPurpose: CommunicationPurpose;
  CommunicationStatus: CommunicationStatus;
  CommunicationWhere: CommunicationWhere;
  ConciergeBrandingInput: ConciergeBrandingInput;
  ConciergeClientBrandingInput: ConciergeClientBrandingInput;
  ConfigurationValidation: ConfigurationValidation;
  ConstraintOperator: ConstraintOperator;
  Contact: ResolverTypeWrapper<Contact>;
  ContactInput: ContactInput;
  ContactMethod: ContactMethod;
  Contract: ResolverTypeWrapper<ContractEntity>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ContractAsyncIssuanceRequestsWhere: ContractAsyncIssuanceRequestsWhere;
  ContractCount: ResolverTypeWrapper<Omit<ContractCount, 'contract'> & { contract: ResolversTypes['Contract'] }>;
  ContractDisplayClaim: ResolverTypeWrapper<Omit<ContractDisplayClaim, 'validation'> & { validation?: Maybe<ResolversTypes['ClaimValidation']> }>;
  ContractDisplayClaimInput: ContractDisplayClaimInput;
  ContractDisplayConsent: ResolverTypeWrapper<ContractDisplayConsent>;
  ContractDisplayConsentInput: ContractDisplayConsentInput;
  ContractDisplayCredential: ResolverTypeWrapper<ContractDisplayCredential>;
  ContractDisplayCredentialInput: ContractDisplayCredentialInput;
  ContractDisplayCredentialLogo: ResolverTypeWrapper<ContractDisplayCredentialLogo>;
  ContractDisplayCredentialLogoInput: ContractDisplayCredentialLogoInput;
  ContractDisplayModel: ResolverTypeWrapper<Omit<ContractDisplayModel, 'claims'> & { claims: Array<ResolversTypes['ContractDisplayClaim']> }>;
  ContractDisplayModelInput: ContractDisplayModelInput;
  ContractImportInput: ContractImportInput;
  ContractInput: ContractInput;
  ContractIssuanceWeeklyAverageWhere: ContractIssuanceWeeklyAverageWhere;
  ContractIssuanceWhere: ContractIssuanceWhere;
  ContractOrderBy: ContractOrderBy;
  ContractPresentationWeeklyAverageWhere: ContractPresentationWeeklyAverageWhere;
  ContractPresentationWhere: ContractPresentationWhere;
  ContractWhere: ContractWhere;
  CorsOriginConfig: ResolverTypeWrapper<CorsOriginConfigEntity>;
  CorsOriginConfigInput: CorsOriginConfigInput;
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
  EmailSenderConfig: ResolverTypeWrapper<EmailSenderConfig>;
  EmailSenderConfigInput: EmailSenderConfigInput;
  FaceCheckPhotoSupport: FaceCheckPhotoSupport;
  FaceCheckResult: ResolverTypeWrapper<FaceCheckResult>;
  FaceCheckValidation: ResolverTypeWrapper<FaceCheckValidation>;
  FaceCheckValidationInput: FaceCheckValidationInput;
  FeatureUrls: ResolverTypeWrapper<FeatureUrls>;
  Features: ResolverTypeWrapper<Features>;
  GraphQLSecuritySettings: ResolverTypeWrapper<GraphQlSecuritySettings>;
  GraphQLSecuritySettingsInput: GraphQlSecuritySettingsInput;
  HexColorCode: ResolverTypeWrapper<Scalars['HexColorCode']['output']>;
  Identity: ResolverTypeWrapper<IdentityEntity>;
  IdentityAsyncIssuanceRequestsWhere: IdentityAsyncIssuanceRequestsWhere;
  IdentityInput: IdentityInput;
  IdentityIssuanceWhere: IdentityIssuanceWhere;
  IdentityIssuer: ResolverTypeWrapper<IdentityIssuer>;
  IdentityOrderBy: IdentityOrderBy;
  IdentityPresentationWhere: IdentityPresentationWhere;
  IdentityStore: ResolverTypeWrapper<IdentityStoreEntity>;
  IdentityStoreInput: IdentityStoreInput;
  IdentityStoreOrderBy: IdentityStoreOrderBy;
  IdentityStoreType: IdentityStoreType;
  IdentityStoreWhere: IdentityStoreWhere;
  IdentityWhere: IdentityWhere;
  ImportInput: ImportInput;
  Instance: ResolverTypeWrapper<Instance>;
  InstanceConfiguration: ResolverTypeWrapper<InstanceConfiguration>;
  InstanceConfigurationInput: InstanceConfigurationInput;
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
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  JSONObject: ResolverTypeWrapper<Scalars['JSONObject']['output']>;
  ListValidation: ResolverTypeWrapper<ListValidation>;
  ListValidationInput: ListValidationInput;
  Locale: ResolverTypeWrapper<Scalars['Locale']['output']>;
  MDocCertificateValidation: ResolverTypeWrapper<MDocCertificateValidation>;
  MDocCertificateValidity: ResolverTypeWrapper<MDocCertificateValidity>;
  MDocClaim: ResolverTypeWrapper<MDocClaim>;
  MDocClaimPathInput: MDocClaimPathInput;
  MDocDiagnostics: ResolverTypeWrapper<MDocDiagnostics>;
  MDocDigestValidation: ResolverTypeWrapper<MDocDigestValidation>;
  MDocDocument: ResolverTypeWrapper<MDocDocument>;
  MDocDocumentValidation: ResolverTypeWrapper<MDocDocumentValidation>;
  MDocMsoValidityInfo: ResolverTypeWrapper<MDocMsoValidityInfo>;
  MDocNamespace: ResolverTypeWrapper<MDocNamespace>;
  MDocPlatform: MDocPlatform;
  MDocPresentationRequestInput: MDocPresentationRequestInput;
  MDocPresentationRequestResponse: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['MDocPresentationRequestResponse']>;
  MDocPresentationResponse: ResolverTypeWrapper<MDocPresentationResponse>;
  MDocPresentationResponseInput: MDocPresentationResponseInput;
  MDocProcessedResponse: ResolverTypeWrapper<MDocProcessedResponse>;
  MDocProcessedResponseResult: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['MDocProcessedResponseResult']>;
  MDocRequestSigningInput: MDocRequestSigningInput;
  MDocValidationResults: ResolverTypeWrapper<MDocValidationResults>;
  Me: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['Me']>;
  MsGraphFailure: ResolverTypeWrapper<MsGraphFailure>;
  Mutation: ResolverTypeWrapper<{}>;
  NetworkContract: ResolverTypeWrapper<NetworkContract>;
  NetworkIssuer: ResolverTypeWrapper<NetworkIssuer>;
  NetworkIssuersWhere: NetworkIssuersWhere;
  NonNegativeInt: ResolverTypeWrapper<Scalars['NonNegativeInt']['output']>;
  NumberValidation: ResolverTypeWrapper<NumberValidation>;
  NumberValidationInput: NumberValidationInput;
  OidcApplicationType: OidcApplicationType;
  OidcClaimMapping: ResolverTypeWrapper<OidcClaimMappingEntity>;
  OidcClaimMappingInput: OidcClaimMappingInput;
  OidcClaimMappingOrderBy: OidcClaimMappingOrderBy;
  OidcClaimMappingWhere: OidcClaimMappingWhere;
  OidcClient: ResolverTypeWrapper<OidcClientEntity>;
  OidcClientInput: OidcClientInput;
  OidcClientOrderBy: OidcClientOrderBy;
  OidcClientPresentationWhere: OidcClientPresentationWhere;
  OidcClientResource: ResolverTypeWrapper<OidcClientResourceEntity>;
  OidcClientResourceInput: OidcClientResourceInput;
  OidcClientType: OidcClientType;
  OidcClientWhere: OidcClientWhere;
  OidcResource: ResolverTypeWrapper<OidcResourceEntity>;
  OidcResourceInput: OidcResourceInput;
  OidcResourceOrderBy: OidcResourceOrderBy;
  OidcResourceWhere: OidcResourceWhere;
  OrderDirection: OrderDirection;
  Partner: ResolverTypeWrapper<PartnerEntity>;
  PartnerOrderBy: PartnerOrderBy;
  PartnerPresentationWhere: PartnerPresentationWhere;
  PartnerWhere: PartnerWhere;
  PhotoCaptureEventData: ResolverTypeWrapper<PhotoCaptureEventData>;
  PhotoCaptureRequest: PhotoCaptureRequest;
  PhotoCaptureRequestResponse: ResolverTypeWrapper<PhotoCaptureRequestResponse>;
  PhotoCaptureStatus: PhotoCaptureStatus;
  PhotoCaptureTokenResponse: ResolverTypeWrapper<PhotoCaptureTokenResponse>;
  Pin: Pin;
  PositiveFloat: ResolverTypeWrapper<Scalars['PositiveFloat']['output']>;
  PositiveInt: ResolverTypeWrapper<Scalars['PositiveInt']['output']>;
  Presentation: ResolverTypeWrapper<PresentationEntity>;
  PresentationCallbackEvent: ResolverTypeWrapper<PresentationCallbackEvent>;
  PresentationEvent: ResolverTypeWrapper<PresentationEvent>;
  PresentationEventData: ResolverTypeWrapper<Omit<PresentationEventData, 'presentation'> & { presentation?: Maybe<ResolversTypes['Presentation']> }>;
  PresentationEventWhere: PresentationEventWhere;
  PresentationOrderBy: PresentationOrderBy;
  PresentationReceiptInput: PresentationReceiptInput;
  PresentationRequestInput: PresentationRequestInput;
  PresentationRequestRegistration: PresentationRequestRegistration;
  PresentationRequestResponse: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['PresentationRequestResponse']>;
  PresentationRequestStatus: PresentationRequestStatus;
  PresentationResponse: ResolverTypeWrapper<PresentationResponse>;
  PresentationWhere: PresentationWhere;
  PresentedCredential: ResolverTypeWrapper<PresentedCredential>;
  Query: ResolverTypeWrapper<{}>;
  RegexValidation: ResolverTypeWrapper<RegexValidation>;
  RegexValidationInput: RegexValidationInput;
  RequestConfiguration: RequestConfiguration;
  RequestConfigurationValidation: ResolverTypeWrapper<RequestConfigurationValidation>;
  RequestCredential: RequestCredential;
  RequestError: ResolverTypeWrapper<RequestError>;
  RequestErrorResponse: ResolverTypeWrapper<RequestErrorResponse>;
  RequestErrorWithInner: ResolverTypeWrapper<RequestErrorWithInner>;
  RequestInnerError: ResolverTypeWrapper<RequestInnerError>;
  RequestedClaimConstraint: ResolverTypeWrapper<RequestedClaimConstraint>;
  RequestedConfiguration: ResolverTypeWrapper<RequestedConfiguration>;
  RequestedCredential: ResolverTypeWrapper<RequestedCredential>;
  RequestedCredentialSpecificationInput: RequestedCredentialSpecificationInput;
  ScopedClaimMapping: ResolverTypeWrapper<ScopedClaimMapping>;
  ScopedClaimMappingInput: ScopedClaimMappingInput;
  SendAsyncIssuanceVerificationResponse: ResolverTypeWrapper<SendAsyncIssuanceVerificationResponse>;
  ServiceFailures: ResolverTypeWrapper<ServiceFailures>;
  Subscription: ResolverTypeWrapper<{}>;
  Template: ResolverTypeWrapper<TemplateEntity>;
  TemplateDisplayClaim: ResolverTypeWrapper<Omit<TemplateDisplayClaim, 'validation'> & { validation?: Maybe<ResolversTypes['ClaimValidation']> }>;
  TemplateDisplayConsent: ResolverTypeWrapper<TemplateDisplayConsent>;
  TemplateDisplayCredential: ResolverTypeWrapper<TemplateDisplayCredential>;
  TemplateDisplayCredentialLogo: ResolverTypeWrapper<TemplateDisplayCredentialLogo>;
  TemplateDisplayModel: ResolverTypeWrapper<Omit<TemplateDisplayModel, 'claims'> & { claims?: Maybe<Array<ResolversTypes['TemplateDisplayClaim']>> }>;
  TemplateImportInput: TemplateImportInput;
  TemplateInput: TemplateInput;
  TemplateParentData: ResolverTypeWrapper<Omit<TemplateParentData, 'display'> & { display?: Maybe<ResolversTypes['TemplateDisplayModel']> }>;
  TemplateWhere: TemplateWhere;
  TenantIdentity: ResolverTypeWrapper<TenantIdentity>;
  TenantIdentityWhere: TenantIdentityWhere;
  TextValidation: ResolverTypeWrapper<TextValidation>;
  TextValidationInput: TextValidationInput;
  URL: ResolverTypeWrapper<Scalars['URL']['output']>;
  UUID: ResolverTypeWrapper<Scalars['UUID']['output']>;
  UpdateApprovalRequestInput: UpdateApprovalRequestInput;
  UpdateIdentityStoreInput: UpdateIdentityStoreInput;
  UpdatePartnerInput: UpdatePartnerInput;
  User: ResolverTypeWrapper<UserEntity>;
  UserCount: ResolverTypeWrapper<Omit<UserCount, 'user'> & { user: ResolversTypes['User'] }>;
  UserIssuanceWhere: UserIssuanceWhere;
  UserOrderBy: UserOrderBy;
  UserPresentationWhere: UserPresentationWhere;
  UserWhere: UserWhere;
  VerifyPresentationResult: ResolverTypeWrapper<VerifyPresentationResult>;
  Void: ResolverTypeWrapper<Scalars['Void']['output']>;
  Wallet: ResolverTypeWrapper<WalletEntity>;
  WalletPresentationWhere: WalletPresentationWhere;
  WalletWhere: WalletWhere;
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
  AcquireLimitedPhotoCaptureTokenInput: AcquireLimitedPhotoCaptureTokenInput;
  ActionApprovalRequestInput: ActionApprovalRequestInput;
  ActionedApprovalData: ActionedApprovalData;
  ActionedBy: ActionedBy;
  AndroidPresentationRequest: AndroidPresentationRequest;
  ApplePresentationRequest: ApplePresentationRequest;
  ApplicationLabelConfig: ApplicationLabelConfigEntity;
  ApplicationLabelConfigInput: ApplicationLabelConfigInput;
  ApprovalRequest: ApprovalRequestEntity;
  ApprovalRequestInput: ApprovalRequestInput;
  ApprovalRequestPresentationInput: ApprovalRequestPresentationInput;
  ApprovalRequestResponse: ApprovalRequestResponse;
  ApprovalRequestsWhere: ApprovalRequestsWhere;
  ApprovalTokenResponse: ApprovalTokenResponse;
  AsyncIssuanceContact: AsyncIssuanceContact;
  AsyncIssuanceContactInput: AsyncIssuanceContactInput;
  AsyncIssuanceErrorResponse: AsyncIssuanceErrorResponse;
  AsyncIssuanceRequest: AsyncIssuanceEntity;
  AsyncIssuanceRequestInput: AsyncIssuanceRequestInput;
  AsyncIssuanceRequestResponse: ResolversUnionTypes<ResolversParentTypes>['AsyncIssuanceRequestResponse'];
  AsyncIssuanceRequestsWhere: AsyncIssuanceRequestsWhere;
  AsyncIssuanceResponse: AsyncIssuanceResponse;
  AsyncIssuanceTokenResponse: AsyncIssuanceTokenResponse;
  Authority: Authority;
  BackgroundJobActiveEvent: BackgroundJobActiveEvent;
  BackgroundJobCompletedEvent: BackgroundJobCompletedEvent;
  BackgroundJobErrorEvent: BackgroundJobErrorEvent;
  BackgroundJobEvent: ResolversUnionTypes<ResolversParentTypes>['BackgroundJobEvent'];
  BackgroundJobEventData: Omit<BackgroundJobEventData, 'event' | 'user'> & { event: ResolversParentTypes['BackgroundJobEvent'], user?: Maybe<ResolversParentTypes['User']> };
  BackgroundJobEventWhere: BackgroundJobEventWhere;
  BackgroundJobProgressEvent: BackgroundJobProgressEvent;
  Branding: BrandingEntity;
  Callback: Callback;
  ClaimConstraint: ClaimConstraint;
  ClaimValidation: ResolversUnionTypes<ResolversParentTypes>['ClaimValidation'];
  ClaimValidationInput: ClaimValidationInput;
  ClientCredentialsInput: ClientCredentialsInput;
  Communication: CommunicationEntity;
  CommunicationWhere: CommunicationWhere;
  ConciergeBrandingInput: ConciergeBrandingInput;
  ConciergeClientBrandingInput: ConciergeClientBrandingInput;
  ConfigurationValidation: ConfigurationValidation;
  Contact: Contact;
  ContactInput: ContactInput;
  Contract: ContractEntity;
  Int: Scalars['Int']['output'];
  Float: Scalars['Float']['output'];
  ContractAsyncIssuanceRequestsWhere: ContractAsyncIssuanceRequestsWhere;
  ContractCount: Omit<ContractCount, 'contract'> & { contract: ResolversParentTypes['Contract'] };
  ContractDisplayClaim: Omit<ContractDisplayClaim, 'validation'> & { validation?: Maybe<ResolversParentTypes['ClaimValidation']> };
  ContractDisplayClaimInput: ContractDisplayClaimInput;
  ContractDisplayConsent: ContractDisplayConsent;
  ContractDisplayConsentInput: ContractDisplayConsentInput;
  ContractDisplayCredential: ContractDisplayCredential;
  ContractDisplayCredentialInput: ContractDisplayCredentialInput;
  ContractDisplayCredentialLogo: ContractDisplayCredentialLogo;
  ContractDisplayCredentialLogoInput: ContractDisplayCredentialLogoInput;
  ContractDisplayModel: Omit<ContractDisplayModel, 'claims'> & { claims: Array<ResolversParentTypes['ContractDisplayClaim']> };
  ContractDisplayModelInput: ContractDisplayModelInput;
  ContractImportInput: ContractImportInput;
  ContractInput: ContractInput;
  ContractIssuanceWeeklyAverageWhere: ContractIssuanceWeeklyAverageWhere;
  ContractIssuanceWhere: ContractIssuanceWhere;
  ContractPresentationWeeklyAverageWhere: ContractPresentationWeeklyAverageWhere;
  ContractPresentationWhere: ContractPresentationWhere;
  ContractWhere: ContractWhere;
  CorsOriginConfig: CorsOriginConfigEntity;
  CorsOriginConfigInput: CorsOriginConfigInput;
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
  EmailSenderConfig: EmailSenderConfig;
  EmailSenderConfigInput: EmailSenderConfigInput;
  FaceCheckResult: FaceCheckResult;
  FaceCheckValidation: FaceCheckValidation;
  FaceCheckValidationInput: FaceCheckValidationInput;
  FeatureUrls: FeatureUrls;
  Features: Features;
  GraphQLSecuritySettings: GraphQlSecuritySettings;
  GraphQLSecuritySettingsInput: GraphQlSecuritySettingsInput;
  HexColorCode: Scalars['HexColorCode']['output'];
  Identity: IdentityEntity;
  IdentityAsyncIssuanceRequestsWhere: IdentityAsyncIssuanceRequestsWhere;
  IdentityInput: IdentityInput;
  IdentityIssuanceWhere: IdentityIssuanceWhere;
  IdentityIssuer: IdentityIssuer;
  IdentityPresentationWhere: IdentityPresentationWhere;
  IdentityStore: IdentityStoreEntity;
  IdentityStoreInput: IdentityStoreInput;
  IdentityStoreWhere: IdentityStoreWhere;
  IdentityWhere: IdentityWhere;
  ImportInput: ImportInput;
  Instance: Instance;
  InstanceConfiguration: InstanceConfiguration;
  InstanceConfigurationInput: InstanceConfigurationInput;
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
  JSON: Scalars['JSON']['output'];
  JSONObject: Scalars['JSONObject']['output'];
  ListValidation: ListValidation;
  ListValidationInput: ListValidationInput;
  Locale: Scalars['Locale']['output'];
  MDocCertificateValidation: MDocCertificateValidation;
  MDocCertificateValidity: MDocCertificateValidity;
  MDocClaim: MDocClaim;
  MDocClaimPathInput: MDocClaimPathInput;
  MDocDiagnostics: MDocDiagnostics;
  MDocDigestValidation: MDocDigestValidation;
  MDocDocument: MDocDocument;
  MDocDocumentValidation: MDocDocumentValidation;
  MDocMsoValidityInfo: MDocMsoValidityInfo;
  MDocNamespace: MDocNamespace;
  MDocPresentationRequestInput: MDocPresentationRequestInput;
  MDocPresentationRequestResponse: ResolversUnionTypes<ResolversParentTypes>['MDocPresentationRequestResponse'];
  MDocPresentationResponse: MDocPresentationResponse;
  MDocPresentationResponseInput: MDocPresentationResponseInput;
  MDocProcessedResponse: MDocProcessedResponse;
  MDocProcessedResponseResult: ResolversUnionTypes<ResolversParentTypes>['MDocProcessedResponseResult'];
  MDocRequestSigningInput: MDocRequestSigningInput;
  MDocValidationResults: MDocValidationResults;
  Me: ResolversUnionTypes<ResolversParentTypes>['Me'];
  MsGraphFailure: MsGraphFailure;
  Mutation: {};
  NetworkContract: NetworkContract;
  NetworkIssuer: NetworkIssuer;
  NetworkIssuersWhere: NetworkIssuersWhere;
  NonNegativeInt: Scalars['NonNegativeInt']['output'];
  NumberValidation: NumberValidation;
  NumberValidationInput: NumberValidationInput;
  OidcClaimMapping: OidcClaimMappingEntity;
  OidcClaimMappingInput: OidcClaimMappingInput;
  OidcClaimMappingWhere: OidcClaimMappingWhere;
  OidcClient: OidcClientEntity;
  OidcClientInput: OidcClientInput;
  OidcClientPresentationWhere: OidcClientPresentationWhere;
  OidcClientResource: OidcClientResourceEntity;
  OidcClientResourceInput: OidcClientResourceInput;
  OidcClientWhere: OidcClientWhere;
  OidcResource: OidcResourceEntity;
  OidcResourceInput: OidcResourceInput;
  OidcResourceWhere: OidcResourceWhere;
  Partner: PartnerEntity;
  PartnerPresentationWhere: PartnerPresentationWhere;
  PartnerWhere: PartnerWhere;
  PhotoCaptureEventData: PhotoCaptureEventData;
  PhotoCaptureRequest: PhotoCaptureRequest;
  PhotoCaptureRequestResponse: PhotoCaptureRequestResponse;
  PhotoCaptureTokenResponse: PhotoCaptureTokenResponse;
  Pin: Pin;
  PositiveFloat: Scalars['PositiveFloat']['output'];
  PositiveInt: Scalars['PositiveInt']['output'];
  Presentation: PresentationEntity;
  PresentationCallbackEvent: PresentationCallbackEvent;
  PresentationEvent: PresentationEvent;
  PresentationEventData: Omit<PresentationEventData, 'presentation'> & { presentation?: Maybe<ResolversParentTypes['Presentation']> };
  PresentationEventWhere: PresentationEventWhere;
  PresentationReceiptInput: PresentationReceiptInput;
  PresentationRequestInput: PresentationRequestInput;
  PresentationRequestRegistration: PresentationRequestRegistration;
  PresentationRequestResponse: ResolversUnionTypes<ResolversParentTypes>['PresentationRequestResponse'];
  PresentationResponse: PresentationResponse;
  PresentationWhere: PresentationWhere;
  PresentedCredential: PresentedCredential;
  Query: {};
  RegexValidation: RegexValidation;
  RegexValidationInput: RegexValidationInput;
  RequestConfiguration: RequestConfiguration;
  RequestConfigurationValidation: RequestConfigurationValidation;
  RequestCredential: RequestCredential;
  RequestError: RequestError;
  RequestErrorResponse: RequestErrorResponse;
  RequestErrorWithInner: RequestErrorWithInner;
  RequestInnerError: RequestInnerError;
  RequestedClaimConstraint: RequestedClaimConstraint;
  RequestedConfiguration: RequestedConfiguration;
  RequestedCredential: RequestedCredential;
  RequestedCredentialSpecificationInput: RequestedCredentialSpecificationInput;
  ScopedClaimMapping: ScopedClaimMapping;
  ScopedClaimMappingInput: ScopedClaimMappingInput;
  SendAsyncIssuanceVerificationResponse: SendAsyncIssuanceVerificationResponse;
  ServiceFailures: ServiceFailures;
  Subscription: {};
  Template: TemplateEntity;
  TemplateDisplayClaim: Omit<TemplateDisplayClaim, 'validation'> & { validation?: Maybe<ResolversParentTypes['ClaimValidation']> };
  TemplateDisplayConsent: TemplateDisplayConsent;
  TemplateDisplayCredential: TemplateDisplayCredential;
  TemplateDisplayCredentialLogo: TemplateDisplayCredentialLogo;
  TemplateDisplayModel: Omit<TemplateDisplayModel, 'claims'> & { claims?: Maybe<Array<ResolversParentTypes['TemplateDisplayClaim']>> };
  TemplateImportInput: TemplateImportInput;
  TemplateInput: TemplateInput;
  TemplateParentData: Omit<TemplateParentData, 'display'> & { display?: Maybe<ResolversParentTypes['TemplateDisplayModel']> };
  TemplateWhere: TemplateWhere;
  TenantIdentity: TenantIdentity;
  TenantIdentityWhere: TenantIdentityWhere;
  TextValidation: TextValidation;
  TextValidationInput: TextValidationInput;
  URL: Scalars['URL']['output'];
  UUID: Scalars['UUID']['output'];
  UpdateApprovalRequestInput: UpdateApprovalRequestInput;
  UpdateIdentityStoreInput: UpdateIdentityStoreInput;
  UpdatePartnerInput: UpdatePartnerInput;
  User: UserEntity;
  UserCount: Omit<UserCount, 'user'> & { user: ResolversParentTypes['User'] };
  UserIssuanceWhere: UserIssuanceWhere;
  UserPresentationWhere: UserPresentationWhere;
  UserWhere: UserWhere;
  VerifyPresentationResult: VerifyPresentationResult;
  Void: Scalars['Void']['output'];
  Wallet: WalletEntity;
  WalletPresentationWhere: WalletPresentationWhere;
  WalletWhere: WalletWhere;
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
  requestData?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ApprovalRequestStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActionedByResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ActionedBy'] = ResolversParentTypes['ActionedBy']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AndroidPresentationRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AndroidPresentationRequest'] = ResolversParentTypes['AndroidPresentationRequest']> = {
  openId4VpProtocol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  openId4VpRequest?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ApplePresentationRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ApplePresentationRequest'] = ResolversParentTypes['ApplePresentationRequest']> = {
  deviceRequest?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  encryptionInfo?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ApplicationLabelConfigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ApplicationLabelConfig'] = ResolversParentTypes['ApplicationLabelConfig']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  identifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export type AsyncIssuanceContactResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AsyncIssuanceContact'] = ResolversParentTypes['AsyncIssuanceContact']> = {
  notification?: Resolver<Maybe<ResolversTypes['Contact']>, ParentType, ContextType>;
  verification?: Resolver<Maybe<ResolversTypes['Contact']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AsyncIssuanceErrorResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AsyncIssuanceErrorResponse'] = ResolversParentTypes['AsyncIssuanceErrorResponse']> = {
  errors?: Resolver<Array<Maybe<ResolversTypes['String']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AsyncIssuanceRequestResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AsyncIssuanceRequest'] = ResolversParentTypes['AsyncIssuanceRequest']> = {
  communications?: Resolver<Array<ResolversTypes['Communication']>, ParentType, ContextType, Partial<AsyncIssuanceRequestCommunicationsArgs>>;
  contract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  expiresOn?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  expiry?: Resolver<ResolversTypes['AsyncIssuanceRequestExpiry'], ParentType, ContextType>;
  failureReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasContactNotificationSet?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  hasContactVerificationSet?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>;
  isStatusFinal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  issuance?: Resolver<Maybe<ResolversTypes['Issuance']>, ParentType, ContextType>;
  photoCapture?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AsyncIssuanceRequestStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AsyncIssuanceRequestResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AsyncIssuanceRequestResponse'] = ResolversParentTypes['AsyncIssuanceRequestResponse']> = {
  __resolveType: TypeResolveFn<'AsyncIssuanceErrorResponse' | 'AsyncIssuanceResponse', ParentType, ContextType>;
};

export type AsyncIssuanceResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AsyncIssuanceResponse'] = ResolversParentTypes['AsyncIssuanceResponse']> = {
  asyncIssuanceRequestIds?: Resolver<Array<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AsyncIssuanceTokenResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AsyncIssuanceTokenResponse'] = ResolversParentTypes['AsyncIssuanceTokenResponse']> = {
  expires?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  photoCaptureRequestId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type BrandingResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Branding'] = ResolversParentTypes['Branding']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  data?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ClaimValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ClaimValidation'] = ResolversParentTypes['ClaimValidation']> = {
  __resolveType: TypeResolveFn<'ListValidation' | 'NumberValidation' | 'RegexValidation' | 'TextValidation', ParentType, ContextType>;
};

export type CommunicationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Communication'] = ResolversParentTypes['Communication']> = {
  contactMethod?: Resolver<ResolversTypes['ContactMethod'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  purpose?: Resolver<ResolversTypes['CommunicationPurpose'], ParentType, ContextType>;
  recipient?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>;
  sentAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContactResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Contact'] = ResolversParentTypes['Contact']> = {
  method?: Resolver<ResolversTypes['ContactMethod'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContractResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Contract'] = ResolversParentTypes['Contract']> = {
  asyncIssuanceRequests?: Resolver<Array<ResolversTypes['AsyncIssuanceRequest']>, ParentType, ContextType, RequireFields<ContractAsyncIssuanceRequestsArgs, 'limit'>>;
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
  issuances?: Resolver<Array<ResolversTypes['Issuance']>, ParentType, ContextType, RequireFields<ContractIssuancesArgs, 'limit'>>;
  lastProvisionedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  lastProvisionedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  manifestUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presentationWeeklyAverage?: Resolver<ResolversTypes['Float'], ParentType, ContextType, RequireFields<ContractPresentationWeeklyAverageArgs, 'where'>>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, RequireFields<ContractPresentationsArgs, 'limit'>>;
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
  isFixed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isOptional?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ClaimType'], ParentType, ContextType>;
  validation?: Resolver<Maybe<ResolversTypes['ClaimValidation']>, ParentType, ContextType>;
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

export type CorsOriginConfigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CorsOriginConfig'] = ResolversParentTypes['CorsOriginConfig']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DiscoveryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Discovery'] = ResolversParentTypes['Discovery']> = {
  features?: Resolver<ResolversTypes['Features'], ParentType, ContextType>;
  serviceFailures?: Resolver<ResolversTypes['ServiceFailures'], ParentType, ContextType>;
  urls?: Resolver<ResolversTypes['FeatureUrls'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface EmailAddressScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['EmailAddress'], any> {
  name: 'EmailAddress';
}

export type EmailSenderConfigResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EmailSenderConfig'] = ResolversParentTypes['EmailSenderConfig']> = {
  senderEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  senderName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FaceCheckResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FaceCheckResult'] = ResolversParentTypes['FaceCheckResult']> = {
  matchConfidenceScore?: Resolver<ResolversTypes['PositiveFloat'], ParentType, ContextType>;
  sourcePhotoQuality?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FaceCheckValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FaceCheckValidation'] = ResolversParentTypes['FaceCheckValidation']> = {
  matchConfidenceThreshold?: Resolver<Maybe<ResolversTypes['PositiveInt']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FeatureUrlsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FeatureUrls'] = ResolversParentTypes['FeatureUrls']> = {
  docsUrl?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  oidcAuthorityUrl?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  portalUrl?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FeaturesResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Features'] = ResolversParentTypes['Features']> = {
  demoEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  devToolsEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  faceCheckEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  findTenantIdentities?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  oidcEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GraphQlSecuritySettingsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GraphQLSecuritySettings'] = ResolversParentTypes['GraphQLSecuritySettings']> = {
  maxAliases?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  maxDepth?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  maxDirectives?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  maxTokens?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface HexColorCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['HexColorCode'], any> {
  name: 'HexColorCode';
}

export type IdentityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Identity'] = ResolversParentTypes['Identity']> = {
  asyncIssuanceRequests?: Resolver<Array<ResolversTypes['AsyncIssuanceRequest']>, ParentType, ContextType, RequireFields<IdentityAsyncIssuanceRequestsArgs, 'limit'>>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  identifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  identityStoreId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isDeletable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  issuanceCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  issuances?: Resolver<Array<ResolversTypes['Issuance']>, ParentType, ContextType, RequireFields<IdentityIssuancesArgs, 'limit'>>;
  issuer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  issuerLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, RequireFields<IdentityPresentationsArgs, 'limit'>>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IdentityIssuerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['IdentityIssuer'] = ResolversParentTypes['IdentityIssuer']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IdentityStoreResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['IdentityStore'] = ResolversParentTypes['IdentityStore']> = {
  clientId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  identifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isAuthenticationEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  suspendedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['IdentityStoreType'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InstanceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Instance'] = ResolversParentTypes['Instance']> = {
  authorityHosting?: Resolver<ResolversTypes['AuthorityHosting'], ParentType, ContextType>;
  configuration?: Resolver<Maybe<ResolversTypes['InstanceConfiguration']>, ParentType, ContextType>;
  identifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InstanceConfigurationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['InstanceConfiguration'] = ResolversParentTypes['InstanceConfiguration']> = {
  additionalAuthTenantIds?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  appOidLabels?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  corsOrigins?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  graphQLSecuritySettings?: Resolver<Maybe<ResolversTypes['GraphQLSecuritySettings']>, ParentType, ContextType>;
  identityIssuerLabels?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
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
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, RequireFields<IssuancePresentationsArgs, 'limit'>>;
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
  postIssuanceRedirectUrl?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  qrCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSONObject'], any> {
  name: 'JSONObject';
}

export type ListValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ListValidation'] = ResolversParentTypes['ListValidation']> = {
  values?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface LocaleScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Locale'], any> {
  name: 'Locale';
}

export type MDocCertificateValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocCertificateValidation'] = ResolversParentTypes['MDocCertificateValidation']> = {
  isValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  issuer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serialNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  validity?: Resolver<ResolversTypes['MDocCertificateValidity'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocCertificateValidityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocCertificateValidity'] = ResolversParentTypes['MDocCertificateValidity']> = {
  notAfter?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  notBefore?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocClaimResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocClaim'] = ResolversParentTypes['MDocClaim']> = {
  elementIdentifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  elementValue?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocDiagnosticsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocDiagnostics'] = ResolversParentTypes['MDocDiagnostics']> = {
  deviceResponse?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  response?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  validation?: Resolver<ResolversTypes['MDocValidationResults'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocDigestValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocDigestValidation'] = ResolversParentTypes['MDocDigestValidation']> = {
  digestID?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  elementIdentifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  namespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocDocumentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocDocument'] = ResolversParentTypes['MDocDocument']> = {
  docType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespaces?: Resolver<Array<ResolversTypes['MDocNamespace']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocDocumentValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocDocumentValidation'] = ResolversParentTypes['MDocDocumentValidation']> = {
  certificate?: Resolver<ResolversTypes['MDocCertificateValidation'], ParentType, ContextType>;
  digestAlgorithm?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  digestValidations?: Resolver<Array<ResolversTypes['MDocDigestValidation']>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docTypeMatches?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isWithinValidityPeriod?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  msoValidityInfo?: Resolver<ResolversTypes['MDocMsoValidityInfo'], ParentType, ContextType>;
  receivedDocType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestedDocType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  signatureVerified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocMsoValidityInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocMsoValidityInfo'] = ResolversParentTypes['MDocMsoValidityInfo']> = {
  expectedUpdate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  signed?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  validFrom?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  validUntil?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocNamespaceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocNamespace'] = ResolversParentTypes['MDocNamespace']> = {
  claims?: Resolver<Array<ResolversTypes['MDocClaim']>, ParentType, ContextType>;
  namespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocPresentationRequestResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocPresentationRequestResponse'] = ResolversParentTypes['MDocPresentationRequestResponse']> = {
  __resolveType: TypeResolveFn<'MDocPresentationResponse' | 'RequestErrorResponse', ParentType, ContextType>;
};

export type MDocPresentationResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocPresentationResponse'] = ResolversParentTypes['MDocPresentationResponse']> = {
  androidRequest?: Resolver<ResolversTypes['AndroidPresentationRequest'], ParentType, ContextType>;
  appleRequest?: Resolver<ResolversTypes['ApplePresentationRequest'], ParentType, ContextType>;
  expiry?: Resolver<ResolversTypes['PositiveInt'], ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocProcessedResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocProcessedResponse'] = ResolversParentTypes['MDocProcessedResponse']> = {
  diagnostics?: Resolver<Maybe<ResolversTypes['MDocDiagnostics']>, ParentType, ContextType>;
  documents?: Resolver<Array<ResolversTypes['MDocDocument']>, ParentType, ContextType>;
  identityId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  platform?: Resolver<ResolversTypes['MDocPlatform'], ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MDocProcessedResponseResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocProcessedResponseResult'] = ResolversParentTypes['MDocProcessedResponseResult']> = {
  __resolveType: TypeResolveFn<'MDocProcessedResponse' | 'RequestErrorResponse', ParentType, ContextType>;
};

export type MDocValidationResultsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MDocValidationResults'] = ResolversParentTypes['MDocValidationResults']> = {
  decryptedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  documents?: Resolver<Array<ResolversTypes['MDocDocumentValidation']>, ParentType, ContextType>;
  isValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  validatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Me'] = ResolversParentTypes['Me']> = {
  __resolveType: TypeResolveFn<'Identity' | 'User', ParentType, ContextType>;
};

export type MsGraphFailureResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MsGraphFailure'] = ResolversParentTypes['MsGraphFailure']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  identityStoreId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  acquireAsyncIssuanceToken?: Resolver<ResolversTypes['AsyncIssuanceTokenResponse'], ParentType, ContextType, RequireFields<MutationAcquireAsyncIssuanceTokenArgs, 'asyncIssuanceRequestId' | 'verificationCode'>>;
  acquireLimitedAccessToken?: Resolver<ResolversTypes['AccessTokenResponse'], ParentType, ContextType, RequireFields<MutationAcquireLimitedAccessTokenArgs, 'input'>>;
  acquireLimitedApprovalToken?: Resolver<ResolversTypes['ApprovalTokenResponse'], ParentType, ContextType, RequireFields<MutationAcquireLimitedApprovalTokenArgs, 'input'>>;
  acquireLimitedPhotoCaptureToken?: Resolver<ResolversTypes['PhotoCaptureTokenResponse'], ParentType, ContextType, RequireFields<MutationAcquireLimitedPhotoCaptureTokenArgs, 'input'>>;
  actionApprovalRequest?: Resolver<ResolversTypes['ApprovalRequest'], ParentType, ContextType, RequireFields<MutationActionApprovalRequestArgs, 'id' | 'input'>>;
  cancelApprovalRequest?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<MutationCancelApprovalRequestArgs, 'id'>>;
  cancelAsyncIssuanceRequest?: Resolver<Maybe<ResolversTypes['AsyncIssuanceRequest']>, ParentType, ContextType, RequireFields<MutationCancelAsyncIssuanceRequestArgs, 'asyncIssuanceRequestId'>>;
  cancelAsyncIssuanceRequests?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationCancelAsyncIssuanceRequestsArgs, 'asyncIssuanceRequestIds'>>;
  capturePhoto?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<MutationCapturePhotoArgs, 'photo' | 'photoCaptureRequestId'>>;
  createApprovalRequest?: Resolver<ResolversTypes['ApprovalRequestResponse'], ParentType, ContextType, RequireFields<MutationCreateApprovalRequestArgs, 'request'>>;
  createAsyncIssuanceRequest?: Resolver<ResolversTypes['AsyncIssuanceRequestResponse'], ParentType, ContextType, RequireFields<MutationCreateAsyncIssuanceRequestArgs, 'request'>>;
  createContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationCreateContractArgs, 'input'>>;
  createIdentityStore?: Resolver<ResolversTypes['IdentityStore'], ParentType, ContextType, RequireFields<MutationCreateIdentityStoreArgs, 'input'>>;
  createIssuanceRequest?: Resolver<ResolversTypes['IssuanceRequestResponse'], ParentType, ContextType, RequireFields<MutationCreateIssuanceRequestArgs, 'request'>>;
  createIssuanceRequestForAsyncIssuance?: Resolver<ResolversTypes['IssuanceRequestResponse'], ParentType, ContextType, RequireFields<MutationCreateIssuanceRequestForAsyncIssuanceArgs, 'asyncIssuanceRequestId'>>;
  createMDocPresentationRequest?: Resolver<ResolversTypes['MDocPresentationRequestResponse'], ParentType, ContextType, RequireFields<MutationCreateMDocPresentationRequestArgs, 'request'>>;
  createOidcClaimMapping?: Resolver<ResolversTypes['OidcClaimMapping'], ParentType, ContextType, RequireFields<MutationCreateOidcClaimMappingArgs, 'input'>>;
  createOidcClient?: Resolver<ResolversTypes['OidcClient'], ParentType, ContextType, RequireFields<MutationCreateOidcClientArgs, 'input'>>;
  createOidcClientResource?: Resolver<ResolversTypes['OidcClient'], ParentType, ContextType, RequireFields<MutationCreateOidcClientResourceArgs, 'clientId' | 'input'>>;
  createOidcResource?: Resolver<ResolversTypes['OidcResource'], ParentType, ContextType, RequireFields<MutationCreateOidcResourceArgs, 'input'>>;
  createPartner?: Resolver<ResolversTypes['Partner'], ParentType, ContextType, RequireFields<MutationCreatePartnerArgs, 'input'>>;
  createPhotoCaptureRequest?: Resolver<ResolversTypes['PhotoCaptureRequestResponse'], ParentType, ContextType, RequireFields<MutationCreatePhotoCaptureRequestArgs, 'request'>>;
  createPresentationRequest?: Resolver<ResolversTypes['PresentationRequestResponse'], ParentType, ContextType, RequireFields<MutationCreatePresentationRequestArgs, 'request'>>;
  createPresentationRequestForApproval?: Resolver<ResolversTypes['PresentationRequestResponse'], ParentType, ContextType, RequireFields<MutationCreatePresentationRequestForApprovalArgs, 'approvalRequestId'>>;
  createPresentationRequestForAuthn?: Resolver<ResolversTypes['PresentationRequestResponse'], ParentType, ContextType>;
  createTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationCreateTemplateArgs, 'input'>>;
  deleteConciergeBranding?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType>;
  deleteContract?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<MutationDeleteContractArgs, 'id'>>;
  deleteIdentities?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<MutationDeleteIdentitiesArgs, 'ids'>>;
  deleteInstanceMsGraphClient?: Resolver<ResolversTypes['Instance'], ParentType, ContextType, RequireFields<MutationDeleteInstanceMsGraphClientArgs, 'identifier'>>;
  deleteOidcClaimMapping?: Resolver<ResolversTypes['OidcClaimMapping'], ParentType, ContextType, RequireFields<MutationDeleteOidcClaimMappingArgs, 'id'>>;
  deleteOidcClient?: Resolver<ResolversTypes['OidcClient'], ParentType, ContextType, RequireFields<MutationDeleteOidcClientArgs, 'id'>>;
  deleteOidcClientResource?: Resolver<ResolversTypes['OidcClient'], ParentType, ContextType, RequireFields<MutationDeleteOidcClientResourceArgs, 'clientId' | 'resourceId'>>;
  deleteOidcResource?: Resolver<ResolversTypes['OidcResource'], ParentType, ContextType, RequireFields<MutationDeleteOidcResourceArgs, 'id'>>;
  deleteTemplate?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<MutationDeleteTemplateArgs, 'id'>>;
  deprecateContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationDeprecateContractArgs, 'id'>>;
  generateOidcClientSecret?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  import?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<MutationImportArgs, 'input'>>;
  processMDocPresentationResponse?: Resolver<ResolversTypes['MDocProcessedResponseResult'], ParentType, ContextType, RequireFields<MutationProcessMDocPresentationResponseArgs, 'response'>>;
  provisionContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationProvisionContractArgs, 'id'>>;
  resendAsyncIssuanceNotification?: Resolver<Maybe<ResolversTypes['AsyncIssuanceRequest']>, ParentType, ContextType, RequireFields<MutationResendAsyncIssuanceNotificationArgs, 'asyncIssuanceRequestId'>>;
  resendAsyncIssuanceNotifications?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationResendAsyncIssuanceNotificationsArgs, 'asyncIssuanceRequestIds'>>;
  resumeIdentityStore?: Resolver<ResolversTypes['IdentityStore'], ParentType, ContextType, RequireFields<MutationResumeIdentityStoreArgs, 'id'>>;
  resumePartner?: Resolver<ResolversTypes['Partner'], ParentType, ContextType, RequireFields<MutationResumePartnerArgs, 'id'>>;
  revokeContractIssuances?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRevokeContractIssuancesArgs, 'contractId'>>;
  revokeIdentityIssuances?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRevokeIdentityIssuancesArgs, 'identityId'>>;
  revokeIssuance?: Resolver<ResolversTypes['Issuance'], ParentType, ContextType, RequireFields<MutationRevokeIssuanceArgs, 'id'>>;
  revokeIssuances?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRevokeIssuancesArgs, 'ids'>>;
  revokeUserIssuances?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRevokeUserIssuancesArgs, 'userId'>>;
  revokeWalletIssuances?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRevokeWalletIssuancesArgs, 'walletId'>>;
  saveConciergeBranding?: Resolver<ResolversTypes['Branding'], ParentType, ContextType, RequireFields<MutationSaveConciergeBrandingArgs, 'input'>>;
  saveIdentity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType, RequireFields<MutationSaveIdentityArgs, 'input'>>;
  saveInstanceMsGraphClient?: Resolver<ResolversTypes['Instance'], ParentType, ContextType, RequireFields<MutationSaveInstanceMsGraphClientArgs, 'graphClient' | 'identifier'>>;
  sendAsyncIssuanceVerification?: Resolver<ResolversTypes['SendAsyncIssuanceVerificationResponse'], ParentType, ContextType, RequireFields<MutationSendAsyncIssuanceVerificationArgs, 'asyncIssuanceRequestId'>>;
  setApplicationLabelConfigs?: Resolver<Array<ResolversTypes['ApplicationLabelConfig']>, ParentType, ContextType, RequireFields<MutationSetApplicationLabelConfigsArgs, 'identityStoreId' | 'input'>>;
  setCorsOriginConfigs?: Resolver<Array<ResolversTypes['CorsOriginConfig']>, ParentType, ContextType, RequireFields<MutationSetCorsOriginConfigsArgs, 'input'>>;
  setEmailSenderConfig?: Resolver<ResolversTypes['EmailSenderConfig'], ParentType, ContextType, RequireFields<MutationSetEmailSenderConfigArgs, 'input'>>;
  suspendIdentityStore?: Resolver<ResolversTypes['IdentityStore'], ParentType, ContextType, RequireFields<MutationSuspendIdentityStoreArgs, 'id'>>;
  suspendPartner?: Resolver<ResolversTypes['Partner'], ParentType, ContextType, RequireFields<MutationSuspendPartnerArgs, 'id'>>;
  testServices?: Resolver<ResolversTypes['Discovery'], ParentType, ContextType>;
  updateApprovalRequest?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<MutationUpdateApprovalRequestArgs, 'id' | 'input'>>;
  updateAsyncIssuanceContact?: Resolver<Maybe<ResolversTypes['AsyncIssuanceContact']>, ParentType, ContextType, RequireFields<MutationUpdateAsyncIssuanceContactArgs, 'asyncIssuanceRequestId'>>;
  updateConciergeClientBranding?: Resolver<ResolversTypes['OidcClient'], ParentType, ContextType, RequireFields<MutationUpdateConciergeClientBrandingArgs, 'input'>>;
  updateContract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<MutationUpdateContractArgs, 'id' | 'input'>>;
  updateIdentityStore?: Resolver<ResolversTypes['IdentityStore'], ParentType, ContextType, RequireFields<MutationUpdateIdentityStoreArgs, 'id' | 'input'>>;
  updateInstanceAuthorityClient?: Resolver<ResolversTypes['Instance'], ParentType, ContextType, RequireFields<MutationUpdateInstanceAuthorityClientArgs, 'authorityClient' | 'identifier'>>;
  updateInstanceConfiguration?: Resolver<ResolversTypes['Instance'], ParentType, ContextType, RequireFields<MutationUpdateInstanceConfigurationArgs, 'configuration' | 'identifier'>>;
  updateOidcClaimMapping?: Resolver<ResolversTypes['OidcClaimMapping'], ParentType, ContextType, RequireFields<MutationUpdateOidcClaimMappingArgs, 'id' | 'input'>>;
  updateOidcClient?: Resolver<ResolversTypes['OidcClient'], ParentType, ContextType, RequireFields<MutationUpdateOidcClientArgs, 'id' | 'input'>>;
  updateOidcClientClaimMappings?: Resolver<ResolversTypes['OidcClient'], ParentType, ContextType, RequireFields<MutationUpdateOidcClientClaimMappingsArgs, 'claimMappingIds' | 'clientId'>>;
  updateOidcClientResource?: Resolver<ResolversTypes['OidcClient'], ParentType, ContextType, RequireFields<MutationUpdateOidcClientResourceArgs, 'clientId' | 'input'>>;
  updateOidcResource?: Resolver<ResolversTypes['OidcResource'], ParentType, ContextType, RequireFields<MutationUpdateOidcResourceArgs, 'id' | 'input'>>;
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

export type NumberValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['NumberValidation'] = ResolversParentTypes['NumberValidation']> = {
  max?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  min?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  precision?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OidcClaimMappingResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['OidcClaimMapping'] = ResolversParentTypes['OidcClaimMapping']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  credentialTypes?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  deletedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mappings?: Resolver<Array<ResolversTypes['ScopedClaimMapping']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OidcClientResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['OidcClient'] = ResolversParentTypes['OidcClient']> = {
  allowAnyPartner?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  applicationType?: Resolver<ResolversTypes['OidcApplicationType'], ParentType, ContextType>;
  backgroundColor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  backgroundImage?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  claimMappings?: Resolver<Array<ResolversTypes['OidcClaimMapping']>, ParentType, ContextType>;
  clientType?: Resolver<ResolversTypes['OidcClientType'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  credentialTypes?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  deletedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  partners?: Resolver<Array<ResolversTypes['Partner']>, ParentType, ContextType>;
  policyUrl?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  postLogoutUris?: Resolver<Array<ResolversTypes['URL']>, ParentType, ContextType>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, RequireFields<OidcClientPresentationsArgs, 'limit'>>;
  redirectUris?: Resolver<Array<ResolversTypes['URL']>, ParentType, ContextType>;
  requireFaceCheck?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  resources?: Resolver<Maybe<Array<ResolversTypes['OidcClientResource']>>, ParentType, ContextType>;
  termsOfServiceUrl?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  uniqueClaimsForSubjectId?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OidcClientResourceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['OidcClientResource'] = ResolversParentTypes['OidcClientResource']> = {
  resource?: Resolver<ResolversTypes['OidcResource'], ParentType, ContextType>;
  resourceScopes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OidcResourceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['OidcResource'] = ResolversParentTypes['OidcResource']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  deletedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resourceIndicator?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  scopes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PartnerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Partner'] = ResolversParentTypes['Partner']> = {
  contracts?: Resolver<Array<ResolversTypes['NetworkContract']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  credentialTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  did?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  issuerId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  linkedDomainUrls?: Resolver<Maybe<Array<ResolversTypes['URL']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, RequireFields<PartnerPresentationsArgs, 'limit'>>;
  suspendedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  tenantId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PhotoCaptureEventDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PhotoCaptureEventData'] = ResolversParentTypes['PhotoCaptureEventData']> = {
  status?: Resolver<ResolversTypes['PhotoCaptureStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PhotoCaptureRequestResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PhotoCaptureRequestResponse'] = ResolversParentTypes['PhotoCaptureRequestResponse']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  photoCaptureQrCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  photoCaptureUrl?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PhotoCaptureTokenResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PhotoCaptureTokenResponse'] = ResolversParentTypes['PhotoCaptureTokenResponse']> = {
  expires?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  oidcClient?: Resolver<Maybe<ResolversTypes['OidcClient']>, ParentType, ContextType>;
  partners?: Resolver<Array<ResolversTypes['Partner']>, ParentType, ContextType>;
  presentedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  presentedCredentials?: Resolver<Array<ResolversTypes['PresentedCredential']>, ParentType, ContextType>;
  receipt?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  requestedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  requestedCredentials?: Resolver<Array<ResolversTypes['RequestedCredential']>, ParentType, ContextType>;
  wallet?: Resolver<Maybe<ResolversTypes['Wallet']>, ParentType, ContextType>;
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
  applicationLabelConfigs?: Resolver<Array<ResolversTypes['ApplicationLabelConfig']>, ParentType, ContextType, RequireFields<QueryApplicationLabelConfigsArgs, 'identityStoreId'>>;
  approvalRequest?: Resolver<ResolversTypes['ApprovalRequest'], ParentType, ContextType, RequireFields<QueryApprovalRequestArgs, 'id'>>;
  approvalRequestTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  asyncIssuanceContact?: Resolver<Maybe<ResolversTypes['AsyncIssuanceContact']>, ParentType, ContextType, RequireFields<QueryAsyncIssuanceContactArgs, 'asyncIssuanceRequestId'>>;
  asyncIssuanceRequest?: Resolver<ResolversTypes['AsyncIssuanceRequest'], ParentType, ContextType, RequireFields<QueryAsyncIssuanceRequestArgs, 'id'>>;
  authority?: Resolver<ResolversTypes['Authority'], ParentType, ContextType>;
  conciergeBranding?: Resolver<Maybe<ResolversTypes['Branding']>, ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Contract'], ParentType, ContextType, RequireFields<QueryContractArgs, 'id'>>;
  corsOriginConfigs?: Resolver<Array<ResolversTypes['CorsOriginConfig']>, ParentType, ContextType>;
  credentialTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, Partial<QueryCredentialTypesArgs>>;
  discovery?: Resolver<ResolversTypes['Discovery'], ParentType, ContextType>;
  emailSenderConfig?: Resolver<ResolversTypes['EmailSenderConfig'], ParentType, ContextType>;
  findApprovalRequests?: Resolver<Array<ResolversTypes['ApprovalRequest']>, ParentType, ContextType, RequireFields<QueryFindApprovalRequestsArgs, 'limit'>>;
  findAsyncIssuanceRequests?: Resolver<Array<ResolversTypes['AsyncIssuanceRequest']>, ParentType, ContextType, RequireFields<QueryFindAsyncIssuanceRequestsArgs, 'limit'>>;
  findCommunications?: Resolver<Array<ResolversTypes['Communication']>, ParentType, ContextType, Partial<QueryFindCommunicationsArgs>>;
  findContracts?: Resolver<Array<ResolversTypes['Contract']>, ParentType, ContextType, Partial<QueryFindContractsArgs>>;
  findIdentities?: Resolver<Array<ResolversTypes['Identity']>, ParentType, ContextType, RequireFields<QueryFindIdentitiesArgs, 'limit'>>;
  findIdentityStores?: Resolver<Array<ResolversTypes['IdentityStore']>, ParentType, ContextType, Partial<QueryFindIdentityStoresArgs>>;
  findIssuances?: Resolver<Array<ResolversTypes['Issuance']>, ParentType, ContextType, RequireFields<QueryFindIssuancesArgs, 'limit'>>;
  findNetworkIssuers?: Resolver<Array<ResolversTypes['NetworkIssuer']>, ParentType, ContextType, RequireFields<QueryFindNetworkIssuersArgs, 'where'>>;
  findOidcClaimMappings?: Resolver<Array<ResolversTypes['OidcClaimMapping']>, ParentType, ContextType, RequireFields<QueryFindOidcClaimMappingsArgs, 'limit'>>;
  findOidcClients?: Resolver<Array<ResolversTypes['OidcClient']>, ParentType, ContextType, RequireFields<QueryFindOidcClientsArgs, 'limit'>>;
  findOidcResources?: Resolver<Array<ResolversTypes['OidcResource']>, ParentType, ContextType, RequireFields<QueryFindOidcResourcesArgs, 'limit'>>;
  findPartners?: Resolver<Array<ResolversTypes['Partner']>, ParentType, ContextType, RequireFields<QueryFindPartnersArgs, 'limit'>>;
  findPresentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, RequireFields<QueryFindPresentationsArgs, 'limit'>>;
  findTemplates?: Resolver<Array<ResolversTypes['Template']>, ParentType, ContextType, RequireFields<QueryFindTemplatesArgs, 'limit'>>;
  findTenantIdentities?: Resolver<Array<ResolversTypes['TenantIdentity']>, ParentType, ContextType, RequireFields<QueryFindTenantIdentitiesArgs, 'limit' | 'where'>>;
  findUsers?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryFindUsersArgs, 'limit'>>;
  findWallets?: Resolver<Array<ResolversTypes['Wallet']>, ParentType, ContextType, RequireFields<QueryFindWalletsArgs, 'limit'>>;
  healthcheck?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType>;
  identities?: Resolver<Array<Maybe<ResolversTypes['Identity']>>, ParentType, ContextType, Partial<QueryIdentitiesArgs>>;
  identitiesByIdentifiers?: Resolver<Array<Maybe<ResolversTypes['Identity']>>, ParentType, ContextType, Partial<QueryIdentitiesByIdentifiersArgs>>;
  identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType, RequireFields<QueryIdentityArgs, 'id'>>;
  identityByIdentifier?: Resolver<ResolversTypes['Identity'], ParentType, ContextType, RequireFields<QueryIdentityByIdentifierArgs, 'issuerId'>>;
  identityIssuers?: Resolver<Array<ResolversTypes['IdentityIssuer']>, ParentType, ContextType>;
  identityStore?: Resolver<Maybe<ResolversTypes['IdentityStore']>, ParentType, ContextType, RequireFields<QueryIdentityStoreArgs, 'id'>>;
  instanceByIdentifier?: Resolver<ResolversTypes['Instance'], ParentType, ContextType, RequireFields<QueryInstanceByIdentifierArgs, 'identifier'>>;
  issuance?: Resolver<ResolversTypes['Issuance'], ParentType, ContextType, RequireFields<QueryIssuanceArgs, 'id'>>;
  issuanceCount?: Resolver<ResolversTypes['NonNegativeInt'], ParentType, ContextType, Partial<QueryIssuanceCountArgs>>;
  issuanceCountByContract?: Resolver<Array<ResolversTypes['ContractCount']>, ParentType, ContextType, Partial<QueryIssuanceCountByContractArgs>>;
  issuanceCountByUser?: Resolver<Array<ResolversTypes['UserCount']>, ParentType, ContextType, Partial<QueryIssuanceCountByUserArgs>>;
  me?: Resolver<Maybe<ResolversTypes['Me']>, ParentType, ContextType>;
  networkContracts?: Resolver<Array<ResolversTypes['NetworkContract']>, ParentType, ContextType, RequireFields<QueryNetworkContractsArgs, 'issuerId' | 'tenantId'>>;
  oidcClaimMapping?: Resolver<ResolversTypes['OidcClaimMapping'], ParentType, ContextType, RequireFields<QueryOidcClaimMappingArgs, 'id'>>;
  oidcClient?: Resolver<ResolversTypes['OidcClient'], ParentType, ContextType, RequireFields<QueryOidcClientArgs, 'id'>>;
  oidcResource?: Resolver<ResolversTypes['OidcResource'], ParentType, ContextType, RequireFields<QueryOidcResourceArgs, 'id'>>;
  partner?: Resolver<ResolversTypes['Partner'], ParentType, ContextType, RequireFields<QueryPartnerArgs, 'id'>>;
  partnerByDid?: Resolver<Maybe<ResolversTypes['Partner']>, ParentType, ContextType, RequireFields<QueryPartnerByDidArgs, 'did'>>;
  photoCaptureStatus?: Resolver<ResolversTypes['PhotoCaptureEventData'], ParentType, ContextType, RequireFields<QueryPhotoCaptureStatusArgs, 'photoCaptureRequestId'>>;
  presentation?: Resolver<ResolversTypes['Presentation'], ParentType, ContextType, RequireFields<QueryPresentationArgs, 'id'>>;
  presentationCount?: Resolver<ResolversTypes['NonNegativeInt'], ParentType, ContextType, Partial<QueryPresentationCountArgs>>;
  presentationCountByContract?: Resolver<Array<ResolversTypes['ContractCount']>, ParentType, ContextType, Partial<QueryPresentationCountByContractArgs>>;
  presentationCountByUser?: Resolver<Array<ResolversTypes['UserCount']>, ParentType, ContextType, Partial<QueryPresentationCountByUserArgs>>;
  template?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<QueryTemplateArgs, 'id'>>;
  templateCombinedData?: Resolver<ResolversTypes['TemplateParentData'], ParentType, ContextType, RequireFields<QueryTemplateCombinedDataArgs, 'templateId'>>;
  testAuthorityClient?: Resolver<ResolversTypes['Authority'], ParentType, ContextType, RequireFields<QueryTestAuthorityClientArgs, 'authorityClient' | 'identifier'>>;
  testIdentityStoreGraphClient?: Resolver<Maybe<ResolversTypes['MsGraphFailure']>, ParentType, ContextType, RequireFields<QueryTestIdentityStoreGraphClientArgs, 'identityStoreId'>>;
  testMsGraphClient?: Resolver<Maybe<ResolversTypes['Void']>, ParentType, ContextType, RequireFields<QueryTestMsGraphClientArgs, 'graphClient' | 'identifier'>>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  verifyPresentation?: Resolver<ResolversTypes['VerifyPresentationResult'], ParentType, ContextType, RequireFields<QueryVerifyPresentationArgs, 'presentedAt' | 'receipt'>>;
  wallet?: Resolver<Maybe<ResolversTypes['Wallet']>, ParentType, ContextType, RequireFields<QueryWalletArgs, 'id'>>;
};

export type RegexValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RegexValidation'] = ResolversParentTypes['RegexValidation']> = {
  pattern?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
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

export type RequestedClaimConstraintResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestedClaimConstraint'] = ResolversParentTypes['RequestedClaimConstraint']> = {
  claimName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  operator?: Resolver<ResolversTypes['ConstraintOperator'], ParentType, ContextType>;
  values?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RequestedConfigurationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestedConfiguration'] = ResolversParentTypes['RequestedConfiguration']> = {
  validation?: Resolver<Maybe<ResolversTypes['RequestConfigurationValidation']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RequestedCredentialResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RequestedCredential'] = ResolversParentTypes['RequestedCredential']> = {
  acceptedIssuers?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  configuration?: Resolver<Maybe<ResolversTypes['RequestedConfiguration']>, ParentType, ContextType>;
  constraints?: Resolver<Maybe<Array<ResolversTypes['RequestedClaimConstraint']>>, ParentType, ContextType>;
  purpose?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ScopedClaimMappingResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ScopedClaimMapping'] = ResolversParentTypes['ScopedClaimMapping']> = {
  claim?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  credentialClaim?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scope?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SendAsyncIssuanceVerificationResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SendAsyncIssuanceVerificationResponse'] = ResolversParentTypes['SendAsyncIssuanceVerificationResponse']> = {
  method?: Resolver<Maybe<ResolversTypes['ContactMethod']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServiceFailuresResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ServiceFailures'] = ResolversParentTypes['ServiceFailures']> = {
  msGraph?: Resolver<Maybe<Array<ResolversTypes['MsGraphFailure']>>, ParentType, ContextType>;
  verifiedId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  backgroundJobEvent?: SubscriptionResolver<ResolversTypes['BackgroundJobEventData'], "backgroundJobEvent", ParentType, ContextType, Partial<SubscriptionBackgroundJobEventArgs>>;
  issuanceEvent?: SubscriptionResolver<ResolversTypes['IssuanceEventData'], "issuanceEvent", ParentType, ContextType, Partial<SubscriptionIssuanceEventArgs>>;
  photoCaptureEvent?: SubscriptionResolver<ResolversTypes['PhotoCaptureEventData'], "photoCaptureEvent", ParentType, ContextType, RequireFields<SubscriptionPhotoCaptureEventArgs, 'photoCaptureRequestId'>>;
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
  isFixed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isOptional?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ClaimType'], ParentType, ContextType>;
  validation?: Resolver<Maybe<ResolversTypes['ClaimValidation']>, ParentType, ContextType>;
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

export type TextValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TextValidation'] = ResolversParentTypes['TextValidation']> = {
  maxLength?: Resolver<Maybe<ResolversTypes['PositiveInt']>, ParentType, ContextType>;
  minLength?: Resolver<Maybe<ResolversTypes['PositiveInt']>, ParentType, ContextType>;
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
  issuances?: Resolver<Array<ResolversTypes['Issuance']>, ParentType, ContextType, RequireFields<UserIssuancesArgs, 'limit'>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, RequireFields<UserPresentationsArgs, 'limit'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserCountResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserCount'] = ResolversParentTypes['UserCount']> = {
  count?: Resolver<ResolversTypes['NonNegativeInt'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VerifyPresentationResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['VerifyPresentationResult'] = ResolversParentTypes['VerifyPresentationResult']> = {
  faceCheckValid?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  idTokenValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface VoidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Void'], any> {
  name: 'Void';
}

export type WalletResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Wallet'] = ResolversParentTypes['Wallet']> = {
  firstUsed?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastUsed?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  presentations?: Resolver<Array<ResolversTypes['Presentation']>, ParentType, ContextType, RequireFields<WalletPresentationsArgs, 'limit'>>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

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
  AndroidPresentationRequest?: AndroidPresentationRequestResolvers<ContextType>;
  ApplePresentationRequest?: ApplePresentationRequestResolvers<ContextType>;
  ApplicationLabelConfig?: ApplicationLabelConfigResolvers<ContextType>;
  ApprovalRequest?: ApprovalRequestResolvers<ContextType>;
  ApprovalRequestResponse?: ApprovalRequestResponseResolvers<ContextType>;
  ApprovalTokenResponse?: ApprovalTokenResponseResolvers<ContextType>;
  AsyncIssuanceContact?: AsyncIssuanceContactResolvers<ContextType>;
  AsyncIssuanceErrorResponse?: AsyncIssuanceErrorResponseResolvers<ContextType>;
  AsyncIssuanceRequest?: AsyncIssuanceRequestResolvers<ContextType>;
  AsyncIssuanceRequestResponse?: AsyncIssuanceRequestResponseResolvers<ContextType>;
  AsyncIssuanceResponse?: AsyncIssuanceResponseResolvers<ContextType>;
  AsyncIssuanceTokenResponse?: AsyncIssuanceTokenResponseResolvers<ContextType>;
  Authority?: AuthorityResolvers<ContextType>;
  BackgroundJobActiveEvent?: BackgroundJobActiveEventResolvers<ContextType>;
  BackgroundJobCompletedEvent?: BackgroundJobCompletedEventResolvers<ContextType>;
  BackgroundJobErrorEvent?: BackgroundJobErrorEventResolvers<ContextType>;
  BackgroundJobEvent?: BackgroundJobEventResolvers<ContextType>;
  BackgroundJobEventData?: BackgroundJobEventDataResolvers<ContextType>;
  BackgroundJobProgressEvent?: BackgroundJobProgressEventResolvers<ContextType>;
  Branding?: BrandingResolvers<ContextType>;
  ClaimValidation?: ClaimValidationResolvers<ContextType>;
  Communication?: CommunicationResolvers<ContextType>;
  Contact?: ContactResolvers<ContextType>;
  Contract?: ContractResolvers<ContextType>;
  ContractCount?: ContractCountResolvers<ContextType>;
  ContractDisplayClaim?: ContractDisplayClaimResolvers<ContextType>;
  ContractDisplayConsent?: ContractDisplayConsentResolvers<ContextType>;
  ContractDisplayCredential?: ContractDisplayCredentialResolvers<ContextType>;
  ContractDisplayCredentialLogo?: ContractDisplayCredentialLogoResolvers<ContextType>;
  ContractDisplayModel?: ContractDisplayModelResolvers<ContextType>;
  CorsOriginConfig?: CorsOriginConfigResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Discovery?: DiscoveryResolvers<ContextType>;
  EmailAddress?: GraphQLScalarType;
  EmailSenderConfig?: EmailSenderConfigResolvers<ContextType>;
  FaceCheckResult?: FaceCheckResultResolvers<ContextType>;
  FaceCheckValidation?: FaceCheckValidationResolvers<ContextType>;
  FeatureUrls?: FeatureUrlsResolvers<ContextType>;
  Features?: FeaturesResolvers<ContextType>;
  GraphQLSecuritySettings?: GraphQlSecuritySettingsResolvers<ContextType>;
  HexColorCode?: GraphQLScalarType;
  Identity?: IdentityResolvers<ContextType>;
  IdentityIssuer?: IdentityIssuerResolvers<ContextType>;
  IdentityStore?: IdentityStoreResolvers<ContextType>;
  Instance?: InstanceResolvers<ContextType>;
  InstanceConfiguration?: InstanceConfigurationResolvers<ContextType>;
  Issuance?: IssuanceResolvers<ContextType>;
  IssuanceCallbackEvent?: IssuanceCallbackEventResolvers<ContextType>;
  IssuanceEventData?: IssuanceEventDataResolvers<ContextType>;
  IssuanceRequestResponse?: IssuanceRequestResponseResolvers<ContextType>;
  IssuanceResponse?: IssuanceResponseResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  JSONObject?: GraphQLScalarType;
  ListValidation?: ListValidationResolvers<ContextType>;
  Locale?: GraphQLScalarType;
  MDocCertificateValidation?: MDocCertificateValidationResolvers<ContextType>;
  MDocCertificateValidity?: MDocCertificateValidityResolvers<ContextType>;
  MDocClaim?: MDocClaimResolvers<ContextType>;
  MDocDiagnostics?: MDocDiagnosticsResolvers<ContextType>;
  MDocDigestValidation?: MDocDigestValidationResolvers<ContextType>;
  MDocDocument?: MDocDocumentResolvers<ContextType>;
  MDocDocumentValidation?: MDocDocumentValidationResolvers<ContextType>;
  MDocMsoValidityInfo?: MDocMsoValidityInfoResolvers<ContextType>;
  MDocNamespace?: MDocNamespaceResolvers<ContextType>;
  MDocPresentationRequestResponse?: MDocPresentationRequestResponseResolvers<ContextType>;
  MDocPresentationResponse?: MDocPresentationResponseResolvers<ContextType>;
  MDocProcessedResponse?: MDocProcessedResponseResolvers<ContextType>;
  MDocProcessedResponseResult?: MDocProcessedResponseResultResolvers<ContextType>;
  MDocValidationResults?: MDocValidationResultsResolvers<ContextType>;
  Me?: MeResolvers<ContextType>;
  MsGraphFailure?: MsGraphFailureResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NetworkContract?: NetworkContractResolvers<ContextType>;
  NetworkIssuer?: NetworkIssuerResolvers<ContextType>;
  NonNegativeInt?: GraphQLScalarType;
  NumberValidation?: NumberValidationResolvers<ContextType>;
  OidcClaimMapping?: OidcClaimMappingResolvers<ContextType>;
  OidcClient?: OidcClientResolvers<ContextType>;
  OidcClientResource?: OidcClientResourceResolvers<ContextType>;
  OidcResource?: OidcResourceResolvers<ContextType>;
  Partner?: PartnerResolvers<ContextType>;
  PhotoCaptureEventData?: PhotoCaptureEventDataResolvers<ContextType>;
  PhotoCaptureRequestResponse?: PhotoCaptureRequestResponseResolvers<ContextType>;
  PhotoCaptureTokenResponse?: PhotoCaptureTokenResponseResolvers<ContextType>;
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
  RegexValidation?: RegexValidationResolvers<ContextType>;
  RequestConfigurationValidation?: RequestConfigurationValidationResolvers<ContextType>;
  RequestError?: RequestErrorResolvers<ContextType>;
  RequestErrorResponse?: RequestErrorResponseResolvers<ContextType>;
  RequestErrorWithInner?: RequestErrorWithInnerResolvers<ContextType>;
  RequestInnerError?: RequestInnerErrorResolvers<ContextType>;
  RequestedClaimConstraint?: RequestedClaimConstraintResolvers<ContextType>;
  RequestedConfiguration?: RequestedConfigurationResolvers<ContextType>;
  RequestedCredential?: RequestedCredentialResolvers<ContextType>;
  ScopedClaimMapping?: ScopedClaimMappingResolvers<ContextType>;
  SendAsyncIssuanceVerificationResponse?: SendAsyncIssuanceVerificationResponseResolvers<ContextType>;
  ServiceFailures?: ServiceFailuresResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Template?: TemplateResolvers<ContextType>;
  TemplateDisplayClaim?: TemplateDisplayClaimResolvers<ContextType>;
  TemplateDisplayConsent?: TemplateDisplayConsentResolvers<ContextType>;
  TemplateDisplayCredential?: TemplateDisplayCredentialResolvers<ContextType>;
  TemplateDisplayCredentialLogo?: TemplateDisplayCredentialLogoResolvers<ContextType>;
  TemplateDisplayModel?: TemplateDisplayModelResolvers<ContextType>;
  TemplateParentData?: TemplateParentDataResolvers<ContextType>;
  TenantIdentity?: TenantIdentityResolvers<ContextType>;
  TextValidation?: TextValidationResolvers<ContextType>;
  URL?: GraphQLScalarType;
  UUID?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  UserCount?: UserCountResolvers<ContextType>;
  VerifyPresentationResult?: VerifyPresentationResultResolvers<ContextType>;
  Void?: GraphQLScalarType;
  Wallet?: WalletResolvers<ContextType>;
  WebDidModel?: WebDidModelResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = GraphQLContext> = {
  cacheControl?: CacheControlDirectiveResolver<any, any, ContextType>;
  constraint?: ConstraintDirectiveResolver<any, any, ContextType>;
};
