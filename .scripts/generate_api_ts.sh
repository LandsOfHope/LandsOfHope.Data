#!/bin/bash
mkdir -p ../api/ts/

ln -s /schemas/ $PWD/schemas

npm run generate-api-ts