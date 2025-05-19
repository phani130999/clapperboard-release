"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileVideo, faExpand, faCompress } from "@fortawesome/free-solid-svg-icons";
import MoviePickerDialog from "./moviePicker";

interface Movie {
    id: string;
    name: string;
    defaultFlag: string | null;
}

export default function TopNavBar() {
    
    const [movies, setMovies] = useState([]);
    const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const pathname = usePathname();

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const handleOpenDialog = async () => {
        if (isDialogOpen) return;
        try {
            const response = await fetch("/api/db/movies", { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch movies");

            const userMovies = await response.json();
            setMovies(userMovies);
            const currentDefault = userMovies.find((movie: Movie) => movie.defaultFlag === "Y");
            setSelectedMovieId(currentDefault?.id || null);
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching movies:", error);
        }
    };

    // Exclude nav bar from specific routes
    const excludedRoutes = ["/", "/signin", "/documentation"];
    if (excludedRoutes.includes(pathname)) return null;

    return (
        <nav className="fixed top-0 left-0 w-full bg-white text-black flex justify-between items-center pt-2 pb-1 pl-5 pr-5 shadow-md shadow-gray-700 z-50 lg:px-40">
            {/* Left Side - Home & Search */}
            <div className="flex items-center gap-8">
                <Link href="/">
                    <button type="button" aria-label="Home" className="relative group cursor-pointer hover:scale-105 transition-all">
                        <Image
                            src="/assets/clapperboard.png"
                            alt="Clapperboard Logo"
                            width={27}
                            height={27}
                            priority
                            className="mx-auto"
                        />
                        <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-3 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                            Home
                        </span>
                    </button>
                </Link>
                <button
                    type="button"
                    aria-label="Open"
                    className="relative group cursor-pointer hover:scale-105 transition-all"
                >
                    <FontAwesomeIcon icon={faFileVideo} className="text-2xl" onClick={handleOpenDialog} />
                    <MoviePickerDialog
                        open={isDialogOpen}
                        onClose={() => {
                            setIsDialogOpen(false);
                        }}
                        movies={movies}
                        selectedMovieId={selectedMovieId}
                        setSelectedMovieId={setSelectedMovieId}
                    />
                    <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                        Switch
                    </span>
                </button>
                <button
                    type="button"
                    aria-label="Go full screen"
                    className="relative group cursor-pointer hover:scale-105 transition-all"
                    onClick={toggleFullscreen}
                >
                    <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="text-2xl" />
                    <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                        {isFullscreen ? "Exit" : "Fullscreen"}
                    </span>
                </button>
            </div>

        </nav>
    );
}
