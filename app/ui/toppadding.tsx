"use client";

import { usePathname } from "next/navigation";

export default function TopPadding() {

    const pathname = usePathname();

    const excludedRoutes = ["/", "/signin", "/documentation"];
    if (excludedRoutes.includes(pathname)) return null;

    return (
        <div className="h-14"></div>
    );
}