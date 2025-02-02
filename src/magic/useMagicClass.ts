import "reflect-metadata";
import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useLayoutEffect,
} from "react";

const stateMetadataKey = Symbol("🇺🇸");
const effectMetadataKey = Symbol("⁉️");
const layoutEffectMetadataKey = Symbol("‼️");
const contextMetadataKey = Symbol("☁️");
const memoMetadataKey = Symbol("📝");
const magicMetadataKey = Symbol("🔮");

type Constructor<T = any> =
  | {
      new (): T;
    }
  | {
      (): T;
    };

export const isState = Reflect.metadata(stateMetadataKey, true);

const getIsState = (target: any, propertyKey: string) => {
  return !!Reflect.getMetadata(stateMetadataKey, target, propertyKey);
};

export const isEffect = <Target extends Object>(
  dependencies: any[] | ((target: Target) => any[] | void) = () => {}
) => Reflect.metadata(effectMetadataKey, dependencies);

const getIsEffect = (target: any, propertyKey: string) => {
  return Reflect.getMetadata(effectMetadataKey, target, propertyKey);
};

export const isLayoutEffect = <Target extends Object>(
  dependencies: any[] | ((target: Target) => any[] | void) = () => {}
) => Reflect.metadata(layoutEffectMetadataKey, dependencies);

const getIsLayoutEffect = (target: any, propertyKey: string) => {
  return Reflect.getMetadata(layoutEffectMetadataKey, target, propertyKey);
};

export const isMemo = <Target extends Object>(
  dependencies: any[] | ((target: Target) => any[] | void) = () => {}
) => Reflect.metadata(memoMetadataKey, dependencies);

const getIsMemo = (target: any, propertyKey: string) => {
  return Reflect.getMetadata(memoMetadataKey, target, propertyKey);
};

export const isContext = <T, U = T>(
  context: React.Context<T>,
  transform: (value: T) => U = (value) => value as unknown as U
) => Reflect.metadata(contextMetadataKey, [context, transform]);

const getIsContext = (target: any, propertyKey: string) => {
  return Reflect.getMetadata(contextMetadataKey, target, propertyKey);
};

export const isMagic = Reflect.metadata(magicMetadataKey, true);

const getIsMagic = (target: any, propertyKey: string) => {
  return Reflect.getMetadata(magicMetadataKey, target, propertyKey);
};

export const useMagicClass = <Obj extends Object>(
  Constructor: Constructor<Obj>
) => {
  const [obj, magic, states, effects, layoutEffects, memos, contexts] =
    useMemo(() => {
      let obj: Obj = {} as Obj;

      try {
        // @ts-ignore
        obj = new Constructor();
      } catch {
        // @ts-ignore
        obj = Constructor();
      }

      let target = obj;
      const keys: Record<string, Object> = {};
      const chain: Object[] = [];

      do {
        chain.push(target);

        Object.getOwnPropertyNames(target).forEach((key) => {
          if (!keys.hasOwnProperty(key)) {
            keys[key] = target;
          }
        });

        target = Object.getPrototypeOf(target);
      } while (target !== Object.prototype);

      const store: Partial<Obj> = {};
      const magic: [(obj: any) => void, any][] = [];
      const states: [(setState: React.Dispatch<any>) => void, string][] = [];
      const effects: [any[] | (() => React.DependencyList | void), string][] =
        [];
      const layoutEffects: [
        any[] | (() => React.DependencyList | void),
        string
      ][] = [];
      const contexts: [
        React.Context<any>,
        undefined | ((value: any) => any),
        string
      ][] = [];
      const memos: [
        () => any,
        any[] | (() => React.DependencyList | void),
        string
      ][] = [];

      Object.keys(keys).forEach((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(keys[key], key);

        const contextInfos = chain
          .map((target) => getIsContext(target, key))
          .filter((info) => info !== undefined);

        if (contextInfos.length) {
          const [context, transform] = contextInfos[0];
          contexts.push([context, transform, key]);
        }

        const effectDependencies = chain
          .map((target) => getIsEffect(target, key))
          .filter((info) => info !== undefined);

        if (effectDependencies.length) {
          effects.push(
            // @ts-ignore
            ...effectDependencies.map((dependencies) => [dependencies, key])
          );
        }

        const layoutEffectDependencies = chain
          .map((target) => getIsLayoutEffect(target, key))
          .filter((info) => info !== undefined);

        if (layoutEffectDependencies.length) {
          layoutEffects.push(
            // @ts-ignore
            ...layoutEffectDependencies.map((dependencies) => [
              dependencies,
              key,
            ])
          );
        }

        const memoDependencies = chain
          .map((target) => getIsMemo(target, key))
          .filter((info) => info !== undefined);

        if (memoDependencies.length) {
          if (descriptor?.get && !descriptor?.set) {
            memos.push([descriptor.get.bind(obj), memoDependencies[0], key]);

            Object.defineProperty(obj, key, {
              // @ts-ignore
              set: (val) => (store[key] = val),
              // @ts-ignore
              get: () => store[key],
            });
          } else {
            throw new TypeError("Memoized properties need to be computed");
          }
        } else if (getIsMagic(keys[key], key)) {
          const targetObj = obj[key as keyof Obj];

          Object.defineProperty(obj, key, {
            get: () => store[key as keyof Obj],
          });

          magic.push([
            (magicObj) => (store[key as keyof Obj] = magicObj),
            targetObj,
          ]);
        } else if (getIsState(keys[key], key)) {
          states.push([
            (setState) => {
              store[key as keyof Obj] = obj[key as keyof Obj];
              Object.defineProperty(obj, key, {
                // @ts-ignore
                set: (val) => {
                  store[key as keyof Obj] = val;
                  setState(val);
                },
                // @ts-ignore
                get: () => store[key],
              });
            },
            key,
          ]);
        }
      });

      return [
        obj,
        magic,
        states,
        effects,
        layoutEffects,
        memos,
        contexts,
      ] as const;
      /* eslint-disable */
    }, []);
  /* eslint-enable */

  magic.forEach(([init, obj]) => {
    /* eslint-disable */
    // @ts-ignore
    const magicObj = useMagicClass(() => obj);
    useMemo(() => init(magicObj), []);
    /* eslint-enable */
  });

  states.forEach(([init, key]) => {
    /* eslint-disable */
    // @ts-ignore
    const [_, setState] = useState(obj[key]);
    useMemo(() => init(setState), []);
    /* eslint-enable */
  });

  contexts.forEach(([context, transform, key]) => {
    /* eslint-disable */
    // @ts-ignore
    const value = useContext(context);
    // @ts-ignore
    obj[key] = useMemo(
      () => (transform instanceof Function ? transform(value) : value),
      [value]
    );
    /* eslint-enable */
  });

  memos.forEach(([get, dependencies, key]) => {
    /* eslint-disable */
    //@ts-ignore
    useMemo(
      // @ts-ignore
      () => (obj[key] = get()),
      // @ts-ignore
      Array.isArray(dependencies) ? dependencies : dependencies(obj)
      /* eslint-enable */
    );
  });

  effects.forEach(([dependencies, key]) => {
    /* eslint-disable */
    useEffect(
      () => {
        // @ts-ignore
        const ret = obj[key as keyof Obj].bind(obj)();
        if (typeof ret === "function") {
          return ret;
        }
      },
      // @ts-ignore
      Array.isArray(dependencies) ? dependencies : dependencies(obj)
      /* eslint-enable */
    );
  });

  layoutEffects.forEach(([dependencies, key]) => {
    /* eslint-disable */
    useLayoutEffect(
      
      () => {
        // @ts-ignore
        const ret = obj[key as keyof Obj].bind(obj)();
        if (typeof ret === "function") {
          return ret;
        }
      },
      // @ts-ignore
      Array.isArray(dependencies) ? dependencies : dependencies(obj)
      /* eslint-enable */
    );
  });

  return obj;
};
