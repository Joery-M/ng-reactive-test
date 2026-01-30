import {
  type Signal,
  WritableSignal,
  afterNextRender,
  isSignal,
  isWritableSignal,
  signal,
} from '@angular/core';
import {
  consumerDestroy,
  producerAccessed,
  producerNotifyConsumers,
  runPostProducerCreatedFn,
  runPostSignalSetFn,
  SIGNAL_NODE,
  signalSetFn,
  type SignalNode,
} from '@angular/core/primitives/signals';

const targetMap = new WeakMap<object, Map<any, SignalNode<any>>>();

function track(target: object, key: string | symbol, value?: any) {
  let nodeMap = targetMap.get(target);
  if (!nodeMap) {
    targetMap.set(target, (nodeMap = new Map()));
  }
  const node = nodeMap.get(key);
  if (!node) {
    console.log('Creating new node for key', key);
    const node: SignalNode<any> = Object.create(SIGNAL_NODE);
    node.debugName = String(key);
    node.value = value;
    nodeMap.set(key, node);
    runPostProducerCreatedFn(node);
    return node;
  } else {
    return node;
  }
}

const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol';
const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object';
const isFunction = (val: unknown): val is Function => typeof val === 'function';

const builtInSymbols = new Set(
  /*@__PURE__*/
  Object.getOwnPropertyNames(Symbol)
    // ios10.x Object.getOwnPropertyNames(Symbol) can enumerate 'arguments' and 'caller'
    // but accessing them on Symbol leads to TypeError because Symbol is a strict mode
    // function
    .filter((key) => key !== 'arguments' && key !== 'caller')
    .map((key) => Symbol[key as keyof SymbolConstructor])
    .filter(isSymbol),
);

class ReactiveHandler<T extends object> implements ProxyHandler<T> {
  get(target: T, key: string | symbol, receiver: any) {
    const res = Reflect.get(target, key, receiver);

    if (isSymbol(key) ? builtInSymbols.has(key) : key === '__proto__') {
      return res;
    }
    if (isSignal(res)) {
      const value = res();
      return value;
    }
    if (isObject(res)) {
      // Deep reactivity
      return reactiveObject(res);
    }
    if (isFunction(res)) {
      return res;
    }

    const node = track(target, key, res);
    producerAccessed(node);
    return res;
  }
  set(target: T, key: string | symbol, value: any, receiver: any): boolean {
    const oldValue = Reflect.get(target, key, receiver);
    if (isSignal(oldValue)) {
      if (isWritableSignal(oldValue)) {
        oldValue.set(value);
        return true;
      }
      return false;
    } else {
      const result = Reflect.set(target, key, value, receiver);

      const node = targetMap.get(target)?.get(key);
      if (node) signalSetFn(node, value);

      return result;
    }
  }

  deleteProperty(target: T, key: string | symbol): boolean {
    const result = Reflect.deleteProperty(target, key);

    const node = targetMap.get(target)?.get(key);
    if (node) signalSetFn(node, undefined);

    return result;
  }

  has(target: T, key: string | symbol): boolean {
    const result = Reflect.has(target, key);
    if (!isSymbol(key)) {
      const node = targetMap.get(target)?.get(key);
      if (node) producerAccessed(node);
    }

    return result;
  }

  ownKeys(target: T): (string | symbol)[] {
    targetMap.get(target)?.forEach((node) => producerAccessed(node));
    return Reflect.ownKeys(target);
  }
}

type UnwrapSignal<T> =
  T extends Signal<infer v>
    ? v
    : T extends Function
      ? T
      : T extends object
        ? { [K in keyof T]: UnwrapSignal<T[K]> }
        : T;

export function reactiveObject<T extends object>(target: T): UnwrapSignal<T>;
export function reactiveObject(target: object) {
  return new Proxy(target, new ReactiveHandler());
}
