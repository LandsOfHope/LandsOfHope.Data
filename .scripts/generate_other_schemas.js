"use strict";

const fs = require('fs');
const path = require('path');
const schemaRoot = path.join(__dirname, '../schemas');

const creationImages = JSON.parse(fs.readFileSync(path.join(__dirname, '../characters/character-creation-images.json')));

function generateStandardCharacterCreationImages() {
    fs.mkdirSync(path.join(schemaRoot, './v1/'), { recursive: true });
    fs.writeFileSync(
        path.join(schemaRoot, './v1/characters-creation-standard-images.gen.json'),
        JSON.stringify(
            {
                "$id": "https://data.landsofhope.com/schemas/v1/characters-creation-standard-images.gen.json",
                "title": "StandardCharacterCreationImages",
                "enum": Array.from(new Set(
                    Array.prototype.concat(
                        creationImages.M.sohu,
                        creationImages.M.bla,
                        creationImages.M.asi,
                        creationImages.F.sohu,
                        creationImages.F.bla,
                        creationImages.F.asi
                    )
                ))
            }
        )
    )
}

function generateStargazerCharacterCreationImages() {
    fs.mkdirSync(path.join(schemaRoot, './v1'), { recursive: true });
    fs.writeFileSync(
        path.join(schemaRoot, './v1/characters-creation-stargazer-images.gen.json'),
        JSON.stringify(
            {
                "$id": "https://data.landsofhope.com/schemas/v1/characters-creation-stargazer-images.gen.json",
                "title": "StargazerCharacterCreationImages",
                "enum": Array.from(new Set(
                    Array.prototype.concat(
                        creationImages.M.star,
                        creationImages.F.star
                    )
                ))
            }
        )
    )
}

function generateHagCharacterCreationImages() {
    fs.mkdirSync(path.join(schemaRoot, './v1/'), { recursive: true });
    fs.writeFileSync(
        path.join(schemaRoot, './v1/characters-creation-hag-images.gen.json'),
        JSON.stringify(
            {
                "$id": "https://data.landsofhope.com/schemas/v1/characters-creation-hag-images.gen.json",
                "title": "HagCharacterCreationImages",
                "enum": Array.from(new Set(
                    creationImages.F.hag
                ))
            }
        )
    )
}

function generateUnchartedWatersCharacterCreationImages() {
    fs.mkdirSync(path.join(schemaRoot, './v1/'), { recursive: true });
    function generatePirateCharacterCreationImages() {
        fs.writeFileSync(
            path.join(schemaRoot, './v1/characters-creation-uncharted-waters-pirate-images.gen.json'),
            JSON.stringify(
                {
                    "$id": "https://data.landsofhope.com/schemas/v1/characters-creation-uncharted-waters-pirate-images.gen.json",
                    "title": "PirateCharacterCreationImages",
                    "enum": Array.from(new Set(
                        Array.prototype.concat(
                            creationImages.M.pirate,
                            creationImages.F.pirate
                        )
                    ))
                }
            )
        )
    }

    function generateNavyCharacterCreationImages() {
        fs.writeFileSync(
            path.join(schemaRoot, './v1/characters-creation-uncharted-waters-navy-images.gen.json'),
            JSON.stringify(
                {
                    "$id": "https://data.landsofhope.com/schemas/v1/characters-creation-uncharted-waters-navy-images.gen.json",
                    "title": "NavyCharacterCreationImages",
                    "enum": Array.from(new Set(
                        Array.prototype.concat(
                            creationImages.M.navy,
                            creationImages.F.navy
                        )
                    ))
                }
            )
        );
    }

    generatePirateCharacterCreationImages();
    generateNavyCharacterCreationImages();
}

generateStandardCharacterCreationImages();
generateStargazerCharacterCreationImages();
generateHagCharacterCreationImages();
generateUnchartedWatersCharacterCreationImages();
