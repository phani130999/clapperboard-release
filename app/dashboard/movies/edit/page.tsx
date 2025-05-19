"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackMenu } from "../../components";

export default function EditMoviePage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [logline, setLogline] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const [loglineRows, setLoglineRows] = useState(2);
    const [descriptionRows, setDescriptionRows] = useState(4);

    useEffect(() => {
        const editMovieId = String(sessionStorage.getItem("edit_movie_id"));

        if (!editMovieId) {
            alert("Movie ID not found. Redirecting...");
            router.push("/dashboard/movies");
            return;
        }

        fetch(`/api/db/movies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "GET_MOVIE_BY_ID",
                movieId: editMovieId,
            }),
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Server error or invalid response.");
                }
                return res.json();
            })
            .then((data) => {
                if (!data || !data.name) {
                    throw new Error("Invalid movie data.");
                }

                setName(data.name);
                setLogline(data.logline);
                setDescription(data.description);
            })
            .catch((error) => {
                console.error("Error fetching movie details:", error);
                alert("Failed to fetch movie details. Please try again.");
            });
        
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setLoglineRows(4);
                setDescriptionRows(8);
            }
            else if (window.innerWidth < 768) {
                setLoglineRows(3);
                setDescriptionRows(6);
            }
            else {
                setLoglineRows(2);
                setDescriptionRows(4);
            }
        };

        handleResize(); // Initial check
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const editMovieId = String(sessionStorage.getItem("edit_movie_id"));

        try {
            const response = await fetch("/api/db/movies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "EDIT",
                    movieId: editMovieId,
                    movieData: {
                        name,
                        logline,
                        description,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save movie.");
            }

            router.push("/dashboard/movies");
        } catch (error) {
            console.error("Error saving movie:", error);
            alert("Failed to save movie.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6 w-full lg:w-8/12 mx-auto">
            <BackMenu basePath="/dashboard/movies" baseObject="Movie" />
            <div className="block text-3xl text-center font-semibold">Edit Movie</div>
            <Card className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
                <button
                    type="button"
                    className="absolute group bottom-4 right-4 flex items-center gap-1 text-black hover:scale-105 transition-all cursor-pointer"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <FontAwesomeIcon icon={faSave} className="text-2xl" />
                    <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                        {saving ? "Saving..." : "Save"}
                    </span>
                </button>

                <CardHeader>
                    <CardTitle>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Movie Title"
                            className="w-full text-2xl font-bold outline-none border-b border-gray-300 bg-transparent"
                        />
                    </CardTitle>
                    <textarea
                        rows={loglineRows}
                        value={logline}
                        onChange={(e) => setLogline(e.target.value)}
                        placeholder="Logline"
                        className="w-full text-sm text-gray-500 outline-none border-b border-gray-300 bg-transparent mt-2"
                    />
                </CardHeader>

                <CardContent className="space-y-4">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Movie Description"
                        rows={descriptionRows}
                        className="w-full text-gray-700 outline-none border border-gray-300 p-2 rounded-md"
                    />
                    <div className="h-2"></div>
                </CardContent>
            </Card>
        </div>
    );
}
