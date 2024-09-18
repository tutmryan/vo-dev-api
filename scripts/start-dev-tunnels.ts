import ngrok from 'ngrok'
import fs from 'fs'
import * as Path from 'node:path'
import YAML from 'yaml'
import readline from 'node:readline'
import open from 'open'

const pathToApi = `${process.cwd()}`
const pathToAdminUi = `${process.cwd()}/../verified-orchestration-admin`
const pathToPortalUi = `${process.cwd()}/../verified-orchestration-portal`

const getNgrokConfigPath = () => {
  if (process.platform === 'darwin') {
    return `${process.env.HOME}/Library/Application Support/ngrok/ngrok.yml`
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
  if (!fs.existsSync(Path.join(pathToAdminUi, 'package.json'))) {
    console.error('Admin project not found. Exiting...')
    process.exit(-1)
  }
  if (!fs.existsSync(Path.join(pathToPortalUi, 'package.json'))) {
    console.error('Portal project not found. Exiting...')
    process.exit(-1)
  }
}

let ngrokConfigPath = getNgrokConfigPath()
let ngrokAuthToken = ``
let isAuthenticated = false

const checkNgrokConfiguration = async () => {
  console.log('Checking Ngrok configuration...')

  if (fs.existsSync(ngrokConfigPath)) {
    const ngrokConfig = YAML.parse(fs.readFileSync(ngrokConfigPath, 'utf8')) as {
      authtoken?: string
    }
    if (ngrokConfig.authtoken) {
      console.log('🙌 Ngrok configuration found and authtoken is present...')
      console.log(`💡 If you get an auth error, update the authtoken in the configuration file located at ${ngrokConfigPath}`)
      isAuthenticated = true
    }
  }

  // If the file does not exist, create it
  if (!isAuthenticated) {
    console.log('No ngrok configuration file was found or the authtoken was empty. One will be created for you...')
    console.log('But before I do, you will need to provide me your authtoken. Okay?')
    console.log('You can get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken')
    console.log("I pinky promise I won't store it anywhere but the configuration file.")

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question('Please paste it here:', (token) => {
      ngrokAuthToken = token
      rl.close()
    })
  }
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

const startNgrok = async () => {
  console.log('Starting Ngrok...')

  if (!isAuthenticated && !ngrokAuthToken) {
    console.error('No authtoken provided. Exiting...')
    process.exit(-1)
  }

  console.log('Creating tunnel to the API project...')
  const apiUrl = await ngrok.connect({
    proto: 'http',
    addr: 4000,
  })
  console.log(`✅ API tunnel created at ${apiUrl}`)

  console.log('Updating the API .env file with the new API URL...')
  replaceValueInEnvConfigFile('LOCAL_DEV_TUNNEL_URI', apiUrl, pathToApi, '.env')
  console.log('Updating the Admin UI .env.local file with the new API URL...')
  replaceValueInEnvConfigFile('VITE_API_URL', `${apiUrl}/graphql`, pathToAdminUi, '.env.local')
  console.log('Updating the Portal UI .env.local file with the new API URL...')
  replaceValueInEnvConfigFile('VITE_VO_API_URL', `${apiUrl}/graphql`, pathToPortalUi, '.env.local')

  console.log('Creating tunnel to the Admin UI project...')
  const adminUiUrl = await ngrok.connect({
    proto: 'http',
    addr: 5173,
  })
  console.log(`✅ Admin UI tunnel created at ${adminUiUrl}`)

  console.log('Creating tunnel to the Portal UI project...')
  const portalUiUrl = await ngrok.connect({
    proto: 'http',
    addr: 50173,
  })
  console.log(`✅ Portal UI tunnel created at ${portalUiUrl}`)

  open('http://127.0.0.1:4040/').catch(console.error)

  console.log('')
  console.log('')
  console.log('------------------------------------------------')
  console.log('Tunnels are open')
  console.log(`  API:       ${apiUrl}`)
  console.log(`  Admin UI:  ${adminUiUrl}`)
  console.log(`  Portal UI: ${portalUiUrl}`)
  console.log('')
  console.log('Ngrok dashboard')
  console.log('  http://127.0.0.1:4040/')
  console.log('')
  console.log('------------------------------------------------')
  console.log('')
  console.log('Press Ctrl+C to close the tunnels and exit')
}

let gracefulExit = false
const graceful = async () => {
  if (gracefulExit) return
  gracefulExit = true

  // so the program will not close instantly
  process.stdin.resume()

  console.log('Gracefully closing Ngrok tunnels...')
  ngrok.kill()

  console.log('Removing Ngrok configuration...')
  replaceValueInEnvConfigFile('LOCAL_DEV_TUNNEL_URI', '', pathToApi, '.env')
  replaceValueInEnvConfigFile('VITE_API_URL', `http://localhost:4000/graphql`, pathToAdminUi, '.env.local')
  replaceValueInEnvConfigFile('VITE_VO_API_URL', `http://localhost:4000/graphql`, pathToPortalUi, '.env.local')

  process.exit(0)
}

;(async () => {
  process.on('SIGTERM', graceful)
  process.on('SIGINT', graceful)

  await checkProjectLayout()
  await checkNgrokConfiguration()
  await startNgrok()
})()
