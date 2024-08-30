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