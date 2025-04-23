# date-fns Documentation (Summary)

## Importing and Formatting
```js
import { format, compareAsc } from 'date-fns';
format(new Date(2014, 1, 11), 'yyyy-MM-dd');
```

## Sorting Dates
```js
const dates = [new Date(1995, 6, 2), new Date(1987, 1, 11)];
dates.sort(compareAsc);
```

## formatDistance Example
```js
import { formatDistance, subDays } from 'date-fns';
formatDistance(subDays(new Date(), 3), new Date(), { addSuffix: true });
// '3 days ago'
```

## Locale Usage
```js
import { formatDistance } from 'date-fns';
import { eo } from 'date-fns/locale';
formatDistance(new Date(2016, 7, 1), new Date(2015, 0, 1), { locale: eo });
```
