import casual from 'casual'
import fs from 'fs'
import * as os from 'node:os'
import * as Path from 'node:path'
import { dataSource, dataSourceConfig } from '../../src/data'
import { ContractEntity } from '../../src/features/contracts/entities/contract-entity'
import { IANA_RESERVED_DOMAINS } from '../../src/util/email'
import { RESERVED_TEST_PHONE_NUMBERS } from '../../src/util/sms'

// ----------------------------------------------------------------------------------
// This script generates a CSV file with random data for testing bulk async issuance
// ----------------------------------------------------------------------------------

// To run this script, from the API project root, run: `npx dotenv -e .env -- ts-node-dev scripts/manual-integration-tests/generate-async-issuance-csv.ts`

// -- Configuration

const contractId = '4EF81A0B-D981-4401-9C9A-06029FDA80C0'
const rowsToGenerate = [250, 500, 750, 1000, 2000, 5000, 10000, 20000, 50000, 100000]

// --- Script

const header = `"ID","Issuer Name","Recipient Name","Notification Method (email | sms)","Notification Value","Verification Method (email | sms)","Verification Value","Issuance Expiry (oneDay | oneMonth | oneWeek | threeDays | threeMonths | twoWeeks)","(Optional) - Credential Expiry Date"`

const generateRandomEmail = () => `${casual.username}@${casual.random_element(IANA_RESERVED_DOMAINS)}.com`
const generateRandomPhoneNumber = () => casual.random_element([...RESERVED_TEST_PHONE_NUMBERS.values()])

async function generateAsyncIssuanceCsv() {
  await dataSource.initialize()
  const contract = await dataSource.getRepository(ContractEntity).findOneByOrFail({ id: contractId })

  const additionalClaimColumns = contract.display.claims.filter((c) => !c.value).map((c) => c.label)
  const additionalClaimHeaders = additionalClaimColumns.map((c) => `"${c}"`).join(',')

  for (const rows of rowsToGenerate) {
    console.log(`Generating ${rows} rows`)

    let outputFilePath = Path.join(os.homedir(), `/downloads/test-file-for-async-issuance-${rows}-1.csv`)
    let duplicateCount = 1
    while (fs.existsSync(outputFilePath)) {
      duplicateCount++
      outputFilePath = Path.join(os.homedir(), `/downloads/test-file-for-async-issuance-${rows}-${duplicateCount}.csv`)
    }

    // write out the header
    fs.existsSync(outputFilePath) && fs.unlinkSync(outputFilePath)
    fs.writeFileSync(outputFilePath, `${header},${additionalClaimHeaders}\n`)

    // write out the rows
    for (let i = 0; i < rows; i++) {
      const row =
        `"${casual.integer(100_000_000_000, 999_999_999_999)}","manual","${casual.name}","email","${generateRandomEmail()}","sms",${generateRandomPhoneNumber()},"oneWeek",,` +
        additionalClaimColumns.map(() => `"${casual.word}"`).join(',')
      fs.appendFileSync(outputFilePath, `${row}\n`)
    }

    console.log(`File written to ${outputFilePath}`)
  }

  process.exit(0)
}

generateAsyncIssuanceCsv().catch(console.error)
