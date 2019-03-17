'use strict';

const path = require('path');
const tracker = require('v8-callsites');
const getPkgKey = require('./pkg-key.js');

const isObject = (val) => {
  return val !== null && typeof val === 'object' && Array.isArray(val) === false;
};

class SealError extends Error {
  constructor(errorCode, httpStatusCode = 500, metadata = {}) {
    if (!errorCode) {
      throw new TypeError('Message is missing.');
    }
    if (isObject(httpStatusCode)) {
      metadata = httpStatusCode;
      httpStatusCode = 500;
    }
    if (typeof httpStatusCode !== 'number') {
      throw new TypeError('Illegal data type, "code" should be number.');
    }

    super(errorCode);

    const caller = tracker()[0].getFileName();
    const basePath = caller.replace(/([/\\])(bin|lib|test)[/\\].*$/, '$1');

    // eslint-disable-next-line global-require
    const pkg = require(`${basePath}package.json`);
    const pkgKey = getPkgKey(pkg);

    if (basePath !== caller) {
      const errorJsPath = `${basePath}lib${path.sep}errors.js`;

      if (!this.errorsMap[pkgKey]) {
        // eslint-disable-next-line global-require
        SealError.addModuleErrors(pkg, require(errorJsPath));
      }
    }

    this.name = 'SealError';
    this.httpStatusCode = httpStatusCode;
    this.metadata = metadata;

    // Look up extended error information
    const moduleErrors = this.errorsMap[pkgKey];

    if (moduleErrors && moduleErrors[errorCode]) {
      this.message = moduleErrors[errorCode].message;
      this.code = errorCode;
      this.metadata.kbCode = `${pkg.name}/${errorCode.replace(/^ERR_/, '')}`;

      if (moduleErrors[errorCode].httpStatusCode) {
        this.httpStatusCode = moduleErrors[errorCode].httpStatusCode;
      }
    }
  }

  static toJSON(error) {
    if (!error) {
      return {};
    }

    const tmp = { name: error.name };

    Object.getOwnPropertyNames(error).forEach((key) => {
      tmp[key] = error[key];
    });

    return tmp;
  }

  toJSON() {
    return SealError.toJSON(this);
  }

  toString() {
    return this.id ? `${this.name}: ${this.message} (${this.id})` : `${this.name}: ${this.message}`;
  }

  chain(previousError) {
    if (!previousError || !(previousError instanceof Error)) {
      throw new TypeError('Chainable Error object is missing.');
    }
    this.metadata.cause = SealError.toJSON(previousError);

    return this;
  }

  static addModuleErrors(packageJson, errors) {
    if (!isObject(packageJson)) {
      throw new TypeError('package.json is missing or not an object.');
    }
    if (!isObject(errors)) {
      throw new TypeError('errors are missing or not an object.');
    }

    SealError.prototype.errorsMap[getPkgKey(packageJson)] = errors;
  }
}

SealError.prototype.errorsMap = {};
SealError.addModuleErrors(require('../package.json'), require('./errors.js'));

module.exports = SealError;
