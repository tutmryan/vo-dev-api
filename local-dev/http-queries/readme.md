# About

These HTTP queries are used to test interactions with APIs, such as the MS or local one. They're a good way for developers to research and commit their results to the repository.

## Usage

These files are formatted for use with the [HTTP Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension in Visual Studio Code. They may work with other HTTP clients, but they are primarily designed for this extension.

## Setup

Copy the .env.template file to .env and fill in the required values. This file stores sensitive information such as API keys, tokens, and other credentials. It should not be committed to the repository.

## Not a VS Code User?

Not everyone uses VS Code, so recognising and supporting this is important. In such a case, you have a few options:

1. Use VS Code, but only for running these queries.
2. Use these queries directly in your own HTTP client. Or use them as a reference for your own queries.

# Microsoft reference material

MS has [published](https://github.com/Azure-Samples/active-directory-verifiable-credentials/tree/main/Postman) a collection of reference material for use with [Postman](https://www.postman.com/). Postman is a click-based REST client that is used by some. Other popular tools in the space include [Insomnia](https://insomnia.rest/), [Rapid API](https://paw.cloud/), and others.

> [!IMPORTANT]
> Most of these clients include cloud-based features. It's very **IMPORTANT** that no secrets or sensitive information are shared with these providers!
