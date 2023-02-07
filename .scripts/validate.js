"use strict";

const util = require("util");
const exec = util.promisify(require("child_process").exec);
const glob = require("glob");

const schemas = glob.sync("schemas/*.json");

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
    validateAll("schemas/profession.json", "professions/!(all).json"),
    validateAll("schemas/skill.json", "skills/!(all).json"),
    validateAll("schemas/race.json", "races/!(all).json"),
    validateAll("schemas/profession-list.json", "player-professions.json"),
    validateAll("schemas/map.json", "maps/!(all).json"),
    validateAll("schemas/terrain.json", "terrain/!(all).json")
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
