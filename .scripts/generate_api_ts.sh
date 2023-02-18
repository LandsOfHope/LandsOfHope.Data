mkdir -p /api/ts/

npm install -g json-schema-to-typescript@latest
json2ts -i /schemas/ -o /api/ts/