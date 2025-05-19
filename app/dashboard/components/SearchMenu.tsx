"use client"

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faArrowRight } from "@fortawesome/free-solid-svg-icons";

export default function SearchMenu({ search, setSearch }: { search: string; setSearch: (query: string) => void }) {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [inputValue, setInputValue] = useState(search);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchActive(false);
                setInputValue(""); // Clear input on click outside
            }
        }

        function handleEscapeKey(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsSearchActive(false);
                setInputValue(""); // Clear input on Escape key
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscapeKey);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, []);

    const handleSearch = () => {
        setSearch(inputValue.trim());
        setTimeout(() => setIsSearchActive(false), 200);
    };

    return (
        <div
            ref={searchRef}
            className={`fixed top-33 left-3 z-15 bg-white text-black shadow-md shadow-gray-500 rounded-md
        ${isSearchActive ? 'w-48' : 'w-10'} h-10 transition-all duration-300`}
        >
            {!isSearchActive ? (
                // Search Icon (Initial State)
                <button
                    type="button"
                    aria-label="Search"
                    className="relative group w-full h-10 flex items-center justify-center cursor-pointer"
                    onClick={() => {
                        setIsSearchActive(true);
                        setTimeout(() => searchRef.current?.querySelector("input")?.focus(), 200); // Focus on input after animation
                    }}
                >
                    <FontAwesomeIcon icon={faSearch} className="text-lg" />
                    <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                        Search
                    </span>
                </button>
            ) : (
                // Expanded Search Input (Active State)
                <div className="flex items-center w-full h-full px-2 text-sm gap-2">
                    <input
                        type="text"
                        placeholder="Search"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 outline-none bg-transparent w-36"
                    />
                    <button
                        type="button"
                        aria-label="Submit Search"
                        onClick={handleSearch}
                        className="cursor-pointer flex items-center"
                    >
                        <FontAwesomeIcon icon={faArrowRight} className="text-lg" />
                    </button>
                </div>
            )}
        </div>
    );
}
