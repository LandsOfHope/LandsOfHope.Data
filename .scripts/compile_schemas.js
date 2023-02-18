"use strict";

const util = require("util");
const exec = util.promisify(require("child_process").exec);
const glob = require("glob");
const fs = require("fs");
const path = require("path");

const schemas = glob.sync("schemas/**/*.json");

const validationRoot = "api/js/validation/";

const compile = async (schema) => {
    const output = schema.replace('schemas/', validationRoot).replace('.json', '-validation.js');
    const outDir = path.dirname(output);
    if (!fs.existsSync(outDir))
        fs.mkdirSync(outDir, { recursive: true });
    const tmpSchemas = schemas
        .filter((value) => value !== schema)
        .map((value) => `-r "${value}"`);
    return (
        await exec(
            `npx --yes ajv-cli@latest compile ${tmpSchemas.join(" ")} -s "${schema}" -o ${output}`
        )
    ).exitCode;
};

const main = async function () {
    return await Promise.all(schemas.map(compile));
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
