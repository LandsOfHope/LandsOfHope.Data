"use strict";

const fs = require("fs");
const path = require("path");

const directories = (() => {
	const dirs = process.argv.slice(2);
	if (dirs.length > 0) return dirs;
	return [
		"professions",
		"races",
		"races/groups",
		"skills",
		"skills/crafting/recipes/*",
		"maps/worlds",
		"maps/terrains/*",
		"titles",
		"items",
		"items/types",
		"items/images",
		"items/extras",
		"items/resources",
		"items/materials",
		"items/qualities",
		"items/locations",
		"items/enhancements/*",
		"vessel-items",
		"characters/images",
		"characters/extra-images",
		"characters/enhancements",
		"characters/npcs",
		"characters/npcs/recipes",
		"stats/stat-categories",
		"stats/rankings",
		"expansions",
	];
})();

function inlineContent(dir, file) {
	if (dir.startsWith("skills/crafting/recipes/")) {
		const recipe = JSON.parse(fs.readFileSync(`${dir}/${file}`));
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

	return JSON.parse(fs.readFileSync(`${dir}/${file}`));
}

directories.forEach((dir) => {
	const isGlob = dir.endsWith("*");
	const parentDir = isGlob ? path.dirname(dir) : dir;

	let all_content = [];
	let all_inline_content = {};

	if (isGlob) {
		const subdirs = fs.readdirSync(parentDir);
		subdirs.forEach((subdir) => {
			const subdirPath = path.join(parentDir, subdir);
			const stat = fs.statSync(subdirPath);
			if (stat.isDirectory()) {
				const scopedAllValues = [];
				const scopedInlineValues = {};
				const files = fs.readdirSync(subdirPath);
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

					fs.writeFileSync(
						`${subdirPath}/all.gen.json`,
						JSON.stringify(scopedAllValues),
					);
					fs.writeFileSync(
						`${subdirPath}/all.inline.gen.json`,
						JSON.stringify(scopedInlineValues),
					);
				}
			}
		});
	} else {
		const files = fs.readdirSync(parentDir);
		for (const file of files) {
			if (file.endsWith(".json") && !file.endsWith(".gen.json")) {
				all_content.push(file.slice(0, -5));
				all_inline_content[file.slice(0, -5)] = inlineContent(dir, file);
			}
		}
	}

	fs.writeFileSync(`${parentDir}/all.gen.json`, JSON.stringify(all_content));
	fs.writeFileSync(
		`${parentDir}/all.inline.gen.json`,
		JSON.stringify(all_inline_content),
	);
});
