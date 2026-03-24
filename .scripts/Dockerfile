FROM node:24-alpine AS build

WORKDIR /build

COPY ./package.json /build/.

ARG BUILD_VERSION
RUN npm version --no-git-tag-version "$BUILD_VERSION"

WORKDIR /build/.scripts

COPY .scripts/package.json .scripts/package-lock.json /build/.scripts/
RUN npm ci

WORKDIR /build

COPY . /build

RUN node .scripts/generate_all_json.js
RUN node .scripts/generate_id_schemas.js
RUN node .scripts/generate_other_schemas.js
RUN node .scripts/validate.js
RUN node .scripts/compile_schemas.js
RUN node .scripts/generate_api_ts.js
RUN node .scripts/generate_search_indexes.js
RUN node .scripts/generate_health.js

RUN npx biome check api/ --write

RUN rm -r .[^.]*

FROM httpd:2.4.62-alpine AS prod

COPY --from=build /build/. /usr/local/apache2/htdocs