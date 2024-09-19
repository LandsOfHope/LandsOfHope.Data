"use strict";

const util = require("util");
const exec = util.promisify(require("child_process").exec);
const glob = require("glob");
const fs = require("fs");
const path = require("path");
const jsonschematots = require("json-schema-to-typescript");

const schemaVersions = glob.sync('schemas/*');

const apiRoot = "api/ts/";

const resolver = {
    order: 1,

    canRead: true,

    read(file, callback, $refs) {
        const filePath = path.resolve(`.${file.url.replace('c:', '')}`);
        if(fs.existsSync(filePath)) {
            callback(null, fs.readFileSync(filePath, { encoding: 'utf-8' }));
        } else {
            callback(new Error(`File not found: ${filePath}`));
        }
    }
}

const main = async function () {
    schemaVersions.forEach(version => {
        const schemaGlob = (version + "/**/*.json").replace(path.sep, '/');
        const schemas = glob.sync(schemaGlob);

        const schemaFiles = schemas.map(s => [s, JSON.parse(fs.readFileSync(s, { encoding: 'utf-8' }))]);

        schemaFiles.forEach(([schemaPath, schema]) => {
            const outDir = path.join(apiRoot, path.dirname(schemaPath));
            fs.mkdirSync(outDir, { recursive: true });
            const outSchemaPath = path.join(outDir, path.basename(schemaPath).replace('/schemas', '').replace('.json', '.d.ts'));
            jsonschematots.compile(schema, schema['title'], { $refOptions: { dereference: { externalReferenceResolution: 'root' }, resolve: { external: true, file: false, http: false, myresolver: resolver } } })
                .then(ts => {
                    fs.writeFileSync(outSchemaPath, ts)
                });
        });
    });

    return [0];
};

main()
    .then((results) => results.reduce((last, current) => last | current))
    .then((exitCode) => {
        process.exitCode = exitCode;
    })
    .catch((reason) => {
        console.error(reason);
        process.exitCode = 1;
    });
