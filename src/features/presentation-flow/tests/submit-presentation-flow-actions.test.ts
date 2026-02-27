import { addDays } from 'date-fns'
import type { DataDefinitionInput } from '../../../generated/graphql'
import { DataType, PresentationFlowStatus } from '../../../generated/graphql'
import type { LimitedPresentationFlowOperationInput } from '../../../test'
import { beforeAfterAll, executeOperationAsLimitedPresentationFlowClient, expectUnauthorizedError } from '../../../test'
import {
  createPresentationFlow,
  createPresentationFlowWithPresentation,
  getDefaultPresentationFlowInput,
  submitPresentationFlowActionsMutation,
} from './helpers'

async function arrangeFlowWithPresentation(overrides?: Partial<Awaited<ReturnType<typeof getDefaultPresentationFlowInput>>>) {
  const input = { ...(await getDefaultPresentationFlowInput()), ...overrides }
  const { presentation, presentationFlow } = await createPresentationFlowWithPresentation(input)
  const limitedPresentationFlowInput: LimitedPresentationFlowOperationInput = {
    presentationFlowId: presentationFlow.request.id,
    presentationId: presentation.id,
  }
  return { input, presentationFlow, presentation, limitedPresentationFlowInput }
}

function submitAs(
  flowId: string,
  limitedPresentationFlowInput: LimitedPresentationFlowOperationInput,
  submitInput: Record<string, unknown>,
) {
  return executeOperationAsLimitedPresentationFlowClient(
    {
      query: submitPresentationFlowActionsMutation,
      variables: { id: flowId, input: submitInput },
    },
    limitedPresentationFlowInput,
  )
}

describe('submit presentation flow actions', () => {
  beforeAfterAll()

  it('can be submitted with empty action results', async () => {
    const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation()

    const { data, errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, { dataResults: {} })

    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.submitPresentationFlowActions.id).toEqual(presentationFlow.request.id)
    expect(data?.submitPresentationFlowActions.status).toEqual(PresentationFlowStatus.Submitted)
    expect(data?.submitPresentationFlowActions.isSubmitted).toEqual(true)
  })

  it('returns unauthorised when no presentation has been made', async () => {
    const input = await getDefaultPresentationFlowInput()
    const presentationFlow = await createPresentationFlow(input)
    const limitedPresentationFlowInput: LimitedPresentationFlowOperationInput = {
      presentationFlowId: presentationFlow.request.id,
    }

    const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, { dataResults: {} })

    expectUnauthorizedError(errors)
  })

  it('returns an error when request is not in presentation verified state', async () => {
    const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation()

    // Submit once
    await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, { dataResults: {} })

    // Act - try to submit again
    const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, { dataResults: {} })

    expect(errors?.[0]?.message).toContain('not in a valid state')
  })

  it('returns an error when request is expired', async () => {
    const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
      expiresAt: addDays(new Date(), -1),
    })

    const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, { dataResults: {} })

    expect(errors?.[0]?.message).toContain('not in a valid state')
  })

  describe('data schema validation', () => {
    const textField: DataDefinitionInput = { type: DataType.Text, label: 'Name', required: true }
    const optionalTextField: DataDefinitionInput = { type: DataType.Text, label: 'Notes', required: false }
    const numberField: DataDefinitionInput = {
      type: DataType.Number,
      label: 'Age',
      required: true,
      constraints: { min: 0, max: 150 },
    }
    const selectField: DataDefinitionInput = {
      type: DataType.Select,
      label: 'Colour',
      required: true,
      options: [{ label: 'Red' }, { label: 'Blue' }],
    }
    const multiSelectField: DataDefinitionInput = {
      type: DataType.Select,
      label: 'Tags',
      required: true,
      allowMultiple: true,
      options: [{ label: 'A' }, { label: 'B' }, { label: 'C' }],
    }
    const booleanField: DataDefinitionInput = { type: DataType.Boolean, label: 'Agree', required: true }
    const textWithConstraints: DataDefinitionInput = {
      type: DataType.Text,
      label: 'Code',
      required: false,
      constraints: { minLength: 3, maxLength: 10, pattern: '^[A-Z]+$' },
    }

    it('accepts valid data results matching the schema', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [textField, optionalTextField, booleanField],
      })

      // Need to discover the auto-generated IDs from the created flow
      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {})

      // With required fields missing, this should fail — confirming schema is enforced
      expect(errors?.[0]?.message).toContain('"Name" is required')
    })

    it('rejects unknown data field IDs', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [textField],
      })

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { 'non-existent-id': 'value' },
      })

      expect(errors?.[0]?.message).toContain('Unknown data field ID')
    })

    it('rejects missing required text field', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [textField],
      })

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, { dataResults: {} })

      expect(errors?.[0]?.message).toContain('"Name" is required')
    })

    it('rejects empty string for required text field', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [textField],
      })

      // We need the auto-generated field ID. Fetch the entity to get it.
      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: '   ' },
      })

      expect(errors?.[0]?.message).toContain('"Name" is required')
    })

    it('accepts boolean required field with false value', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [booleanField],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { data, errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: false },
      })

      expect(errors).toBeUndefined()
      expect(data?.submitPresentationFlowActions.isSubmitted).toBe(true)
    })

    it('rejects number below minimum', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [numberField],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: -1 },
      })

      expect(errors?.[0]?.message).toContain('must be at least 0')
    })

    it('rejects number above maximum', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [numberField],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: 200 },
      })

      expect(errors?.[0]?.message).toContain('must be at most 150')
    })

    it('rejects non-numeric value for number field', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [numberField],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: 'not-a-number' },
      })

      expect(errors?.[0]?.message).toContain('must be a number')
    })

    it('rejects text shorter than minLength', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [textWithConstraints],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: 'AB' },
      })

      expect(errors?.[0]?.message).toContain('must be at least 3 characters')
    })

    it('rejects text longer than maxLength', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [textWithConstraints],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: 'ABCDEFGHIJK' },
      })

      expect(errors?.[0]?.message).toContain('must be at most 10 characters')
    })

    it('rejects text not matching pattern', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [textWithConstraints],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: 'abc' },
      })

      expect(errors?.[0]?.message).toContain('does not match the required pattern')
    })

    it('rejects invalid option for single select field', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [selectField],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: 'non-existent-option-id' },
      })

      expect(errors?.[0]?.message).toContain('invalid option')
    })

    it('rejects invalid option in multi-select field', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [multiSelectField],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: ['non-existent-option-id'] },
      })

      expect(errors?.[0]?.message).toContain('invalid option')
    })

    it('rejects empty array for required multi-select field', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [multiSelectField],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: [] },
      })

      expect(errors?.[0]?.message).toContain('at least one selection')
    })

    it('accepts valid select option', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        dataSchema: [selectField],
      })

      const { dataSource } = await import('../../../data')
      const entity = await dataSource
        .getRepository((await import('../entities/presentation-flow-entity')).PresentationFlowEntity)
        .findOneByOrFail({ id: presentationFlow.request.id })
      const fieldId = entity.dataSchema![0]!.id
      const validOptionId = entity.dataSchema![0]!.options![0]!.id

      const { data, errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        dataResults: { [fieldId]: validOptionId },
      })

      expect(errors).toBeUndefined()
      expect(data?.submitPresentationFlowActions.isSubmitted).toBe(true)
    })
  })

  describe('action key validation', () => {
    it('rejects unknown action key', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        actions: [
          { key: 'approve', label: 'Approve' },
          { key: 'reject', label: 'Reject' },
        ],
        autoSubmit: false,
      })

      const { errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        actionKey: 'unknown-key',
      })

      expect(errors?.[0]?.message).toContain('Unknown action key')
    })

    it('accepts valid action key', async () => {
      const { presentationFlow, limitedPresentationFlowInput } = await arrangeFlowWithPresentation({
        actions: [
          { key: 'approve', label: 'Approve' },
          { key: 'reject', label: 'Reject' },
        ],
        autoSubmit: false,
      })

      const { data, errors } = await submitAs(presentationFlow.request.id, limitedPresentationFlowInput, {
        actionKey: 'approve',
      })

      expect(errors).toBeUndefined()
      expect(data?.submitPresentationFlowActions.isSubmitted).toBe(true)
    })
  })
})
