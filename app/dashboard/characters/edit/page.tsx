"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackMenu } from "../../components";

const genderLabels = {
    M: "Male",
    F: "Female",
    O: "Other"
};

const characterTypeLabels = {
    M: "Main",
    P: "Primary",
    S: "Secondary",
    T: "Tertiary",
    O: "Other"
};

const fetchMovieName = async (id: string): Promise<string> => {
    try {
        const res = await fetch(`/api/db/movies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "GET_MOVIE_BY_ID",
                movieId: id,
            }),
        });

        if (!res.ok) {
            throw new Error("Server error or invalid response.");
        }

        const data = await res.json();

        if (!data || !data.name) {
            throw new Error("Invalid movie data.");
        }

        return data.name;
    } catch (error) {
        console.error("Error fetching movie details:", error);
        alert("Failed to fetch movie details. Please try again.");
        return "";
    }
};

export default function EditCharacter() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [gender, setGender] = useState("M");
    const [lowerAge, setLowerAge] = useState(0);
    const [upperAge, setUpperAge] = useState(0);
    const [type, setType] = useState("M");
    const [description, setDescription] = useState("");
    const [expScreenTime, setExpScreenTime] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [movie, setMovie] = useState("");

    const [loglineRows, setLoglineRows] = useState(2);
    const [descriptionRows, setDescriptionRows] = useState(4);

    useEffect(() => {
        const editCharacterId = sessionStorage.getItem("edit_character_id");

        if (!editCharacterId) {
            alert("Character ID not found. Redirecting...");
            router.push("/dashboard/characters");
            return;
        }

        fetch(`/api/db/characters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "GET_CHARACTER_BY_ID",
                characterId: editCharacterId,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data || !data.name) {
                    throw new Error("Invalid character data.");
                }
                setName(data.name);
                setGender(data.gender);
                setLowerAge(data.lowerAge);
                setUpperAge(data.upperAge);
                setType(data.type);
                setDescription(data.description);
                setExpScreenTime(data.expScreenTime);
                setNotes(data.notes);
                fetchMovieName(data.movieId).then((name) => setMovie(name));
            })
            .catch((error) => {
                console.error("Error fetching character details:", error);
                alert("Failed to fetch character details. Please try again.");
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
        const editCharacterId = sessionStorage.getItem("edit_character_id");

        try {
            const response = await fetch("/api/db/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "EDIT",
                    characterId: editCharacterId,
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
                <div className="text-3xl">Edit Character</div>
                <div className="text-2xl ">{movie}</div>
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
                    <textarea
                        rows={loglineRows}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full outline-none bg-transparent text-gray-700 border border-gray-300 p-2 rounded-md"
                        placeholder="Character Description"
                    />
                    <textarea
                        rows={descriptionRows}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full outline-none bg-transparent text-gray-700 border border-gray-300 p-2 rounded-md"
                        placeholder="Notes"
                    />
                    <div className="h-2"></div>
                </CardContent>

                <button
                    type="button"
                    className="absolute bottom-4 right-4 text-black hover:scale-105 transition-all cursor-pointer"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <FontAwesomeIcon icon={faSave} className="text-2xl" />
                </button>
            </Card>
        </div>
    );
}
