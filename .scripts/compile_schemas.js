"use strict";

const util = require("util");
const exec = util.promisify(require("child_process").exec);
const glob = require("glob");
const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require('ajv-formats');
const standaloneCode = require("ajv/dist/standalone").default

const schemaVersions = glob.sync('schemas/*');

const validationRoot = "api/js/validation/";

const main = async function () {
    schemaVersions.forEach(version => {
        const versionName = path.basename(version);
        fs.mkdirSync(path.join(validationRoot, versionName), { recursive: true });
        const schemaGlob = (version + "/**/*.json").replace(path.sep, '/');
        const schemas = glob.sync(schemaGlob);

        const titleMap = {};
        const schemaFiles = schemas.map(s => JSON.parse(fs.readFileSync(s, { encoding: 'utf-8' })));
        const ajv = new Ajv({
            strict: true,
            code: { source: true, esm: true },
        });
        addFormats(ajv);

        schemaFiles.forEach(schema => {
            ajv.addSchema(schema);
            titleMap["validate" + schema["title"]] = schema["$id"];
        });

        let retry = true;
        let lastRefErrPath = undefined;

        while (retry) {
            retry = false;
            try {
                const code = standaloneCode(ajv, titleMap);
                fs.writeFileSync(path.join(validationRoot, path.basename(version), "model-validation.js"), code);
            } catch (err) {
                if (err instanceof Ajv.MissingRefError) {
                    const missingUrl = new URL(err.missingRef);
                    if (missingUrl.host == "data.landsofhope.com") {
                        if (lastRefErrPath == missingUrl.pathname) {
                            // give up if we get the same ref error twice in a row
                            throw err;
                        }

                        lastRefErrPath = missingUrl.pathname;
                        const schema = JSON.parse(fs.readFileSync("." + missingUrl.pathname, { encoding: 'utf-8' }));
                        ajv.addSchema(schema);
                        retry = true;
                        continue;
                    }
                }
                throw err;
            }
        }
    });


    return [0];
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
