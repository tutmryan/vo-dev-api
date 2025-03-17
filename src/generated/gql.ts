/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n    mutation CancelApprovalRequest($id: ID!) {\n      cancelApprovalRequest(id: $id)\n    }\n  ": types.CancelApprovalRequestDocument,
    "\n  query ApprovalRequest($approvalRequestId: ID!) {\n    approvalRequest(id: $approvalRequestId) {\n      id\n      requestedAt\n      expiresAt\n      requestType\n      correlationId\n      referenceUrl\n      purpose\n      requestData\n      actionedComment\n      status\n    }\n  }\n": types.ApprovalRequestDocument,
    "\n  mutation CreateApprovalRequest($input: ApprovalRequestInput!) {\n    createApprovalRequest(request: $input) {\n      id\n      portalUrl\n      callbackSecret\n    }\n  }\n": types.CreateApprovalRequestDocument,
    "\n    mutation ActionApprovalRequest($id: ID!, $input: ActionApprovalRequestInput!) {\n      actionApprovalRequest(id: $id, input: $input) {\n        id\n        status\n        isApproved\n        actionedComment\n      }\n    }\n  ": types.ActionApprovalRequestDocument,
    "\n  query FindActionedApprovalData($id: ID!) {\n    actionedApprovalData(id: $id) {\n      approvalRequestId\n      correlationId\n      requestData\n      state\n      status\n      actionedComment\n      actionedAt\n      actionedBy {\n        id\n        name\n      }\n      callbackSecret\n    }\n  }": types.FindActionedApprovalDataDocument,
    "\n    mutation UpdateApprovalRequest($id: ID!, $input: UpdateApprovalRequestInput!) {\n      updateApprovalRequest(id: $id, input: $input)\n    }\n  ": types.UpdateApprovalRequestDocument,
    "\n  mutation CancelAsyncIssuanceRequest($asyncIssuanceRequestId: UUID!) {\n    cancelAsyncIssuanceRequest(asyncIssuanceRequestId: $asyncIssuanceRequestId) {\n      ...AsyncIssuanceRequestFragment\n    }\n  }\n": types.CancelAsyncIssuanceRequestDocument,
    "\n  mutation CreateAsyncIssuanceRequest($request: [AsyncIssuanceRequestInput!]!) {\n    createAsyncIssuanceRequest(request: $request) {\n      ... on AsyncIssuanceResponse {\n        __typename\n        asyncIssuanceRequestIds\n      }\n      ... on AsyncIssuanceErrorResponse {\n        __typename\n        errors\n      }\n    }\n  }\n": types.CreateAsyncIssuanceRequestDocument,
    "\n  mutation CreateIssuanceRequestForAsyncIssuance($asyncIssuanceRequestId: UUID!) {\n    createIssuanceRequestForAsyncIssuance(asyncIssuanceRequestId: $asyncIssuanceRequestId) {\n      ... on IssuanceResponse {\n        __typename\n        requestId\n        url\n        qrCode\n      }\n      ... on RequestErrorResponse {\n        __typename\n        requestId\n        date\n        mscv\n        error {\n          code\n          message\n          innererror {\n            code\n            message\n            target\n          }\n        }\n      }\n    }\n  }\n": types.CreateIssuanceRequestForAsyncIssuanceDocument,
    "\n  fragment AsyncIssuanceRequestFragment on AsyncIssuanceRequest {\n    id\n    status\n    isStatusFinal\n    failureReason\n    expiry\n    expiresOn\n    createdAt\n    updatedAt\n    identity {\n      id\n    }\n    issuance {\n      id\n    }\n    createdBy {\n      id\n    }\n    updatedBy {\n      id\n    }\n  }\n": types.AsyncIssuanceRequestFragmentFragmentDoc,
    "\n  query GetAsyncIssuance($id: UUID!) {\n    asyncIssuanceRequest(id: $id) {\n      ...AsyncIssuanceRequestFragment\n    }\n  }\n": types.GetAsyncIssuanceDocument,
    "\n  mutation ResendAsyncIssuanceNotification($asyncIssuanceRequestId: UUID!) {\n    resendAsyncIssuanceNotification(asyncIssuanceRequestId: $asyncIssuanceRequestId) {\n      ...AsyncIssuanceRequestFragment\n    }\n  }\n": types.ResendAsyncIssuanceNotificationDocument,
    "\n  mutation UpdateAsyncIssuanceContact($asyncIssuanceRequestId: UUID!, $contact: AsyncIssuanceContactInput!) {\n    updateAsyncIssuanceContact(asyncIssuanceRequestId: $asyncIssuanceRequestId, contact: $contact) {\n      notification {\n        value\n        method\n      }\n      verification {\n        value\n        method\n      }\n    }\n  }\n": types.UpdateAsyncIssuanceContactDocument,
    "\n  query ConciergeBranding {\n    conciergeBranding {\n      data\n    }\n  }\n": types.ConciergeBrandingDocument,
    "\n  mutation SaveConciergeBranding($input: ConciergeBrandingInput!) {\n    saveConciergeBranding(input: $input) {\n      id\n    }\n  }\n": types.SaveConciergeBrandingDocument,
    "\n  mutation DeleteConciergeBranding {\n    deleteConciergeBranding\n  }\n": types.DeleteConciergeBrandingDocument,
    "\n  fragment ContractFragment on Contract {\n    id\n    name\n    description\n    template {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    credentialTypes\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n  }\n": types.ContractFragmentFragmentDoc,
    "\n  mutation CreateContract($input: ContractInput!) {\n    createContract(input: $input) {\n      ...ContractFragment\n    }\n  }\n": types.CreateContractDocument,
    "\n  mutation DeprecateContract($id: ID!) {\n    deprecateContract(id: $id) {\n      ...ContractFragment,\n      externalId,\n      provisionedAt,\n      lastProvisionedAt,\n      isDeprecated,\n      deprecatedAt\n    }\n  }\n": types.DeprecateContractDocument,
    "\n  query GetContract($id: ID!) {\n    contract(id: $id) {\n      ...ContractFragment\n    }\n  }": types.GetContractDocument,
    "\n  mutation ProvisionContract($id: ID!) {\n    provisionContract(id: $id) {\n      ...ContractFragment,\n      externalId,\n      provisionedAt,\n      lastProvisionedAt\n    }\n  }\n": types.ProvisionContractDocument,
    "\n  mutation UpdateContract($id: ID!, $input: ContractInput!) {\n    updateContract(id: $id, input: $input) {\n      ...ContractFragment\n    }\n  }\n": types.UpdateContractDocument,
    "\n  query Healthcheck {\n    healthcheck\n  }\n": types.HealthcheckDocument,
    "\n  query Identity($id: ID!) {\n    identity(id: $id) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n": types.IdentityDocument,
    "\n  query FindIdentities($where: IdentityWhere, $limit: PositiveInt, $offset: PositiveInt) {\n    findIdentities(where: $where, limit: $limit, offset: $offset) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n": types.FindIdentitiesDocument,
    "\n  mutation SaveIdentity($input: IdentityInput!) {\n    saveIdentity(input: $input) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n": types.SaveIdentityDocument,
    "\n  mutation CreateIssuanceRequest($request: IssuanceRequestInput!) {\n    createIssuanceRequest(request: $request) {\n      ... on IssuanceResponse {\n        requestId\n        url\n        qrCode\n      }\n      ... on RequestErrorResponse {\n        error {\n          code\n          message\n        }\n      }\n    }\n  }\n": types.CreateIssuanceRequestDocument,
    "\n  mutation AcquireLimitedAccessToken($input: AcquireLimitedAccessTokenInput!) {\n    acquireLimitedAccessToken(input: $input) {\n      expires\n      token\n    }\n  }\n": types.AcquireLimitedAccessTokenDocument,
    "\n  query FindContracts($where: ContractWhere, $forIdentityId: ID) {\n    findContracts(where: $where) {\n      id\n      credentialTypes\n      display {\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            description\n          }\n        }\n      }\n      issuances(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        issuedAt\n        expiresAt\n      }\n      presentations(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        presentedAt\n      }\n    }\n  }\n": types.FindContractsDocument,
    "\n  query Contract($id: ID!, $forIdentityId: ID) {\n    contract(id: $id) {\n      id\n      credentialTypes\n      display {\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            description\n          }\n        }\n      }\n      issuances(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        issuedAt\n        expiresAt\n      }\n      presentations(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        presentedAt\n      }\n    }\n  }\n": types.ContractDocument,
    "\n  query FindIssuances($where: IssuanceWhere) {\n    findIssuances(where: $where) {\n      issuedAt\n    }\n  }\n": types.FindIssuancesDocument,
    "\n  query CredentialTypes {\n    credentialTypes\n  }\n": types.CredentialTypesDocument,
    "\n  mutation CreatePresentationRequest($request: PresentationRequestInput!) {\n    createPresentationRequest(request: $request) {\n      ... on PresentationResponse {\n        requestId\n        url\n        qrCode\n        expiry\n      }\n      ... on RequestErrorResponse {\n        error {\n          code\n          message\n          innererror {\n            code\n            message\n            target\n          }\n        }\n      }\n    }\n  }\n": types.CreatePresentationRequestDocument,
    "\n  mutation AcquireLimitedApprovalToken($input: AcquireLimitedApprovalTokenInput!) {\n    acquireLimitedApprovalToken(input: $input) {\n      token\n      expires\n    }\n  }\n": types.AcquireLimitedApprovalTokenDocument,
    "\n  mutation AcquireLimitedPhotoCaptureToken($input: AcquireLimitedPhotoCaptureTokenInput!) {\n    acquireLimitedPhotoCaptureToken(input: $input) {\n      token\n      expires\n    }\n  }\n": types.AcquireLimitedPhotoCaptureTokenDocument,
    "\n  fragment OidcClientFragment on OidcClient {\n    id\n    name\n    logo\n    backgroundColor\n    backgroundImage\n    policyUrl\n    termsOfServiceUrl\n    applicationType\n    redirectUris\n    postLogoutUris\n    requireFaceCheck\n    allowAnyPartner\n    partners {\n      id\n      name\n      did\n      credentialTypes\n      linkedDomainUrls\n    }\n    uniqueClaimsForSubjectId\n    credentialTypes\n    resources {\n      resource {\n        id\n        name\n        resourceIndicator\n        scopes\n      }\n      resourceScopes\n    }\n    createdBy {\n      id\n      name\n    }\n    createdAt\n    updatedBy {\n      id\n      name\n    }\n    updatedAt\n    deletedAt\n  }\n": types.OidcClientFragmentFragmentDoc,
    "\n  mutation CreateOidcClient($input: OidcClientInput!) {\n    createOidcClient(input: $input) {\n      ...OidcClientFragment\n    }\n  }\n": types.CreateOidcClientDocument,
    "\n  mutation UpdateOidcClient($id: ID!, $input: OidcClientInput!) {\n    updateOidcClient(id: $id, input: $input) {\n      ...OidcClientFragment\n    }\n  }\n": types.UpdateOidcClientDocument,
    "\n  mutation DeleteOidcClient($id: ID!) {\n    deleteOidcClient(id: $id) {\n      ...OidcClientFragment\n    }\n  }\n": types.DeleteOidcClientDocument,
    "\n  query FindOidcClients(\n    $where: OidcClientWhere\n    $offset: PositiveInt\n    $limit: PositiveInt\n    $orderBy: OidcClientOrderBy\n    $orderDirection: OrderDirection\n  ) {\n    findOidcClients(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {\n      ...OidcClientFragment\n    }\n  }\n": types.FindOidcClientsDocument,
    "\n  query OidcClient($id: ID!) {\n    oidcClient(id: $id) {\n      ...OidcClientFragment\n    }\n  }\n": types.OidcClientDocument,
    "\n  fragment OidcResourceFragment on OidcResource {\n    id\n    name\n    resourceIndicator\n    scopes\n    createdBy {\n      id\n      name\n    }\n    createdAt\n    updatedBy {\n      id\n      name\n    }\n    updatedAt\n    deletedAt\n  }\n": types.OidcResourceFragmentFragmentDoc,
    "\n  mutation CreateOidcResource($input: OidcResourceInput!) {\n    createOidcResource(input: $input) {\n      ...OidcResourceFragment\n    }\n  }\n": types.CreateOidcResourceDocument,
    "\n  mutation UpdateOidcResource($id: ID!, $input: OidcResourceInput!) {\n    updateOidcResource(id: $id, input: $input) {\n      ...OidcResourceFragment\n    }\n  }\n": types.UpdateOidcResourceDocument,
    "\n  mutation DeleteOidcResource($id: ID!) {\n    deleteOidcResource(id: $id) {\n      ...OidcResourceFragment\n    }\n  }\n": types.DeleteOidcResourceDocument,
    "\n  query FindOidcResources(\n    $where: OidcResourceWhere\n    $offset: PositiveInt\n    $limit: PositiveInt\n    $orderBy: OidcResourceOrderBy\n    $orderDirection: OrderDirection\n  ) {\n    findOidcResources(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {\n      ...OidcResourceFragment\n    }\n  }\n": types.FindOidcResourcesDocument,
    "\n  query OidcResource($id: ID!) {\n    oidcResource(id: $id) {\n      ...OidcResourceFragment\n    }\n  }\n": types.OidcResourceDocument,
    "\n  mutation CreateOidcClientResource($clientId: ID!, $input: OidcClientResourceInput!) {\n    createOidcClientResource(clientId: $clientId, input: $input) {\n      ...OidcClientFragment\n    }\n  }\n": types.CreateOidcClientResourceDocument,
    "\n  mutation UpdateOidcClientResource($clientId: ID!, $input: OidcClientResourceInput!) {\n    updateOidcClientResource(clientId: $clientId, input: $input) {\n      ...OidcClientFragment\n    }\n  }\n": types.UpdateOidcClientResourceDocument,
    "\n  mutation DeleteOidcClientResource($clientId: ID!, $resourceId: ID!) {\n    deleteOidcClientResource(clientId: $clientId, resourceId: $resourceId) {\n      ...OidcClientFragment\n    }\n  }\n": types.DeleteOidcClientResourceDocument,
    "\n  mutation CreatePhotoCaptureRequest($request: PhotoCaptureRequest!) {\n    createPhotoCaptureRequest(request: $request) {\n      id\n      photoCaptureUrl\n      photoCaptureQrCode\n    }\n  }\n": types.CreatePhotoCaptureRequestDocument,
    "\n  mutation CapturePhoto($photoCaptureRequestId: UUID!, $photo: String!) {\n    capturePhoto(photoCaptureRequestId: $photoCaptureRequestId, photo: $photo)\n  }\n": types.CapturePhotoDocument,
    "\n  query PhotoCaptureStatus($photoCaptureRequestId: UUID!) {\n    photoCaptureStatus(photoCaptureRequestId: $photoCaptureRequestId) {\n      status\n    }\n  }\n": types.PhotoCaptureStatusDocument,
    "\n  fragment TemplateParentDataFragment on Template {\n    parentData {\n      display {\n        locale\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            description\n          }\n        }\n        consent {\n          title\n          instructions\n        }\n        claims {\n          label\n          claim\n          type\n          description\n          value\n        }\n      }\n      isPublic\n      validityIntervalInSeconds\n      credentialTypes\n    }\n  }\n  ": types.TemplateParentDataFragmentFragmentDoc,
    "\n  query GetTemplateParentDataQuery($id: ID!) {\n    template(id: $id) {\n      ...TemplateParentDataFragment\n    }\n  }": types.GetTemplateParentDataQueryDocument,
    "\n  fragment TemplateFragment on Template {\n    id\n    name\n    description\n    parent {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n    credentialTypes\n  }\n": types.TemplateFragmentFragmentDoc,
    "\n  mutation CreateTemplate($input: TemplateInput!) {\n    createTemplate(input: $input) {\n      ...TemplateFragment\n    }\n  }\n": types.CreateTemplateDocument,
    "\n  query GetTemplate($id: ID!) {\n    template(id: $id) {\n      ...TemplateFragment\n    }\n  }": types.GetTemplateDocument,
    "\n  mutation UpdateTemplate($id: ID!, $input: TemplateInput!) {\n    updateTemplate(id: $id, input: $input) {\n      ...TemplateFragment\n    }\n  }\n": types.UpdateTemplateDocument,
    "\n  mutation CreatePartner($input: CreatePartnerInput!) {\n    createPartner(input: $input) {\n      id\n    }\n  }\n": types.CreatePartnerDocument,
    "\n    mutation AcquireLimitedAccessToken($input: AcquireLimitedAccessTokenInput!) {\n      acquireLimitedAccessToken(input: $input) {\n        expires\n        token\n      }\n    }\n  ": types.AcquireLimitedAccessTokenDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation CancelApprovalRequest($id: ID!) {\n      cancelApprovalRequest(id: $id)\n    }\n  "): (typeof documents)["\n    mutation CancelApprovalRequest($id: ID!) {\n      cancelApprovalRequest(id: $id)\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ApprovalRequest($approvalRequestId: ID!) {\n    approvalRequest(id: $approvalRequestId) {\n      id\n      requestedAt\n      expiresAt\n      requestType\n      correlationId\n      referenceUrl\n      purpose\n      requestData\n      actionedComment\n      status\n    }\n  }\n"): (typeof documents)["\n  query ApprovalRequest($approvalRequestId: ID!) {\n    approvalRequest(id: $approvalRequestId) {\n      id\n      requestedAt\n      expiresAt\n      requestType\n      correlationId\n      referenceUrl\n      purpose\n      requestData\n      actionedComment\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateApprovalRequest($input: ApprovalRequestInput!) {\n    createApprovalRequest(request: $input) {\n      id\n      portalUrl\n      callbackSecret\n    }\n  }\n"): (typeof documents)["\n  mutation CreateApprovalRequest($input: ApprovalRequestInput!) {\n    createApprovalRequest(request: $input) {\n      id\n      portalUrl\n      callbackSecret\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation ActionApprovalRequest($id: ID!, $input: ActionApprovalRequestInput!) {\n      actionApprovalRequest(id: $id, input: $input) {\n        id\n        status\n        isApproved\n        actionedComment\n      }\n    }\n  "): (typeof documents)["\n    mutation ActionApprovalRequest($id: ID!, $input: ActionApprovalRequestInput!) {\n      actionApprovalRequest(id: $id, input: $input) {\n        id\n        status\n        isApproved\n        actionedComment\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FindActionedApprovalData($id: ID!) {\n    actionedApprovalData(id: $id) {\n      approvalRequestId\n      correlationId\n      requestData\n      state\n      status\n      actionedComment\n      actionedAt\n      actionedBy {\n        id\n        name\n      }\n      callbackSecret\n    }\n  }"): (typeof documents)["\n  query FindActionedApprovalData($id: ID!) {\n    actionedApprovalData(id: $id) {\n      approvalRequestId\n      correlationId\n      requestData\n      state\n      status\n      actionedComment\n      actionedAt\n      actionedBy {\n        id\n        name\n      }\n      callbackSecret\n    }\n  }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation UpdateApprovalRequest($id: ID!, $input: UpdateApprovalRequestInput!) {\n      updateApprovalRequest(id: $id, input: $input)\n    }\n  "): (typeof documents)["\n    mutation UpdateApprovalRequest($id: ID!, $input: UpdateApprovalRequestInput!) {\n      updateApprovalRequest(id: $id, input: $input)\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelAsyncIssuanceRequest($asyncIssuanceRequestId: UUID!) {\n    cancelAsyncIssuanceRequest(asyncIssuanceRequestId: $asyncIssuanceRequestId) {\n      ...AsyncIssuanceRequestFragment\n    }\n  }\n"): (typeof documents)["\n  mutation CancelAsyncIssuanceRequest($asyncIssuanceRequestId: UUID!) {\n    cancelAsyncIssuanceRequest(asyncIssuanceRequestId: $asyncIssuanceRequestId) {\n      ...AsyncIssuanceRequestFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAsyncIssuanceRequest($request: [AsyncIssuanceRequestInput!]!) {\n    createAsyncIssuanceRequest(request: $request) {\n      ... on AsyncIssuanceResponse {\n        __typename\n        asyncIssuanceRequestIds\n      }\n      ... on AsyncIssuanceErrorResponse {\n        __typename\n        errors\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAsyncIssuanceRequest($request: [AsyncIssuanceRequestInput!]!) {\n    createAsyncIssuanceRequest(request: $request) {\n      ... on AsyncIssuanceResponse {\n        __typename\n        asyncIssuanceRequestIds\n      }\n      ... on AsyncIssuanceErrorResponse {\n        __typename\n        errors\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateIssuanceRequestForAsyncIssuance($asyncIssuanceRequestId: UUID!) {\n    createIssuanceRequestForAsyncIssuance(asyncIssuanceRequestId: $asyncIssuanceRequestId) {\n      ... on IssuanceResponse {\n        __typename\n        requestId\n        url\n        qrCode\n      }\n      ... on RequestErrorResponse {\n        __typename\n        requestId\n        date\n        mscv\n        error {\n          code\n          message\n          innererror {\n            code\n            message\n            target\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateIssuanceRequestForAsyncIssuance($asyncIssuanceRequestId: UUID!) {\n    createIssuanceRequestForAsyncIssuance(asyncIssuanceRequestId: $asyncIssuanceRequestId) {\n      ... on IssuanceResponse {\n        __typename\n        requestId\n        url\n        qrCode\n      }\n      ... on RequestErrorResponse {\n        __typename\n        requestId\n        date\n        mscv\n        error {\n          code\n          message\n          innererror {\n            code\n            message\n            target\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AsyncIssuanceRequestFragment on AsyncIssuanceRequest {\n    id\n    status\n    isStatusFinal\n    failureReason\n    expiry\n    expiresOn\n    createdAt\n    updatedAt\n    identity {\n      id\n    }\n    issuance {\n      id\n    }\n    createdBy {\n      id\n    }\n    updatedBy {\n      id\n    }\n  }\n"): (typeof documents)["\n  fragment AsyncIssuanceRequestFragment on AsyncIssuanceRequest {\n    id\n    status\n    isStatusFinal\n    failureReason\n    expiry\n    expiresOn\n    createdAt\n    updatedAt\n    identity {\n      id\n    }\n    issuance {\n      id\n    }\n    createdBy {\n      id\n    }\n    updatedBy {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAsyncIssuance($id: UUID!) {\n    asyncIssuanceRequest(id: $id) {\n      ...AsyncIssuanceRequestFragment\n    }\n  }\n"): (typeof documents)["\n  query GetAsyncIssuance($id: UUID!) {\n    asyncIssuanceRequest(id: $id) {\n      ...AsyncIssuanceRequestFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResendAsyncIssuanceNotification($asyncIssuanceRequestId: UUID!) {\n    resendAsyncIssuanceNotification(asyncIssuanceRequestId: $asyncIssuanceRequestId) {\n      ...AsyncIssuanceRequestFragment\n    }\n  }\n"): (typeof documents)["\n  mutation ResendAsyncIssuanceNotification($asyncIssuanceRequestId: UUID!) {\n    resendAsyncIssuanceNotification(asyncIssuanceRequestId: $asyncIssuanceRequestId) {\n      ...AsyncIssuanceRequestFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAsyncIssuanceContact($asyncIssuanceRequestId: UUID!, $contact: AsyncIssuanceContactInput!) {\n    updateAsyncIssuanceContact(asyncIssuanceRequestId: $asyncIssuanceRequestId, contact: $contact) {\n      notification {\n        value\n        method\n      }\n      verification {\n        value\n        method\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAsyncIssuanceContact($asyncIssuanceRequestId: UUID!, $contact: AsyncIssuanceContactInput!) {\n    updateAsyncIssuanceContact(asyncIssuanceRequestId: $asyncIssuanceRequestId, contact: $contact) {\n      notification {\n        value\n        method\n      }\n      verification {\n        value\n        method\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ConciergeBranding {\n    conciergeBranding {\n      data\n    }\n  }\n"): (typeof documents)["\n  query ConciergeBranding {\n    conciergeBranding {\n      data\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveConciergeBranding($input: ConciergeBrandingInput!) {\n    saveConciergeBranding(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation SaveConciergeBranding($input: ConciergeBrandingInput!) {\n    saveConciergeBranding(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteConciergeBranding {\n    deleteConciergeBranding\n  }\n"): (typeof documents)["\n  mutation DeleteConciergeBranding {\n    deleteConciergeBranding\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ContractFragment on Contract {\n    id\n    name\n    description\n    template {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    credentialTypes\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n  }\n"): (typeof documents)["\n  fragment ContractFragment on Contract {\n    id\n    name\n    description\n    template {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    credentialTypes\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateContract($input: ContractInput!) {\n    createContract(input: $input) {\n      ...ContractFragment\n    }\n  }\n"): (typeof documents)["\n  mutation CreateContract($input: ContractInput!) {\n    createContract(input: $input) {\n      ...ContractFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeprecateContract($id: ID!) {\n    deprecateContract(id: $id) {\n      ...ContractFragment,\n      externalId,\n      provisionedAt,\n      lastProvisionedAt,\n      isDeprecated,\n      deprecatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation DeprecateContract($id: ID!) {\n    deprecateContract(id: $id) {\n      ...ContractFragment,\n      externalId,\n      provisionedAt,\n      lastProvisionedAt,\n      isDeprecated,\n      deprecatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetContract($id: ID!) {\n    contract(id: $id) {\n      ...ContractFragment\n    }\n  }"): (typeof documents)["\n  query GetContract($id: ID!) {\n    contract(id: $id) {\n      ...ContractFragment\n    }\n  }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ProvisionContract($id: ID!) {\n    provisionContract(id: $id) {\n      ...ContractFragment,\n      externalId,\n      provisionedAt,\n      lastProvisionedAt\n    }\n  }\n"): (typeof documents)["\n  mutation ProvisionContract($id: ID!) {\n    provisionContract(id: $id) {\n      ...ContractFragment,\n      externalId,\n      provisionedAt,\n      lastProvisionedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateContract($id: ID!, $input: ContractInput!) {\n    updateContract(id: $id, input: $input) {\n      ...ContractFragment\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateContract($id: ID!, $input: ContractInput!) {\n    updateContract(id: $id, input: $input) {\n      ...ContractFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Healthcheck {\n    healthcheck\n  }\n"): (typeof documents)["\n  query Healthcheck {\n    healthcheck\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Identity($id: ID!) {\n    identity(id: $id) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n"): (typeof documents)["\n  query Identity($id: ID!) {\n    identity(id: $id) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FindIdentities($where: IdentityWhere, $limit: PositiveInt, $offset: PositiveInt) {\n    findIdentities(where: $where, limit: $limit, offset: $offset) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n"): (typeof documents)["\n  query FindIdentities($where: IdentityWhere, $limit: PositiveInt, $offset: PositiveInt) {\n    findIdentities(where: $where, limit: $limit, offset: $offset) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveIdentity($input: IdentityInput!) {\n    saveIdentity(input: $input) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation SaveIdentity($input: IdentityInput!) {\n    saveIdentity(input: $input) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateIssuanceRequest($request: IssuanceRequestInput!) {\n    createIssuanceRequest(request: $request) {\n      ... on IssuanceResponse {\n        requestId\n        url\n        qrCode\n      }\n      ... on RequestErrorResponse {\n        error {\n          code\n          message\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateIssuanceRequest($request: IssuanceRequestInput!) {\n    createIssuanceRequest(request: $request) {\n      ... on IssuanceResponse {\n        requestId\n        url\n        qrCode\n      }\n      ... on RequestErrorResponse {\n        error {\n          code\n          message\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AcquireLimitedAccessToken($input: AcquireLimitedAccessTokenInput!) {\n    acquireLimitedAccessToken(input: $input) {\n      expires\n      token\n    }\n  }\n"): (typeof documents)["\n  mutation AcquireLimitedAccessToken($input: AcquireLimitedAccessTokenInput!) {\n    acquireLimitedAccessToken(input: $input) {\n      expires\n      token\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FindContracts($where: ContractWhere, $forIdentityId: ID) {\n    findContracts(where: $where) {\n      id\n      credentialTypes\n      display {\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            description\n          }\n        }\n      }\n      issuances(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        issuedAt\n        expiresAt\n      }\n      presentations(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        presentedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query FindContracts($where: ContractWhere, $forIdentityId: ID) {\n    findContracts(where: $where) {\n      id\n      credentialTypes\n      display {\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            description\n          }\n        }\n      }\n      issuances(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        issuedAt\n        expiresAt\n      }\n      presentations(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        presentedAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Contract($id: ID!, $forIdentityId: ID) {\n    contract(id: $id) {\n      id\n      credentialTypes\n      display {\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            description\n          }\n        }\n      }\n      issuances(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        issuedAt\n        expiresAt\n      }\n      presentations(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        presentedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query Contract($id: ID!, $forIdentityId: ID) {\n    contract(id: $id) {\n      id\n      credentialTypes\n      display {\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            description\n          }\n        }\n      }\n      issuances(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        issuedAt\n        expiresAt\n      }\n      presentations(where: { identityId: $forIdentityId }, limit: 1) {\n        id\n        presentedAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FindIssuances($where: IssuanceWhere) {\n    findIssuances(where: $where) {\n      issuedAt\n    }\n  }\n"): (typeof documents)["\n  query FindIssuances($where: IssuanceWhere) {\n    findIssuances(where: $where) {\n      issuedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CredentialTypes {\n    credentialTypes\n  }\n"): (typeof documents)["\n  query CredentialTypes {\n    credentialTypes\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePresentationRequest($request: PresentationRequestInput!) {\n    createPresentationRequest(request: $request) {\n      ... on PresentationResponse {\n        requestId\n        url\n        qrCode\n        expiry\n      }\n      ... on RequestErrorResponse {\n        error {\n          code\n          message\n          innererror {\n            code\n            message\n            target\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePresentationRequest($request: PresentationRequestInput!) {\n    createPresentationRequest(request: $request) {\n      ... on PresentationResponse {\n        requestId\n        url\n        qrCode\n        expiry\n      }\n      ... on RequestErrorResponse {\n        error {\n          code\n          message\n          innererror {\n            code\n            message\n            target\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AcquireLimitedApprovalToken($input: AcquireLimitedApprovalTokenInput!) {\n    acquireLimitedApprovalToken(input: $input) {\n      token\n      expires\n    }\n  }\n"): (typeof documents)["\n  mutation AcquireLimitedApprovalToken($input: AcquireLimitedApprovalTokenInput!) {\n    acquireLimitedApprovalToken(input: $input) {\n      token\n      expires\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AcquireLimitedPhotoCaptureToken($input: AcquireLimitedPhotoCaptureTokenInput!) {\n    acquireLimitedPhotoCaptureToken(input: $input) {\n      token\n      expires\n    }\n  }\n"): (typeof documents)["\n  mutation AcquireLimitedPhotoCaptureToken($input: AcquireLimitedPhotoCaptureTokenInput!) {\n    acquireLimitedPhotoCaptureToken(input: $input) {\n      token\n      expires\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment OidcClientFragment on OidcClient {\n    id\n    name\n    logo\n    backgroundColor\n    backgroundImage\n    policyUrl\n    termsOfServiceUrl\n    applicationType\n    redirectUris\n    postLogoutUris\n    requireFaceCheck\n    allowAnyPartner\n    partners {\n      id\n      name\n      did\n      credentialTypes\n      linkedDomainUrls\n    }\n    uniqueClaimsForSubjectId\n    credentialTypes\n    resources {\n      resource {\n        id\n        name\n        resourceIndicator\n        scopes\n      }\n      resourceScopes\n    }\n    createdBy {\n      id\n      name\n    }\n    createdAt\n    updatedBy {\n      id\n      name\n    }\n    updatedAt\n    deletedAt\n  }\n"): (typeof documents)["\n  fragment OidcClientFragment on OidcClient {\n    id\n    name\n    logo\n    backgroundColor\n    backgroundImage\n    policyUrl\n    termsOfServiceUrl\n    applicationType\n    redirectUris\n    postLogoutUris\n    requireFaceCheck\n    allowAnyPartner\n    partners {\n      id\n      name\n      did\n      credentialTypes\n      linkedDomainUrls\n    }\n    uniqueClaimsForSubjectId\n    credentialTypes\n    resources {\n      resource {\n        id\n        name\n        resourceIndicator\n        scopes\n      }\n      resourceScopes\n    }\n    createdBy {\n      id\n      name\n    }\n    createdAt\n    updatedBy {\n      id\n      name\n    }\n    updatedAt\n    deletedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateOidcClient($input: OidcClientInput!) {\n    createOidcClient(input: $input) {\n      ...OidcClientFragment\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOidcClient($input: OidcClientInput!) {\n    createOidcClient(input: $input) {\n      ...OidcClientFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateOidcClient($id: ID!, $input: OidcClientInput!) {\n    updateOidcClient(id: $id, input: $input) {\n      ...OidcClientFragment\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateOidcClient($id: ID!, $input: OidcClientInput!) {\n    updateOidcClient(id: $id, input: $input) {\n      ...OidcClientFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteOidcClient($id: ID!) {\n    deleteOidcClient(id: $id) {\n      ...OidcClientFragment\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteOidcClient($id: ID!) {\n    deleteOidcClient(id: $id) {\n      ...OidcClientFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FindOidcClients(\n    $where: OidcClientWhere\n    $offset: PositiveInt\n    $limit: PositiveInt\n    $orderBy: OidcClientOrderBy\n    $orderDirection: OrderDirection\n  ) {\n    findOidcClients(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {\n      ...OidcClientFragment\n    }\n  }\n"): (typeof documents)["\n  query FindOidcClients(\n    $where: OidcClientWhere\n    $offset: PositiveInt\n    $limit: PositiveInt\n    $orderBy: OidcClientOrderBy\n    $orderDirection: OrderDirection\n  ) {\n    findOidcClients(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {\n      ...OidcClientFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OidcClient($id: ID!) {\n    oidcClient(id: $id) {\n      ...OidcClientFragment\n    }\n  }\n"): (typeof documents)["\n  query OidcClient($id: ID!) {\n    oidcClient(id: $id) {\n      ...OidcClientFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment OidcResourceFragment on OidcResource {\n    id\n    name\n    resourceIndicator\n    scopes\n    createdBy {\n      id\n      name\n    }\n    createdAt\n    updatedBy {\n      id\n      name\n    }\n    updatedAt\n    deletedAt\n  }\n"): (typeof documents)["\n  fragment OidcResourceFragment on OidcResource {\n    id\n    name\n    resourceIndicator\n    scopes\n    createdBy {\n      id\n      name\n    }\n    createdAt\n    updatedBy {\n      id\n      name\n    }\n    updatedAt\n    deletedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateOidcResource($input: OidcResourceInput!) {\n    createOidcResource(input: $input) {\n      ...OidcResourceFragment\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOidcResource($input: OidcResourceInput!) {\n    createOidcResource(input: $input) {\n      ...OidcResourceFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateOidcResource($id: ID!, $input: OidcResourceInput!) {\n    updateOidcResource(id: $id, input: $input) {\n      ...OidcResourceFragment\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateOidcResource($id: ID!, $input: OidcResourceInput!) {\n    updateOidcResource(id: $id, input: $input) {\n      ...OidcResourceFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteOidcResource($id: ID!) {\n    deleteOidcResource(id: $id) {\n      ...OidcResourceFragment\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteOidcResource($id: ID!) {\n    deleteOidcResource(id: $id) {\n      ...OidcResourceFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FindOidcResources(\n    $where: OidcResourceWhere\n    $offset: PositiveInt\n    $limit: PositiveInt\n    $orderBy: OidcResourceOrderBy\n    $orderDirection: OrderDirection\n  ) {\n    findOidcResources(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {\n      ...OidcResourceFragment\n    }\n  }\n"): (typeof documents)["\n  query FindOidcResources(\n    $where: OidcResourceWhere\n    $offset: PositiveInt\n    $limit: PositiveInt\n    $orderBy: OidcResourceOrderBy\n    $orderDirection: OrderDirection\n  ) {\n    findOidcResources(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {\n      ...OidcResourceFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OidcResource($id: ID!) {\n    oidcResource(id: $id) {\n      ...OidcResourceFragment\n    }\n  }\n"): (typeof documents)["\n  query OidcResource($id: ID!) {\n    oidcResource(id: $id) {\n      ...OidcResourceFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateOidcClientResource($clientId: ID!, $input: OidcClientResourceInput!) {\n    createOidcClientResource(clientId: $clientId, input: $input) {\n      ...OidcClientFragment\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOidcClientResource($clientId: ID!, $input: OidcClientResourceInput!) {\n    createOidcClientResource(clientId: $clientId, input: $input) {\n      ...OidcClientFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateOidcClientResource($clientId: ID!, $input: OidcClientResourceInput!) {\n    updateOidcClientResource(clientId: $clientId, input: $input) {\n      ...OidcClientFragment\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateOidcClientResource($clientId: ID!, $input: OidcClientResourceInput!) {\n    updateOidcClientResource(clientId: $clientId, input: $input) {\n      ...OidcClientFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteOidcClientResource($clientId: ID!, $resourceId: ID!) {\n    deleteOidcClientResource(clientId: $clientId, resourceId: $resourceId) {\n      ...OidcClientFragment\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteOidcClientResource($clientId: ID!, $resourceId: ID!) {\n    deleteOidcClientResource(clientId: $clientId, resourceId: $resourceId) {\n      ...OidcClientFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePhotoCaptureRequest($request: PhotoCaptureRequest!) {\n    createPhotoCaptureRequest(request: $request) {\n      id\n      photoCaptureUrl\n      photoCaptureQrCode\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePhotoCaptureRequest($request: PhotoCaptureRequest!) {\n    createPhotoCaptureRequest(request: $request) {\n      id\n      photoCaptureUrl\n      photoCaptureQrCode\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CapturePhoto($photoCaptureRequestId: UUID!, $photo: String!) {\n    capturePhoto(photoCaptureRequestId: $photoCaptureRequestId, photo: $photo)\n  }\n"): (typeof documents)["\n  mutation CapturePhoto($photoCaptureRequestId: UUID!, $photo: String!) {\n    capturePhoto(photoCaptureRequestId: $photoCaptureRequestId, photo: $photo)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PhotoCaptureStatus($photoCaptureRequestId: UUID!) {\n    photoCaptureStatus(photoCaptureRequestId: $photoCaptureRequestId) {\n      status\n    }\n  }\n"): (typeof documents)["\n  query PhotoCaptureStatus($photoCaptureRequestId: UUID!) {\n    photoCaptureStatus(photoCaptureRequestId: $photoCaptureRequestId) {\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TemplateParentDataFragment on Template {\n    parentData {\n      display {\n        locale\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            description\n          }\n        }\n        consent {\n          title\n          instructions\n        }\n        claims {\n          label\n          claim\n          type\n          description\n          value\n        }\n      }\n      isPublic\n      validityIntervalInSeconds\n      credentialTypes\n    }\n  }\n  "): (typeof documents)["\n  fragment TemplateParentDataFragment on Template {\n    parentData {\n      display {\n        locale\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            description\n          }\n        }\n        consent {\n          title\n          instructions\n        }\n        claims {\n          label\n          claim\n          type\n          description\n          value\n        }\n      }\n      isPublic\n      validityIntervalInSeconds\n      credentialTypes\n    }\n  }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTemplateParentDataQuery($id: ID!) {\n    template(id: $id) {\n      ...TemplateParentDataFragment\n    }\n  }"): (typeof documents)["\n  query GetTemplateParentDataQuery($id: ID!) {\n    template(id: $id) {\n      ...TemplateParentDataFragment\n    }\n  }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TemplateFragment on Template {\n    id\n    name\n    description\n    parent {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n    credentialTypes\n  }\n"): (typeof documents)["\n  fragment TemplateFragment on Template {\n    id\n    name\n    description\n    parent {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n    credentialTypes\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTemplate($input: TemplateInput!) {\n    createTemplate(input: $input) {\n      ...TemplateFragment\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTemplate($input: TemplateInput!) {\n    createTemplate(input: $input) {\n      ...TemplateFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTemplate($id: ID!) {\n    template(id: $id) {\n      ...TemplateFragment\n    }\n  }"): (typeof documents)["\n  query GetTemplate($id: ID!) {\n    template(id: $id) {\n      ...TemplateFragment\n    }\n  }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTemplate($id: ID!, $input: TemplateInput!) {\n    updateTemplate(id: $id, input: $input) {\n      ...TemplateFragment\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTemplate($id: ID!, $input: TemplateInput!) {\n    updateTemplate(id: $id, input: $input) {\n      ...TemplateFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePartner($input: CreatePartnerInput!) {\n    createPartner(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePartner($input: CreatePartnerInput!) {\n    createPartner(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation AcquireLimitedAccessToken($input: AcquireLimitedAccessTokenInput!) {\n      acquireLimitedAccessToken(input: $input) {\n        expires\n        token\n      }\n    }\n  "): (typeof documents)["\n    mutation AcquireLimitedAccessToken($input: AcquireLimitedAccessTokenInput!) {\n      acquireLimitedAccessToken(input: $input) {\n        expires\n        token\n      }\n    }\n  "];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;