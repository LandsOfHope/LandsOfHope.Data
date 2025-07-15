"use strict";

const fs = require('fs');

const directories = (() => {
    const dirs = process.argv.slice(2);
    if (dirs.length > 0)
        return dirs;
    return [
        'professions',
        'races',
        'races/groups',
        'skills',
        'skills/crafting/recipes/alchemy',
        'skills/crafting/recipes/animation',
        'skills/crafting/recipes/artisan',
        'skills/crafting/recipes/augmenting',
        'skills/crafting/recipes/bewitching',
        'skills/crafting/recipes/blacksmithing',
        'skills/crafting/recipes/blood-over-beauty',
        'skills/crafting/recipes/bolts-over-brains',
        'skills/crafting/recipes/carpentry',
        'skills/crafting/recipes/charms-and-hexes',
        'skills/crafting/recipes/construction',
        'skills/crafting/recipes/cooking',
        'skills/crafting/recipes/dungeon-mastery',
        'skills/crafting/recipes/floristry',
        'skills/crafting/recipes/furnishing',
        'skills/crafting/recipes/gamemastery',
        'skills/crafting/recipes/leatherworking',
        'skills/crafting/recipes/lordship',
        'skills/crafting/recipes/parlor-tricks',
        'skills/crafting/recipes/patchcrafting',
        'skills/crafting/recipes/seamanship',
        'skills/crafting/recipes/stonemasonry',
        'skills/crafting/recipes/surgery',
        'skills/crafting/recipes/tailoring',
        'skills/crafting/recipes/tinkering',
        'maps/terrains',
        'maps/worlds',
        'titles',
        'items',
        'items/types',
        'items/images',
        'items/extras',
        'items/resources',
        'items/materials',
        'items/qualities',
        'items/locations',
        'items/enhancements/bejewels',
        'items/enhancements/imbuements',
        'items/enhancements/names',
        'items/enhancements/patches',
        'characters/images',
        'characters/extra-images',
        'characters/enhancements',
        'characters/npcs',
        'characters/npcs/recipes',
        'stats/stat-categories',
        'stats/rankings',
        'expansions'
    ];
})();

function inlineContent(dir, file) {
    if(dir.startsWith('skills/crafting/recipes/')) {
        const recipe = JSON.parse(fs.readFileSync(`${dir}/${file}`));
        return {
            ...recipe,
            item: recipe.item ? inlineContent('items', `${recipe.item}.json`) : undefined,
            vesselItem: recipe.vesselItem ? inlineContent('vessel-items', `${recipe.vesselItem}.json`) : undefined,
        }
    }

    return JSON.parse(fs.readFileSync(`${dir}/${file}`));
}

directories.forEach(dir => {
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        let all_content = [];
        let all_inline_content = {};
        files.forEach(file => {
            if (file.endsWith('.json') && !file.endsWith(".gen.json")) {
                all_content.push(file.slice(0, -5));
                all_inline_content[file.slice(0, -5)] = inlineContent(dir, file);
            }
        });

        fs.writeFileSync(`${dir}/all.gen.json`, JSON.stringify(all_content));
        fs.writeFileSync(`${dir}/all.inline.gen.json`, JSON.stringify(all_inline_content));
    });
});