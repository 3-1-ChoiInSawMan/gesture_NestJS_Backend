ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS install

WORKDIR /opt/app

# mediasoup downloads a native Worker, or builds it when no matching binary exists.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv build-essential ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node package*.json ./

RUN npm ci

# BUILD
FROM install AS build

COPY --chown=node:node tsconfig*.json ./
COPY --chown=node:node nest-cli.json ./
COPY --chown=node:node src src/

RUN npm run build

RUN npm prune --omit=dev && npm cache clean --force


# RUNTIME
FROM node:${NODE_VERSION}-bookworm-slim AS runtime

WORKDIR /opt/app
RUN chown node:node /opt/app

COPY --from=build --chown=node:node /opt/app/dist dist/
COPY --from=build --chown=node:node /opt/app/node_modules node_modules/

RUN chown node:node /opt/app

USER node

EXPOSE 8080
EXPOSE 6002-6202/udp 6002-6202/tcp

CMD ["node", "dist/main"]
