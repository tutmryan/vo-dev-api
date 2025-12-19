ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-slim AS base
LABEL fly_launch_runtime="Node.js"
WORKDIR /app
ENV NODE_ENV="production"

FROM base AS build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3
COPY package-lock.json package.json ./
RUN npm ci --include=dev
COPY . .
WORKDIR /app/docs-site
RUN npm run generate-graphql-docs
RUN npm run generate-permissions-docs
RUN npm run build
RUN npm prune --omit=dev

FROM base
COPY --from=build /app/docs-site /app
EXPOSE 3000
CMD ["npm", "run", "serve"]
