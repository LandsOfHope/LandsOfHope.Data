"use strict";

const fs = require('fs');

const directories = process.argv.slice(2);

directories.forEach(dir => {
    const id_schema_file = `schemas/${dir}-id.json`;
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        let all_content = [];
        files.forEach(file => {
            if (file != 'all.json' && file.slice(-5) === '.json') {
                all_content.push(file.slice(0, -5));
            }
        });

        const schema_content = `
        {
            "$id": "https://data.landsofhope.com/${id_schema_file}",
            "enum": ${JSON.stringify(all_content)}
        }
        `;
        fs.writeFileSync(id_schema_file, schema_content);
    });
});