"use client";

import { useEffect } from "react";
import Image from 'next/image';
import Link from "next/link";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {

    useEffect(() => {
        void reset;
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="bg-gray-100 h-[calc(100vh-7rem)] flex flex-col items-center justify-center text-center p-6">
            <div className="text-center relative space-y-6">
                <Link href="/" className="p-5">
                    <button type="button" aria-label="Back to Home" className="relative group cursor-pointer hover:scale-110 transition-all duration-300 p-5">
                        <Image
                            src="/assets/clapperboard.png"
                            alt="Clapperboard Logo"
                            width={70}
                            height={70}
                            priority
                            className="mx-auto shadow-md shadow-gray-500 rounded-full"
                        />
                        <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-max px-3 py-1 bg-black text-white text-sm rounded-md shadow-md">
                            Home
                        </span>
                    </button>
                </Link>
                <h1 className="text-7xl m-6 text-black">Oops!</h1>
                <h3 className="w-full mx-auto text-3xl m-6 text-black text-center font-semibold pl-3 pr-3">What brought you here?</h3>
                <Link href={"/dashboard"}>
                    <button type="button" aria-label="Go to Dashboard" className="mx-auto px-4 py-2 bg-black text-white rounded-md text-xl lg:text-2xl cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700">
                        Go to Dashboard!
                    </button>
                </Link>
            </div>
        </div>
    );
}
