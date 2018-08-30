'use strict';

const path = require('path');
const tracker = require('v8-callsites');

const moduleName = require('../package.json').name;

class SealError extends Error {
  constructor (message, code = 0, metadata = {}) {
    if (!message) {
      throw new SealError('Message is missing.');
    }
    if (typeof code === 'object') {
      metadata = code;
      code = 0;
    }
    if (typeof code !== 'number') {
      throw new SealError('Illegal data type, "code" should be number.');
    }

    super(message);

    const caller = tracker()[0].getFileName();
    const basePath = caller.replace(/([/\\])(bin|lib|test)[/\\].*$/, '$1');
    const errorJsPath = `${basePath}lib${path.sep}errors.js`;
    const packageJsonPath = `${basePath}package.json`;

    this.name = 'SealError';
    this.code = code;
    this.metadata = metadata;

    if (basePath !== caller) {
      const module = require(packageJsonPath).name;

      if (!this.errorsMap[module]) {
        this.errorsMap[module] = require(errorJsPath);
      }

      const kbCode = typeof this.errorsMap[module][message] === 'object' ?
        this.errorsMap[module][message].code :
        this.errorsMap[module][message];

      this.metadata.kbcode = `${module}.${kbCode}`;
    }
  }

  static plain (error) {
    return {
      code: error.code || 0,
      message: error.message,
      metadata: error.metadata || {}
    };
  }

  normalize () {
    return SealError.plain(this);
  }

  stringify () {
    return JSON.stringify(SealError.plain(this));
  }

  joinMeta (metadata) {
    return Object.assign({}, this.metadata, metadata);
  }

  chain (previousError) {
    if (!previousError) {
      throw new SealError('Chainable object is missing.');
    }
    this.metadata.cause = SealError.plain(previousError);

    return this;
  }
}

SealError.prototype.errorsMap = {};
SealError.prototype.errorsMap[moduleName] = require('./errors.js');

module.exports = SealError;
