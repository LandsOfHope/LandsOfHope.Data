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
        'skills/crafting/recipes/*',
        'maps/terrains',
        'maps/worlds',
        'titles',
        'items',
        'items/types',
        'items/images',
        'items/extras',
        'items/materials',
        'items/resources',
        'vessel-items',
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
    const isGlob = dir.endsWith('*');

    const parentOutputDir = path.join(schemas, version, path.dirname(dir));
    if (!fs.existsSync(parentOutputDir))
        fs.mkdirSync(parentOutputDir, { recursive: true } );

    console.log(`Generating ID schema for ${dir} in ${version}`, { isGlob, parentOutputDir });

    const idNameBase = dir.replaceAll('/', ' ').replace('*', '').trim().replaceAll(' ', '-');
    const idName = `${idNameBase}-id`;
    const properTitle = idName.split('-').map(word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()).join('');

    const id_schema_file = `${schemas}/${version}/${idName}.gen.json`;
    
    const enumValues = [];
    if (isGlob) {
        const parentDir = path.dirname(dir);
        const subdirs = fs.readdirSync(parentDir);
        subdirs.forEach(subdir => {
            const subDirPath = path.join(parentDir, subdir);
            const stat = fs.statSync(subDirPath);
            if (stat.isDirectory()) {
                const scopedEnumValues = [];
                const scopedProperTitle = subdir.split('-').map(word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()).join('') + properTitle;
                const scoped_id_schema_file = `${schemas}/${version}/${subdir}-${idName}.gen.json`;
                const files = fs.readdirSync(subDirPath);

                for (const file of files) {
                    if (file.endsWith('.json') && !file.endsWith('.gen.json')) {
                        scopedEnumValues.push(`${subdir}/${file.slice(0, -5)}`);
                    }
                }

                if (scopedEnumValues.length > 0) {
                    enumValues.push(...scopedEnumValues);
                }

                fs.writeFileSync(
                    path.join(parentOutputDir, `${subdir}-${idName}.gen.json`),
                    JSON.stringify(
                        {
                            "$id": `https://data.landsofhope.com/${scoped_id_schema_file}`,
                            "title": scopedProperTitle,
                            "enum": scopedEnumValues
                        }
                    )
                );
            }
        });
    } else {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (file.endsWith('.json') && !file.endsWith('.gen.json')) {
                enumValues.push(file.slice(0, -5));
            }
        }
    }

    fs.writeFileSync(
        id_schema_file,
        JSON.stringify(
            {
                "$id": `https://data.landsofhope.com/${id_schema_file}`,
                "title": properTitle,
                "enum": enumValues
            }
        )
    );
});