/**
 * Configuration options for selecting diverse examples from a dataset
 * @interface SelectorOptions
 */
export interface SelectorOptions<T extends Record<string, unknown>> {
  numExamples: number;
  sampleSize?: number;
  prioritizeComplete?: boolean;
  completenessWeight?: number;
  distanceFunction?: (a: T, b: T) => number;
}
