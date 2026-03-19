ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-slim AS base
LABEL fly_launch_runtime="Node.js"
WORKDIR /app
ENV NODE_ENV="production"

FROM base AS build
WORKDIR /app/docs-site
RUN apt-get update -qq && apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3
COPY docs-site/package-lock.json docs-site/package.json ./
RUN npm ci --include=dev

COPY . ../
RUN npm run generate-graphql-docs &&\
  npm run generate-permissions-docs &&\
  npm run build &&\
  npm prune --omit=dev

FROM nginx:stable-alpine3.23

LABEL org.opencontainers.image.source="https://github.com/verified-orchestration/verified-orchestration-api"
LABEL org.opencontainers.image.description="Verified Orchestration API Documentation Site"

COPY --from=build /app/docs-site/build /usr/share/nginx/html

RUN cat > /docker-entrypoint.sh <<'EOF'
#!/bin/sh
set -e
if [ -z "$DOCS_SITE_URL_OLD" ] || [ -z "$DOCS_SITE_URL" ]; then
  echo "Error: DOCS_SITE_URL_OLD and DOCS_SITE_URL environment variables must be set"
  exit 1
fi
sed -i "s/DOCS_SITE_URL_OLD/${DOCS_SITE_URL_OLD}/g" /etc/nginx/conf.d/default.conf
sed -i "s/DOCS_SITE_URL/${DOCS_SITE_URL}/g" /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
EOF

RUN chmod +x /docker-entrypoint.sh
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
  listen 3000;
  listen [::]:3000;
  server_name DOCS_SITE_URL_OLD;
  return 301 https://DOCS_SITE_URL$request_uri;
}

server {
  listen 3000;
  listen [::]:3000;
  server_name DOCS_SITE_URL;

  root /usr/share/nginx/html;
  index index.html;
  absolute_redirect off;

  location / {
    try_files $uri $uri/ /index.html;
  }

  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
EOF
EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
