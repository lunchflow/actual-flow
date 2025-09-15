#!/usr/bin/env node

import 'dotenv/config';
import chalk from 'chalk';
import { LunchFlowImporter } from './importer';

async function main() {
  try {
    const importer = new LunchFlowImporter();
    await importer.run();
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

main();
