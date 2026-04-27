import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve as _resolve, basename, dirname, join, sep } from "node:path";
import { compile } from "json-schema-to-typescript";

const resolver = {
    canRead: true,
    order: 1,

    read(file: { url: string }, callback: (err: Error | null, data?: string) => void, _$refs: any) {
        const filePath = _resolve(`.${file.url.replace("c:", "")}`);
        if (existsSync(filePath)) {
            callback(null, readFileSync(filePath, { encoding: "utf-8" }));
        } else {
            callback(new Error(`File not found: ${filePath}`));
        }
    },
};

const apiRoot = "api/ts/";
const schemaPath = process.argv[2];
const schema = await Bun.file(schemaPath).json();

const outDir = join(
    apiRoot,
    dirname(schemaPath).substring("schemas/".length),
);
mkdirSync(outDir, { recursive: true });
const outSchemaPath = join(
    outDir,
    basename(schemaPath).replace(".gen.", ".").replace(".json", ".d.ts"),
);
console.log("compiling schema", schemaPath, "to", outSchemaPath);
const ts = await compile(schema, schema.title, {
    $refOptions: {
        dereference: { externalReferenceResolution: "root" },
        resolve: {
            external: true,
            file: false,
            http: false,
            myresolver: resolver,
        },
    },
    enableConstEnums: true,
});
writeFileSync(outSchemaPath, ts);
console.log("finished writing", outSchemaPath);
