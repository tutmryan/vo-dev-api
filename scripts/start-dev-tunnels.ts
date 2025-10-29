import fs from 'fs'
import mssql from 'mssql'
import { spawn } from 'node:child_process'
import * as Path from 'node:path'
import readline from 'node:readline'
import open from 'open'
import openEditor from 'open-editor'
import YAML from 'yaml'

const pathToApi = `${process.cwd()}`
const pathToComposer = `${process.cwd()}/../verified-orchestration-admin`
const pathToConcierge = `${process.cwd()}/../verified-orchestration-portal`

const getNgrokConfigPath = () => {
  if (process.platform === 'darwin') {
    return `${process.env.HOME}/Library/Application Support/ngrok/ngrok.yml`
  } else if (process.platform === 'linux') {
    return `${process.env.HOME}/.config/ngrok/ngrok.yml`
  } else if (process.platform === 'win32') {
    return `${process.env.HOMEPATH}/AppData/Local/ngrok/ngrok.yml`
  }
  throw new Error('Unsupported platform. Please add the path to the Ngrok configuration file logic.')
}

const checkProjectLayout = async () => {
  console.log('Checking project layout...')
  if (!fs.existsSync(Path.join(pathToApi, 'package.json'))) {
    console.error('API project not found. Exiting...', Path.join(pathToApi, 'package.json'))
    process.exit(-1)
  }
  if (!fs.existsSync(Path.join(pathToComposer, 'package.json'))) {
    console.error('Composer project not found. Exiting...')
    process.exit(-1)
  }
  if (!fs.existsSync(Path.join(pathToConcierge, 'package.json'))) {
    console.error('Concierge project not found. Exiting...')
    process.exit(-1)
  }
}

let ngrokConfigPath = getNgrokConfigPath()

interface NgrokEndpoint {
  name: string
  url: string
  upstream: {
    url: number | string
    protocol: string
  }
}

interface NgrokConfig {
  version?: string
  agent?: {
    authtoken?: string
  }
  endpoints?: NgrokEndpoint[]
}

const checkNgrokConfiguration = async () => {
  console.log('Checking Ngrok configuration...')

  if (!fs.existsSync(ngrokConfigPath)) {
    console.error(`No ngrok configuration file found at ${ngrokConfigPath}`)
    console.error('Please create a configuration file with your tunnels.')
    console.error('See: https://ngrok.com/docs/agent/config/')
    process.exit(-1)
  }

  const ngrokConfig = YAML.parse(fs.readFileSync(ngrokConfigPath, 'utf8')) as NgrokConfig

  if (!ngrokConfig.agent?.authtoken) {
    console.error('No authtoken found in ngrok configuration file.')
    console.error(`Please add your authtoken to ${ngrokConfigPath}`)
    console.error('Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken')
    process.exit(-1)
  }

  const requiredTunnels = ['api-tunnel', 'composer-tunnel', 'concierge-tunnel']
  const configuredTunnels = ngrokConfig.endpoints?.map((e) => e.name) || []
  const missingTunnels = requiredTunnels.filter((t) => !configuredTunnels.includes(t))

  if (missingTunnels.length > 0) {
    console.error(`Missing required tunnels in ngrok configuration: ${missingTunnels.join(', ')}`)
    console.error(`Please add these tunnels to ${ngrokConfigPath}`)
    console.error('Required tunnels: api-tunnel, composer-tunnel, concierge-tunnel')
    console.error('Register your own subdomains for these tunnels at https://dashboard.ngrok.com/domains')
    process.exit(-1)
  }

  console.log('🙌 Ngrok configuration found with all required tunnels...')
  console.log(`💡 Config file: ${ngrokConfigPath}`)

  return ngrokConfig
}

const replaceValueInEnvConfigFile = (key: string, value: string, projectPath: string, fileName: string) => {
  const envConfigPath = Path.join(projectPath, fileName)

  if (!fs.existsSync(envConfigPath)) {
    console.error(`No .env file found at ${envConfigPath}. Exiting...`)
    process.exit(-1)
  }

  const envConfig = fs.readFileSync(envConfigPath, 'utf8')

  // if the key does not exist, add it
  if (!envConfig.includes(key)) {
    fs.appendFileSync(envConfigPath, `${key}=${value}\n`)
    return
  }

  const updatedEnvConfig = envConfig.replace(new RegExp(`${key}=.*`), `${key}=${value}`)
  fs.writeFileSync(envConfigPath, updatedEnvConfig, 'utf8')
}

let ngrokProcess: ReturnType<typeof spawn> | null = null

const startNgrok = async (ngrokConfig: NgrokConfig) => {
  console.log('Starting Ngrok...')

  // Get tunnel URLs from config
  const apiEndpoint = ngrokConfig.endpoints?.find((e) => e.name === 'api-tunnel')
  const composerEndpoint = ngrokConfig.endpoints?.find((e) => e.name === 'composer-tunnel')
  const conciergeEndpoint = ngrokConfig.endpoints?.find((e) => e.name === 'concierge-tunnel')

  if (!apiEndpoint || !composerEndpoint || !conciergeEndpoint) {
    console.error('Could not find required tunnel endpoints in config')
    process.exit(-1)
  }

  const apiURL = `https://${apiEndpoint.url}`
  const composerURL = `https://${composerEndpoint.url}`
  const conciergeURL = `https://${conciergeEndpoint.url}`

  console.log('Starting ngrok tunnels...')

  // Start ngrok with the config file
  ngrokProcess = spawn('ngrok', ['start', 'api-tunnel', 'composer-tunnel', 'concierge-tunnel'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  ngrokProcess.stdout?.on('data', (data) => {
    console.log(`[ngrok] ${data.toString().trim()}`)
  })

  ngrokProcess.stderr?.on('data', (data) => {
    console.error(`[ngrok error] ${data.toString().trim()}`)
  })

  ngrokProcess.on('error', (error) => {
    console.error('Failed to start ngrok:', error.message)
    console.error('Make sure ngrok CLI is installed: https://dashboard.ngrok.com/get-started/setup')
    process.exit(-1)
  })

  ngrokProcess.on('exit', (code) => {
    if (code !== 0 && !gracefulExit) {
      console.error(`ngrok process exited with code ${code}`)
      process.exit(code ?? -1)
    }
  })

  // Wait a bit for ngrok to start
  console.log('Waiting for ngrok to initialize...')
  await new Promise((resolve) => setTimeout(resolve, 3000))

  console.log(`✅ API tunnel: ${apiURL}`)
  console.log(`✅ Composer tunnel: ${composerURL}`)
  console.log(`✅ Concierge tunnel: ${conciergeURL}`)

  // API
  console.log('Updating the API .env file with the new API URL...')
  replaceValueInEnvConfigFile('LOCAL_DEV_TUNNEL_API', apiURL, pathToApi, '.env')
  console.log('Updating the API .env file with the new Portal tunnel URL...')
  replaceValueInEnvConfigFile('LOCAL_DEV_TUNNEL_PORTAL', conciergeURL, pathToApi, '.env')

  // Composer
  console.log('Updating the Composer .env.local file with the new API URL...')
  replaceValueInEnvConfigFile('VITE_API_URL', `${apiURL}/graphql`, pathToComposer, '.env.local')
  replaceValueInEnvConfigFile('VITE_API_SCHEMA_URL', `${apiURL}/graphql`, pathToComposer, '.env.local')
  replaceValueInEnvConfigFile('VITE_PORTAL_URL', conciergeURL, pathToComposer, '.env.local')

  // Concierge
  console.log('Updating the Concierge .env.local file with the new API URL...')
  replaceValueInEnvConfigFile('VITE_VO_API_URL', `${apiURL}/graphql`, pathToConcierge, '.env.local')
  replaceValueInEnvConfigFile('VITE_OIDC_AUTHORITY', `${apiURL}/oidc`, pathToConcierge, '.env.local')

  // Patch local dev tunnel icon URLs
  // TODO: Swap this over to the API DB infrastructure when we can import it without errors. 🙌 Yay for CJS/ESM interop.
  const { host, db, user, pass } = {
    host: process.env.DATABASE_HOST,
    db: 'VerifiedOrchestration',
    user: process.env.DATABASE_USERNAME,
    pass: process.env.DATABASE_PASSWORD,
  }
  await mssql.connect(`Server=${host},1433;Database=${db};User Id=${user};Password=${pass};TrustServerCertificate=true;`)
  await mssql.query`
    WITH q AS
    (
      SELECT id, PATINDEX('%https://%.ngrok.app%', display_json) AS i, PATINDEX('%ppa.korgn.%//:sptth%', REVERSE(display_json)) AS ri, LEN(display_json) AS l
      FROM contract
    )
    UPDATE contract
    SET display_json = STUFF(display_json, q.i, q.l - (q.i + q.ri - 2), ${apiURL})
    FROM q
    WHERE contract.id = q.id`

  const renderUi = () => {
    console.log('')
    console.log('')
    console.log('------------------------------------------------')
    console.log('Tunnels are open')
    console.log(`  API:       ${apiURL}`)
    console.log(`  Composer:  ${composerURL}`)
    console.log(`  Concierge: ${conciergeURL}`)
    console.log('')
    console.log('Ngrok dashboard')
    console.log('  http://127.0.0.1:4040/')
    console.log('')
    console.log('------------------------------------------------')
    console.log('')
    console.log('Press Ctrl+C to close the tunnels and exit')
    console.log('')
    console.log('Enter 1 or a to open API')
    console.log('Enter 2 or c to open Composer')
    console.log('Enter 3 or p to open Concierge')
    console.log('Enter 4 or n to open the ngrok dashboard')
    console.log('')
    console.log('------------------------------------------------')
    console.log('Enter `e` to edit the Ngrok configuration file')
    console.log('')
  }

  renderUi()

  const rl = readline.createInterface(process.stdin)

  rl.on('line', (input) => {
    console.clear()
    renderUi()
    switch (input.toLowerCase()) {
      case '1':
      case 'a':
        console.log('Opening API...')
        open(apiURL).catch(console.error)
        break
      case '2':
      case 'c':
        console.log('Opening Composer...')
        open(composerURL).catch(console.error)
        break
      case '3':
      case 'p':
        console.log('Opening Concierge...')
        open(conciergeURL).catch(console.error)
        break
      case '4':
      case 'n':
        console.log('Opening Ngrok dashboard...')
        open('http://127.0.0.1:4040/').catch(console.error)
        break
      case 'e':
        console.log('Opening Ngrok configuration file...')
        openEditor(
          [
            {
              file: ngrokConfigPath,
            },
          ],
          {
            editor: 'code',
          },
        )
        break
    }
  })
}

let gracefulExit = false
const graceful = async () => {
  if (gracefulExit) return
  gracefulExit = true

  // so the program will not close instantly
  process.stdin.resume()

  console.log('Gracefully closing Ngrok tunnels...')
  if (ngrokProcess) {
    ngrokProcess.kill('SIGTERM')
  }

  console.log('Removing Ngrok configuration...')
  replaceValueInEnvConfigFile('LOCAL_DEV_TUNNEL_API', '', pathToApi, '.env')
  replaceValueInEnvConfigFile('LOCAL_DEV_TUNNEL_PORTAL', '', pathToApi, '.env')
  replaceValueInEnvConfigFile('VITE_API_URL', `http://localhost:4000/graphql`, pathToComposer, '.env.local')
  replaceValueInEnvConfigFile('VITE_VO_API_URL', `http://localhost:4000/graphql`, pathToConcierge, '.env.local')

  process.exit(0)
}

;(async () => {
  process.on('SIGTERM', graceful)
  process.on('SIGINT', graceful)

  await checkProjectLayout()
  const ngrokConfig = await checkNgrokConfiguration()
  await startNgrok(ngrokConfig)
})()
