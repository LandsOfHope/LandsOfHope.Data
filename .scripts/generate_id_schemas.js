"use strict";

const fs = require('fs');
const path = require('path');

const directories = (() => {
    const dirs = process.argv.slice(2);
    if (dirs.length > 0)
        return dirs;
    return ['professions', 'races', 'races/groups', 'skills', 'maps/terrains', 'maps/worlds', 'materials', 'titles', 'characters/images', 'characters/enhancements', 'stats/stat-categories', 'stats/rankings'];
})();
const schemas = 'schemas';
const version = 'v1';

directories.forEach(dir => {
    const parentDir = path.join(schemas, version, path.dirname(dir));
    if (!fs.existsSync(parentDir))
        fs.mkdirSync(parentDir);

    const id_schema_file = `${schemas}/${version}/${dir}-id.json`;
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