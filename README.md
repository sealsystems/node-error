# @sealsystems/error


Easy handling of error codes and metadata.

## Installation

```bash
npm install @sealsystems/error
```

## Quick start

First you need to add a reference to @sealsystems/error within your application.

```javascript
const SealError = require('@sealsystems/error');
```

Then you can create an error object.

```javascript
const err = new SealError('ERR_TEST_ERROR', 503, { username: 'hugo' });
```

This creates an new Error of type `SealError` with some additional properties:

```javascript
{
  name: 'SealError',
  code: 'ERR_TEST_ERROR',
  message: 'Message string for the test error',
  httpErrorCode: 503,
  metadata: {
    kbCode: '<module name>/TEST_ERROR',
    username: 'hugo'
  }
}
```

## API

### Creating an Error object

The constructor function creates a new object of type `SealError`.

```javascript
const err = new SealError(errorCode/message, code, metadata);
```

You can also use `SealError` like a generic error type. If no matching error code for the module is found in the error list, it will treat the error code as error message instead:

```javascript
const err = new SealError('Something went wrong.', 503, { status: 'oh no!' });
```

Parameter:
```
errorCode/message  string   mandatory   error key from `error.js` or custom message
httpErrorCode      number   optional    HTTP error code (default: 500)
metadata           object   optional    error metadata
```

Result: new `SealError` object

It expects the file `errors.js` to exist in callers module `lib` subdirectory if the calling script resides in `bin`, `lib` or `test` subdirectories. The map defined by `errors.js` is used to set additional metadata automatically.

You can also pass a custom list of errors for your model, if you add the following line before invoking a `new SealError()`for the first time:

```javascript
SealError.addModuleErrors(require('../package.json'), require('./my-error-list.js'));
```

Internally, `SealError` uses both the module name and version to distinguish the list of error messages for a module, so using different module versions in your dependencies don't overwrite each other.

### Chaining error history

For creating a history of errors while throwing upward in callstack, every `SealError` object has the `chain` method. It can chain other `SealError`s as well as generic JavaScript error instances (`Error`, `TypeError`, etc.)

```javascript
myError.chain(previousError);
```

Parameter:
```
previousError   object   mandatory    error object returned by a previously called function
```

Result: The caller's error object, to make calls to `chain` chainable. Each `chain` stores the data of the given error object into `metadata.cause`.


### Get plain data object

Plain data objects without functions are useful e.g. for logging or returning errors in an http body. This module provides two ways to get a plain data object:

#### toJSON

The member function `toJSON` returns a plain data object of the calling `@sealsystems/error` object. It will serialize all enumerable properties including chained errors.

```javascript
const myError = new SealError(…);
const myChildError = new SealError(…);
myError.chain(myChildError);
myError.toJSON();
```

Result: new plain javascript object of this structure:

```javascript
{
  name: 'SealError',
  code: myError.code,
  message: myError.message,
  httpStatusCode: myError.httpStatusCode,
  metadata: {
    kbCode: '<module name>/myError.code'
    cause: {
      name: 'SealError',
      code: myChildError.code,
      message: myChildError.message,
      httpStatusCode: myChildError.httpStatusCode,
      …
    }
    …
  }
}
```

#### toJSON (static)

The static function `toJSON` takes an arbitrary object of type `Error` and returns a new plain data object. It will serialize all enumerable properties.

```javascript
const plainNewObject = SealError.toJSON(error);
```

Parameter:
```
error      object   mandatory   error object
```

Result: new plain javascript object of this structure:

```javascript
{
  name: error.name,
  message: error.message,
  …
}
```

#### toRESTError

The member function `toRESTError` returns a plain data object of the calling `@sealsystems/error` object matching the definition of a REST error response body.
It contains `code`, `message` and `metadata` properties.

```javascript
const myError = new SealError(…);
const myChildError = new SealError(…);
myError.chain(myChildError);
myError.toRESTError();
```

Result: new plain javascript object of this structure:

```javascript
{
  code: myError.httpStatusCode,
  message: myError.message,
  metadata: {
    kbCode: '<module name>/myError.code'
    cause: {
      name: 'SealError',
      code: myChildError.code,
      message: myChildError.message,
      httpStatusCode: myChildError.httpStatusCode,
      …
    }
    …
  }
}
```

#### toRESTError (static)

The static function `toRESTError` takes an arbitrary object of type `Error` and returns a new plain data object matching the definition of a REST error response body.
It contains `code`, `message` and `metadata` properties.

```javascript
const plainNewObject = SealError.toRESTError(error);
```

Parameter:
```
error      object   mandatory   error object
```

Result: new plain javascript object of this structure:

```javascript
{
  code: error.httpStatusCode,
  message: error.message,
  metadata: error.metadata
}
```

### Get string representation

`SealError` extends the standard `toString` method of the `Error` class to include the error code, if it can be found in the list of module errors.
This can be useful for log messages, however the HTTP status code and metadata (including chained errors) are not included.
