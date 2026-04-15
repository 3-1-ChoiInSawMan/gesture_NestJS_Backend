ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS install

WORKDIR /opt/app

COPY --chown=node:node package*.json ./

RUN npm ci 

# BUILD
FROM install AS build

COPY --chown=node:node tsconfig*.json ./
COPY --chown=node:node src src/

RUN npm run build

RUN rm -rf node_modules

RUN npm ci --production && npm cache clean --force


# RUNTIME
FROM node:${NODE_VERSION}-alpine AS runtime

ENV SERVICE_PORT=8080
ENV SPRING_SERVER_URL=http://localhost:8082
ENV SECURITY_PUBLIC_KEY=YOUR_PUBLIC_KEY
ENV SECURITY_CORS_ORIGIN=http://localhost:5173,http://localhost:8082,http://localhost:3000

WORKDIR /opt/app

COPY --from=build --chown=node:node /opt/app/dist dist/
COPY --from=build --chown=node:node /opt/app/node_modules node_modules/

USER node

EXPOSE 8080

CMD ["node", "dist/main"]