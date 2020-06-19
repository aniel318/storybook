/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const glob = require('glob');

function getCommand(watch) {
  // Compile angular with tsc
  if (process.cwd().includes(path.join('app', 'angular'))) {
    return '';
  }

  const ignored = glob.sync('./src/**/*.@(d|spec|test|stories).@(js|jsx|ts|tsx)');

  const babel = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'babel');

  const args = [
    './src',
    '--out-dir ./dist',
    `--config-file ${path.resolve(__dirname, '../../.babelrc.js')}`,
    `--copy-files`,
    `--no-copy-ignored`,
  ];

  if (ignored && ignored.length) {
    // the ignore glob doesn't seem to be working at all
    args.push(
      `--ignore ${glob
        .sync('./src/**/*.@(d|spec|test|stories).@(js|jsx|ts|tsx)')
        .map((n) => `"${n}"`)
        .join(',')}`
    );
  }
  /*
   * angular needs to be compiled with tsc; a compilation with babel is possible but throws
   * runtime errors because of the the babel decorators plugin
   * Only transpile .js and let tsc do the job for .ts files
   */
  if (process.cwd().includes(path.join('addons', 'storyshots'))) {
    args.push(`--extensions ".js"`);
  } else {
    args.push(`--extensions ".js,.jsx,.ts,.tsx"`);
  }

  if (watch) {
    args.push('-w');
  }

  return `${babel} ${args.join(' ')}`;
}

function handleExit(code, stderr, errorCallback) {
  if (code !== 0) {
    if (errorCallback && typeof errorCallback === 'function') {
      errorCallback(stderr);
    }

    shell.exit(code);
  }
}

function babelify(options = {}) {
  const { watch = false, silent = true, errorCallback } = options;

  if (!fs.existsSync('src')) {
    if (!silent) {
      console.log('No src dir');
    }
    return;
  }

  const command = getCommand(watch);
  if (command !== '') {
    const { code, stderr } = shell.exec(command, { silent });
    handleExit(code, stderr, errorCallback);
  }
}

module.exports = {
  babelify,
};