# Verified Orchestration API

The verified orchestration platform GraphQL API backend repository.

## Developer prerequisites
- docker
- node v18 LTS

## Getting started
- `npm i`
- `cp .env.template .env`
- fill in `.env` secrets from 1password vault
- run tasks: Start DB & Migrate DB
- F5

**Tip:** If you are getting `Not Authorised!` error when browsing to `http://localhost:4000` and running any query for the first time, then turn on `Include cookies` setting in `Connection settings` dialog of Apollo sandbox. 