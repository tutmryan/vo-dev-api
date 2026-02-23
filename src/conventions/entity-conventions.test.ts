import { isFunction } from 'lodash'
import { getMetadataArgsStorage } from 'typeorm'
import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer'
import { beforeAfterAll } from '../test'

const typeormMetadata = getMetadataArgsStorage()
const manyToOneRelations = () => {
  return typeormMetadata.relations
    .filter((r) => r.relationType === 'many-to-one')
    .map((r) => ({
      ...r,
      typeName: isFunction(r.type) ? r.type().name : r.type,
    }))
}
const uniqueidentifierColumns = () => typeormMetadata.columns.filter((c) => c.options.type === 'uniqueidentifier')

describe('Entity Conventions', () => {
  beforeAfterAll()
  describe('Property columns', () => {
    it.each(uniqueidentifierColumns())('Mapped to type uniqueidentifier has the case transformer $target.name[$propertyName]', (column) => {
      expect(column.options.transformer).toBeDefined()
      expect(Array.isArray(column.options.transformer)).toBe(false)
      expect((column.options.transformer as ValueTransformer).from('DB-VALUE')).toBe('db-value')
    })
  })
  describe('Property relationships', () => {
    it.each(manyToOneRelations())(
      'Mapped using @ManyToOne have corresponding id property with case transformer $target.name[$propertyName] to $typeName',
      (manyToOneRelation) => {
        const columns = typeormMetadata.columns.filter((c) => c.target === manyToOneRelation.target)
        const relationIds = typeormMetadata.relationIds.filter((r) => r.target === manyToOneRelation.target)
        const expectedIdFieldName = `${manyToOneRelation.propertyName}Id`
        const idField = columns.find((c) => c.propertyName === expectedIdFieldName)

        // If the relation has an @RelationId decorator, then it is not necessary to have an id field with a transformer
        // as it seems the value is fetched from the related entity which is already transformed
        if (relationIds.find((r) => r.propertyName === expectedIdFieldName)) {
          return
        }

        expect(idField).toBeDefined()
        expect(idField?.options.transformer).toBeDefined()

        // Checking the equality of the transformer function with uuidLowerCaseTransformer is not possible (for unknown reasons)
        expect(Array.isArray(idField?.options.transformer)).toBe(false)
        expect((idField?.options.transformer as ValueTransformer).from('DB-VALUE')).toBe('db-value')
      },
    )
  })
})
