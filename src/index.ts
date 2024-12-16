/**
 * pickasso
 *
 * A library for selecting diverse examples from a dataset of JSON objects.
 * Useful for creating representative subsets for testing, training, or validation.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { selectDiverseExamples } from 'pickasso';
 *
 * const dataset = [
 *   { id: 1, name: 'John', age: 25 },
 *   { id: 2, name: 'Jane', age: 30 },
 *   // ... more objects
 * ];
 *
 * const diverseExamples = selectDiverseExamples(dataset, {
 *   numExamples: 5,
 *   prioritizeComplete: true
 * });
 * ```
 */
export { selectDiverseExamples, defaultDistance } from "./lib";
export type { SelectorOptions } from "./types";
