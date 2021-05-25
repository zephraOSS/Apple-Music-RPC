# Promise It Exists
## Synopsis
This module checks a filepath to confirm the file exists.


## Motivation
Node does not have a one-liner for file validation using promises, so I wrote a module to do the job. 


##Installation
```bash
$ npm install @johnpaulvaughan/promise-it-exists --save
```

##Code Example
**Resolves a Promise on success:**
```javascript
let promiseIt = require('@johnpaulvaughan/promise-it-exists');

return promiseIt.exists('testing/good filename.txt')
.then((result) => console.log(result))
.catch((err) = > console.log(err)

// -> 'testing/my good filename.txt'
```

**Rejects with an error on failure:**
```javascript
let promiseIt = require('@johnpaulvaughan/promise-it-exists');
return promiseIt.exists('testing/bad filename.txt')
.then((result) => console.log(result))
.catch((err) = > console.log(err)

// -> Error('File does not exist')
```

