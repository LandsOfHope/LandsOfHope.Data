"use strict";

const util = require("util");
const exec = util.promisify(require("child_process").exec);
const glob = require("glob");

const schemas = glob.sync("schemas/v1/**/*.json");

const validateAll = async (schema, fileGlob) => {
  const tmpSchemas = schemas
    .filter((value) => value !== schema)
    .map((value) => `-r "${value}"`);
  return (
    await exec(
      `npx --yes ajv-cli@latest -s "${schema}" -d "${fileGlob}" ${tmpSchemas.join(" ")}`
    )
  ).exitCode;
};

const main = async function () {
  return await Promise.all([
    validateAll("schemas/v1/profession.json", "professions/!(all).json"),
    validateAll("schemas/v1/skill.json", "skills/!(all).json"),
    validateAll("schemas/v1/race.json", "races/!(all).json"),
    validateAll("schemas/v1/race-group.json", "races/groups/!(all).json"),
    validateAll("schemas/v1/profession-list.json", "player-professions.json"),
    validateAll("schemas/v1/map.json", "maps/!(all).json"),
    validateAll("schemas/v1/map-tiles.json", "maps/tiles/!(all).json"),
    validateAll("schemas/v1/map-resources.json", "maps/resources/!(all).json"),
    validateAll("schemas/v1/terrain.json", "terrain/!(all).json")
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
