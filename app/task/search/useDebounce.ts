import { useState, useEffect } from 'react';

const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState<string>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // Cleanup on new input or unmount
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;