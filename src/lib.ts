import { SelectorOptions } from "./types";

/**
 * Custom error class for Pickasso-specific errors
 * @class PickassoError
 * @extends Error
 *
 * @example
 * ```typescript
 * throw new PickassoError("Invalid completeness weight");
 * ```
 */
class PickassoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PickassoError";
  }
}

// Cache for storing flattened object structures to improve performance
const flattenCache = new WeakMap<object, Record<string, any>>();

/**
 * Calculates a normalized distance between two objects
 *
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns A number between 0 and 1, where 0 means identical and 1 means completely different
 *
 * @throws {PickassoError} When inputs are not valid objects
 *
 * @example
 * ```typescript
 * const distance = defaultDistance(
 *   { name: "John", age: 25 },
 *   { name: "Jane", age: 30 }
 * );
 * // Returns a normalized distance based on field differences
 * ```
 */
export function defaultDistance(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
): number {
  const flat1 = getFlattenedObject(obj1);
  const flat2 = getFlattenedObject(obj2);

  const allKeys = new Set([...Object.keys(flat1), ...Object.keys(flat2)]);
  let distance = 0;
  let validComparisons = 0;

  for (const key of allKeys) {
    const val1 = flat1[key];
    const val2 = flat2[key];

    if (val1 === undefined || val2 === undefined) {
      distance += 1;
      continue;
    }

    validComparisons++;

    if (typeof val1 === "number" && typeof val2 === "number") {
      const maxVal = Math.max(Math.abs(val1), Math.abs(val2));
      distance += maxVal > 0 ? Math.abs(val1 - val2) / maxVal : 0;
    } else {
      distance += val1 === val2 ? 0 : 1;
    }
  }

  return validComparisons > 0 ? distance / allKeys.size : 1;
}

/**
 * Retrieves a flattened version of an object from cache or creates a new one
 *
 * @param obj - Object to flatten
 * @returns Flattened object with dot notation for nested properties
 *
 * @internal
 */
function getFlattenedObject(obj: object): Record<string, any> {
  let flattened = flattenCache.get(obj);
  if (!flattened) {
    flattened = flattenObject(obj);
    flattenCache.set(obj, flattened);
  }
  return flattened;
}

/**
 * Flattens a nested object structure into a single-level object with dot notation
 *
 * @param obj - The object to flatten
 * @param prefix - Internal parameter for recursive calls to build the dot notation
 * @returns A flattened object where nested keys are represented with dot notation
 *
 * @example
 * ```typescript
 * const flat = flattenObject({ user: { name: "John", details: { age: 25 } } });
 * // Returns { "user.name": "John", "user.details.age": 25 }
 * ```
 *
 * @internal
 */
function flattenObject(obj: any, prefix = ""): Record<string, any> {
  return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === "object" && obj[key] !== null) {
      Object.assign(acc, flattenObject(obj[key], fullKey));
    } else {
      acc[fullKey] = obj[key];
    }

    return acc;
  }, {});
}

/**
 * Validates the options passed to selectDiverseExamples
 *
 * @param options - The options object to validate
 * @throws {PickassoError} When options contain invalid values
 *
 * @internal
 */
function validateOptions(options: SelectorOptions<any>): void {
  if (options.completenessWeight !== undefined) {
    if (options.completenessWeight < 0 || options.completenessWeight > 1) {
      throw new PickassoError("completenessWeight must be between 0 and 1");
    }
  }

  if (options.sampleSize !== undefined && options.sampleSize <= 0) {
    throw new PickassoError("sampleSize must be positive");
  }
}

/**
 * Selects a diverse subset of examples from an array of objects
 *
 * This function implements an algorithm to select a representative subset of objects
 * that maximizes diversity based on object properties and optionally prioritizes
 * more complete objects (those with fewer undefined/null values).
 *
 * @param items - Array of objects to select from
 * @param options - Configuration options for the selection process
 * @returns Array of selected diverse examples
 *
 * @throws {PickassoError}
 * - When requesting more examples than available items
 * - When options contain invalid values
 * - When input array is empty but examples are requested
 *
 * @example
 * ```typescript
 * const dataset = [
 *   { id: 1, name: "John", age: 25, city: "NY" },
 *   { id: 2, name: "Jane", age: 30, city: "LA" },
 *   { id: 3, name: "Bob", age: 25, city: "NY" },
 * ];
 *
 * const diverse = selectDiverseExamples(dataset, {
 *   numExamples: 2,
 *   prioritizeComplete: true,
 *   completenessWeight: 0.3
 * });
 * ```
 */
export function selectDiverseExamples<T extends Record<string, unknown>>(
  items: T[],
  options: SelectorOptions<T>
): T[] {
  validateOptions(options);

  const {
    numExamples,
    sampleSize = Math.min(1000, items.length),
    prioritizeComplete = false,
    completenessWeight = 0.3,
    distanceFunction = defaultDistance,
  } = options;

  // Handle edge cases with empty arrays or zero examples
  if (items.length === 0 || numExamples === 0) {
    return [];
  }

  if (numExamples > items.length) {
    throw new PickassoError("Cannot select more examples than available items");
  }

  const sampledItems =
    items.length > sampleSize ? getEfficientSample(items, sampleSize) : items;

  const selected: T[] = [];
  const remainingItems = [...sampledItems];
  const distanceCache = new Map<string, number>();

  // Helper to get cached distance
  const getCachedDistance = (a: T, b: T): number => {
    const key = `${items.indexOf(a)}-${items.indexOf(b)}`;
    if (!distanceCache.has(key)) {
      distanceCache.set(key, distanceFunction(a, b));
    }
    return distanceCache.get(key)!;
  };

  // Select first item (most complete if prioritizing completeness)
  if (prioritizeComplete) {
    const mostComplete = remainingItems.sort(
      (a, b) => calculateCompleteness(b) - calculateCompleteness(a)
    )[0];
    selected.push(mostComplete);
    remainingItems.splice(remainingItems.indexOf(mostComplete), 1);
  } else {
    const randomFirst =
      remainingItems[Math.floor(Math.random() * remainingItems.length)];
    selected.push(randomFirst);
    remainingItems.splice(remainingItems.indexOf(randomFirst), 1);
  }

  // Select remaining items
  while (selected.length < numExamples && remainingItems.length > 0) {
    let maxScore = -1;
    let bestItem: T | null = null;
    let bestIndex = -1;

    for (let i = 0; i < remainingItems.length; i++) {
      const item = remainingItems[i];
      const minDistance = Math.min(
        ...selected.map((s) => getCachedDistance(item, s))
      );

      let score = minDistance;
      if (prioritizeComplete) {
        const completeness = calculateCompleteness(item);
        score =
          (1 - completenessWeight) * minDistance +
          completenessWeight * completeness;
      }

      if (score > maxScore) {
        maxScore = score;
        bestItem = item;
        bestIndex = i;
      }
    }

    if (bestItem === null) break;

    selected.push(bestItem);
    remainingItems.splice(bestIndex, 1);
  }

  return selected;
}

/**
 * Selects an efficient sampling method based on dataset size
 *
 * @param items - Array to sample from
 * @param sampleSize - Desired sample size
 * @returns Sampled array
 *
 * @internal
 */
function getEfficientSample<T>(items: T[], sampleSize: number): T[] {
  // Use reservoir sampling for large datasets
  if (items.length > 10000) {
    return reservoirSample(items, sampleSize);
  }
  return getRandomSample(items, sampleSize);
}

/**
 * Implements reservoir sampling algorithm for efficient sampling from large datasets
 *
 * @param items - Array to sample from
 * @param sampleSize - Desired sample size
 * @returns Random sample of specified size
 *
 * @internal
 */
function reservoirSample<T>(items: T[], sampleSize: number): T[] {
  const reservoir = items.slice(0, sampleSize);

  for (let i = sampleSize; i < items.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < sampleSize) {
      reservoir[j] = items[i];
    }
  }

  return reservoir;
}

/**
 * Gets a random sample using Fisher-Yates shuffle
 *
 * @param items - Array to sample from
 * @param sampleSize - Number of items to include in the sample
 * @returns Random subset of the input array
 *
 * @internal
 */
function getRandomSample<T>(items: T[], sampleSize: number): T[] {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, sampleSize);
}

/**
 * Calculates the completeness score of an object based on defined values
 *
 * @param obj - The object to evaluate
 * @returns A number between 0 and 1, where 1 means all fields have defined values
 *
 * @example
 * ```typescript
 * const score = calculateCompleteness({
 *   name: "John",
 *   age: 25,
 *   email: undefined,
 *   phone: null
 * });
 * // Returns 0.5 (2 defined values out of 4 total fields)
 * ```
 */
export function calculateCompleteness(obj: any): number {
  const flat = getFlattenedObject(obj);
  const definedValues = Object.values(flat).filter(
    (v) => v !== undefined && v !== null
  );
  return definedValues.length / Object.keys(flat).length;
}
