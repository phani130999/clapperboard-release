"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SearchMenu, LoadingElement, NoDataElement } from "../components";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMovie } from "@/app/ui/movieContext";

interface Montage {
    id: string;
    sceneId: string;
    seqNumber: number;
    ieFlag: string;
    slFlag: string;
    location: string;
    subLocation?: string;
    weather: string;
    time: string;
    description: string;
    expLength: number;
    numExtras: number;
    notes?: string;
}

interface Scene {
    sceneId: string;
    number: number;
    description: string;
    location: string;
    subLocation?: string;
    montages: Montage[];
}

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

const fetchMontages = async (page: number, search: string) => {
    const response = await fetch(`/api/db/montages?page=${page}&limit=5&search=${encodeURIComponent(search)}`);
    if (!response.ok) throw new Error("Failed to fetch montages");
    return await response.json();
};

const fetchDefaultMovie = async () => {
    const response = await fetch(`/api/db/movies?default=true`);
    if (!response.ok) throw new Error("Failed to fetch default movie");
    const movie = await response.json();
    return movie.name;
}

export default function Montages() {
    const [montages, setMontages] = useState<Scene[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [duplicate, setDuplicate] = useState(true);
    const [search, setSearch] = useState("");
    const initialLoadRef = useRef(false);
    const [defaultMovie, setDefaultMovie] = useState("");
    const [deleteMontageId, setDeleteMontageId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { movieChangeFlag } = useMovie();
    const { ref, inView } = useInView({ threshold: 0.5 });
    const router = useRouter();

    const handleCreate = (sceneId: string, movieName: string) => {
        sessionStorage.setItem("scene_id", sceneId);
        sessionStorage.setItem("movie_name", movieName);
        router.push("/dashboard/montages/create");
    }

    const handleEdit = (sceneId: string, movieName: string, montageId: string) => {
        sessionStorage.setItem("scene_id", sceneId);
        sessionStorage.setItem("movie_name", movieName);
        sessionStorage.setItem("edit_montage_id", montageId);
        router.push("/dashboard/montages/edit");
    };

    const handleDelete = (id: string) => {
        setDeleteMontageId(id);
        setDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteMontageId) return;

        try {
            const response = await fetch("/api/db/montages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "DELETE", sequenceId: deleteMontageId }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete montage.");
            }

            setMontages([]);
            setPage(1);
            setHasMore(true);
            setLoading(false);
            setDuplicate(false);

            const fetchResponse = await fetchMontages(page, search);
            const newMontages = fetchResponse.montagesByScene || [];
            setMontages(newMontages);
        } catch (error) {
            console.error("Error deleting montage:", error);
            alert("Failed to delete montage.");
        } finally {
            setDialogOpen(false);
        }
    };

    useEffect(() => {
        setMontages([]);
        setPage(1);
        setHasMore(true);
        setLoading(false);
        setDuplicate(false);
        setDefaultMovie("");
    }, [search, movieChangeFlag]);

    useEffect(() => {
        if (initialLoadRef.current && process.env.NODE_ENV === 'development' && ((page === 1 && !search?.trim() && montages.length > 0) || duplicate)) {
            setDuplicate(false);
            return;
        }

        initialLoadRef.current = true;

        const loadMontages = async () => {
            if (loading || !hasMore) return;
            setLoading(true);

            try {
                const response = await fetchMontages(page, search);
                const newMontages = response.montagesByScene || [];

                if (defaultMovie === "") {
                    setDefaultMovie(newMontages.length > 0 ? newMontages[0].movieName : await fetchDefaultMovie());
                }

                setMontages((prev) => [...prev, ...newMontages]);
                if (newMontages.length < 5) {
                    setHasMore(false);
                    setPage((prevPage) => prevPage + 1);
                }
            } catch (error) {
                console.error("Error fetching montages:", error);
            } finally {
                setLoading(false);
            }
        };

        loadMontages();
    }, [page, search]);

    useEffect(() => {
        if (inView && hasMore && !loading && montages.length > 0) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [inView, hasMore, loading]);

    return (
        <div>
            <SearchMenu search={search} setSearch={setSearch} />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-700">
                        Deleting this montage will remove it permanently. This action is irreversible.
                    </p>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button onClick={() => setDialogOpen(false)} className="bg-white text-gray-700 rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700">
                            Cancel
                        </Button>
                        <Button onClick={confirmDelete} className="bg-black text-white rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700">
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <div className="space-y-6 p-6 w-full lg:w-8/12 mx-auto">
                <div className="block text-center font-semibold">
                    <div className="text-3xl">Montages</div>
                    <div className="text-2xl ">{defaultMovie}</div>
                </div>
                {montages.map((scene) => (
                    <Card key={scene.sceneId} className="p-4 rounded-2xl shadow-md border border-gray-300 mb-6 relative">
                        <div className="absolute group top-4 right-10 z-10 bg-white text-black shadow-md shadow-gray-500 rounded-md w-10 h-10">
                            <button
                                onClick={() => handleCreate(scene.sceneId, defaultMovie)}
                                aria-label={`Create Sequence`}
                                className="relative group w-full h-10 flex items-center justify-center cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-lg" />
                                <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                                    Create
                                </span>
                            </button>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">
                                {"Scene"} {scene.number}
                            </CardTitle>
                            <p className="text-sm text-gray-500">
                                {scene.description}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {scene.montages.length > 0 ? (
                                scene.montages.map((montage) => (
                                    <div key={montage.id} className="p-4 border border-gray-300 rounded-lg shadow-sm mb-4 relative">
                                        {/* Edit Button */}
                                        <button
                                            onClick={() => handleEdit(scene.sceneId, defaultMovie, montage.id)}
                                            className="absolute group bottom-4 right-12 flex items-center gap-1 text-black hover:scale-105 transition-all cursor-pointer z-20"
                                        >
                                            <FontAwesomeIcon icon={faPenToSquare} className="text-xl" />
                                            <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                                                Edit
                                            </span>
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleDelete(montage.id)}
                                            className="absolute group bottom-4 right-4 flex items-center gap-1 text-black hover:scale-105 transition-all cursor-pointer z-15"
                                        >
                                            <FontAwesomeIcon icon={faTrashCan} className="text-xl" />
                                            <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                                                Delete
                                            </span>
                                        </button>

                                        <h3 className="text-lg font-bold">
                                            Sequence {montage.seqNumber}.&nbsp;
                                            {IE_LABELS[montage.ieFlag ?? ""] || montage.ieFlag}{" "}
                                            {montage.location} {montage.subLocation ? `/ ${montage.subLocation}` : ""} - {montage.time} - {montage.weather}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {SL_LABELS[montage.slFlag ?? ""] || montage.slFlag} | {montage.expLength} seconds
                                        </p>
                                        <p className="text-gray-700">{montage.description}</p>
                                        <p className="text-gray-600 text-sm">Number of Extras: {montage.numExtras}</p>
                                        <p className="text-gray-600 text-sm">Notes: {montage.notes}</p>

                                        <div className="h-6"></div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center italic py-4">No sequences yet!</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {hasMore && <LoadingElement />}
                {!loading && montages.length === 0 && !hasMore && <NoDataElement />}
                {hasMore && <div ref={ref} className="h-10"></div>}
            </div>
        </div>
    );
}