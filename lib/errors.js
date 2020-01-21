'use strict';

const errors = {
  ERR_TEST: {
    message: 'Im a Teapot',
    httpStatusCode: 418
  },
  ERR_TEST2: {
    message: 'Im a Coffeepot',
    exitCode: 42
  }
};

module.exports = errors;
