/* eslint-disable no-undef */
'use strict';

const SealError = require('./SealError');
const getPkgKey = require('./pkg-key.js');

describe('SealError', () => {
  /* eslint-disable no-new */
  it('throws error if no message if given', async () => {
    expect(() => {
      new SealError();
    }).toThrow('Message is missing.');
  });

  it('throws error if code is not a number', async () => {
    expect(() => {
      new SealError('asdf', 'huhu');
    }).toThrow('Illegal data type, "code" should be number.');
  });
  /* eslint-enable no-new */

  it('returns SealError with default values', async () => {
    const err = new SealError('huhu');

    expect(err).not.toBeNull();
    expect(err.name).toStrictEqual('SealError');
    expect(err.code).toBeUndefined();
    expect(err.message).toStrictEqual('huhu');
    expect(err.httpStatusCode).toStrictEqual(500);
    expect(err.metadata).toStrictEqual({});
  });

  it('returns SealError with all given values', async () => {
    const err = new SealError('hopperla', 123, { user: 'hugo' });

    expect(err).not.toBeNull();
    expect(err.name).toStrictEqual('SealError');
    expect(err.code).toBeUndefined();
    expect(err.message).toStrictEqual('hopperla');
    expect(err.httpStatusCode).toStrictEqual(123);
    expect(err.metadata).toStrictEqual({ user: 'hugo' });
  });

  it('returns SealError with given code only', async () => {
    const err = new SealError('hopperla2', 666);

    expect(err).not.toBeNull();
    expect(err.name).toStrictEqual('SealError');
    expect(err.code).toBeUndefined();
    expect(err.message).toStrictEqual('hopperla2');
    expect(err.httpStatusCode).toStrictEqual(666);
    expect(err.metadata).toStrictEqual({});
  });

  it('returns SealError with given metadata only', async () => {
    const err = new SealError('hopperla3', { test: true });

    expect(err).not.toBeNull();
    expect(err.name).toStrictEqual('SealError');
    expect(err.code).toBeUndefined();
    expect(err.message).toStrictEqual('hopperla3');
    expect(err.httpStatusCode).toStrictEqual(500);
    expect(err.metadata).toStrictEqual({ test: true });
  });

  it('returns SealError with message and HTTP status code from errors.js', async () => {
    const err = new SealError('ERR_TEST', { user: 'hansi' });

    expect(err).not.toBeNull();
    expect(err.name).toStrictEqual('SealError');
    expect(err.code).toStrictEqual('ERR_TEST');
    expect(err.message).toStrictEqual('Im a Teapot');
    expect(err.httpStatusCode).toStrictEqual(418);
    expect(err.metadata).toStrictEqual({
      kbCode: '@sealsystems/error/TEST',
      user: 'hansi'
    });
  });

  describe('chain', () => {
    it('throws error if no Error is chained', async () => {
      expect(() => {
        new SealError('Chain error').chain();
      }).toThrow();
      expect(() => {
        new SealError('Chain error').chain('Not an error.');
      }).toThrow();
    });

    it('chains errors', async () => {
      const err1 = new SealError('ERR_TEST', { user: 'hansi' });
      const err2 = new SealError('ERR_TEST', { user: 'klausi' }).chain(err1);

      expect(err2.metadata.user).toStrictEqual('klausi');
      expect(err2.metadata.cause.metadata.user).toStrictEqual('hansi');
    });
  });

  describe('toJSON', () => {
    it('serializes SealErrors', async () => {
      const err = new SealError('ERR_TEST');

      expect(err.toJSON()).toMatchObject({
        name: 'SealError',
        code: 'ERR_TEST',
        message: 'Im a Teapot',
        httpStatusCode: 418,
        metadata: {}
      });
    });

    it('serializes chained SealErrors', async () => {
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
    it('throws error if parameters are not objects', async () => {
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

  it('requires map only once', async () => {
    // eslint-disable-next-line global-require
    const pkg = require('../package.json');
    const pkgKey = getPkgKey(pkg);

    const tmpMap = SealError.prototype.errorsMap[pkgKey];

    Reflect.deleteProperty(SealError.prototype.errorsMap, pkgKey);
    /* eslint-disable no-new */
    expect(Object.keys(SealError.prototype.errorsMap).length).toStrictEqual(0);
    new SealError('err1');
    expect(Object.keys(SealError.prototype.errorsMap).length).toStrictEqual(1);
    expect(SealError.prototype.errorsMap[pkgKey]).toStrictEqual(tmpMap);

    SealError.prototype.errorsMap[pkgKey] = { test: true };
    new SealError('err2');
    expect(Object.keys(SealError.prototype.errorsMap).length).toStrictEqual(1);
    expect(SealError.prototype.errorsMap[pkgKey]).toStrictEqual({ test: true });

    SealError.prototype.errorsMap[pkgKey] = tmpMap;
    /* eslint-enable no-new */
  });
});
/* eslint-enable no-undef */
