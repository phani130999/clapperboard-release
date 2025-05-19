"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faHome, faMagnifyingGlass, faVideo, faUserGroup, faClapperboard, faLayerGroup, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

const menuItems = [
    { label: "Home", href: "/dashboard", icon: faHome },
    { label: "Search", href: "/dashboard/search", icon: faMagnifyingGlass },
    { label: "Movies", href: "/dashboard/movies", icon: faVideo },
    { label: "Characters", href: "/dashboard/characters", icon: faUserGroup },
    { label: "Scenes", href: "/dashboard/scenes", icon: faClapperboard },
    { label: "Montages", href: "/dashboard/montages", icon: faLayerGroup },
    { label: "About", href: "/dashboard/about", icon: faInfoCircle }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-gray-100 h-[calc(100vh-3.5rem)]">
            {/* Floating Menu */}
            <div
                ref={menuRef}
                className={cn(
                    "fixed top-20 left-3 bg-white text-black z-20 shadow-md shadow-gray-500 rounded-md transition-all duration-300",
                    isExpanded ? "w-32 lg:w-48" : "w-10"
                )}
            >
                <button
                    className={cn("relative group w-full h-10 flex items-center justify-center cursor-pointer", isExpanded ? "border-b border-gray-700" : "" )}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <FontAwesomeIcon icon={isExpanded ? faTimes : faBars} className="text-lg" />
                    <span className={cn("absolute hidden left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md", isExpanded ? "" : "group-hover:block")}>
                        Menu
                    </span>
                </button>

                {/* Show menu items only when expanded */}
                {isExpanded && (
                    <nav className="flex flex-col transition-opacity duration-300 ease-in-out">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-200 transition-all duration-300",
                                    pathname === item.href ? "bg-gray-300" : ""
                                )}
                            >
                                <FontAwesomeIcon icon={item.icon} className="text-xs lg:text-lg text-black" />
                                <span className="leading-none text-xs lg:text-base">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
            <div className="h-14">
            </div>
        </div>
    );
}
