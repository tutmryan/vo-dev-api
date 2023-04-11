import type { AzureFunction, Context } from '@azure/functions'

const httpTrigger: AzureFunction = async function (context: Context): Promise<void> {
  try {
    const { APP_VERSION: version } = process.env
    if (!version) throw new Error('Missing environment variable APP_VERSION')

    context.res = { status: 200, body: JSON.stringify({ version }) }
  } catch ({ message, stack }: any) {
    context.log.error(`Error while getting version`, message, stack)
    context.res = { status: 500, body: JSON.stringify({ message, stack }) }
  }
}

export default httpTrigger
