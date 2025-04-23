# TypeScript Language Specs (Summary)

## Generics and Constraints
- Use `<T>` for generics. Constraints: `<U extends T>`.
- Type errors if constraints are violated (e.g., passing string to number).

## Type Guards
- Use custom functions to narrow types, e.g. `function isObject2(value: unknown): value is {}`.

## Discriminated Unions
- Use a `kind` property to narrow union types in switch/if blocks.

## Conditional Types
- Use `T extends U ? X : Y` for type logic.
- Example: `type Unpacked<T> = T extends (infer U)[] ? U : ...`.

## Type Aliases vs Interfaces
- Type aliases cannot be merged or extended like interfaces.
- Duplicate type alias declarations cause errors.

## Variance
- Covariant: `type Covariant<out T> = { x: T }`.
- Contravariant: `type Contravariant<in T> = { f: (x: T) => void }`.
- Invariant: `type Invariant<in out T> = { f: (x: T) => T }`.

## JSX/React
- Type errors if passing text as children to components expecting functions.
- Use generics for React.Component classes: `class MyComp<P extends Prop> extends React.Component<P, {}>`.

## Destructuring
- Destructuring arrays/tuples must match the right-hand side type.
- Errors if destructuring empty tuples with expected elements.

## Satisfies Keyword
- Use `satisfies` to ensure object literals conform to a type.

## JSDoc
- Use `@param {type[]} name` for array of objects in JSDoc.

## Example
```typescript
class C<T> {
  public bar2<U extends T>(x: T, y: U): T {
    return null;
  }
}
var x = new C<number>();
x.bar2(2, ""); // error: string not assignable to number
```
