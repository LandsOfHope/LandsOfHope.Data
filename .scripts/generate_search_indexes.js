"use strict";

const util = require("util");
const glob = require("glob");
const fs = require("fs");
const path = require("path");
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const makeMaterialsSearchIndex = async function () {
    const locales = glob.sync("./locales/*");

    for (const locale of locales) {
        const localeName = path.basename(locale);

        const elasticlunr = require("elasticlunr");
        require('lunr-languages/lunr.stemmer.support.js')(elasticlunr);
        if (localeName !== "en") {
            require(`lunr-languages/lunr.${localeName}.js`)(elasticlunr);
        }

        const materials = await readFileAsync(path.join(locale, "materials.json"));
        const index = elasticlunr(function () {
            if (localeName !== "en") {
                this.use(elasticlunr[localeName]);
            }

            this.addField("name");
            this.addField("level");
            this.setRef("id");
        });

        const materialsJson = JSON.parse(materials);
        for (const [materialId, levels] of Object.entries(materialsJson)) {
            for (const [level, material] of Object.entries(levels)) {
                index.addDoc({
                    id: `material:${materialId}:${level}`,
                    name: material.name,
                    level: level
                });
            }
        }

        await writeFileAsync(path.join(locale, "search.materials.index.json"), JSON.stringify(index.toJSON()));
    }
}

const makeRecipesSearchIndex = async function () {
    const locales = glob.sync("./locales/*");

    for (const locale of locales) {
        const localeName = path.basename(locale);

        const elasticlunr = require("elasticlunr");
        require('lunr-languages/lunr.stemmer.support.js')(elasticlunr);
        if (localeName !== "en") {
            require(`lunr-languages/lunr.${localeName}.js`)(elasticlunr);
        }

        const recipes = await readFileAsync(path.join(locale, "crafting-recipes.json"));
        const skills = JSON.parse(await readFileAsync(path.join(locale, "skills.json")));

        const index = elasticlunr(function () {
            if (localeName !== "en") {
                this.use(elasticlunr[localeName]);
            }

            this.addField("name");
            this.addField("skill");
            this.setRef("id");
        });

        const recipesJson = JSON.parse(recipes);
        for (const [skillId, recipes] of Object.entries(recipesJson)) {
            for (const [recipeId, recipe] of Object.entries(recipes)) {
                index.addDoc({
                    id: `recipe:${skillId}:${recipeId}`,
                    name: recipe.name,
                    skill: skills[skillId].name
                });
            }
        }

        writeFileAsync(path.join(locale, "search.crafting-recipes.index.json"), JSON.stringify(index.toJSON()));
    }
}

const makeSkillsSearchIndex = async function () {
    const locales = glob.sync("./locales/*");

    for (const locale of locales) {
        const localeName = path.basename(locale);

        const elasticlunr = require("elasticlunr");
        require('lunr-languages/lunr.stemmer.support.js')(elasticlunr);
        if (localeName !== "en") {
            require(`lunr-languages/lunr.${localeName}.js`)(elasticlunr);
        }

        const skills = await readFileAsync(path.join(locale, "skills.json"));
        const index = elasticlunr(function () {
            if (localeName !== "en") {
                this.use(elasticlunr[localeName]);
            }

            this.addField("name");
            this.addField("desc");
            this.addField("use");
            this.setRef("id");
        });

        const skillsJson = JSON.parse(skills);
        for (const [skillId, skill] of Object.entries(skillsJson)) {
            index.addDoc({
                id: `skill:${skillId}`,
                name: skill.name,
                desc: skill.desc,
                use: skill.use
            });
        }

        writeFileAsync(path.join(locale, "search.skills.index.json"), JSON.stringify(index.toJSON()));
    }
}

const makeProfessionsSearchIndex = async function () {
    const locales = glob.sync("./locales/*");

    for (const locale of locales) {
        const localeName = path.basename(locale);

        const elasticlunr = require("elasticlunr");
        require('lunr-languages/lunr.stemmer.support.js')(elasticlunr);
        if (localeName !== "en") {
            require(`lunr-languages/lunr.${localeName}.js`)(elasticlunr);
        }

        const professions = await readFileAsync(path.join(locale, "professions.json"));
        const index = elasticlunr(function () {
            if (localeName !== "en") {
                this.use(elasticlunr[localeName]);
            }

            this.addField("name");
            this.addField("desc");
            this.setRef("id");
        });

        const professionsJson = JSON.parse(professions);
        for (const [professionId, profession] of Object.entries(professionsJson)) {
            index.addDoc({
                id: `profession:${professionId}`,
                name: profession.name,
                desc: profession.desc
            });
        }

        writeFileAsync(path.join(locale, "search.professions.index.json"), JSON.stringify(index.toJSON()));
    }
}

const makeItemsSearchIndex = async function () {
    const locales = glob.sync("./locales/*");

    for (const locale of locales) {
        const localeName = path.basename(locale);

        const elasticlunr = require("elasticlunr");
        require('lunr-languages/lunr.stemmer.support.js')(elasticlunr);
        if (localeName !== "en") {
            require(`lunr-languages/lunr.${localeName}.js`)(elasticlunr);
        }

        const items = await readFileAsync(path.join(locale, "items.json"));
        const index = elasticlunr(function () {
            if (localeName !== "en") {
                this.use(elasticlunr[localeName]);
            }

            this.addField("name");
            this.setRef("id");
        });

        const itemsJson = JSON.parse(items);
        for (const [itemId, item] of Object.entries(itemsJson)) {
            index.addDoc({
                id: `item:${itemId}`,
                name: item.name
            });
        }

        writeFileAsync(path.join(locale, "search.items.index.json"), JSON.stringify(index.toJSON()));
    }
}

const makeItemTypesSearchIndex = async function () {
    const locales = glob.sync("./locales/*");

    for (const locale of locales) {
        const localeName = path.basename(locale);

        const elasticlunr = require("elasticlunr");
        require('lunr-languages/lunr.stemmer.support.js')(elasticlunr);
        if (localeName !== "en") {
            require(`lunr-languages/lunr.${localeName}.js`)(elasticlunr);
        }

        const itemTypes = await readFileAsync(path.join(locale, "item-types.json"));
        const index = elasticlunr(function () {
            if (localeName !== "en") {
                this.use(elasticlunr[localeName]);
            }

            this.addField("name");
            this.addField("desc");
            this.setRef("id");
        });

        const itemTypesJson = JSON.parse(itemTypes);
        for (const [itemTypeId, itemType] of Object.entries(itemTypesJson)) {
            index.addDoc({
                id: `item-type:${itemTypeId}`,
                name: itemType.name,
                desc: itemType.desc
            });
        }

        writeFileAsync(path.join(locale, "search.item-types.index.json"), JSON.stringify(index.toJSON()));
    }
}

const main = async function () {
    return Promise.all(
        [
            makeMaterialsSearchIndex(),
            makeRecipesSearchIndex(),
            makeSkillsSearchIndex(),
            makeProfessionsSearchIndex(),
            makeItemsSearchIndex(),
            makeItemTypesSearchIndex()
        ]
    );
}

main()
    .catch((reason) => {
        console.log(reason);
        process.exitCode = 1;
    });
