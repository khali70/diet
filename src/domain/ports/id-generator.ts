/** Identity as a dependency, so tests get stable ids. */
export interface IdGenerator {
  next(): string
}
