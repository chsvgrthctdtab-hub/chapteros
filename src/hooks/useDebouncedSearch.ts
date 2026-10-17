import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDebouncedSearchOptions {
  initialValue?: string;
  delay?: number;
  onSearch: (query: string) => void;
}

/**
 * Manages debounced text input for search bars, avoiding excessive network requests
 * while keeping the input typing 100% responsive. Supports immediate submit on Enter
 * and immediate reset on Clear.
 */
export function useDebouncedSearch({
  initialValue = '',
  delay = 300,
  onSearch,
}: UseDebouncedSearchOptions) {
  const [query, setQuery] = useState(initialValue);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Sync with external updates (e.g. filter reset)
  useEffect(() => {
    setQuery(initialValue || '');
  }, [initialValue]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== (initialValue || '')) {
        onSearchRef.current(query);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay, initialValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearchRef.current('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearchRef.current(query);
      }
    },
    [query]
  );

  return {
    query,
    setQuery,
    handleChange,
    handleClear,
    handleKeyDown,
  };
}
