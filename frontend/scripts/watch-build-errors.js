import { watch } from 'node:fs';
import { readFileSync, existsSync } from 'node:fs';

const buildLog = 'build.log';

if (!existsSync(buildLog)) {
  console.log('No build.log found. Run "npm run build:watch" to start the build watcher.');
  process.exit(0);
}

let lastSize = 0;

function printErrors() {
  const content = readFileSync(buildLog, 'utf8');
  const errorLines = content
    .split('\n')
    .filter((line) => /error/i.test(line) && !line.includes('0 errors'));

  if (errorLines.length > 0) {
    console.log('\n--- Build errors ---');
    errorLines.forEach((line) => console.log(line));
    console.log('--------------------\n');
  }
}

watch(buildLog, () => {
  const content = readFileSync(buildLog, 'utf8');
  if (content.length !== lastSize) {
    lastSize = content.length;
    printErrors();
  }
});

console.log('Watching build.log for errors...');
printErrors();
