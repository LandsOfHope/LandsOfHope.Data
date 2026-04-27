ARG BUN_VERSION

FROM oven/bun:${BUN_VERSION} AS dev

FROM dev AS build

RUN apt-get update && apt-get install -y rsync && apt-get clean

WORKDIR /build

COPY ./package.json /build/.

ARG BUILD_VERSION
RUN bun pm version --no-git-tag-version "$BUILD_VERSION"

WORKDIR /build/.scripts

COPY .scripts/package.json .scripts/bun.lock /build/.scripts/
RUN bun install --production

WORKDIR /build

COPY . /build

RUN bun .scripts/generate_all_json.js
RUN bun .scripts/generate_id_schemas.js
RUN bun .scripts/generate_other_schemas.js
RUN bun .scripts/validate.js
RUN bun .scripts/compile_schemas.js
RUN find schemas/**/*.json | xargs -n1 -P0 bun .scripts/generate_api_ts.ts
RUN bun .scripts/generate_search_indexes.js
RUN bun .scripts/generate_health.js

RUN bunx biome check api/ --write

RUN mkdir dist
RUN rsync --archive --exclude-from='.scripts/dist-exclude.txt' /build/ /build/dist/

FROM httpd:2.4.62-alpine AS prod

COPY --from=build /build/dist/. /usr/local/apache2/htdocs