'use strict';

const assert = require('assertthat');

const SealError = require('../lib/SealError');

suite('SealError', () => {
  let plainResult;

  setup(async () => {
    plainResult = {
      code: 123,
      message: 'hopperla',
      metadata: {
        user: 'hugo',
        kbcode: '@sealsystems/error.undefined'
      }
    };
  });

  test('is a function', async () => {
    assert.that(SealError).is.ofType('function');
  });

  /* eslint-disable no-new */
  test('throws error if no message if given', async () => {
    assert.that(() => {
      new SealError();
      throw new Error('X');
    }).is.throwing('Message is missing.');
  });

  test('throws error if code is not a number', async () => {
    assert.that(() => {
      new SealError('asdf', 'huhu');
      throw new Error('X');
    }).is.throwing('Illegal data type, "code" should be number.');
  });
  /* eslint-enable no-new */

  test('returns SealError with default values', async () => {
    const err = new SealError('huhu');

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.message).is.equalTo('huhu');
    assert.that(err.code).is.equalTo(0);
    assert.that(err.metadata).is.equalTo({
      kbcode: '@sealsystems/error.undefined'
    });
  });

  test('returns SealError with all given values', async () => {
    const err = new SealError('hopperla', 123, { user: 'hugo' });

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.message).is.equalTo('hopperla');
    assert.that(err.code).is.equalTo(123);
    assert.that(err.metadata).is.equalTo({
      user: 'hugo',
      kbcode: '@sealsystems/error.undefined'
    });
  });

  test('returns SealError with given code only', async () => {
    const err = new SealError('hopperla2', 666);

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.message).is.equalTo('hopperla2');
    assert.that(err.code).is.equalTo(666);
    assert.that(err.metadata).is.equalTo({
      kbcode: '@sealsystems/error.undefined'
    });
  });

  test('returns SealError with given metadata only', async () => {
    const err = new SealError('hopperla3', { test: true });

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.message).is.equalTo('hopperla3');
    assert.that(err.code).is.equalTo(0);
    assert.that(err.metadata).is.equalTo({
      test: true,
      kbcode: '@sealsystems/error.undefined'
    });
  });

  test('returns SealError with kbcode from errors.js', async () => {
    const err = new SealError('Chainable object is missing.', { user: 'hansi' });

    assert.that(err).is.not.null();
    assert.that(err.name).is.equalTo('SealError');
    assert.that(err.message).is.equalTo('Chainable object is missing.');
    assert.that(err.code).is.equalTo(0);
    assert.that(err.metadata).is.equalTo({
      user: 'hansi',
      kbcode: '@sealsystems/error.2'
    });
  });

  test('chains errors', async () => {
    const err1 = new SealError('Chainable object is missing.', { user: 'hansi' });
    const err2 = new SealError('Message is missing.').chain(err1);

    assert.that(err2.name).is.equalTo('SealError');
    assert.that(err2.message).is.equalTo('Message is missing.');
    assert.that(err2.code).is.equalTo(0);
    assert.that(err2.metadata).is.equalTo({
      kbcode: '@sealsystems/error.1',
      cause: {
        code: 0,
        message: 'Chainable object is missing.',
        metadata: {
          user: 'hansi',
          kbcode: '@sealsystems/error.2'
        }
      }
    });
  });

  test('requires map only once', async () => {
    const module = require('../package.json').name;
    const tmpMap = SealError.prototype.errorsMap[module];

    delete SealError.prototype.errorsMap[module];
    /* eslint-disable no-new */
    assert.that(Object.keys(SealError.prototype.errorsMap).length).is.equalTo(0);
    new SealError('err1');
    assert.that(Object.keys(SealError.prototype.errorsMap).length).is.equalTo(1);
    assert.that(SealError.prototype.errorsMap[module]).is.equalTo(tmpMap);

    SealError.prototype.errorsMap[module] = { test: true };
    new SealError('err2');
    assert.that(Object.keys(SealError.prototype.errorsMap).length).is.equalTo(1);
    assert.that(SealError.prototype.errorsMap[module]).is.equalTo({ test: true });

    SealError.prototype.errorsMap[module] = tmpMap;
    /* eslint-enable no-new */
  });

  test('throws error if no error object is given', async () => {
    assert.that(() => {
      new SealError('huhu').chain();
      throw new Error('X');
    }).is.throwing('Chainable object is missing.');
  });

  test('has static plain function', async () => {
    assert.that(SealError.plain).is.ofType('function');
  });

  test('returns plain object with properties', async () => {
    const err = new SealError('hopperla', 123, { user: 'hugo' });

    assert.that(SealError.plain(err)).is.equalTo(plainResult);
    assert.that(err.normalize()).is.equalTo(plainResult);
  });

  test('returns plain object with default properties', async () => {
    const err = new Error('huch');

    plainResult = {
      code: 0,
      message: 'huch',
      metadata: {}
    };
    assert.that(SealError.plain(err)).is.equalTo(plainResult);
  });

  test('returns JSON string with properties', async () => {
    const err = new SealError('hopperla', 123, { user: 'hugo' });
    const stringified = err.stringify();
    const err2 = JSON.parse(stringified);

    assert.that(err2).is.equalTo(plainResult);
  });

  test('returns enhanced metadata for logging', async () => {
    const err = new SealError('hopperla', 123, { user: 'hugo' });
    const meta = err.joinMeta({
      document: 'nixda'
    });

    assert.that(meta).is.equalTo({
      user: 'hugo',
      document: 'nixda',
      kbcode: '@sealsystems/error.undefined'
    });
  });
});
