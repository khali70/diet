import type { SchemaInfo, SchemaInfoReader } from '@/domain/ports/schema-info'
import { SCHEMA_VERSION, type DietDatabase } from '../db/schema'

export class DexieSchemaInfo implements SchemaInfoReader {
  constructor(private readonly db: DietDatabase) {}

  async get(): Promise<SchemaInfo> {
    const row = await this.db.meta.get('singleton')
    return {
      schemaVersion: row?.schemaVersion ?? SCHEMA_VERSION,
      seedHash: row?.seedHash ?? '',
    }
  }
}
