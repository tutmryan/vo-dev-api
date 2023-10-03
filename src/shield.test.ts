import type { ShieldRule } from 'graphql-shield/typings/types'
import { rules } from './shield'

jest.mock('graphql-shield', () => {
  const originalShield = jest.requireActual('graphql-shield')
  return {
    __esModule: true,
    ...originalShield,
    and: jest.fn().mockImplementation((...r: ShieldRule[]) => {
      const result = originalShield.and(...r)
      result.toJSON = function () {
        return { rulesAnd: this.rules }
      }
      return result
    }),
    or: jest.fn().mockImplementation((...r: ShieldRule[]) => {
      const result = originalShield.or(...r)
      result.toJSON = function () {
        return { rulesOr: this.rules }
      }
      return result
    }),
    chain: jest.fn().mockImplementation((...r: ShieldRule[]) => {
      const result = originalShield.chain(...r)
      result.toJSON = function () {
        return { rulesChain: this.rules }
      }
      return result
    }),
    race: jest.fn().mockImplementation((...r: ShieldRule[]) => {
      const result = originalShield.race(...r)
      result.toJSON = function () {
        return { rulesRace: this.rules }
      }
      return result
    }),
    not: jest.fn().mockImplementation((rule: ShieldRule, error?: string | Error) => {
      const result = originalShield.not(rule, error)
      result.toJSON = function () {
        return { ruleNot: this.rules }
      }
      return result
    }),
  }
})

it('shield rules are setup correctly', () => {
  const rulesJSON = JSON.stringify(rules, null, 2)
  expect(rulesJSON).toMatchSnapshot()
})
