import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve as _resolve, basename, dirname, join, sep } from "node:path";
import { sync } from "glob";
import { compile } from "json-schema-to-typescript";

const schemaVersions = sync("schemas/*");

const apiRoot = "api/ts/";

const resolver = {
	canRead: true,
	order: 1,

	read(file, callback, _$refs) {
		const filePath = _resolve(`.${file.url.replace("c:", "")}`);
		if (existsSync(filePath)) {
			callback(null, readFileSync(filePath, { encoding: "utf-8" }));
		} else {
			callback(new Error(`File not found: ${filePath}`));
		}
	},
};

const main = async () => {
	schemaVersions.forEach((version) => {
		const schemaGlob = `${version}/**/*.json`.replace(sep, "/");
		const schemas = sync(schemaGlob);

		const schemaFiles = schemas.map((s) => [
			s,
			JSON.parse(readFileSync(s, { encoding: "utf-8" })),
		]);

		schemaFiles.forEach(([schemaPath, schema]) => {
			const outDir = join(
				apiRoot,
				dirname(schemaPath).substring("schemas/".length),
			);
			mkdirSync(outDir, { recursive: true });
			const outSchemaPath = join(
				outDir,
				basename(schemaPath).replace(".gen.", ".").replace(".json", ".d.ts"),
			);
			compile(schema, schema.title, {
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
			}).then((ts) => {
				writeFileSync(outSchemaPath, ts);
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
