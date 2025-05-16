/* eslint-disable no-console */
import type { SubschemaConfig } from '@graphql-tools/delegate'
import { buildHTTPExecutor } from '@graphql-tools/executor-http'
import { stitchSchemas } from '@graphql-tools/stitch'
import { FilterInputObjectFields, FilterObjectFields, FilterTypes, schemaFromExecutor } from '@graphql-tools/wrap'
import { printSchema } from 'graphql'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { platformManagement } from '../../config'

/**
 * Use transforms to filter the schema to only include the types and fields from our configured list.
 */
function transforms() {
  const types = [
    ...platformManagement.transformFilters.types,
    ...Object.keys(platformManagement.transformFilters.fields),
    ...Object.keys(platformManagement.transformFilters.inputFields),
  ]
  return [
    new FilterTypes((namedType) => {
      const included = types.includes(namedType.name)
      console.log(`Type ${namedType.name} ${included ? '✅' : '❌'}`)
      return included
    }),
    new FilterObjectFields((typeName, fieldName) => {
      const fields = platformManagement.transformFilters.fields[typeName]
      const included = !!fields && fields.includes(fieldName)
      console.log(`Type ${typeName} - Field ${fieldName} ${included ? '✅' : '❌'}`)
      return included
    }),
    new FilterInputObjectFields((typeName, fieldName) => {
      const fields = typeName ? platformManagement.transformFilters.inputFields[typeName] : undefined
      const included = !!fields && !!fieldName && fields.includes(fieldName)
      console.log(`Input Type ${typeName} - Field ${fieldName} ${included ? '✅' : '❌'}`)
      return included
    }),
  ]
}

async function introspectionSubschema(): Promise<SubschemaConfig> {
  return {
    schema: await schemaFromExecutor(buildHTTPExecutor({ endpoint: platformManagement.remoteUrl })),
    transforms: transforms(),
  }
}

async function downloadRemoteSchema() {
  const stitched = stitchSchemas({ subschemas: [await introspectionSubschema()] })
  const schema = printSchema(stitched)
  const filePath = join(__dirname, './remote-schema.graphql')
  await writeFile(filePath, `# eslint-disable\n\n${schema}`)
}

console.log('Downloading remote schema...⏳')
downloadRemoteSchema()
  .then(() => {
    console.log('Remote schema downloaded successfully ✅')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error downloading remote schema ❌:\n', error)
    process.exit(1)
  })
