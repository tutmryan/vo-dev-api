# Welcome to the GraphQL documentation writing guide

In this guide, you will learn how VO writes documentation for the GraphQL API. There are a few items to cover before we get started:

  1. This aims to guide, not specify. The goal is to provide a consistent structure and style for the documentation, but it is a flexible rulebook.
  2. This guide is a living document. If you have suggestions for improvement, please open an issue or pull request.
  3. It is designed to be referenced while writing documentation.

## A few common rules

  1. Use the present tense. For example, "The API returns" instead of "The API will return".
  2. Use the imperative mood. For example, "Create a new user" instead of "Creating a new user".
  3. Use the active voice. For example, "The API returns" instead of "The response is returned by the API".
  4. Use the second person. For example, "You can create a new user" instead of "A new user can be created".

Lastly, you should end your sentences with a period. It is much easier to remember whether you should or shouldn't.

## A general guide to writing documentation

When writing documentation, try to imagine yourself as someone new to the API. What would you want to know? What would you need to know to use the API effectively?

Here are a few general tips to keep in mind:

  1. **Be clear and concise**: Avoid jargon and overly technical language. Use simple language and short sentences.
  2. **Use examples**: Examples are a great way to help users understand how to use the API.

## Getting dirty with the GraphQL documentation

When writing documentation for the GraphQL API, you should follow the structure outlined below. This structure is designed to provide a consistent and easy-to-follow format for the documentation.

### Titles (Types, Inputs, Enums, Unions, Interfaces)

To pass the linter, each type, input, enum, and union must have a comment. Think of the comment here as a title. It should describe what the user can expect to find.

```graphql
"""
The possible contact methods.
"""
enum ContactMethod {
  sms
  email
}
```

### Descriptions (Fields)

To pass the linter, each field must have a comment that describes what it is, what it does, and how it is used. We introduce and expand on a single idea or concept, like a paragraph.

```graphql
"""
An async issuance issuee's contact information.
"""
input AsyncIssuanceIssueeContact {
  """
  The method of contact.
  """
  method: ContactMethod!
  """
  The value of the contact method.

  For example, if the method is `sms`, the value would be a phone number.
  """
  value: String!
}
```

### Notes

A note is an addition to a comment that provides additional information about the 'thing' you're documenting. It should be used to provide context or additional information that is not directly written in the comment.

A single note is to be written using the list format with a single item, as it's easier to read and understand.

A few items of note here are:

 - Use the 's' when there is more than one item.
 - Prefer 'to' instead of 'of', as 'to' suggests items that should be observed or remembered. 
 - The linebreak between the list is required for rendering correctly in Apollo (Docusaurus is unaffected)

GraphQL documentation does not support linking to other parts. Sometimes, however, linking to different parts is beneficial. Unfortunately, because it's not supported directly, there is no tooling to ensure the accuracy of the documentation when refactoring the code base. Due to this, we recommend avoiding direct references like 'See the `ContractInput`.`display` field for further information.' Instead, we recommend directing without specificity, like 'Review contract creation for more information'.

```grapql
"""

Items to note:

- You must fulfil the definition of contract claims. See the contract creation.
- See `ContractInput` for further information.

"""
```

#### Format

```graphql
"""
Items to note:

- One
- ...

**Critical items** to note:

- One
- ...
```

#### Example

```graphql
"""
The expiry time for the async issuance request.

Items to note:

- The period starts upon creation of the request.
- No further issuances are possible after expiry.
- Unclaimed PII data associated with an issuance is automatically removed at expiry.

**Critical item** to note:

- VO **cannot** recover PII data after expiry. This is designed to protect the privacy of the issue.
"""
expiry: AsyncIssuanceRequestExpiry!
```

### Required

In certain situations, an input may require one property to be set out of two or more optional properties. A single property can be marked as required using the `!` character. For example, `contractId: ID!`. However, there isn't a way to do this for multiple properties. Multiple properties must be marked as optional (no `!`), and validation is applied by the logic embedded in the server-side logic handling the input.

> 💡 [OneOf](https://github.com/graphql/graphql-spec/pull/825), a GraphQL RFC, is on its way to help solve this situation. However, as of 05/08/2024, it isn't stage 3, so it may change.

To help communicate this situation of a single required property from two or more optional properties, VO uses the following specific call-out method:

- Leveraging the 'Notes' formatting guidance to reduce the noise introduced with an additional formatting way.
- Placing the required comment as the first item in the notes list.

For example, the `identity` or `identityId` field is required in the following `AsyncIssuanceRequestInput` input.

```graphql
"""
Represents the input required to create an async issuance request.
"""
input AsyncIssuanceRequestInput {
  """
  The ID of the identity to issue to.

  Items of note:

  - _Required:_ When not using the identity property.
  """
  identityId: ID

  """
  The identity to issue to.

  Items of note:

  - _Required:_ When not using the identityId property.
  """
  identity: IdentityInput
}
```

### Optionals

Understanding the context of the optionally supplied fields can sometimes be crucial. We call out for further explanation where a deeper understanding is required.

The specific call-out includes:

- Leveraging the 'Notes' formatting guidance to reduce the noise introduced with an additional formatting way.
- Placing the optional comment as the first item in the notes list.

For example, the verification field is optional in the following `AsyncIssuanceIssuee` input. However, when it is not set, the required notification field will be used instead. This information is surfaced using the optional formatting in the verification property document comment.

```graphql

"""
An async issuance issuee's information.
"""
input AsyncIssuanceIssuee {
  """
  How the notification will be sent.
  """
  notification: AsyncIssuanceIssueeContact!

  """
  How the verification will be sent.

  Items to note:

  - _Optional:_ When no verification contact is set, the notification contact is used for verification.
  """
  verification: AsyncIssuanceIssueeContact
}
```
