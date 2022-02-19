"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const importMaps = {};
function traverse(data, fn) {
    if (Array.isArray(data)) {
        data.forEach((item) => traverse(item, fn));
        return;
    }
    if (!(typeof data === 'object' && data !== null))
        return;
    Object.keys(data).forEach(key => {
        fn(data, key);
        traverse(data[key], fn);
    });
}
function main(inputPath, baseDir) {
    const data = fs_1.default.readFileSync(inputPath, 'utf8');
    const json = JSON.parse(data);
    traverse(json, (obj, key) => {
        if (key === 'tsType' && obj.tsTypeImport) {
            importMaps[obj.tsType] = obj.tsTypeImport;
        }
    });
    const inputName = path_1.default.relative(baseDir, inputPath);
    const header = Object.keys(importMaps).map(type => {
        const target = importMaps[type];
        return `import { ${type} } from './${path_1.default.relative(path_1.default.dirname(inputName), target)}'`;
    }).join("\n");
    (0, json_schema_to_typescript_1.compileFromFile)(inputPath, {
        bannerComment: header,
        cwd: './'
    })
        .then(ts => {
        console.log(ts);
    });
}
const argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .usage('keema-typescript-generator [path] --base [base]')
    .command('path', 'Path to the json schema file')
    .demandCommand(1, 'You need to provide a path to the json schema file')
    .describe('base', 'base directory of json schema files')
    .options({ base: { type: 'string', default: '.' } })
    .parseSync();
main(String(argv._[0]), argv.base);
