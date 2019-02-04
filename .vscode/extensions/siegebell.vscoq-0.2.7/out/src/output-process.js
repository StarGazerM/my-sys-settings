"use strict";
const chalk = require('chalk');
const process = require('process');
console.log(chalk.italic("working"));
console.log(chalk.bold("bold"));
console.log(chalk.bgYellow.black("working"));
console.log(chalk.underline("underline"));
console.log(chalk.red("red"));
process.stdin.pipe(process.stdout);
//# sourceMappingURL=output-process.js.map