import { rules } from './shield'

it('shield rules are setup correctly', () => {
  const rulesJSON = JSON.stringify(rules, null, 2)
  expect(rulesJSON).toMatchSnapshot()
})
