import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { List } from 'react-virtualized';
import useDebounce from './useDebounce';

interface Product {
  id: number;
  title: string;
  category: string;
  image: string;
  price: number;
}

const fetchProducts = async ({ query, page = 1 }: { query: string; page: number }) => {
  const response = await axios.get(`http://fakestoreapi.in/api/products?limit=15&page=${page}`, {
    params: { q: query },
  });
  return response.data.products;
};

const SearchInput: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', debouncedQuery],
    queryFn: ({ pageParam = 1 }) => fetchProducts({ query: debouncedQuery, page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length === 15) {
        return pages.length + 1; 
      } else {
        return undefined; 
      }
    },
    enabled: !!debouncedQuery,
    staleTime: 5 * 60 * 1000, 
  });

  const products = useMemo(() => {
    return data ? data.pages.flat() : [];
  }, [data]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedProduct(null);
    setHighlightedIndex(-1);
    setIsDropdownOpen(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isDropdownOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < products.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            setSelectedProduct(products[highlightedIndex]);
            setQuery(products[highlightedIndex].title);
            setIsDropdownOpen(false);
          }
          break;
        case 'Escape':
          setIsDropdownOpen(false);
          setHighlightedIndex(-1);
          break;
        case 'Tab':
          setIsDropdownOpen(false);
          break;
        default:
          break;
      }
    },
    [isDropdownOpen, highlightedIndex, products]
  );

  const handleSuggestionClick = (product: Product) => {
    setSelectedProduct(product);
    setQuery(product.title);
    setIsDropdownOpen(false);
  };

  const handleScroll = ({ clientHeight, scrollHeight, scrollTop }: any) => {
    if (scrollHeight - scrollTop === clientHeight && hasNextPage) {
      fetchNextPage();
    }
  };

  const rowRenderer = ({ index, key, style }: any) => {
    const product = products[index];
    return (
      <div
        key={key}
        style={style}
        className={`suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
        onClick={() => handleSuggestionClick(product)}
      >
        {product.title}
      </div>
    );
  };

  return (
    <div className="relative w-72 mx-auto">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Search products..."
        className="w-full p-3 text-lg border border-gray-300 rounded-md"
      />

      {isDropdownOpen && (
        <div className="absolute top-full left-0 w-full max-h-52 border border-gray-300 rounded-md bg-white overflow-y-auto z-10" ref={dropdownRef}>
          {isLoading && <div className="p-3 text-center">Loading...</div>}
          {error && <div className="p-3 text-center text-red-500">Error: {error.message}</div>}
          {!isLoading && !error && products.length === 0 && debouncedQuery && (
            <div className="p-3 text-center">No results found</div>
          )}
          {!debouncedQuery && !isLoading && (
            <div className="p-3 text-center text-gray-500">Popular Searches</div>
          )}
          {!isLoading && products.length > 0 && (
            <List
              width={300}
              height={200}
              rowCount={products.length}
              rowHeight={40}
              rowRenderer={rowRenderer}
              onScroll={handleScroll}
            />
          )}
          {isFetchingNextPage && <div className="p-3 text-center">Loading more...</div>}
        </div>
      )}

      {selectedProduct && (
        <div className="mt-5 p-4 border border-gray-300 rounded-md">
          <h3 className="text-lg font-semibold">{selectedProduct.title}</h3>
          <p>Category: {selectedProduct.category}</p>
          <img src={selectedProduct.image} alt={selectedProduct.title} width="100" />
          <p>Price: ${selectedProduct.price}</p>
        </div>
      )}
    </div>
  );
};

export default SearchInput;
