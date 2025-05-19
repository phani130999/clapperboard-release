"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackMenu } from "../../components";
import { useMovie } from "@/app/ui/movieContext";
import { Button } from "@/components/ui/button";
import CharacterDataDialog from "@/app/ui/characterDataDialog";

interface Character {
    id: string;
    name: string;
    type: string;
}

const fetchDefaultMovie = async () => {
    const response = await fetch(`/api/db/movies?default=true`);
    if (!response.ok) throw new Error("Failed to fetch default movie");
    const movie = await response.json();
    return movie.name;
};

const fetchDefaultMovieId = async () => {
    const response = await fetch(`/api/db/movies?default=true`);
    if (!response.ok) throw new Error("Failed to fetch default movie");
    const movie = await response.json();
    return movie.id;
};

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
    V: "Value-addition",
    F: "Filler",
    U: "Unimportant"
};

const COST_LABELS: Record<string, string> = {
    I: "Inexpensive",
    R: "Reasonably-expensive",
    M: "Moderately-expensive",
    V: "Very-expensive",
    E: "Extremely-expensive",
};

export default function CreateScene() {
    const [number, setNumber] = useState("");
    const [ieFlag, setIeFlag] = useState("I");
    const [location, setLocation] = useState("");
    const [subLocation, setSubLocation] = useState("");
    const [time, setTime] = useState("");
    const [weather, setWeather] = useState("");
    const [act, setAct] = useState("");
    const [slFlag, setSlFlag] = useState("S");
    const [type, setType] = useState("D");
    const [expLength, setExpLength] = useState("");
    const [relevanceQuotient, setRelevanceQuotient] = useState("M");
    const [costquotient, setCostquotient] = useState("I");
    const [description, setDescription] = useState("");
    const [numExtras, setNumExtras] = useState("");
    const [cameraNotes, setCameraNotes] = useState("");
    const [lightingNotes, setLightingNotes] = useState("");
    const [soundNotes, setSoundNotes] = useState("");
    const [colorNotes, setColorNotes] = useState("");
    const [propNotes, setPropNotes] = useState("");
    const [otherNotes, setOtherNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [defaultMovie, setDefaultMovie] = useState("");
    const router = useRouter();
    const { movieChangeFlag } = useMovie();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [charactersData, setCharactersData] = useState<Character[]>([]);

    const [textRows, setTextRows] = useState(4);

    const fetchSceneCharacters = async () => {

        try {
            const response = await fetch("/api/db/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "GET_SCENE_CHARACTERS",
                    movieId: await fetchDefaultMovieId(),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch characters");
            }

            const characters = await response.json();
            setCharactersData(characters); // Update state with fetched characters
        } catch (error) {
            console.error("Error fetching characters:", error);
        }
    };

    useEffect(() => {

        fetchSceneCharacters();

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

    useEffect(() => {
        const fetchMovie = async () => {
            const movie = await fetchDefaultMovie();
            setDefaultMovie(movie);
        };

        fetchMovie();
        fetchSceneCharacters();

    }, [movieChangeFlag]);

    const handleSave = async () => {
        setSaving(true);

        try {
            const response = await fetch("/api/db/scenes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "CREATE",
                    sceneData: {
                        number,
                        act,
                        ieFlag,
                        slFlag,
                        type,
                        location,
                        subLocation,
                        weather,
                        time,
                        description,
                        expLength,
                        numExtras,
                        cameraNotes,
                        lightingNotes,
                        soundNotes,
                        colorNotes,
                        propNotes,
                        otherNotes,
                        relevanceQuotient,
                        costquotient,
                        charactersData,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save scene.");
            }

            router.push("/dashboard/scenes");
        } catch (error) {
            console.error("Error saving scene:", error);
            alert("Failed to save scene.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6 w-full lg:w-8/12 mx-auto">
            <BackMenu basePath="/dashboard/scenes" baseObject="Scene" />
            <div className="block text-center font-semibold">
                <div className="text-3xl">Create a Scene</div>
                <div className="text-2xl ">{defaultMovie}</div>
            </div>
            <Card className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        <input
                            type="text"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            className="w-12 bg-transparent outline-none border-b border-gray-300 text-center font-bold"
                            placeholder="Num"
                        />
                        .&nbsp;
                        <select
                            value={ieFlag}
                            onChange={(e) => setIeFlag(e.target.value)}
                            className="bg-transparent outline-none border-none w-40"
                        >
                            {Object.entries(IE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        &nbsp;
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Location"
                            className="bg-transparent outline-none border-b border-gray-300 w-40 text-center"
                        />
                        &nbsp;/&nbsp;
                        <input
                            type="text"
                            value={subLocation}
                            onChange={(e) => setSubLocation(e.target.value)}
                            placeholder="Sublocation"
                            className="bg-transparent outline-none border-b border-gray-300 w-40 text-center"
                        />
                        &nbsp;-&nbsp;
                        <input
                            type="text"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            placeholder="Time"
                            className="bg-transparent outline-none border-b border-gray-300 w-32 text-center"
                        />
                        &nbsp;-&nbsp;
                        <input
                            type="text"
                            value={weather}
                            onChange={(e) => setWeather(e.target.value)}
                            placeholder="Weather"
                            className="bg-transparent outline-none border-b border-gray-300 w-32 text-center"
                        />
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        Act <input type="text" value={act} onChange={(e) => setAct(e.target.value)} className="text-center w-8 bg-transparent outline-none border-b border-gray-300" placeholder="Num" /> |
                        <select
                            value={slFlag}
                            onChange={(e) => setSlFlag(e.target.value)}
                            className="bg-transparent outline-none border-none w-32"
                        >
                            {Object.entries(SL_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select> |
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="bg-transparent outline-none border-none w-32"
                        >
                            {Object.entries(TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select> |
                        <input type="text" value={expLength} onChange={(e) => setExpLength(e.target.value)} className="w-8 bg-transparent outline-none border-b border-gray-300 text-center" /> min |
                        <select
                            value={relevanceQuotient}
                            onChange={(e) => setRelevanceQuotient(e.target.value)}
                            className="bg-transparent outline-none border-none w-40"
                        >
                            {Object.entries(RELEVANCE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select> |
                        <select
                            value={costquotient}
                            onChange={(e) => setCostquotient(e.target.value)}
                            className="bg-transparent outline-none border-none w-48"
                        >
                            {Object.entries(COST_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-700">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Scene Description"
                            rows={textRows}
                            className="w-full outline-none bg-transparent text-gray-700 border border-gray-300 p-2 rounded-md"
                        />
                    </p>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-black text-white rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700"
                    >
                        Characters
                    </Button>
                    <CharacterDataDialog
                        characters={charactersData}
                        isOpen={dialogOpen}
                        setIsOpen={setDialogOpen}
                        onClose={(updatedCharacters) => {
                            if (updatedCharacters) {
                                setCharactersData(updatedCharacters);
                            }
                        }}
                    />
                    <div>
                        <h3 className="font-semibold">Notes:</h3>
                        <ul className="list-none pl-5 list-inside text-gray-600 text-sm">
                            <li>
                                Number of Extras:
                                <input
                                    type="text"
                                    value={numExtras}
                                    onChange={(e) => setNumExtras(e.target.value)}
                                    placeholder=""
                                    className="w-12 bg-transparent outline-none border-b border-gray-300 text-center ml-2"
                                />
                            </li>
                            <li className="flex items-center">
                                Camera: <input
                                type="text"
                                value={cameraNotes}
                                onChange={(e) => setCameraNotes(e.target.value)}
                                placeholder=""
                                className="flex-1 bg-transparent outline-none border-b border-gray-300 text-start ml-2"
                            /></li>
                            <li className="flex items-center">
                                Lighting: <input
                                type="text"
                                value={lightingNotes}
                                onChange={(e) => setLightingNotes(e.target.value)}
                                placeholder=""
                                className="flex-1 bg-transparent outline-none border-b border-gray-300 text-start ml-2"
                            /></li>
                            <li className="flex items-center">
                                Sound: <input
                                type="text"
                                value={soundNotes}
                                onChange={(e) => setSoundNotes(e.target.value)}
                                placeholder=""
                                className="flex-1 bg-transparent outline-none border-b border-gray-300 text-start ml-2"
                            /></li>
                            <li className="flex items-center">
                                Color: <input
                                type="text"
                                value={colorNotes}
                                onChange={(e) => setColorNotes(e.target.value)}
                                placeholder=""
                                className="flex-1 bg-transparent outline-none border-b border-gray-300 text-start ml-2"
                            /></li>
                            <li className="flex items-center">
                                Props: <input
                                type="text"
                                value={propNotes}
                                onChange={(e) => setPropNotes(e.target.value)}
                                placeholder=""
                                className="flex-1 bg-transparent outline-none border-b border-gray-300 text-start ml-2"
                            /></li>
                            <li className="flex items-center">
                                Other: <input
                                type="text"
                                value={otherNotes}
                                onChange={(e) => setOtherNotes(e.target.value)}
                                placeholder=""
                                className="flex-1 bg-transparent outline-none border-b border-gray-300 text-start ml-2"
                            /></li>
                        </ul>
                    </div>
                    <div className="h-6"></div>
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
