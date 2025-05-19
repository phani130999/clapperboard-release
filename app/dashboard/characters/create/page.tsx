"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackMenu } from "../../components";
import { useMovie } from "@/app/ui/movieContext";

const genderLabels: Record<string, string> = {
    M: "Male",
    F: "Female",
    O: "Other"
};

const characterTypeLabels: Record<string, string> = {
    M: "Main",
    P: "Primary",
    S: "Secondary",
    T: "Tertiary",
    O: "Other"
};

const fetchDefaultMovie = async () => {
    const response = await fetch(`/api/db/movies?default=true`);
    if (!response.ok) throw new Error("Failed to fetch default movie");
    const movie = await response.json();
    return movie.name;
}

export default function CreateCharacter() {
    const [name, setName] = useState("");
    const [gender, setGender] = useState("M");
    const [lowerAge, setLowerAge] = useState(0);
    const [upperAge, setUpperAge] = useState(0);
    const [type, setType] = useState("M");
    const [description, setDescription] = useState("");
    const [expScreenTime, setExpScreenTime] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [defaultMovie, setDefaultMovie] = useState("");
    const router = useRouter();

    const { movieChangeFlag } = useMovie();

    useEffect(() => {
        const fetchMovie = async () => {
            const movie = await fetchDefaultMovie();
            setDefaultMovie(movie);
        };

        fetchMovie();
    }, [movieChangeFlag]);

    const [textRows, setTextRows] = useState(4);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setTextRows(6);
            }
            else if (window.innerWidth < 768) {
                setTextRows(4);
            }
            else {
                setTextRows(2);
            }
        };

        handleResize(); // Initial check
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSave = async () => {
        setSaving(true);

        try {
            const response = await fetch("/api/db/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "CREATE",
                    characterData: {
                        name,
                        gender,
                        lowerAge,
                        upperAge,
                        type,
                        description,
                        expScreenTime,
                        notes,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save character.");
            }

            router.push("/dashboard/characters");
        } catch (error) {
            console.error("Error saving character:", error);
            alert("Failed to save character.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6 w-full lg:w-8/12 mx-auto">
            <BackMenu basePath="/dashboard/characters" baseObject="Character" />
            <div className="block text-center font-semibold">
                <div className="text-3xl">Create a Character</div>
                <div className="text-2xl ">{defaultMovie}</div>
            </div>
            <Card className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
                <CardHeader>
                    <CardTitle className="space-y-4">
                        <p className="text-gray-700 font-semibold">
                            Character Type:
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="ml-2 bg-transparent outline-none border-none font-normal w-30"
                            >
                                {Object.entries(characterTypeLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Character Name"
                            className="w-full text-2xl font-bold outline-none bg-transparent border-b border-gray-300"
                        />
                    </CardTitle>
                    <div className="text-sm text-gray-500 flex gap-2 mt-2">
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="bg-transparent outline-none border-none w-20"
                        >
                            {Object.entries(genderLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <span>| Age:</span>
                        <input
                            type="text"
                            value={lowerAge || ""}
                            onChange={(e) => setLowerAge(Number(e.target.value))}
                            className="w-10 bg-transparent text-center outline-none border-b border-gray-300"
                        />
                        <span>-</span>
                        <input
                            type="text"
                            value={upperAge || ""}
                            onChange={(e) => setUpperAge(Number(e.target.value))}
                            className="w-10 bg-transparent text-center outline-none border-b border-gray-300"
                        />
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-gray-700">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Character Description"
                            rows={textRows}
                            className="w-full outline-none bg-transparent text-gray-700 border border-gray-300 p-2 rounded-md"
                        />
                    </p>

                    <p className="font-semibold">
                        Expected Screen Time:
                        <input
                            type="text"
                            value={ expScreenTime || "" }
                            onChange={(e) => setExpScreenTime(e.target.value)}
                            className="w-10 bg-transparent text-center outline-none border-b border-gray-300"
                        />
                        mins
                    </p>

                    <p className="text-gray-700 italic">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notes"
                            rows={textRows}
                            className="w-full outline-none bg-transparent text-gray-700 border border-gray-300 p-2 rounded-md"
                        />
                    </p>
                    <div className="h-2"></div>
                </CardContent>

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
            </Card>
        </div>
    );
}
