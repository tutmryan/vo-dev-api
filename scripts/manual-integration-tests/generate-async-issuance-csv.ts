import casual from 'casual'
import fs from 'fs'
import * as os from 'node:os'
import * as Path from 'node:path'
import { dataSource, dataSourceConfig } from '../../src/data'
import { ContractEntity } from '../../src/features/contracts/entities/contract-entity'
import { randomPhoneNumber } from '../../src/test/data-generators'

// ----------------------------------------------------------------------------------
// This script generates a CSV file with random data for testing bulk async issuance
// ----------------------------------------------------------------------------------

// To run this script, from the API project root, run: `npx dotenv -e .env -- ts-node-dev scripts/manual-integration-tests/generate-async-issuance-csv.ts`

// -- Configuration

const contractId = '9650DFB2-10EF-4996-BAFE-23AA463115A5'
const rowsToGenerate = 500
let outputFilePath = Path.join(os.homedir(), `/downloads/test-file-for-async-issuance-${rowsToGenerate}-1.csv`)
let duplicateCount = 1

while (fs.existsSync(outputFilePath)) {
  duplicateCount++
  outputFilePath = Path.join(os.homedir(), `/downloads/test-file-for-async-issuance-${rowsToGenerate}-${duplicateCount}.csv`)
}

// --- Script

const header = `"ID","Issuer Name","Recipient Name","Notification Method (email | sms)","Notification Value","Verification Method (email | sms)","Verification Value","Issuance Expiry (oneDay | oneMonth | oneWeek | threeDays | threeMonths | twoWeeks)","(Optional) - Credential Expiry Date"`

async function generateAsyncIssuanceCsv() {
  console.log(dataSourceConfig)
  await dataSource.initialize()

  const contract = await dataSource.getRepository(ContractEntity).findOneByOrFail({ id: contractId })

  const additionalClaimColumns = contract.display.claims.filter((c) => !c.value).map((c) => c.label)
  const additionalClaimHeaders = additionalClaimColumns.map((c) => `"${c}"`).join(',')

  // write the header to the file
  fs.existsSync(outputFilePath) && fs.unlinkSync(outputFilePath)

  fs.writeFileSync(outputFilePath, `${header},${additionalClaimHeaders}\n`)

  for (let i = 0; i < rowsToGenerate; i++) {
    const row =
      `"${i + 1}","manual","${casual.name}","email","${casual.email}","sms",${randomPhoneNumber()},"oneWeek",,` +
      additionalClaimColumns.map(() => `"${casual.word}"`).join(',')
    fs.appendFileSync(outputFilePath, `${row}\n`)
  }

  console.log(`File written to ${outputFilePath}`)
  process.exit(0)
}

generateAsyncIssuanceCsv().catch(console.error)
