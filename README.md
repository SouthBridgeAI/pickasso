# 🎨 pickasso

<div align="center">

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**Intelligent selection of diverse examples from JSON datasets**

[Features](#-features) • [Quick Start](#-quick-start) • [Installation](#-installation) • [Usage](#-usage) • [Advanced](#-advanced-usage) • [How It Works](#-how-it-works)

</div>

## 🎯 Features

- 🔄 **Smart Selection**: Intelligently selects diverse examples from your dataset
- 📊 **Completeness Aware**: Optionally prioritizes more complete records
- 🎛️ **Configurable Distance**: Custom distance functions for your specific needs
- 💪 **Efficient Processing**: Smart sampling for large datasets
- 🎮 **CLI Support**: Easy command-line interface for quick analysis
- 📦 **TypeScript Ready**: Full TypeScript support with comprehensive types

## 🚀 Quick Start

```bash
# From npm
bunx pickasso data.json -n 5

# Using key path for nested data
bunx pickasso response.json -n 5 -k "data.items"

# Prioritize complete records
bunx pickasso users.json -n 10 -p
```

## 📦 Installation

### As a CLI Tool

```bash
bunx pickasso <file> -n <number_of_examples>
```

### As a Package

```bash
bun install pickasso
```

## 💻 Usage

### Command Line Interface

```bash
bunx pickasso <input-file> [options]
```

Options:

- `-n, --num-examples <number>`: Number of examples to select (required)
- `-s, --sample-size <number>`: Size of random sample to consider
- `-p, --prioritize-complete`: Consider record completeness in selection
- `-k, --key-path <path>`: Path to array in nested JSON (e.g., 'data.items')
- `-o, --out-file <file>`: Output file (defaults to stdout)
- `-w, --completeness-weight <number>`: Balance between diversity and completeness (0-1, only used with -p)
  - 0: Pure diversity-based selection
  - 1: Pure completeness-based selection
  - 0.3 (default): Balanced selection favoring diversity

### As a Module

```typescript
import { selectDiverseExamples } from "pickasso";

const dataset = [
  { id: 1, name: "John", age: 25 },
  { id: 2, name: "Jane", age: 30 },
  // ... more objects
];

const diverseExamples = selectDiverseExamples(dataset, {
  numExamples: 5,
  prioritizeComplete: true,
  completenessWeight: 0.3,
});
```

## 🔧 Advanced Usage

### Custom Distance Functions

Define how similarity is calculated between objects:

```typescript
const customDistance = (a: any, b: any) => {
  // Custom logic to calculate distance
  // Returns a number between 0 and 1
  return Math.abs(a.age - b.age) / 100;
};

const selected = selectDiverseExamples(dataset, {
  numExamples: 5,
  distanceFunction: customDistance,
});
```

### Handling Large Datasets

Pickasso automatically handles large datasets efficiently:

```typescript
// For large datasets, use sample size to control processing
const selected = selectDiverseExamples(largeDataset, {
  numExamples: 10,
  sampleSize: 1000, // Consider 1000 random items
});
```

### Balancing Diversity and Completeness

When working with real-world data, you often want examples that are both diverse and well-populated. Pickasso lets you control this balance:

```typescript
// Default behavior: Pure diversity-based selection
const diverse = selectDiverseExamples(dataset, {
  numExamples: 5,
});

// Prioritize complete records while maintaining diversity
const balancedSelection = selectDiverseExamples(dataset, {
  numExamples: 5,
  prioritizeComplete: true, // Enable completeness consideration
  completenessWeight: 0.3, // 30% completeness, 70% diversity
});

// Strongly favor complete records
const completeRecords = selectDiverseExamples(dataset, {
  numExamples: 5,
  prioritizeComplete: true,
  completenessWeight: 0.8, // 80% completeness, 20% diversity
});
```

### Working with Nested Data

Both CLI and API support nested data structures:

```typescript
// CLI
pickasso complex.json -n 5 -k "response.data.items"

// API
const data = {
  response: {
    data: {
      items: [/* ... */]
    }
  }
};

const selected = selectDiverseExamples(data.response.data.items, {
  numExamples: 5
});
```

## ⚙️ How It Works

Pickasso uses a multi-step algorithm to select diverse examples:

1. **Initial Selection**

   - Randomly samples from the dataset if needed
   - Optionally starts with the most complete item

2. **Iterative Selection**

   - Calculates distances between candidates and selected items
   - Maximizes minimum distance to ensure diversity
   - Optionally weights completeness scores

3. **Distance Calculation**
   - Flattens nested objects for comparison
   - Normalizes numerical differences
   - Handles missing values gracefully

## 🛠️ Requirements

- Node.js 14 or later
- TypeScript 4.5+ (for development)

## Contributing

Contributions are welcome! Check out our [contribution guidelines](CONTRIBUTING.md) for details.

Created by [Hrishi Olickel](https://twitter.com/hrishioa) • Support Pickasso by starring our [GitHub repository](https://github.com/southbridgeai/pickasso)
