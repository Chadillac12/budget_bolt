# Lodash Documentation (Summary)

## cloneDeep
```js
var deep = _.cloneDeep(objects);
```

## debounce
```js
var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
```

## get
```js
_.get(object, 'a[0].b.c');
```

## reduce
```js
_.reduce([1, 2], (sum, n) => sum + n, 0);
```

## mapValues
```js
_.mapValues(users, 'age');
```

## difference
```js
_.difference([2, 1], [2, 3]); // [1]
```
