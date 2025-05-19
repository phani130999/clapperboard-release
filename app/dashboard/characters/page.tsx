"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan, faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SubMenu, SearchMenu, LoadingElement, NoDataElement } from "../components";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMovie } from "@/app/ui/movieContext";

interface CharacterProps {
    data: {
        id: string;
        name: string;
        gender: string;
        lowerAge: number;
        upperAge: number;
        type: string;
        description: string;
        expScreenTime: number;
        notes: string | null;
        scenes: { id: string; number: number; description: string; expLength: number }[];
    };
}

interface Scene {
    id: string;
    number: number;
    description: string;
    expLength: number;
}

interface SceneListProps {
    scenes: Scene[];
}

const fetchCharacters = async (page: number, search: string) => {
    const response = await fetch(`/api/db/characters?page=${page}&limit=5&search=${encodeURIComponent(search)}`);
    if (!response.ok) throw new Error("Failed to fetch characters");
    return await response.json();
};

const fetchDefaultMovie = async () => {
    const response = await fetch(`/api/db/movies?default=true`);
    if (!response.ok) throw new Error("Failed to fetch default movie");
    const movie = await response.json();
    return movie.name;
}

export default function Characters() {
    const [characters, setCharacters] = useState<CharacterProps["data"][]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [duplicate, setDuplicate] = useState(true);
    const [search, setSearch] = useState("");
    const initialLoadRef = useRef(false);

    const characterTypeLabels: Record<string, string> = {
        M: "Main Characters",
        P: "Primary Characters",
        S: "Secondary Characters",
        T: "Tertiary Characters",
        O: "Other Characters"
    };

    const genderLabels: Record<string, string> = {
        M: "Male",
        F: "Female",
        O: "Other"
    };

    const displayedTypes = new Set();

    const [defaultMovie, setDefaultMovie] = useState("");
    const [deleteCharacterId, setDeleteCharacterId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { ref, inView } = useInView({ threshold: 0.5 });
    const router = useRouter();
    const { movieChangeFlag } = useMovie();

    const SceneList: React.FC<SceneListProps> = ({ scenes }) => {
        const [expanded, setExpanded] = useState(false);
        const displayedScenes = expanded ? scenes : scenes.slice(0, 5);

        return (
            <ul className="list-none pl-5 list-inside text-gray-600">
                {displayedScenes.map((scene) => (
                    <li key={scene.id}>
                        Scene {scene.number}: {scene.description} ({scene.expLength} mins)
                    </li>
                ))}
                {scenes.length > 5 && (
                    <li className="text-gray-600 cursor-pointer mt-2" onClick={() => setExpanded(!expanded)}>
                        <FontAwesomeIcon icon={expanded ? faCaretUp : faCaretDown} className="text-2xl"/>
                    </li>
                )}
            </ul>
        );
    };

    const handleEdit = (id: string) => {
        sessionStorage.setItem("edit_character_id", id.toString());
        router.push("/dashboard/characters/edit");
    };

    const handleDelete = (id: string) => {
        setDeleteCharacterId(id);
        setDialogOpen(true);
    }

    const confirmDelete = async () => {
        if (!deleteCharacterId) return;

        try {
            const response = await fetch("/api/db/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "DELETE",
                    characterId: deleteCharacterId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete character.");
            }

            setCharacters([]);
            setPage(1);
            setHasMore(true);
            setLoading(false);
            setDuplicate(false);

            const newCharacters = await fetchCharacters(page, search);
            setCharacters(newCharacters);

        } catch (error) {
            console.error("Error deleting character:", error);
            alert("Failed to delete character.");
        } finally {
            setDialogOpen(false);
        }
    };

    useEffect(() => {
        setCharacters([]);
        setPage(1);
        setHasMore(true);
        setLoading(false);
        setDuplicate(false);
        setDefaultMovie("");
    }, [search, movieChangeFlag]);

    useEffect(() => {
        
        if (initialLoadRef.current && process.env.NODE_ENV === 'development' && ((page === 1 && !search?.trim() && characters.length > 0) || duplicate)) {
            setDuplicate(false);
            return;
        }

        initialLoadRef.current = true;

        const loadCharacters = async () => {
            if (loading || !hasMore) return;
            setLoading(true);

            try {
                const newCharacters = await fetchCharacters(page, search);

                if (defaultMovie === "") {
                    setDefaultMovie(newCharacters.length > 0 ? newCharacters[0].movieName : await fetchDefaultMovie());
                }

                setCharacters((prev) => [...prev, ...newCharacters]);
                if (newCharacters.length < 5) {
                    setHasMore(false);
                    setPage((prevPage) => prevPage + 1);
                }
            } catch (error) {
                console.error("Error fetching characters:", error);
            } finally {
                setLoading(false);
            }
        };

        loadCharacters();
    }, [page, search]);

    useEffect(() => {
        if (inView && hasMore && !loading && characters.length > 0) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [inView, hasMore, loading]);

    return (
        <div>
            <SearchMenu search={search} setSearch={setSearch} />
            <SubMenu basePath="/dashboard/characters" baseObject="Character" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                    </DialogHeader>

                    <p className="text-gray-700">
                        Deleting this character will also delete its mappings in scenes. This action is irreversible.
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
                <div className="block text-center font-semibold">
                    <div className="text-3xl">Characters</div>
                    <div className="text-2xl ">{defaultMovie}</div>
                </div>
                {characters.map((data) => {
                    const showTypeHeader = !displayedTypes.has(data.type);
                    if (showTypeHeader) displayedTypes.add(data.type);

                    return (
                        <div key={data.id}>
                            {showTypeHeader && (
                                <div className="block text-center text-xl font-bold mt-6 mb-2">{characterTypeLabels[data.type]}</div>
                            )}
                            <Card className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
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
                                    <p className="text-sm text-gray-500">
                                        {genderLabels[data.gender] || "Unknown"} | Age: {data.lowerAge}-{data.upperAge}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-700">{data.description}</p>
                                    <p className="text-gray-700 font-semibold">Expected Screen Time: {data.expScreenTime} mins</p>

                                    <div>
                                        <h3 className="font-semibold">Scenes:</h3>
                                        {data.scenes.length > 0 ? (
                                            <SceneList scenes={data.scenes} />
                                        ) : (
                                            <p className="text-gray-400 italic">No associated scenes.</p>
                                        )}
                                    </div>

                                    {data.notes && <p className="text-gray-500 italic">Notes: {data.notes}</p>}
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
                {hasMore && <LoadingElement />}
                {!loading && characters.length === 0 && !hasMore && <NoDataElement />}
                {/* Observer Trigger */}
                {hasMore && <div ref={ref} className="h-10"></div>}
            </div>
        </div>
    );
}
