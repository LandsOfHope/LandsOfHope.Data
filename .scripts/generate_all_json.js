"use strict";

const fs = require('fs');

const directories = process.argv.slice(2);

directories.forEach(dir => {
    fs.readdir(dir, (err, files) => {
        let all_content = [];
        files.forEach(file => {
            if(file.slice(-5) === '.json') {
                all_content.push(file.slice(0, -5));
            }
        });

        fs.writeFileSync(`${dir}/all.json`, JSON.stringify(all_content));
    });
});