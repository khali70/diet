/** What the storage layer knows about itself, for backup compatibility checks. */
export interface SchemaInfo {
  readonly schemaVersion: number
  readonly seedHash: string
}

export interface SchemaInfoReader {
  get(): Promise<SchemaInfo>
}
