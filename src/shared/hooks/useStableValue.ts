import { useRef, useMemo } from 'react';

/**
 * Custom hook to create stable array reference for useMemo dependencies
 * Only updates the reference if the array content actually changed
 */
export function useStableArray<T>(array: T[] | undefined | null): T[] | undefined {
  const prevRef = useRef<T[] | undefined | null>(array);
  const stableRef = useRef<T[] | undefined>(array ?? undefined);
  
  return useMemo(() => {
    if (array === prevRef.current) {
      return stableRef.current;
    }
    
    // Deep comparison - check if content actually changed
    if (!array && !prevRef.current) {
      // Both are undefined/null, keep stable
      prevRef.current = array;
      return stableRef.current;
    }
    
    if (!array || !prevRef.current) {
      // One is undefined/null, update
      const result = array ?? undefined;
      stableRef.current = result;
      prevRef.current = array;
      return result;
    }
    
    if (array.length !== prevRef.current.length) {
      // Length changed, update
      stableRef.current = array;
      prevRef.current = array;
      return array;
    }
    
    // Check if any element changed
    const hasChanged = array.some((item, i) => {
      const prevItem = prevRef.current![i];
      if (item === prevItem) return false;
      
      // Deep comparison for objects
      if (typeof item === 'object' && item !== null && typeof prevItem === 'object' && prevItem !== null) {
        return JSON.stringify(item) !== JSON.stringify(prevItem);
      }
      
      return true;
    });
    
    if (hasChanged) {
      stableRef.current = array;
      prevRef.current = array;
      return array;
    }
    
    // Content is the same, keep stable reference
    prevRef.current = array;
    return stableRef.current;
  }, [array]);
}

/**
 * Custom hook to create stable object reference for useMemo dependencies
 */
export function useStableObject<T extends Record<string, any>>(obj: T | undefined | null): T | undefined {
  const prevRef = useRef<T | undefined | null>(obj);
  const stableRef = useRef<T | undefined>(obj ?? undefined);
  
  return useMemo(() => {
    if (obj === prevRef.current) {
      return stableRef.current;
    }
    
    if (!obj && !prevRef.current) {
      prevRef.current = obj;
      return stableRef.current;
    }
    
    if (!obj || !prevRef.current) {
      const result = obj ?? undefined;
      stableRef.current = result;
      prevRef.current = obj;
      return result;
    }
    
    // Deep comparison
    const prevStr = JSON.stringify(prevRef.current);
    const currentStr = JSON.stringify(obj);
    
    if (prevStr !== currentStr) {
      stableRef.current = obj;
      prevRef.current = obj;
      return obj;
    }
    
    // Content is the same, keep stable reference
    prevRef.current = obj;
    return stableRef.current;
  }, [obj]);
}

/**
 * Custom hook to create stable value reference (for primitives or complex objects)
 */
export function useStableValue<T>(value: T, compareFn?: (a: T, b: T) => boolean): T {
  const prevRef = useRef<T>(value);
  const stableRef = useRef<T>(value);
  
  return useMemo(() => {
    if (value === prevRef.current) {
      return stableRef.current;
    }
    
    if (compareFn) {
      if (!compareFn(prevRef.current, value)) {
        // Values are equal according to compareFn, keep stable
        prevRef.current = value;
        return stableRef.current;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Deep comparison for objects
      const prevStr = JSON.stringify(prevRef.current);
      const currentStr = JSON.stringify(value);
      
      if (prevStr === currentStr) {
        // Content is the same, keep stable reference
        prevRef.current = value;
        return stableRef.current;
      }
    }
    
    // Value changed, update
    stableRef.current = value;
    prevRef.current = value;
    return value;
  }, [value, compareFn]);
}

