import React, { useRef } from "react";

type SearchbarProps = {
  value: string;
  onSearch: (keyword: string) => void;
};

export default function Searchbar({ value, onSearch }: SearchbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const submitSearch = () => onSearch(inputRef.current?.value.trim() || "");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) submitSearch();
  };

  return (
    <div
      className="flex items-center justify-between w-full h-13 px-4 py-2.5 
                  bg-[#FCF9F6] text-[#3D2419] font-bold text-base
                  border-[3px] border-[#3D2419]
                  shadow-[4px_4px_0px_0px_#3D2419]
                  "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 30 30"
        fill="#6B7280"
      >
        <path d="M13 3C7.489 3 3 7.489 3 13s4.489 10 10 10a9.95 9.95 0 0 0 6.322-2.264l5.971 5.971a1 1 0 1 0 1.414-1.414l-5.97-5.97A9.95 9.95 0 0 0 23 13c0-5.511-4.489-10-10-10m0 2c4.43 0 8 3.57 8 8s-3.57 8-8 8-8-3.57-8-8 3.57-8 8-8" />
      </svg>
      <input
        key={value}
        ref={inputRef}
        type="text"
        placeholder="搜尋商品"
        defaultValue={value}
        onKeyDown={handleKeyDown}
        className="w-full h-full outline-none text-gray-500 placeholder-gray-500 text-sm ml-2"
      />
      <button
        onClick={submitSearch}
        className="ml-2 px-3 py-1 bg-[#3D2419] text-white text-sm font-bold
                   hover:bg-[#5a3a2a] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer whitespace-nowrap"
      >
        搜尋
      </button>
    </div>
  );
}
