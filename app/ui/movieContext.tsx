"use client";

import { createContext, useContext, useState } from "react";

const MovieContext = createContext<{ movieChangeFlag: string; setMovieChangeFlag: (id: string) => void } | undefined>(undefined);

export function MovieProvider({ children }: { children: React.ReactNode }) {
    const [movieChangeFlag, setMovieChangeFlag] = useState("");

    return (
        <MovieContext.Provider value={{ movieChangeFlag, setMovieChangeFlag }}>
            {children}
        </MovieContext.Provider>
    );
}

export function useMovie() {
    const context = useContext(MovieContext);
    if (!context) throw new Error("useMovie must be used within a MovieProvider");
    return context;
}
