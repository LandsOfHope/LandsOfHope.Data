"use strict";

const fs = require('fs');

const directories = (() => {
    const dirs = process.argv.slice(2);
    if (dirs.length > 0)
        return dirs;
    return ['images', 'professions', 'races', 'races/groups', 'skills', 'maps/terrains', 'maps/worlds', 'materials'];;
})();

directories.forEach(dir => {
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        let all_content = [];
        files.forEach(file => {
            if (file !== "all.json" && file.slice(-5) === '.json') {
                all_content.push(file.slice(0, -5));
            }
        });

        fs.writeFileSync(`${dir}/all.json`, JSON.stringify(all_content));
    });
});