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
const err = new SealError('Universal error.', 42, { username: 'hugo' });
```

This creates an new object of type `Error` with some additional properties:

```javascript
{
  name: 'SealError',
  code: 42,
  message: 'Universal error',
  metadata: {
    username: 'hugo'
  }
  ...
}
```

## API

### Creating an error object

The constructor function creates a new object of type `Error`. It expects the file `errors.js` to exist in callers module `lib` subdirectory if the calling script resides in `bin`, `lib` or `test` subdirectories. The map defined by `errors.js` is used to set the `metadata.kbcode` entry automatically.

```javascript
const err = new SealError(message, code, metadata);
```

Parameter:
```
message    string   mandatory   error message
code       number   optional    error code
metadata   object   optional    error metadata
```

Result: new error object

### Chaining error history

For creating a history of errors while throwing upward in callstack every error object has the `chain` method.

```javascript
myError.chain(previousError);
```

Parameter:
```
previousError   object   mandatory    error object returned by a previously called function
```

Result: the callers error object, to make calls to `chain` chainable. Each `chain` stores the data of the given error object into `metadata.cause`.

### Join metadata

Join metadata and error object metadata into a new metadata object for extended logging.

**Attention**: This function does not alter the errors metadata, it just returns a new metadata object.

```javascript
const joinedMeta = error.joinMeta(metadata);
```

Parameter:
```
metadata   object   mandatory   additional metadata to join
```

Result: new metadata object

### Get plain data object

Plain data objects without functions are useful e.g. for logging or returning errors in an http body.
This module provides two ways to get a plain data object.

#### plain

The static function `plain` takes an arbitrary object of type `Error` and returns a new plain data object.

```javascript
const plainNewObject = SealError.plain(error);
```

Parameter:
```
error      object   mandatory   error object
```

Result: new plain javascript object of this structure:

```javascript
{
  code: error.code,
  message: error.message,
  metadata: error.metadata
}
```

#### normalize

The member function `normalize` returns a plain data object of the calling `@sealsystems/error` object.

```javascript
const plainNewObject = error.normalize();
```

Result: new plain javascript object as descriped above.

### Get JSON string

The member function `stringify` returns a stringified JSON representation of the errors plain data.

```javascript
const stringifiedData = error.stringify();
```

Result: JSON string of plain data object created by `plain`.
