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
    "\n  fragment ContractFragment on Contract {\n    id\n    name\n    description\n    template {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    credentialTypes\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n  }\n": types.ContractFragmentFragmentDoc,
    "\n  mutation CreateContract($input: ContractInput!) {\n    createContract(input: $input) {\n      ...ContractFragment\n    }\n  }\n": types.CreateContractDocument,
    "\n  query GetContract($id: ID!) {\n    contract(id: $id) {\n      ...ContractFragment\n    }\n  }": types.GetContractDocument,
    "\n  mutation UpdateContract($id: ID!, $input: ContractInput!) {\n    updateContract(id: $id, input: $input) {\n      ...ContractFragment\n    }\n  }\n": types.UpdateContractDocument,
    "\n  query Healthcheck {\n    healthcheck\n  }\n": types.HealthcheckDocument,
    "\n  query Identity($id: ID!) {\n    identity(id: $id) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n": types.IdentityDocument,
    "\n  mutation SaveIdentity($input: IdentityInput!) {\n    saveIdentity(input: $input) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n": types.SaveIdentityDocument,
    "\n  fragment TemplateParentDataFragment on Template {\n    parentData {\n      display {\n        locale\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            image\n            description\n          }\n        }\n        consent {\n          title\n          instructions\n        }\n        claims {\n          label\n          claim\n          type\n          description\n          value\n        }\n      }\n      isPublic\n      validityIntervalInSeconds\n    }\n  }\n  ": types.TemplateParentDataFragmentFragmentDoc,
    "\n  query GetTemplateParentDataQuery($id: ID!) {\n    template(id: $id) {\n      ...TemplateParentDataFragment\n    }\n  }": types.GetTemplateParentDataQueryDocument,
    "\n  fragment TemplateFragment on Template {\n    id\n    name\n    description\n    parent {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n  }\n": types.TemplateFragmentFragmentDoc,
    "\n  mutation CreateTemplate($input: TemplateInput!) {\n    createTemplate(input: $input) {\n      ...TemplateFragment\n    }\n  }\n": types.CreateTemplateDocument,
    "\n  query GetTemplate($id: ID!) {\n    template(id: $id) {\n      ...TemplateFragment\n    }\n  }": types.GetTemplateDocument,
    "\n  mutation UpdateTemplate($id: ID!, $input: TemplateInput!) {\n    updateTemplate(id: $id, input: $input) {\n      ...TemplateFragment\n    }\n  }\n": types.UpdateTemplateDocument,
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
export function graphql(source: "\n  fragment ContractFragment on Contract {\n    id\n    name\n    description\n    template {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    credentialTypes\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n  }\n"): (typeof documents)["\n  fragment ContractFragment on Contract {\n    id\n    name\n    description\n    template {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    credentialTypes\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateContract($input: ContractInput!) {\n    createContract(input: $input) {\n      ...ContractFragment\n    }\n  }\n"): (typeof documents)["\n  mutation CreateContract($input: ContractInput!) {\n    createContract(input: $input) {\n      ...ContractFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetContract($id: ID!) {\n    contract(id: $id) {\n      ...ContractFragment\n    }\n  }"): (typeof documents)["\n  query GetContract($id: ID!) {\n    contract(id: $id) {\n      ...ContractFragment\n    }\n  }"];
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
export function graphql(source: "\n  mutation SaveIdentity($input: IdentityInput!) {\n    saveIdentity(input: $input) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation SaveIdentity($input: IdentityInput!) {\n    saveIdentity(input: $input) {\n      id\n      issuer\n      identifier\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TemplateParentDataFragment on Template {\n    parentData {\n      display {\n        locale\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            image\n            description\n          }\n        }\n        consent {\n          title\n          instructions\n        }\n        claims {\n          label\n          claim\n          type\n          description\n          value\n        }\n      }\n      isPublic\n      validityIntervalInSeconds\n    }\n  }\n  "): (typeof documents)["\n  fragment TemplateParentDataFragment on Template {\n    parentData {\n      display {\n        locale\n        card {\n          title\n          issuedBy\n          backgroundColor\n          textColor\n          description\n          logo {\n            uri\n            image\n            description\n          }\n        }\n        consent {\n          title\n          instructions\n        }\n        claims {\n          label\n          claim\n          type\n          description\n          value\n        }\n      }\n      isPublic\n      validityIntervalInSeconds\n    }\n  }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTemplateParentDataQuery($id: ID!) {\n    template(id: $id) {\n      ...TemplateParentDataFragment\n    }\n  }"): (typeof documents)["\n  query GetTemplateParentDataQuery($id: ID!) {\n    template(id: $id) {\n      ...TemplateParentDataFragment\n    }\n  }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TemplateFragment on Template {\n    id\n    name\n    description\n    parent {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n  }\n"): (typeof documents)["\n  fragment TemplateFragment on Template {\n    id\n    name\n    description\n    parent {\n      id\n      name\n      description\n      isPublic\n      validityIntervalInSeconds\n    }\n    display {\n      locale\n      card {\n        title\n        issuedBy\n        backgroundColor\n        textColor\n        description\n        logo {\n          uri\n          image\n          description\n        }\n      }\n      consent {\n        title\n        instructions\n      }\n      claims {\n        label\n        claim\n        type\n        description\n        value\n      }\n    }\n    isPublic\n    validityIntervalInSeconds\n  }\n"];
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

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;