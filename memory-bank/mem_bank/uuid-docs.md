# UUID Documentation (Summary)

## Generating UUID v4
```js
import { v4 as uuidv4 } from 'uuid';
uuidv4();
```

## Validating UUID
```js
import { validate as uuidValidate } from 'uuid';
uuidValidate('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'); // true
```

## UUID Versions
- v1: Timestamp
- v4: Random
- v5: Namespace
- v6/v7: Timestamp/random (newer)
