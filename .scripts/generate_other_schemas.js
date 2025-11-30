import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const schemaRoot = join(import.meta.dirname, "../schemas");

const creationImages = JSON.parse(
	readFileSync(
		join(import.meta.dirname, "../characters/character-creation-images.json"),
	),
);

function generateStandardCharacterCreationImages() {
	mkdirSync(join(schemaRoot, "./v1/"), { recursive: true });
	writeFileSync(
		join(schemaRoot, "./v1/characters-creation-standard-images.gen.json"),
		JSON.stringify({
			$id: "https://data.landsofhope.com/schemas/v1/characters-creation-standard-images.gen.json",
			enum: Array.from(
				new Set(
					Array.prototype.concat(
						creationImages.M.sohu,
						creationImages.M.bla,
						creationImages.M.asi,
						creationImages.F.sohu,
						creationImages.F.bla,
						creationImages.F.asi,
					),
				),
			),
			title: "StandardCharacterCreationImages",
		}),
	);
}

function generateStargazerCharacterCreationImages() {
	mkdirSync(join(schemaRoot, "./v1"), { recursive: true });
	writeFileSync(
		join(schemaRoot, "./v1/characters-creation-stargazer-images.gen.json"),
		JSON.stringify({
			$id: "https://data.landsofhope.com/schemas/v1/characters-creation-stargazer-images.gen.json",
			enum: Array.from(
				new Set(
					Array.prototype.concat(creationImages.M.star, creationImages.F.star),
				),
			),
			title: "StargazerCharacterCreationImages",
		}),
	);
}

function generateHagCharacterCreationImages() {
	mkdirSync(join(schemaRoot, "./v1/"), { recursive: true });
	writeFileSync(
		join(schemaRoot, "./v1/characters-creation-hag-images.gen.json"),
		JSON.stringify({
			$id: "https://data.landsofhope.com/schemas/v1/characters-creation-hag-images.gen.json",
			enum: Array.from(new Set(creationImages.F.hag)),
			title: "HagCharacterCreationImages",
		}),
	);
}

function generateUnchartedWatersCharacterCreationImages() {
	mkdirSync(join(schemaRoot, "./v1/"), { recursive: true });
	function generatePirateCharacterCreationImages() {
		writeFileSync(
			join(
				schemaRoot,
				"./v1/characters-creation-uncharted-waters-pirate-images.gen.json",
			),
			JSON.stringify({
				$id: "https://data.landsofhope.com/schemas/v1/characters-creation-uncharted-waters-pirate-images.gen.json",
				enum: Array.from(
					new Set(
						Array.prototype.concat(
							creationImages.M.pirate,
							creationImages.F.pirate,
						),
					),
				),
				title: "PirateCharacterCreationImages",
			}),
		);
	}

	function generateNavyCharacterCreationImages() {
		writeFileSync(
			join(
				schemaRoot,
				"./v1/characters-creation-uncharted-waters-navy-images.gen.json",
			),
			JSON.stringify({
				$id: "https://data.landsofhope.com/schemas/v1/characters-creation-uncharted-waters-navy-images.gen.json",
				enum: Array.from(
					new Set(
						Array.prototype.concat(
							creationImages.M.navy,
							creationImages.F.navy,
						),
					),
				),
				title: "NavyCharacterCreationImages",
			}),
		);
	}

	generatePirateCharacterCreationImages();
	generateNavyCharacterCreationImages();
}

generateStandardCharacterCreationImages();
generateStargazerCharacterCreationImages();
generateHagCharacterCreationImages();
generateUnchartedWatersCharacterCreationImages();
