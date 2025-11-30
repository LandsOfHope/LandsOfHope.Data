import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, sep } from "node:path";
import Ajv, { MissingRefError } from "ajv";
import standaloneCode from "ajv/dist/standalone/index.js";
import addFormats from "ajv-formats";
import { sync } from "glob";

const schemaVersions = sync("schemas/*");

const validationRoot = "api/js/validation/";

const main = async () => {
	schemaVersions.forEach((version) => {
		const versionName = basename(version);
		mkdirSync(join(validationRoot, versionName), { recursive: true });
		const schemaGlob = `${version}/**/*.json`.replace(sep, "/");
		const schemas = sync(schemaGlob);

		const titleMap = {};
		const schemaFiles = schemas.map((s) =>
			JSON.parse(readFileSync(s, { encoding: "utf-8" })),
		);
		const ajv = new Ajv({
			code: { esm: true, source: true },
			strict: true,
		});
		addFormats(ajv);
		ajv.addKeyword("tsEnumNames");

		schemaFiles.forEach((schema) => {
			ajv.addSchema(schema);
			titleMap[`validate${schema.title}`] = schema.$id;
		});

		let retry = true;
		let lastRefErrPath;

		while (retry) {
			retry = false;
			try {
				const code = standaloneCode(ajv, titleMap);
				writeFileSync(
					join(validationRoot, basename(version), "model-validation.js"),
					code,
				);
			} catch (err) {
				if (err instanceof MissingRefError) {
					const missingUrl = new URL(err.missingRef);
					if (missingUrl.host === "data.landsofhope.com") {
						if (lastRefErrPath === missingUrl.pathname) {
							// give up if we get the same ref error twice in a row
							throw err;
						}

						lastRefErrPath = missingUrl.pathname;
						const schema = JSON.parse(
							readFileSync(`.${missingUrl.pathname}`, { encoding: "utf-8" }),
						);
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
