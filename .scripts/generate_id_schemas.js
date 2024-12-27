"use strict";

const fs = require('fs');
const path = require('path');

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
        'items/materials',
        'items/resources',
        'characters/images',
        'characters/extra-images',
        'characters/enhancements',
        'stats/stat-categories',
        'stats/rankings'
    ];
})();
const schemas = 'schemas';
const versions = {
    'items/extras': 'v0',
}

directories.forEach(dir => {
    const version = versions[dir] ?? 'v1';
    const parentDir = path.join(schemas, version, path.dirname(dir));
    if (!fs.existsSync(parentDir))
        fs.mkdirSync(parentDir, {recursive: true});

    const id_schema_file = `${schemas}/${version}/${dir}-id.gen.json`;
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        let all_content = [];
        files.forEach(file => {
            if (file != 'all.json' && file != 'all.inline.json' && file.slice(-5) === '.json') {
                all_content.push(file.slice(0, -5));
            }
        });

        var properTitle = `${path.basename(dir)}-id`.split('-').map(word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()).join('');
        const schema_content = `
        {
            "$id": "https://data.landsofhope.com/${id_schema_file}",
            "title": "${properTitle}",
            "enum": ${JSON.stringify(all_content)}
        }
        `;
        fs.writeFileSync(id_schema_file, schema_content);
    });
});