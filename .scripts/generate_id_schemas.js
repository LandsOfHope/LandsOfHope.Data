import {
	existsSync,
	mkdirSync,
	readdirSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const directories = (() => {
	const dirs = process.argv.slice(2);
	if (dirs.length > 0) return dirs;
	return [
		"professions",
		"races",
		"races/groups",
		"races/classifications",
		"skills",
		"skills/crafting/recipes/*",
		"skills/caring/actions",
		"skills/spells/*",
		"skills/styles/*",
		"maps/terrains/*",
		"maps/worlds",
		"maps/tiles/actions",
		"maps/landmarks/types",
		"maps/buildings/images",
		"maps/buildings/actions",
		"titles",
		"allegiances",
		"items",
		"items/sets",
		"items/types",
		"items/images",
		"items/extras",
		"items/materials",
		"items/resources",
		"items/locations",
		"items/enhancements/*",
		"vessel-items",
		"characters/images",
		"characters/actions",
		"characters/actions/emotes",
		"characters/extra-images",
		"characters/enhancements",
		"characters/npcs",
		"characters/npcs/recipes",
		"characters/combat/scripts",
		"stats/stat-categories",
		"stats/rankings",
		"expansions",
	];
})();
const schemas = "schemas";
const versions = {
	"items/extras": "v0",
};

directories.forEach((dir) => {
	const version = versions[dir] ?? "v1";
	const isGlob = dir.endsWith("*");

	const parentOutputDir = join(schemas, version, dirname(dir));
	if (!existsSync(parentOutputDir))
		mkdirSync(parentOutputDir, { recursive: true });

	console.log(`Generating ID schema for ${dir} in ${version}`, {
		isGlob,
		parentOutputDir,
	});

	const idNameBase = dir
		.replaceAll("/", " ")
		.replace("*", "")
		.trim()
		.replaceAll(" ", "-");
	const idName = `${idNameBase}-id`;
	const properTitle = idName
		.split("-")
		.map(
			(word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase(),
		)
		.join("");

	const id_schema_file = `${schemas}/${version}/${idName}.gen.json`;

	const enumValues = [];
	const childEnums = [];
	if (isGlob) {
		const parentDir = dirname(dir);
		const subdirs = readdirSync(parentDir);
		subdirs.forEach((subdir) => {
			const subDirPath = join(parentDir, subdir);
			const stat = statSync(subDirPath);
			if (stat.isDirectory()) {
				const scopedEnumValues = [];
				const scopedProperTitle =
					subdir
						.split("-")
						.map(
							(word) =>
								word.charAt(0).toUpperCase() + word.substring(1).toLowerCase(),
						)
						.join("") + properTitle;
				const scoped_id_schema_file = `${schemas}/${version}/${parentDir}/${subdir}-${idName}.gen.json`;
				const files = readdirSync(subDirPath);

				for (const file of files) {
					if (file.endsWith(".json") && !file.endsWith(".gen.json")) {
						scopedEnumValues.push(`${subdir}/${file.slice(0, -5)}`);
					}
				}

				if (scopedEnumValues.length > 0) {
					enumValues.push(...scopedEnumValues);
				}

				writeFileSync(
					join(parentOutputDir, `${subdir}-${idName}.gen.json`),
					JSON.stringify({
						$id: `https://data.landsofhope.com/${scoped_id_schema_file}`,
						enum: scopedEnumValues,
						title: scopedProperTitle,
					}),
				);
				childEnums.push(scoped_id_schema_file);
			}
		});
	} else {
		const files = readdirSync(dir);
		for (const file of files) {
			if (file.endsWith(".json") && !file.endsWith(".gen.json")) {
				enumValues.push(file.slice(0, -5));
			}
		}
	}

	const enumTypeObj = {};
	if (isGlob) {
		enumTypeObj.oneOf = childEnums.map((childEnum) => ({
			$ref: `/${childEnum}`,
		}));
	} else {
		enumTypeObj.enum = enumValues;
	}

	writeFileSync(
		id_schema_file,
		JSON.stringify({
			$id: `https://data.landsofhope.com/${id_schema_file}`,
			title: properTitle,
			...enumTypeObj,
		}),
	);
});
