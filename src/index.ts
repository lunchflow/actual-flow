#!/usr/bin/env node

import 'dotenv/config';
import chalk from 'chalk';
import { LunchFlowImporter } from './importer';

async function main() {
  try {
    const importer = new LunchFlowImporter();
    
    // Check for command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'import') {
      // Direct import command - skip the interactive menu
      await importer.runImport();
    } else if (command === 'help' || command === '--help' || command === '-h') {
      showHelp();
    } else if (command) {
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log(chalk.yellow('Use "help" to see available commands'));
      process.exit(1);
    } else {
      // No command provided - run interactive mode
      await importer.run();
    }
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(chalk.blue.bold('\n🍽️  Lunch Flow → Actual Budget Importer\n'));
  console.log(chalk.gray('Usage: actual-flow [command]\n'));
  console.log(chalk.cyan('Commands:'));
  console.log('  import    Run the import process directly (non-interactive)');
  console.log('  help      Show this help message');
  console.log('  (no args) Run in interactive mode\n');
  console.log(chalk.gray('Examples:'));
  console.log('  actual-flow import    # Run import directly');
  console.log('  actual-flow           # Run interactive mode');
  console.log('  actual-flow help      # Show help\n');
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
