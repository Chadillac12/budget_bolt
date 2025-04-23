# React Documentation (Summary)

## Basic Component
```jsx
import { createRoot } from 'react-dom/client';
function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}
const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

## useState Example
```jsx
import { useState } from 'react';
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

## useMemo Example
```jsx
import { useMemo } from 'react';
const filtered = useMemo(() => items.filter(i => i.active), [items]);
```

## New Features (React 19)
- `useActionState` for managing actions in transitions.
- `createRoot` and `hydrateRoot` for concurrent rendering.
- JSX comment node support: `{/* comment */}`
