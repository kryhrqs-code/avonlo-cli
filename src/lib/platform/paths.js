'use strict';

const os = require('os');
const path = require('path');

function home() {
  return os.homedir();
}

function configDir() {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home(), 'AppData', 'Roaming'), 'avonlo');
  }
  if (process.platform === 'darwin') {
    return path.join(home(), 'Library', 'Application Support', 'avonlo');
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(home(), '.config'), 'avonlo');
}

function cacheDir() {
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || path.join(home(), 'AppData', 'Local'), 'avonlo', 'cache');
  }
  if (process.platform === 'darwin') {
    return path.join(home(), 'Library', 'Caches', 'avonlo');
  }
  return path.join(process.env.XDG_CACHE_HOME || path.join(home(), '.cache'), 'avonlo');
}

function configFile() {
  return path.join(configDir(), 'config.json');
}

module.exports = { home, configDir, cacheDir, configFile };
