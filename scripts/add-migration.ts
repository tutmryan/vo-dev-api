import { requestText, writeText } from './helpers'
import { throwError } from '../src/util/throw-error'

const { runChildProc } = require('./helpers')
const subCommandName = process.argv[2] ?? throwError(new Error('Missing sub command. Expected generate or create'))
let migrationName = process.argv[3]

if (!subCommandName) {
  console.error('Missing sub-command to execute')
}

if (!migrationName) {
  writeText(`No migration name provided. You can provide one by invoking 'npm run typeorm:migration:${subCommandName} -- MIGRATION_NAME'`)
  migrationName = requestText('Enter a name for the migrations: ')
}
addMigration(subCommandName, migrationName.replaceAll(' ', '_'))

function addMigration(migrationSubCommandName: string, name: string) {
  writeText('Creating migration with name: ' + name)

  let additionalOptions: string[] = []
  if (migrationSubCommandName === 'generate') {
    additionalOptions = ['--dataSource', 'src/data', '--pretty']
  }
  runChildProc('npm', [
    'run',
    'typeorm',
    '--',
    `migration:${migrationSubCommandName}`,
    ...additionalOptions,
    `./migrate-db-lambda/migrations/${name}`,
  ])
}
