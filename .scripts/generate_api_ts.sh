#!/bin/bash
mkdir -p ../api/ts/

ln -s $PWD/schemas /schemas

npm run generate-api-ts