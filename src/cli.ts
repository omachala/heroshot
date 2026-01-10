import { Command } from 'commander';

const program = new Command();

program
  .name('heroshot')
  .description('Define your screenshots once, update them forever with one command')
  .version('0.0.1');

program
  .command('init')
  .description('Create a heroshot.json config file')
  .action(() => {
    console.log('TODO: Create heroshot.json');
  });

program
  .command('sync')
  .description('Capture all screenshots defined in config')
  .option('--id <id>', 'Only capture a specific screenshot by ID')
  .action(options => {
    console.log('TODO: Sync screenshots', options);
  });

program
  .command('check')
  .description('Check if screenshots are up-to-date (for CI)')
  .action(() => {
    console.log('TODO: Check screenshots');
  });

program.parse();
