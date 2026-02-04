# Angular Reactive test

This is a test for creating a version of Vue's [`reactive`](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#reactive) in Angular's [Signal](https://angular.dev/guide/signals) API.

This is purely for fun. I know some people think each framework should create their own reactivity system that is solely catered to themselves, but that doesn't mean we can't trade concepts and ideas.

## What works

The file `src/app/utils/reactive.ts` has an export called `reactiveObject()` that acts the same as Vue's reactive:

```ts
export class MyComponent {
  data = reactiveObject({
    count: 10,
  });
  countX2 = computed(() => this.data.count * 2); // 20
}
```

Any signals are unwrapped:

```ts
export class MyComponent {
  data = reactiveObject({
    count: signal(10),
  });
  countX2 = computed(() => this.data.count * 2); // 20
}
```

Deep reactivity is supported:

```ts
export class MyComponent {
  data = reactiveObject({
    innerObject: {
      count: 10,
    },
  });
  countX2 = computed(() => this.data.innerObject.count * 2); // 20
}
```

## What doesn't work

- Other data types are not supported:
  - Arrays
  - Maps
  - Sets
- Shallow reactive.
- Unwrapped computed are not marked as `readonly` in TypeScript.
- Angular's `isReactive` doesn't see object properties as reactive:
  ```ts
  isReactive(this.data); // false
  isReactive(this.data.count); // false
  ```
- Angular debugger doesn't represent the object cleanly.
