'use strict';

const errors = {
  ERR_TEST: {
    message: 'Im a Teapot',
    httpStatusCode: 418
  },
  ERR_TEST2: {
    message: 'Im a Coffeepot',
    exitCode: 42
  },
  ERR_TEST3: {
    message: 'Chained error message'
  }
};

module.exports = errors;
