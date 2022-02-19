import { compileFromFile } from 'json-schema-to-typescript'
import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'


const importMaps: any = {}

function traverse(data: any, fn: (data: any, key: string) => void) {
  if (Array.isArray(data)) {
    data.forEach((item) => traverse(item, fn))
    return
  }
  if (!(typeof data === 'object' && data !== null)) return

  Object.keys(data).forEach(key => {
    fn(data, key)
    traverse(data[key], fn)
  })
}

function main(inputPath: string, baseDir: string) {
  const data = fs.readFileSync(inputPath, 'utf8')
  const json = JSON.parse(data)
  traverse(json, (obj, key) => {
    if (key === 'tsType' && obj.tsTypeImport) {
      importMaps[obj.tsType] = obj.tsTypeImport
    }
  })

  const inputName = path.relative(baseDir, inputPath)
  const header = Object.keys(importMaps).map(type => {
    const target = importMaps[type]
    return `import { ${type} } from './${path.relative(path.dirname(inputName), target)}'`
  }).join("\n")

  compileFromFile(inputPath, {
    bannerComment: header,
    cwd: './'
  })
    .then(ts => {
      console.log(ts)
    })

}

const argv = yargs(hideBin(process.argv))
  .usage('keema-typescript-generator [path] --base [base]')
  .command('path', 'Path to the json schema file')
  .describe('base', 'base directory of json schema files')
  .options({ base: { type: 'string', demandOption: true, default: '.' } })
  .parseSync()

main(String(argv._[0]), argv.base)
