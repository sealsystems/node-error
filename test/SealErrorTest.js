/* eslint-disable no-undef */
'use strict';

const assert = require('assertthat');

const SealError = require('../lib/SealError');
const getPkgKey = require('../lib/pkg-key.js');

suite('SealError', () => {
  /* eslint-disable no-new */
  test('throws error if no message if given', async () => {
    assert
      .that(() => {
        new SealError();
      })
      .is.throwing('Message is missing.');
  });

  test('throws error if code is not a number', async () => {
    assert
      .that(() => {
        new SealError('asdf', 'huhu');
      })
      .is.throwing('Illegal data type, "code" should be number.');
  });
  /* eslint-enable no-new */

  test('returns SealError with default values', async () => {
    const err = new SealError('huhu');

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.code).is.undefined();
    assert.that(err.message).is.equalTo('huhu');
    assert.that(err.httpStatusCode).is.equalTo(500);
    assert.that(err.metadata).is.equalTo({});
  });

  test('returns SealError with all given values', async () => {
    const err = new SealError('hopperla', 123, { user: 'hugo' });

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.code).is.undefined();
    assert.that(err.message).is.equalTo('hopperla');
    assert.that(err.httpStatusCode).is.equalTo(123);
    assert.that(err.metadata).is.equalTo({ user: 'hugo' });
  });

  test('returns SealError with given code only', async () => {
    const err = new SealError('hopperla2', 666);

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.code).is.undefined();
    assert.that(err.message).is.equalTo('hopperla2');
    assert.that(err.httpStatusCode).is.equalTo(666);
    assert.that(err.metadata).is.equalTo({});
  });

  test('returns SealError with given metadata only', async () => {
    const err = new SealError('hopperla3', { test: true });

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.code).is.undefined();
    assert.that(err.message).is.equalTo('hopperla3');
    assert.that(err.httpStatusCode).is.equalTo(500);
    assert.that(err.metadata).is.equalTo({ test: true });
  });

  test('returns SealError with message and HTTP status code from errors.js', async () => {
    const err = new SealError('ERR_TEST', { user: 'hansi' });

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.code).is.equalTo('ERR_TEST');
    assert.that(err.message).is.equalTo('Im a Teapot');
    assert.that(err.httpStatusCode).is.equalTo(418);
    assert.that(err.metadata).is.equalTo({
      kbCode: 'TEST-error',
      user: 'hansi',
      sealSpaceUrl: 'https://sealspace.sealsystems.de/display/KB/TEST-error'
    });
  });

  test('returns SealError with metadata from errors.js', async () => {
    const err = new SealError('ERR_TEST2', { user: 'hugo' });

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.code).is.equalTo('ERR_TEST2');
    assert.that(err.message).is.equalTo('Im a Coffeepot');
    assert.that(err.httpStatusCode).is.equalTo(500);
    assert.that(err.metadata).is.equalTo({
      kbCode: 'TEST2-error',
      user: 'hugo',
      exitCode: 42,
      sealSpaceUrl: 'https://sealspace.sealsystems.de/display/KB/TEST2-error'
    });
  });

  suite('chain', () => {
    test('throws error if no Error is chained', async () => {
      assert
        .that(() => {
          new SealError('Chain error').chain();
        })
        .is.throwing();
      assert
        .that(() => {
          new SealError('Chain error').chain('Not an error.');
        })
        .is.throwing();
    });

    test('chains errors', async () => {
      const err1 = new SealError('ERR_TEST', { user: 'hansi' });
      const err2 = new SealError('ERR_TEST', { user: 'klausi' }).chain(err1);

      assert.that(err2.metadata.user).is.equalTo('klausi');
      assert.that(err2.metadata.cause.metadata.user).is.equalTo('hansi');
    });
  });

  suite('toJSON', () => {
    test('serializes SealErrors', async () => {
      const err = new SealError('ERR_TEST');
      delete err.stack;
      delete err.pkgKey;

      assert.that(err.toJSON()).is.equalTo({
        name: 'SealError',
        code: 'ERR_TEST',
        message: 'Im a Teapot',
        httpStatusCode: 418,
        metadata: {
          kbCode: 'TEST-error',
          sealSpaceUrl: 'https://sealspace.sealsystems.de/display/KB/TEST-error'
        }
      });
    });

    test('serializes chained SealErrors', async () => {
      const err1 = new SealError('Chained error');
      delete err1.stack;
      delete err1.pkgKey;
      const err2 = new SealError('ERR_TEST').chain(err1);
      delete err2.stack;
      delete err2.pkgKey;

      assert.that(err2.toJSON()).is.equalTo({
        name: 'SealError',
        code: 'ERR_TEST',
        message: 'Im a Teapot',
        httpStatusCode: 418,
        metadata: {
          kbCode: 'TEST-error',
          sealSpaceUrl: 'https://sealspace.sealsystems.de/display/KB/TEST-error',
          cause: {
            name: 'SealError',
            message: 'Chained error',
            httpStatusCode: 500,
            metadata: {}
          }
        }
      });
    });

    test('serializes only SealError specific properties', async () => {
      const err1 = new SealError('ERR_TEST3', 123, { bu: 'hu' });
      err1.recoverable = true;
      const err2 = new SealError('ERR_TEST').chain(err1);
      // create recursive dependencies
      err1.metadata.next = err2;
      err2.metadata.next = err1;
      // check data for recursive dependencies
      assert
        .that(() => {
          JSON.stringify(err2);
        })
        .is.throwing('Maximum call stack size exceeded');

      const res = err2.toJSON();

      assert.that(res.metadata.cause.httpStatusCode).is.equalTo(123);
      assert.that(res.metadata.cause.code).is.equalTo('ERR_TEST3');
      assert.that(res.metadata.cause.message).is.equalTo('Chained error message');
      assert.that(res.metadata.cause.stack).is.ofType('string');
      assert.that(res.metadata.cause.recoverable).is.true();
      assert.that(res.metadata.cause.metadata.bu).is.equalTo('hu');
    });
  });

  suite('toRESTError', () => {
    test('serializes SealErrors', async () => {
      const err = new SealError('ERR_TEST');
      delete err.stack;
      delete err.pkgKey;

      assert.that(err.toRESTError()).is.equalTo({
        code: 418,
        message: 'Im a Teapot',
        metadata: {
          kbCode: 'TEST-error',
          sealSpaceUrl: 'https://sealspace.sealsystems.de/display/KB/TEST-error'
        }
      });
    });

    test('serializes chained SealErrors', async () => {
      const err1 = new SealError('Chained error');
      delete err1.stack;
      delete err1.pkgKey;
      const err2 = new SealError('ERR_TEST').chain(err1);
      delete err2.stack;
      delete err2.pkgKey;

      assert.that(err2.toRESTError()).is.equalTo({
        code: 418,
        message: 'Im a Teapot',
        metadata: {
          kbCode: 'TEST-error',
          sealSpaceUrl: 'https://sealspace.sealsystems.de/display/KB/TEST-error',
          cause: {
            name: 'SealError',
            message: 'Chained error',
            httpStatusCode: 500,
            metadata: {}
          }
        }
      });
    });
  });

  suite('#addModuleErrors', () => {
    test('throws error if parameters are not objects', async () => {
      assert
        .that(() => {
          SealError.addModuleErrors();
        })
        .is.throwing();
      assert
        .that(() => {
          SealError.addModuleErrors('foo');
        })
        .is.throwing();
      assert
        .that(() => {
          SealError.addModuleErrors({}, 'bar');
        })
        .is.throwing();
    });
  });

  test('requires map only once', async () => {
    // eslint-disable-next-line global-require
    const pkg = require('../package.json');
    const pkgKey = getPkgKey(pkg);

    const tmpMap = SealError.prototype.errorsMap[pkgKey];

    Reflect.deleteProperty(SealError.prototype.errorsMap, pkgKey);
    /* eslint-disable no-new */
    assert.that(Object.keys(SealError.prototype.errorsMap).length).is.equalTo(0);
    new SealError('err1');
    assert.that(Object.keys(SealError.prototype.errorsMap).length).is.equalTo(1);
    assert.that(SealError.prototype.errorsMap[pkgKey]).is.equalTo(tmpMap);

    SealError.prototype.errorsMap[pkgKey] = { test: true };
    new SealError('err2');
    assert.that(Object.keys(SealError.prototype.errorsMap).length).is.equalTo(1);
    assert.that(SealError.prototype.errorsMap[pkgKey]).is.equalTo({ test: true });

    SealError.prototype.errorsMap[pkgKey] = tmpMap;
    /* eslint-enable no-new */
  });
});
/* eslint-enable no-undef */
