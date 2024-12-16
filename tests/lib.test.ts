// lib.test.ts
import { selectDiverseExamples, defaultDistance } from "../src/lib";
import type { SelectorOptions } from "../src/types";

describe("selectDiverseExamples", () => {
  const testData = [
    { id: 1, name: "John", age: 25, city: "NY" },
    { id: 2, name: "Jane", age: 30, city: "LA" },
    { id: 3, name: "Bob", age: 25, city: "NY" },
    { id: 4, name: "Alice", age: 35, city: "SF" },
  ];

  test("returns requested number of examples", () => {
    const result = selectDiverseExamples(testData, { numExamples: 2 });
    expect(result).toHaveLength(2);
  });

  test("throws error if requesting more examples than available", () => {
    expect(() => selectDiverseExamples(testData, { numExamples: 5 })).toThrow(
      "Cannot select more examples than available items"
    );
  });

  test("respects custom distance function", () => {
    const customDistance = jest.fn((a, b) => Math.abs(a.age - b.age) / 35);

    const result = selectDiverseExamples(testData, {
      numExamples: 2,
      distanceFunction: customDistance,
    });

    expect(result).toHaveLength(2);
    expect(customDistance).toHaveBeenCalled();
    expect(Math.abs(result[0].age - result[1].age)).toBeGreaterThan(5);
  });

  test("validates completenessWeight", () => {
    expect(() =>
      selectDiverseExamples(testData, {
        numExamples: 2,
        completenessWeight: 1.5,
      })
    ).toThrow("completenessWeight must be between 0 and 1");
  });

  test("handles empty arrays", () => {
    const result = selectDiverseExamples([], { numExamples: 0 });
    expect(result).toHaveLength(0);
  });
});

describe("defaultDistance", () => {
  test("calculates distance between similar objects", () => {
    const obj1 = { a: 1, b: "test" };
    const obj2 = { a: 1, b: "test" };
    expect(defaultDistance(obj1, obj2)).toBe(0);
  });

  test("handles missing properties", () => {
    const obj1 = { a: 1, b: "test" };
    const obj2 = { a: 1 };
    const distance = defaultDistance(obj1, obj2);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThanOrEqual(1);
  });

  test("handles nested objects", () => {
    const obj1 = { a: { b: 1 } };
    const obj2 = { a: { b: 2 } };
    const distance = defaultDistance(obj1, obj2);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThanOrEqual(1);
  });

  test("handles arrays", () => {
    const obj1 = { arr: [1, 2, 3] };
    const obj2 = { arr: [1, 2, 4] };
    const distance = defaultDistance(obj1, obj2);
    expect(distance).toBeGreaterThan(0);
  });
});
