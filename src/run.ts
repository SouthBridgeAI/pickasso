#!/usr/bin/env node

import { program } from "commander";
import fs from "fs/promises";
import { selectDiverseExamples } from "./lib";
import type { SelectorOptions } from "./types";

interface CliOptions {
  numExamples: number;
  sampleSize?: number;
  prioritizeComplete?: boolean;
  completenessWeight?: number;
  outFile?: string;
  keyPath?: string;
}

/**
 * Gets a nested value from an object using a dot-notation path
 *
 * @example
 * ```typescript
 * getNestedValue({ data: { items: [1,2,3] }}, "data.items") // returns [1,2,3]
 * ```
 */
function getNestedValue(obj: any, path?: string): any {
  if (!path) return obj;

  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current === null || typeof current !== "object") {
      throw new Error(`Invalid path: ${path} (${part} is not an object)`);
    }
    current = current[part];
    if (current === undefined) {
      throw new Error(`Invalid path: ${path} (${part} not found)`);
    }
  }

  return current;
}

async function main() {
  program
    .argument("<file>", "JSON file containing array of objects")
    .requiredOption(
      "-n, --num-examples <number>",
      "Number of examples to select",
      parseInt
    )
    .option(
      "-s, --sample-size <number>",
      "Size of random sample to consider",
      parseInt
    )
    .option(
      "-p, --prioritize-complete",
      "Prioritize objects with more fields filled"
    )
    .option(
      "-w, --completeness-weight <number>",
      "Weight for completeness (0-1)",
      parseFloat
    )
    .option("-o, --out-file <file>", "Output file (defaults to stdout)")
    .option(
      "-k, --key-path <path>",
      "Dot notation path to array in JSON (e.g., 'data.items')"
    )
    .version("1.0.0");

  program.parse();

  const options = program.opts<CliOptions>();
  const inputFile = program.args[0];

  try {
    // Read and parse input file
    const fileContent = await fs.readFile(inputFile, "utf-8");
    const jsonData = JSON.parse(fileContent);

    // Get the array using key path if specified
    let arrayData: any[];
    try {
      const data = getNestedValue(jsonData, options.keyPath);
      if (!Array.isArray(data)) {
        throw new Error(
          options.keyPath
            ? `Path '${options.keyPath}' does not point to an array`
            : "Input file must contain a JSON array"
        );
      }
      arrayData = data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to access data: ${error.message}`);
      }
      throw error;
    }

    // Configure selector options
    const selectorOptions: SelectorOptions<Record<string, unknown>> = {
      numExamples: options.numExamples,
      sampleSize: options.sampleSize,
      prioritizeComplete: options.prioritizeComplete,
      completenessWeight: options.completenessWeight,
    };

    // Select diverse examples
    const selected = selectDiverseExamples(arrayData, selectorOptions);

    // Output results
    const output = JSON.stringify(selected, null, 2);
    if (options.outFile) {
      await fs.writeFile(options.outFile, output);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main().catch(console.error);
