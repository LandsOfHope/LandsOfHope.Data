import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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

function inlineContent(dir, file) {
	if (dir.startsWith("skills/crafting/recipes/")) {
		const recipe = JSON.parse(readFileSync(`${dir}/${file}`));
		return {
			...recipe,
			item: recipe.item
				? inlineContent("items", `${recipe.item}.json`)
				: undefined,
			vesselItem: recipe.vesselItem
				? inlineContent("vessel-items", `${recipe.vesselItem}.json`)
				: undefined,
		};
	}

	return JSON.parse(readFileSync(`${dir}/${file}`));
}

directories.forEach((dir) => {
	const isGlob = dir.endsWith("*");
	const parentDir = isGlob ? dirname(dir) : dir;

	const all_content = [];
	let all_inline_content = {};

	if (isGlob) {
		const subdirs = readdirSync(parentDir);
		subdirs.forEach((subdir) => {
			const subdirPath = join(parentDir, subdir);
			const stat = statSync(subdirPath);
			if (stat.isDirectory()) {
				const scopedAllValues = [];
				const scopedInlineValues = {};
				const files = readdirSync(subdirPath);
				for (const file of files) {
					if (file.endsWith(".json") && !file.endsWith(".gen.json")) {
						const id = `${subdir}/${file.slice(0, -5)}`;
						scopedAllValues.push(id);
						scopedInlineValues[id] = inlineContent(subdirPath, file);
					}
				}
				if (scopedAllValues.length > 0) {
					all_content.push(...scopedAllValues);
					all_inline_content = {
						...all_inline_content,
						...scopedInlineValues,
					};

					writeFileSync(
						`${subdirPath}/all.gen.json`,
						JSON.stringify(scopedAllValues),
					);
					writeFileSync(
						`${subdirPath}/all.inline.gen.json`,
						JSON.stringify(scopedInlineValues),
					);
				}
			}
		});
	} else {
		const files = readdirSync(parentDir);
		for (const file of files) {
			if (file.endsWith(".json") && !file.endsWith(".gen.json")) {
				all_content.push(file.slice(0, -5));
				all_inline_content[file.slice(0, -5)] = inlineContent(dir, file);
			}
		}
	}

	writeFileSync(`${parentDir}/all.gen.json`, JSON.stringify(all_content));
	writeFileSync(
		`${parentDir}/all.inline.gen.json`,
		JSON.stringify(all_inline_content),
	);
});
