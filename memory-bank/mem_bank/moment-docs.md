# Moment.js Documentation (Summary)

## Basic Usage
```js
var now = moment();
moment().format('YYYY-MM-DD');
```

## Parsing
```js
moment('12-25-1995', 'MM-DD-YYYY');
```

## Relative Time
```js
var a = moment([2007, 0, 28]);
var b = moment([2007, 0, 29]);
a.from(b); // 'a day ago'
```

## Validity
```js
moment('not a real date').isValid(); // false
```
