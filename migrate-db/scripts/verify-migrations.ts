import spawn = require('cross-spawn')
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config()

const runCommand = (command: string, args: string[], cwd: string = process.cwd()) => {
  return new Promise<void>((resolvePromise, reject) => {
    console.log(`> ${command} ${args.join(' ')}`)
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'test' },
    })

    child.on('close', (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`))
      } else {
        resolvePromise()
      }
    })

    child.on('error', (err: Error) => {
      reject(err)
    })
  })
}

const main = async () => {
  try {
    const projectRoot = resolve(__dirname, '../..')

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

    // We need to disable the random database suffix for this check so we can predict the DB name
    // We also force the DB setup to run even though we are technically in 'test' mode (not localdev)
    process.env.TEST_DATA_MIGRATION_DRIFT = 'true'

    // Migration 1755489140150 requiring HOME_TENANT_ID
    // We try to use what's in .env (loaded above), otherwise fall back to strict test defaults for CI
    process.env.HOME_TENANT_ID ||= '11111111-1111-1111-1111-111111111111'
    process.env.HOME_TENANT_NAME ||= 'Test Home Tenant'

    console.log('Step 1: Initializing database (ensure it exists)...')
    await runCommand(npmCmd, ['run', 'db:init-localdev'], projectRoot)

    console.log('\nStep 2: Resetting database (drop schema + run migrations)...')
    await runCommand(npmCmd, ['run', 'db:reset'], projectRoot)

    console.log('\nStep 3: Checking for schema drift...')
    await runCommand(npmCmd, ['run', 'db:migration:check'], projectRoot)

    console.log('\nSUCCESS: Migrations are valid and up-to-date.')
    process.exit(0)
  } catch (error) {
    console.error('\nFAILURE: Migration verification failed.')
    console.error(error)
    process.exit(1)
  }
}

main()
