import { useState } from 'react';

// 메시지 검색 입력. 입력 즉시 onSearch 호출(빈 문자열이면 검색 해제).
export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const update = (value) => {
    setQuery(value);
    onSearch(value.trim());
  };

  return (
    <div className="searchbar">
      <input
        type="search"
        value={query}
        placeholder="메시지·환자명 검색"
        onChange={(e) => update(e.target.value)}
      />
      {query && (
        <button type="button" className="searchbar__clear" onClick={() => update('')}>
          ✕
        </button>
      )}
    </div>
  );
}
