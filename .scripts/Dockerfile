FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-version

RUN mkdir -p /build
WORKDIR /build

RUN dotnet tool install GitVersion.Tool --global --version 6.0.*
ENV PATH="${PATH}:/root/.dotnet/tools"

COPY .git /build/.
RUN SEMVER=$(dotnet-gitversion /output json /format {SemVer}) \
    && echo "SEMVER=$SEMVER" > .version

FROM node:24-alpine AS build

COPY --from=build-version /build/.version /build/.

WORKDIR /build

COPY ./package.json /build/.
RUN source /build/.version && \
    npm version --no-git-tag-version "$SEMVER"

WORKDIR /build/.scripts

COPY .scripts/package.json .scripts/package-lock.json /build/.scripts/
RUN npm ci
COPY .scripts /build/.scripts

WORKDIR /build

COPY . /build

RUN node .scripts/generate_all_json
RUN node .scripts/generate_id_schemas
RUN node .scripts/generate_other_schemas
RUN node .scripts/validate
RUN node .scripts/compile_schemas.js
RUN node .scripts/generate_api_ts.js
RUN node .scripts/generate_search_indexes.js
RUN node .scripts/generate_health.js

RUN rm -r .[^.]*

FROM httpd:2.4.62-alpine AS prod

COPY --from=build /build/. /usr/local/apache2/htdocs