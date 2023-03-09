import { isLocalDev } from '@makerxstudio/node-common'
import { connect } from 'mssql'

if (!isLocalDev) {
  console.log('Database setup is only for localdev ❌')
  process.exit(1)
}

const handleError = (error: Error) => {
  console.log(error)
  process.exit(1)
}

connect('Server=localhost,1433;Database=master;User Id=sa;Password=7o}R~=XA1jmz!-aHQ^pA;Encrypt=true;TrustServerCertificate=True')
  .then(async ({ query }) => {
    const database = await query`SELECT * FROM sys.databases WHERE name = N'VerifiedOrchestration'`
    if (database.recordset.length) process.exit(0)

    await query`CREATE DATABASE VerifiedOrchestration`
    await query`CREATE LOGIN api_user WITH PASSWORD = '7o}R~=XA1jmz!-aHQ^pA'`
    await query`USE VerifiedOrchestration`
    await query`CREATE USER [api_user] FOR LOGIN [api_user]`
    await query`EXEC sp_addrolemember N'db_datareader', N'api_user'`
    await query`EXEC sp_addrolemember N'db_datawriter', N'api_user'`
    process.exit(0)
  })
  .catch(handleError)
