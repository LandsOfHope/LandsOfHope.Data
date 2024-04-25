"use strict";

const fs = require('fs');

const directories = (() => {
    const dirs = process.argv.slice(2);
    if (dirs.length > 0)
        return dirs;
    return ['professions', 'races', 'races/groups', 'skills', 'maps/terrains', 'maps/worlds', 'materials', 'titles', 'items/extras', 'characters/images', 'characters/enhancements', 'stats/stat-categories', 'stats/rankings'];
})();

directories.forEach(dir => {
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        let all_content = [];
        let all_inline_content = {};
        files.forEach(file => {
            if (file !== "all.json" && file !== "all.inline.json" && file.slice(-5) === '.json') {
                all_content.push(file.slice(0, -5));
                all_inline_content[file.slice(0, -5)] = JSON.parse(fs.readFileSync(`${dir}/${file}`));
            }
        });

        fs.writeFileSync(`${dir}/all.json`, JSON.stringify(all_content));
        fs.writeFileSync(`${dir}/all.inline.json`, JSON.stringify(all_inline_content));
    });
});