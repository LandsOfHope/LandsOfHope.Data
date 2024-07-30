"use strict";

const util = require("util");
const exec = util.promisify(require("child_process").exec);
const glob = require("glob");
const { basename, dirname } = require("path");
const readFile = util.promisify(require("fs").readFile);

const schemas = glob.sync("schemas/v*/**/*.json");
const schemasWithOptionalTypeSpecifier = [
  // for logistical reasons these types should allow $type to be omitted in some circumstances

  // professions ands races were 'exported' by hand and I'm too lazy to fix them all right now.  
  // If/when proper exports are written, these can be removed
  'https://data.landsofhope.com/schemas/v1/profession.json',
  'https://data.landsofhope.com/schemas/v1/race.json',

  // service spec is compatible with package.json; $type would break that compatibility
  'https://data.landsofhope.com/schemas/v1/services/service.json',
  'https://data.landsofhope.com/schemas/v1/services/service-dependency.json',
  // it's just ugly
  'https://data.landsofhope.com/schemas/v1/localized-string.json',

  // the following map types are ignored primarily due to laziness and not due to techinal reasons
  // the export needs to be updated to include the types
  'https://data.landsofhope.com/schemas/v1/maps/map.json',
  'https://data.landsofhope.com/schemas/v1/maps/terrain.json',
  'https://data.landsofhope.com/schemas/v1/maps/map-tile.json',
  // coordinate types are used in maps, so also laziness; could also be argued that {x:1, y:1} is
  // significantly cleaner than {$type:'/v1/coordinate2', x: 1, y: 1} and jusifies being included
  // here
  'https://data.landsofhope.com/schemas/v1/coordinate2.json',
  'https://data.landsofhope.com/schemas/v1/coordinate3.json',

  'https://data.landsofhope.com/schemas/v1/accounts/keycloak/keycloak-id-token.json',
  'https://data.landsofhope.com/schemas/v1/accounts/keycloak/keycloak-access-token.json',
  'https://data.landsofhope.com/schemas/v1/accounts/keycloak/keycloak-user.json',

  'https://data.landsofhope.com/schemas/v1/accounts/cognito/cognito-id-token.json',
  'https://data.landsofhope.com/schemas/v1/accounts/cognito/cognito-access-token.json',

  'https://data.landsofhope.com/schemas/v1/events/payments/stripe/stripe-event.json',
  'https://data.landsofhope.com/schemas/v1/events/payments/paddle/paddle-event.json',
  'https://data.landsofhope.com/schemas/v1/events/payments/paddle/paddle-subscription.json',
  'https://data.landsofhope.com/schemas/v1/events/payments/paddle/paddle-transaction.json',
  'https://data.landsofhope.com/schemas/v1/events/payments/paddle/paddle-billing-period.json',

  "https://data.landsofhope.com/schemas/v1/payments/credits/credit-history.json"

]

const validate = async (schema, file) => {
  const tmpSchemas = schemas
    .filter((value) => value !== schema)
    .map((value) => `-r "${dirname(value)}/!(${basename(schema).replace('.json', '')}).json"`)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  // const tmpSchemas = ["-r \"schemas/v*/**/*.json\""]
  return (
    await exec(
      `node ${__dirname}/node_modules/ajv-cli/dist test -c ajv-formats -s "${schema}" -d "${file}" ${tmpSchemas.join(" ")} --valid`
    )
  ).exitCode;

}

const validateAll = async (schema, fileGlob) => {
  const tmpSchemas = schemas
    .filter((value) => value !== schema)
    .map((value) => `-r "${dirname(value)}/!(${basename(schema).replace('.json', '')}).json"`)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  // const tmpSchemas = ["-r \"schemas/v*/**/*.json\""]
  const files = glob.sync(fileGlob);
  if (files.length == 0)
    throw Error(`Could not find files matching glob ${fileGlob}`);
  return (
    await exec(
      `node ${__dirname}/node_modules/ajv-cli/dist test -c ajv-formats -s "${schema}" -d "${fileGlob}" ${tmpSchemas.join(" ")} --valid`
    )
  ).exitCode;
};

const failAll = async (schema, fileGlob) => {
  const tmpSchemas = schemas
    .filter((value) => value !== schema)
    .map((value) => `-r "${dirname(value)}/!(${basename(schema).replace('.json', '')}).json"`)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  // const tmpSchemas = ["-r \"schemas/v*/**/*.json\""]
  const files = glob.sync(fileGlob);
  if (files.length == 0)
    throw Error(`Could not find files matching glob ${fileGlob}`);
  return (
    await exec(
      `node ${__dirname}/node_modules/ajv-cli/dist test -c ajv-formats -s "${schema}" -d "${fileGlob}" ${tmpSchemas.join(" ")} --invalid`
    )
  ).exitCode;
};

const validateTestData = (path) => validateAll(`schemas/${path}.json`, `.validation-test-data/${path}!(.negative).*.json`);

const validateNegativeTestData = (path) => failAll(`schemas/${path}.json`, `.validation-test-data/${path}.negative.*.json`)

const readSchema = async (schema) => {
  return [schema, await readFile(schema, { encoding: 'utf-8' })];
}

const parseSchema = ([schema, content]) => {
  try {
    return JSON.parse(content);
  } catch (err) {
    console.log('schema failed to parse', schema);
    throw err;
  }
}

const checkSchemaTypes = async () => {
  const schemaObjects = Array.from(await Promise.all(schemas.map(readSchema)).then(res => res.map(parseSchema)));
  return schemaObjects.reduce((ret, schema) => {
    if (schema.type == 'object') {
      if (schema.oneOf || schema.allOf) {
        // ignore oneOf and allOf for the time being
      }
      else if (!schema.properties) {
        if (!(schema.patternProperties || schema.propertyNames)) {
          console.error(`schema ${schema.$id} is missing properties`);
          return ret || 1;
        }
      }
      else if (!schema.properties.$type) {
        if (schemasWithOptionalTypeSpecifier.find(s => s == schema.$id) == undefined) {
          console.error(`schema ${schema.$id} is missing $type`);
          return ret || 1;
        }
      } else if (!schema.required?.find(req => req === "$type")) {
        if (schemasWithOptionalTypeSpecifier.find(s => s == schema.$id) == undefined) {
          console.error(`schema ${schema.$id} does not mark $type as required`);
          return ret || 1;
        }
      } else if (!schema.properties.$type.const || (schema.properties.$type.const !== schema.$id.replaceAll('https://data.landsofhope.com/schemas', '').replaceAll('.json', ''))) {
        console.error(`schema ${schema.$id} has $type.const ${schema.properties.$type.const}`);
        return ret || 1;
      }
    }
    return ret || 0;
  }, 0);
}

const main = async function () {
  return await Promise.all([
    validateAll("schemas/v0/items/extra-item.json", "items/extras/!(all|all.inline).json"),
    validateAll("schemas/v0/characters/character-enhancement.json", "characters/enhancements/!(all|all.inline).json"),

    validateAll("schemas/v1/profession.json", "professions/!(all|all.inline).json"),
    validateAll("schemas/v1/skill.json", "skills/!(all|all.inline).json"),
    validateAll("schemas/v1/race.json", "races/!(all|all.inline).json"),
    validateAll("schemas/v1/race-group.json", "races/groups/!(all|all.inline).json"),
    validateAll("schemas/v1/profession-list.json", "player-professions.json"),
    validateAll("schemas/v1/maps/map.json", "maps/worlds/!(all|all.inline).json"),
    validateAll("schemas/v1/maps/map-tiles.json", "maps/worlds/*/tiles.json"),
    validateAll("schemas/v1/maps/map-resources.json", "maps/worlds/*/resources.json"),
    validateAll("schemas/v1/maps/terrain.json", "maps/terrains/!(all|all.inline).json"),
    validateAll("schemas/v1/characters/character-title.json", "titles/!(all|all.inline).json"),
    validateAll("schemas/v1/characters/extra-character-image.json", "characters/extra-images/!(all|all.inline).json"),
    validateAll("schemas/v1/menus/menu-list.json", "menus/!(all|all.inline).json"),
    validateAll("schemas/v1/stats/ranking.json", "stats/rankings/!(all|all.inline).json"),
    validateAll("schemas/v1/stats/stat-category.json", "stats/stat-categories/!(all|all.inline).json"),
    validateAll("schemas/v1/services/service.json", "./package.json"),
    validateAll("schemas/v1/professions/profession-evolution-graph.json", "professions/evolution/profession-evolution.json"),
    validateAll("schemas/v1/races/race-evolution-graph.json", "races/evolution/race-evolution.json"),
    validateAll("schemas/v1/characters/character-creation-images.json", "characters/character-creation-images.json"),

    validate("schemas/v1/accounts/settings/account-email-settings.json", "accounts/settings/account-email-settings.default.json"),

    validateTestData("v1/accounts/account"),
    validateTestData("v1/accounts/cognito/cognito-id-token"),
    validateTestData("v1/accounts/keycloak/keycloak-id-token"),
    validateTestData("v1/accounts/keycloak/keycloak-access-token"),
    validateNegativeTestData("v1/accounts/keycloak/keycloak-access-token"),
    validateTestData("v1/accounts/keycloak/keycloak-user"),
    validateTestData("v1/characters/appearance-profile"),
    validateTestData("v1/characters/character-id"),
    validateTestData("v1/chat/chat-mention"),
    validateTestData("v1/chat/chat-message"),
    validateTestData("v1/chat/chat-settings"),
    validateTestData("v1/events/accounts/returning/returning-account-imported"),
    validateNegativeTestData("v1/events/accounts/returning/returning-account-imported"),
    validateTestData("v1/events/chat/rooms/chat-room-presence-event"),
    validateTestData("v1/events/chat/messages/chat-message-sent-event"),
    validateTestData("v1/events/any-event"),
    // validateTestData("v1/events/server-event"),
    validateTestData("v1/events/client-event"),
    validateNegativeTestData("v1/events/client-event"),
    validateTestData("v1/events/live/live-client-event"),
    validateNegativeTestData("v1/events/live/live-client-event"),
    validateTestData("v1/stats/ranking-list"),
    validateTestData("v1/events/payments/paddle/paddle-event"),

    validateTestData("v1/payments/credits/credit-history-support-adjustment"),

    checkSchemaTypes()
  ]);
};

main()
  .then((results) => results.reduce((last, current) => last | current))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((reason) => {
    console.log(reason);
    process.exitCode = 1;
  });
