"use client";

import Image from 'next/image';
import Link from "next/link";

export default function HomePage() {

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center relative">
        <h1 className="text-5xl lg:text-7xl mb-4 text-black">CLAPPERBOARD</h1>
        <p className="text-2xl lg:text-3xl mb-8 text-black">Lights! Camera!</p>

        {/* Image Container */}
        <div className="relative inline-block">
          <Image
            src="/assets/clapperboard.png"
            alt="Clapperboard Logo"
            width={300}
            height={300}
            priority
            className="mx-auto"
          />

          {/* "Action!" Button Positioned Over Image */}
          <Link href="/dashboard">
            <button type="button" aria-label="Proceed to Sign In" className="absolute top-[71%] left-[53%] transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-black text-white rounded-md text-2xl cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700">
              Action!
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
