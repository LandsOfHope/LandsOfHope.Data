import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, sep } from 'node:path';
import Ajv, { MissingRefError } from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';
import addFormats from 'ajv-formats';
import { fullFormats } from 'ajv-formats/dist/formats';
import { sync } from 'glob';

const schemaVersions = sync('schemas/*');

const validationRoot = 'api/js/validation/';

const fixModelValidation = (data) => {
	const result = data
		.replaceAll(
			/const ([^\s]*?)\s*=\s*require\("([^"]*)"\)([^;]*);/g,
			(_, assignedVariable, includedModulePath, postIncludeModuleObjAccess) => {
				if (postIncludeModuleObjAccess === '.default') {
					return `import ${assignedVariable} from "${includedModulePath}";`;
				}
				if (postIncludeModuleObjAccess === '') {
					return `import * as ${assignedVariable} from "${includedModulePath}";`;
				}
				return `import * as ${assignedVariable}_module from "${includedModulePath}";const ${assignedVariable} = ${assignedVariable}_module${postIncludeModuleObjAccess};`;
			},
		)
		.replaceAll(
			/import\s+([^\s]*?)\s*from\s+["']ajv\/dist\/runtime\/ucs2length["'];/g,
			(_, importName) => {
				return `
				function ${importName}(str) {
					// ajv ucs2length
					const len = str.length;
					let length = 0;
					let pos = 0;
					let value;
					while (pos < len) {
						length++;
						value = str.charCodeAt(pos++);
						if (value >= 0xd800 && value <= 0xdbff && pos < len) {
							// high surrogate, and there is a next character
							value = str.charCodeAt(pos);
							if ((value & 0xfc00) === 0xdc00)
								pos++; // low surrogate
						}
					}
					return length;
				}
			`;
			},
		)
		.replaceAll(
			/import\s+([^\s]*?)\s*from\s+["']ajv\/dist\/runtime\/equal["'];/g,
			(_, importName) => {
				return `
				function ${importName}(a,b) {
					// fast-deep-equal
					if (a === b) return true;

					if (a && b && typeof a == 'object' && typeof b == 'object') {
						if (a.constructor !== b.constructor) return false;

						var length, i, keys;
						if (Array.isArray(a)) {
						length = a.length;
						if (length != b.length) return false;
						for (i = length; i-- !== 0;)
							if (!equal(a[i], b[i])) return false;
						return true;
						}



						if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
						if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
						if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

						keys = Object.keys(a);
						length = keys.length;
						if (length !== Object.keys(b).length) return false;

						for (i = length; i-- !== 0;)
						if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

						for (i = length; i-- !== 0;) {
						var key = keys[i];

						if (!equal(a[key], b[key])) return false;
						}

						return true;
					}

					// true if both NaN, false otherwise
					return a!==a && b!==b;
				}
			`;
			},
		);

	const imports = result.match(/import\s+([^\s]*?)\s*from\s+["'][^"']*?["']/gm);
	if ((imports?.length ?? 0) > 0) {
		console.error(imports);
		throw new Error(
			'output contains unreplaced imports (not sufficiently standalone)',
		);
	}
	return result;
};

const main = async () => {
	schemaVersions.forEach((version) => {
		const versionName = basename(version);
		mkdirSync(join(validationRoot, versionName), { recursive: true });
		const schemaGlob = `${version}/**/*.json`.replace(sep, '/');
		const schemas = sync(schemaGlob);

		const titleMap = {};
		const schemaFiles = schemas.map((s) =>
			JSON.parse(readFileSync(s, { encoding: 'utf-8' })),
		);
		const ajv = new Ajv({
			code: { esm: true, formats: fullFormats, optimize: 3, source: true },
			strict: true,
		});
		addFormats(ajv);
		ajv.addKeyword('tsEnumNames');

		schemaFiles.forEach((schema) => {
			ajv.addSchema(schema);
			titleMap[`validate${schema.title}`] = schema.$id;
		});

		let retry = true;
		let lastRefErrPath;

		while (retry) {
			retry = false;
			try {
				const code = fixModelValidation(standaloneCode(ajv, titleMap));
				writeFileSync(
					join(validationRoot, basename(version), 'model-validation.js'),
					code,
				);

				const validateFunctions = Object.keys(titleMap);

				writeFileSync(
					join(validationRoot, basename(version), 'model-validation.d.ts'),
					`// Auto-generated for model-validation.js
${validateFunctions
	.map(
		(fn) =>
			`export var ${fn}: ((data: unknown) => data is ${fn.replace('validate', '')}) & { errors: unknown[] };`,
	)
	.join('\n')}
							`,
				);
			} catch (err) {
				if (err instanceof MissingRefError) {
					const missingUrl = new URL(err.missingRef);
					if (missingUrl.host === 'data.landsofhope.com') {
						if (lastRefErrPath === missingUrl.pathname) {
							// give up if we get the same ref error twice in a row
							throw err;
						}

						lastRefErrPath = missingUrl.pathname;
						const schema = JSON.parse(
							readFileSync(`.${missingUrl.pathname}`, { encoding: 'utf-8' }),
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
