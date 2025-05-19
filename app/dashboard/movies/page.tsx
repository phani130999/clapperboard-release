"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SubMenu, SearchMenu, LoadingElement, NoDataElement } from "../components";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MovieProps {
    data: {
        id: string;
        name: string;
        logline: string | null;
        description: string | null;
        mainCharacters: string[];
        sceneCount: number;
    };
}

const fetchMovies = async (page: number, search: string) => {
    const response = await fetch(`/api/db/movies?page=${page}&limit=5&search=${encodeURIComponent(search)}`);
    if (!response.ok) throw new Error("Failed to fetch movies");
    return await response.json();
};

export default function Movies() {
    const [movies, setMovies] = useState<MovieProps["data"][]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [duplicate, setDuplicate] = useState(true);
    const [search, setSearch] = useState("");
    const initialLoadRef = useRef(false);

    const [deleteMovieId, setDeleteMovieId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { ref, inView } = useInView({ threshold: 0.5 });

    const router = useRouter();

    const handleEdit = (id: string) => {
        sessionStorage.setItem("edit_movie_id", id.toString());
        router.push("/dashboard/movies/edit");
    };

    const handleDelete = (id: string) => {
        setDeleteMovieId(id);
        setDialogOpen(true);
    }

    const confirmDelete = async () => {
        if (!deleteMovieId) return;

        try {
            const response = await fetch("/api/db/movies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "DELETE",
                    movieId: deleteMovieId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete movie.");
            }

            setMovies([]);
            setPage(1);
            setHasMore(true);
            setLoading(false);
            setDuplicate(false);

            const newMovies = await fetchMovies(page, search);
            setMovies(newMovies);

        } catch (error) {
            console.error("Error deleting movie:", error);
            alert("Failed to delete movie.");
        } finally {
            setDialogOpen(false);
        }
    };

    useEffect(() => {
        setMovies([]);
        setPage(1);
        setHasMore(true);
        setLoading(false);
        setDuplicate(false);
    }, [search]);

    useEffect(() => {

        if (initialLoadRef.current && process.env.NODE_ENV === 'development' && ((page === 1 && !search?.trim() && movies.length > 0) || duplicate)) {
            setDuplicate(false);
            return;
        }

        initialLoadRef.current = true;

        const loadMovies = async () => {
            if (loading || !hasMore) return;
            setLoading(true);

            try {
                const newMovies = await fetchMovies(page, search);
                setMovies((prev) => [...prev, ...newMovies]);
                if (newMovies.length < 5) {
                    setHasMore(false);
                    setPage((prevPage) => prevPage + 1);
                }
            } catch (error) {
                console.error("Error fetching movies:", error);
            } finally {
                setLoading(false);
            }
        };

        loadMovies();
    }, [page, search]);

    useEffect(() => {
        if (inView && hasMore && !loading && movies.length > 0) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [inView, hasMore, loading]);

    return (
        <div>
            <SearchMenu search={search} setSearch={setSearch} />
            <SubMenu basePath="/dashboard/movies" baseObject="Movie" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                    </DialogHeader>

                    <p className="text-gray-700">
                        Deleting this movie will also delete its associated characters, scenes,
                        and montages. This action is irreversible.
                    </p>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button
                            onClick={() => setDialogOpen(false)}
                            className="bg-white text-gray-700 rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={confirmDelete}
                            className="bg-black text-white rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        <div className="space-y-6 p-6 w-full lg:w-8/12 mx-auto">
            <div className="block text-3xl text-center font-semibold">Movies</div>
            {movies.map((data) => (
                <Card key={data.id} className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
                    <button
                        onClick={() => handleEdit(data.id)}
                        className="absolute group bottom-4 right-12 flex items-center gap-1 text-black hover:scale-105 transition-all cursor-pointer z-20"
                    >
                        <FontAwesomeIcon icon={faPenToSquare} className="text-xl" />
                        <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                            Edit
                        </span>
                    </button>
                    <button
                        onClick={() => handleDelete(data.id)}
                        className="absolute group bottom-4 right-4 flex items-center gap-1 text-black hover:scale-105 transition-all cursor-pointer z-15"
                    >
                        <FontAwesomeIcon icon={faTrashCan} className="text-xl" />
                        <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                            Delete
                        </span>
                    </button>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">{data.name}</CardTitle>
                        <p className="text-sm text-gray-500">{data.logline}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-700">{data.description}</p>
                        <div>
                            <h3 className="font-semibold">Main Characters:</h3>
                            {data.mainCharacters.length > 0 ? (
                                <ul className="list-disc list-inside text-gray-600">
                                    {data.mainCharacters.map((character) => (
                                        <li key={character}>{character}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 italic">No main characters listed.</p>
                            )}
                        </div>
                        <p className="text-gray-700 font-semibold">Total Scenes: {data.sceneCount}</p>
                    </CardContent>
                </Card>
            ))}
            {hasMore && <LoadingElement />}
            {!loading && movies.length === 0 && !hasMore && <NoDataElement />}

            {/* Observer Trigger */}
            {hasMore && <div ref={ref} className="h-10"></div>}
        </div>
        </div>
    );
}
