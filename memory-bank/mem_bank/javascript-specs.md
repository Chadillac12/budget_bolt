# JavaScript Language Specs (Summary)

## Import/Export
- Use `import { x } from 'module'` and `export { x }` for modules.

## Destructuring
- Array and object destructuring supported.
- Example: `const [a, b] = [1, 2];`

## Functions
- Arrow functions: `const fn = (x) => x + 1;`
- Template types via JSDoc: `/** @template T */ function f(a) { ... }`

## Classes
- ES6 class syntax: `class MyClass { constructor() { ... } }`

## For...of Loops
- Iterate arrays: `for (const item of arr) { ... }`

## Spread/Rest
- Spread: `[...arr]`, Rest: `function f(...args) {}`

## Example
```javascript
var robotA = [1, "mower", "mowing"];
var robotB = [2, "trimmer", "trimming"];
var robots = [robotA, robotB];
for (const [id, name, task] of robots) {
  console.log(name);
}
```
