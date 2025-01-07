#!/usr/bin/env node

import { program } from "commander";
import fs from "fs/promises";
import clipboardy from "clipboardy";
import { selectDiverseExamples } from "./lib";
import type { SelectorOptions } from "./types";

interface CliOptions {
  numExamples: number;
  sampleSize?: number;
  prioritizeComplete?: boolean;
  completenessWeight?: number;
  outFile?: string;
  keyPath?: string;
  clipboard?: boolean;
}
/**
 * Check if stdout is being piped
 */
function isOutputPiped(): boolean {
  return process.stdout.isTTY === undefined || process.stdout.isTTY === false;
}

/**
 * Gets a nested value from an object using a dot-notation path
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

/**
 * Reads input from stdin
 */
async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Uint8Array);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Gets the content of the clipboard
 */
async function getClipboardContent(): Promise<string> {
  try {
    return await clipboardy.read();
  } catch (error) {
    throw new Error(
      `Failed to read clipboard: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function main() {
  // Set up command line options
  program
    .argument("[file]", "JSON file containing array of objects (or use stdin)")
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
    .option(
      "-c, --clipboard",
      "Read input from clipboard instead of file or stdin"
    )
    .version("1.0.0");

  program.parse();

  const options = program.opts<CliOptions>();
  const inputFile = program.args[0];
  const isStdin = !process.stdin.isTTY;

  try {
    // Determine input source and get content
    let fileContent: string;

    if (options.clipboard) {
      !isOutputPiped() && console.log("Reading from clipboard...");
      fileContent = await getClipboardContent();
    } else if (inputFile) {
      !isOutputPiped() && console.log(`Reading from file: ${inputFile}`);
      fileContent = await fs.readFile(inputFile, "utf-8");
    } else if (isStdin) {
      !isOutputPiped() && console.log("Reading from stdin...");
      fileContent = await readStdin();
    } else {
      throw new Error(
        "No input provided. Use --clipboard flag, provide a file argument, or pipe data to stdin"
      );
    }

    // Get the array using key path if specified
    let arrayData: any[];
    try {
      const jsonData = JSON.parse(fileContent.trim());
      const data = getNestedValue(jsonData, options.keyPath);
      if (!Array.isArray(data)) {
        throw new Error(
          options.keyPath
            ? `Path '${options.keyPath}' does not point to an array`
            : "Input must contain a JSON array"
        );
      }
      arrayData = data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse data: ${error.message}`);
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
      !isOutputPiped() && console.log(`Results written to ${options.outFile}`);
    }
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Start the program
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
