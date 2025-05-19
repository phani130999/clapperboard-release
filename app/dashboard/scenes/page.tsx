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
import { useMovie } from "@/app/ui/movieContext";

interface SceneProps {
    id: string;
    number: number;
    act?: string;
    ieFlag?: string;
    slFlag?: string;
    type?: string;
    location?: string;
    subLocation?: string;
    weather?: string;
    time?: string;
    description: string;
    expLength: number;
    numExtras?: number;
    cameraNotes?: string;
    lightingNotes?: string;
    soundNotes?: string;
    colorNotes?: string;
    propNotes?: string;
    otherNotes?: string;
    relevanceQuotient?: string;
    costquotient?: string;
    characters: {
        id: string;
        name: string;
        description: string;
        type: string;
    }[];
    movieName: string;
}

const CHARACTER_TYPES = [
    { value: "D", label: "Dialogue" },
    { value: "N", label: "No-Dialogue" },
    { value: "O", label: "Off-Screen" },
    { value: "B", label: "Background" },
];

const IE_LABELS: Record<string, string> = {
    I: "INT.",
    E: "EXT.",
    IE: "INT./EXT."
};

const SL_LABELS: Record<string, string> = {
    S: "Set",
    L: "Location",
    SL: "Set/Location"
};

const TYPE_LABELS: Record<string, string> = {
    D: "Dialogue",
    A: "Action",
    B: "Balanced",
    M: "Montage",
    T: "Title",
    S: "Stunt",
    G: "Graphical",
    O: "Others"
};

const RELEVANCE_LABELS: Record<string, string> = {
    M: "Must-have",
    G: "Good-to-have",
    F: "Filler",
    V: "Value-addition",
    U: "Unimportant"
};

const COST_LABELS: Record<string, string> = {
    E: "Extremely-expensive",
    V: "Very-expensive",
    M: "Moderately-expensive",
    R: "Reasonably-expensive",
    I: "Inexpensive"
};

const fetchScenes = async (page: number, search: string) => {
    const response = await fetch(`/api/db/scenes?page=${page}&limit=5&search=${encodeURIComponent(search)}`);
    if (!response.ok) throw new Error("Failed to fetch scenes");
    return await response.json();
};

const fetchDefaultMovie = async () => {
    const response = await fetch(`/api/db/movies?default=true`);
    if (!response.ok) throw new Error("Failed to fetch default movie");
    const movie = await response.json();
    return movie.name;
}

export default function Scenes() {
    const [scenes, setScenes] = useState<SceneProps[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [duplicate, setDuplicate] = useState(true);
    const [search, setSearch] = useState("");
    const initialLoadRef = useRef(false);
    const [defaultMovie, setDefaultMovie] = useState("");
    const [deleteSceneId, setDeleteSceneId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { ref, inView } = useInView({ threshold: 0.5 });
    const router = useRouter();
    const { movieChangeFlag } = useMovie();

    const handleEdit = (id: string) => {
        sessionStorage.setItem("edit_scene_id", id);
        router.push("/dashboard/scenes/edit");
    };

    const handleDelete = (id: string) => {
        setDeleteSceneId(id);
        setDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteSceneId) return;

        try {
            const response = await fetch("/api/db/scenes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "DELETE", sceneId: deleteSceneId }),
            });
            if (!response.ok) throw new Error("Failed to delete scene.");

            setScenes([]);
            setPage(1);
            setHasMore(true);
            setLoading(false);
            setDuplicate(false);

            const newScenes = await fetchScenes(page, search);
            setScenes(newScenes);
        } catch (error) {
            console.error("Error deleting scene:", error);
            alert("Failed to delete scene.");
        } finally {
            setDialogOpen(false);
        }
    };

    useEffect(() => {
        setScenes([]);
        setPage(1);
        setHasMore(true);
        setLoading(false);
        setDuplicate(false);
        setDefaultMovie("");
    }, [search, movieChangeFlag]);

    useEffect(() => {
        if (initialLoadRef.current && process.env.NODE_ENV === 'development' && ((page === 1 && !search?.trim() && scenes.length > 0) || duplicate)) {
            setDuplicate(false);
            return;
        }
        initialLoadRef.current = true;
        const loadScenes = async () => {
            if (loading || !hasMore) return;
            setLoading(true);
            try {
                const newScenes = await fetchScenes(page, search);

                if (defaultMovie === "") {
                    setDefaultMovie(newScenes.length > 0 ? newScenes[0].movieName : await fetchDefaultMovie());
                }

                setScenes((prev) => [...prev, ...newScenes]);
                if (newScenes.length < 5) {
                    setHasMore(false);
                    setPage((prevPage) => prevPage + 1);
                }
            } catch (error) {
                console.error("Error fetching scenes:", error);
            } finally {
                setLoading(false);
            }
        };
        loadScenes();
    }, [page, search]);

    useEffect(() => {
        if (inView && hasMore && !loading && scenes.length > 0) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [inView, hasMore, loading]);

    return (
        <div>
            <SearchMenu search={search} setSearch={setSearch} />
            <SubMenu basePath="/dashboard/scenes" baseObject="Scene" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-700">
                        Deleting this scene will also delete its mappings with characters, and associated montages. This action is irreversible.
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
                    <div className="text-3xl">Scenes</div>
                    <div className="text-2xl ">{defaultMovie}</div>
                </div>
                {scenes.map((scene) => (
                    <Card key={scene.id} className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
                        {/* Edit Button */}
                        <button
                            onClick={() => handleEdit(scene.id)}
                            className="absolute group bottom-4 right-12 flex items-center gap-1 text-black hover:scale-105 transition-all cursor-pointer z-20"
                        >
                            <FontAwesomeIcon icon={faPenToSquare} className="text-xl" />
                            <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                                Edit
                            </span>
                        </button>

                        {/* Delete Button */}
                        <button
                            onClick={() => handleDelete(scene.id)}
                            className="absolute group bottom-4 right-4 flex items-center gap-1 text-black hover:scale-105 transition-all cursor-pointer z-15"
                        >
                            <FontAwesomeIcon icon={faTrashCan} className="text-xl" />
                            <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                                Delete
                            </span>
                        </button>

                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">
                                {scene.number}.&nbsp; {IE_LABELS[scene.ieFlag ?? ""] || scene.ieFlag}{" "} {scene.location} {scene.subLocation ? `/ ${scene.subLocation}` : ""} - {scene.time} - {scene.weather}
                            </CardTitle>
                            <p className="text-sm text-gray-500">
                                Act {scene.act} | {SL_LABELS[scene.slFlag ?? ""] || scene.slFlag} | {TYPE_LABELS[scene.type ?? ""] || scene.type} | {scene.expLength} min | {RELEVANCE_LABELS[scene.relevanceQuotient ?? ""] || scene.relevanceQuotient} | {COST_LABELS[scene.costquotient ?? ""] || scene.costquotient}
                            </p>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <p className="text-gray-700">{scene.description}</p>

                            {/* Characters */}
                            <div>
                                <h3 className="font-semibold">Characters:</h3>
                                {scene.characters.length > 0 ? (
                                    <div className="pl-5 text-gray-600 text-sm space-y-1">
                                        {CHARACTER_TYPES.map(({ value, label }) => {
                                            const filteredCharacters = scene.characters
                                                .filter((character) => character.type === value)
                                                .map((character) => character.name);

                                            return filteredCharacters.length > 0 ? (
                                                <div key={value}>
                                                    <span className="font-medium">{label}:</span> {filteredCharacters.join(", ")}
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic">No characters listed.</p>
                                )}
                            </div>

                            {/* Technical Notes */}
                            <div>
                                <h3 className="font-semibold">Notes:</h3>
                                <ul className="list-none pl-5 list-inside text-gray-600 text-sm">
                                    <li>Number of Extras: {scene.numExtras}</li>
                                    <li>Camera: {scene.cameraNotes}</li>
                                    <li>Lighting: {scene.lightingNotes}</li>
                                    <li>Sound: {scene.soundNotes}</li>
                                    <li>Color: {scene.colorNotes}</li>
                                    <li>Props: {scene.propNotes}</li>
                                    <li>Other: {scene.otherNotes}</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {hasMore && <LoadingElement />}
                {!loading && scenes.length === 0 && !hasMore && <NoDataElement />}
                {/* Observer Trigger */}
                {hasMore && <div ref={ref} className="h-10"></div>}
            </div>
        </div>
    );
}
