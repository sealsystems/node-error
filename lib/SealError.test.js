'use strict';

const SealError = require('./SealError');
const getPkgKey = require('./pkg-key.js');

describe('SealError', () => {
  /* eslint-disable no-new */
  test('throws error if no message if given', () => {
    expect(() => {
      new SealError();
    }).toThrow('Message is missing.');
  });

  test('throws error if code is not a number', () => {
    expect(() => {
      new SealError('asdf', 'huhu');
    }).toThrow('Illegal data type, "code" should be number.');
  });
  /* eslint-enable no-new */

  test('returns SealError with default values', () => {
    const err = new SealError('huhu');

    expect(err).not.toBeNull();
    expect(err.name).toEqual('SealError');
    expect(err.code).toBeUndefined();
    expect(err.message).toEqual('huhu');
    expect(err.httpStatusCode).toEqual(500);
    expect(err.metadata).toEqual({});
  });

  test('returns SealError with all given values', () => {
    const err = new SealError('hopperla', 123, { user: 'hugo' });

    expect(err).not.toBeNull();
    expect(err.name).toEqual('SealError');
    expect(err.code).toBeUndefined();
    expect(err.message).toEqual('hopperla');
    expect(err.httpStatusCode).toEqual(123);
    expect(err.metadata).toEqual({ user: 'hugo' });
  });

  test('returns SealError with given code only', () => {
    const err = new SealError('hopperla2', 666);

    expect(err).not.toBeNull();
    expect(err.name).toEqual('SealError');
    expect(err.code).toBeUndefined();
    expect(err.message).toEqual('hopperla2');
    expect(err.httpStatusCode).toEqual(666);
    expect(err.metadata).toEqual({});
  });

  test('returns SealError with given metadata only', () => {
    const err = new SealError('hopperla3', { test: true });

    expect(err).not.toBeNull();
    expect(err.name).toEqual('SealError');
    expect(err.code).toBeUndefined();
    expect(err.message).toEqual('hopperla3');
    expect(err.httpStatusCode).toEqual(500);
    expect(err.metadata).toEqual({ test: true });
  });

  test('returns SealError with message and HTTP status code from errors.js', () => {
    const err = new SealError('ERR_TEST', { user: 'hansi' });

    expect(err).not.toBeNull();
    expect(err.name).toEqual('SealError');
    expect(err.code).toEqual('ERR_TEST');
    expect(err.message).toEqual('Im a Teapot');
    expect(err.httpStatusCode).toEqual(418);
    expect(err.metadata).toEqual({
      kbCode: '@sealsystems/error/TEST',
      user: 'hansi'
    });
  });

  describe('chain', () => {
    test('throws error if no Error is chained', () => {
      expect(() => {
        new SealError('Chain error').chain();
      }).toThrow();
      expect(() => {
        new SealError('Chain error').chain('Not an error.');
      }).toThrow();
    });

    test('chains errors', () => {
      const err1 = new SealError('ERR_TEST', { user: 'hansi' });
      const err2 = new SealError('ERR_TEST', { user: 'klausi' }).chain(err1);

      expect(err2.metadata.user).toEqual('klausi');
      expect(err2.metadata.cause.metadata.user).toEqual('hansi');
    });
  });

  describe('toJSON', () => {
    test('serializes SealErrors', () => {
      const err = new SealError('ERR_TEST');

      expect(err.toJSON()).toMatchObject({
        name: 'SealError',
        code: 'ERR_TEST',
        message: 'Im a Teapot',
        httpStatusCode: 418,
        metadata: {}
      });
    });

    test('serializes chained SealErrors', () => {
      const err1 = new SealError('Chained error');
      const err2 = new SealError('ERR_TEST').chain(err1);

      expect(err2.toJSON()).toMatchObject({
        name: 'SealError',
        code: 'ERR_TEST',
        message: 'Im a Teapot',
        httpStatusCode: 418,
        metadata: {
          cause: {
            name: 'SealError',
            message: 'Chained error',
            httpStatusCode: 500
          }
        }
      });
    });
  });

  describe('#addModuleErrors', () => {
    test('throws error if parameters are not objects', () => {
      expect(() => {
        SealError.addModuleErrors();
      }).toThrow();
      expect(() => {
        SealError.addModuleErrors('foo');
      }).toThrow();
      expect(() => {
        SealError.addModuleErrors({}, 'bar');
      }).toThrow();
    });
  });

  test('requires map only once', () => {
    const pkg = require('../package.json');
    const pkgKey = getPkgKey(pkg);

    const tmpMap = SealError.prototype.errorsMap[pkgKey];

    delete SealError.prototype.errorsMap[pkgKey];
    /* eslint-disable no-new */
    expect(Object.keys(SealError.prototype.errorsMap).length).toEqual(0);
    new SealError('err1');
    expect(Object.keys(SealError.prototype.errorsMap).length).toEqual(1);
    expect(SealError.prototype.errorsMap[pkgKey]).toEqual(tmpMap);

    SealError.prototype.errorsMap[pkgKey] = { test: true };
    new SealError('err2');
    expect(Object.keys(SealError.prototype.errorsMap).length).toEqual(1);
    expect(SealError.prototype.errorsMap[pkgKey]).toEqual({ test: true });

    SealError.prototype.errorsMap[pkgKey] = tmpMap;
    /* eslint-enable no-new */
  });
});
