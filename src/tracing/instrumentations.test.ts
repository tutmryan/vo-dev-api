import { InstrumentationBase } from '@opentelemetry/instrumentation'
import type { InstrumentationNodeModuleDefinition } from '@opentelemetry/instrumentation/build/src/instrumentationNodeModuleDefinition'
import { groupBy } from 'lodash'
import { existsSync } from 'node:fs'
import path from 'node:path'
import * as os from 'os'
import * as semver from 'semver'
import { instrumentations } from './instrumentations'

describe('OpenTelemetry instrumentations', () => {
  it(`are compatible with the installed version of the packages they instrument`, () => {
    const applicableInstrumentationDefinitions = instrumentations
      // They can expose several module definitions; redis does: one for @redis/client, one for @node-redis/client
      .flatMap(
        (x) =>
          (x as { init: InstrumentationBase['init'] }).init() as
            | InstrumentationNodeModuleDefinition<unknown>
            | InstrumentationNodeModuleDefinition<unknown>[],
      )
      // Only get the ones that apply to us
      .filter(({ name }) => existsSync(getPackageNodeModulesDirectory(name)))

    const groupedByPackageName = groupBy(applicableInstrumentationDefinitions, (x) => x.name)
    const results = Object.entries(groupedByPackageName).map(([packageName, instrumentationDefinitions]) => {
      const installedVersion = getPackageVersion(packageName)
      const incompatibleInstrumentationDefinitions = instrumentationDefinitions.filter(({ supportedVersions }) => {
        // http and https instrumentations have a '*' version range, so we special case it
        // because we can't get versions for these built-in modules
        if (supportedVersions.includes('*')) {
          return false
        }

        return supportedVersions.every((x) => !semver.satisfies(installedVersion, x))
      })

      // If none of the definitions for a package are applicable, then we have an issue
      return incompatibleInstrumentationDefinitions.length !== instrumentationDefinitions.length
        ? ({ result: 'success' } as const)
        : ({
            result: 'failure',
            packageName,
            packageVersion: installedVersion,
            supportedVersions: incompatibleInstrumentationDefinitions.flatMap((x) => x.supportedVersions),
          } as const)
    })

    const failures = results.filter((x): x is typeof x & { result: 'failure' } => x.result === 'failure')
    if (failures.length > 0) {
      throw new Error(`Some instrumentations are not compatible with the version of the installed packages:
${failures
  .map(
    ({ packageName, packageVersion, supportedVersions }) =>
      `- ${packageName}@${packageVersion}, supported versions are ${supportedVersions.join(', ')}`,
  )
  .join(os.EOL)}`)
    }
  })
})

function getPackageVersion(packageName: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(path.join(getPackageNodeModulesDirectory(packageName), 'package.json')).version
}

function getPackageNodeModulesDirectory(packageName: string): string {
  return path.join(process.cwd(), 'node_modules', packageName)
}
