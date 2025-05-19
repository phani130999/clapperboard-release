"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { LoadingElement, NoDataElement } from "../components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define entity fields and their types
const entityFields: Record<string, { label: string; type: "text" | "select" }[]> = {
    Movies: [
        { label: "Name", type: "text" },
        { label: "Logline", type: "text" },
        { label: "Description", type: "text" }
    ],
    Characters: [
        { label: "Movie", type: "text" },
        { label: "Name", type: "text" },
        { label: "Description", type: "text" },
        { label: "Gender", type: "select" },
        { label: "Age", type: "select" },
        { label: "Type", type: "select" },
        { label: "Screen Time", type: "select" },
        { label: "Notes", type: "text"}
    ],
    Scenes: [
        { label: "Movie", type: "text" },
        { label: "Character", type: "text" },
        { label: "Number", type: "text" },
        { label: "Description", type: "text" },
        { label: "Act", type: "text" },
        { label: "Int Ext", type: "select" },
        { label: "Set Loc", type: "select" },
        { label: "Type", type: "select" },
        { label: "Location", type: "text" },
        { label: "Sublocation", type: "text" },
        { label: "Weather", type: "text" },
        { label: "Time", type: "text" },
        { label: "Length", type: "select" },
        { label: "Extras", type: "select" },
        { label: "Relevance", type: "select" },
        { label: "Cost", type: "select" },
        { label: "Notes", type: "text" }
    ],
    Montages: [
        { label: "Movie", type: "text" },
        { label: "Scene Number", type: "text" },
        { label: "Description", type: "text" },
        { label: "Int Ext", type: "select" },
        { label: "Set Loc", type: "select" },
        { label: "Location", type: "text" },
        { label: "Sublocation", type: "text" },
        { label: "Weather", type: "text" },
        { label: "Time", type: "text" },
        { label: "Length", type: "select" },
        { label: "Extras", type: "select" },
        { label: "Notes", type: "text" }
    ]
};

// Define dropdown options for LOV fields
const fieldOptions = (entity: string, field: string): string[] => {
    const normalizedField = field.replace(/\W+/g, "_");

    const options: Record<string, Record<string, string[]>> = {
        Characters: {
            Gender: ["Male", "Female", "Other"],
            Age: ["< 10", "10 - 20", "20 - 30", "30 - 40", "40 - 50", "50 - 60", "60 - 70", "70 - 80", "80 - 90", "> 90"],
            Type: ["Main", "Primary", "Secondary", "Tertiary", "Other"],
            Screen_Time: ["< 5 min", "5 - 10 min", "10 - 20 min", "20 - 40 min", "40 - 80 min", "> 80 min"]
        },
        Scenes: {
            Int_Ext: ["INT.", "EXT.", "INT./EXT."],
            Set_Loc: ["Set", "Location", "Set/Location"],
            Type: ["Dialogue", "Action", "Balanced", "Montage", "Title", "Stunt", "Graphical", "Others"],
            Length: ["< 1 min", "1 - 3 min", "3 - 5 min", "5 - 10 min", "10 - 20 min", "> 20 min"],
            Extras: ["< 5", "5 - 10", "10 - 20", "20 - 40", "40 - 80", "> 80"],
            Relevance: ["Must-have", "Good-to-have", "Value-addition", "Filler", "Unimportant"],
            Cost: ["Inexpensive", "Reasonably-expensive", "Moderately-expensive", "Very-expensive", "Extremely-expensive"]
        },
        Montages: {
            Int_Ext: ["INT.", "EXT.", "INT./EXT."],
            Set_Loc: ["Set", "Location", "Set/Location"],
            Length: ["< 10 seconds", "10 - 20 seconds", "20 - 30 seconds", "30 - 40 seconds", "40 - 50 seconds", "> 50 seconds"],
            Extras: ["< 5", "5 - 10", "10 - 20", "20 - 40", "40 - 80", "> 80"]
        }
    };

    return options[entity]?.[normalizedField] || [];
};

const genderLabels: Record<string, string> = {
    M: "Male",
    F: "Female",
    O: "Other"
};

interface SceneListProps {
    scenes: Pick<Scene, "id" | "number" | "description" | "expLength">[];
}

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

interface SceneCharacter {
    id: string;
    name: string;
    description: string;
    type: string;
}

interface Filter {
    field: string;
    value: string;
}

interface Movie {
    id: string;
    name: string;
    userId: string | null;
    logline: string | null;
    description: string | null;
    defaultFlag: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Enriched fields
    mainCharacters?: string[]; // Names of main characters
    sceneCount?: number;
}

interface Character {
    id: string;
    movieId: string | null;
    name: string;
    gender: string;
    lowerAge: number | null;
    upperAge: number | null;
    type: string;
    description: string | null;
    expScreenTime: number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Enriched fields
    movieName?: string | null;
    scenes?: Pick<Scene, "id" | "number" | "description" | "expLength">[];
}

interface Scene {
    id: string;
    movieId: string | null;
    number: number;
    act?: string | null;
    ieFlag?: string | null;
    slFlag?: string | null;
    type?: string | null;
    location?: string | null;
    subLocation?: string | null;
    weather?: string | null;
    time?: string | null;
    description?: string | null;
    expLength?: number | null;
    numExtras?: number | null;
    cameraNotes?: string | null;
    lightingNotes?: string | null;
    soundNotes?: string | null;
    colorNotes?: string | null;
    propNotes?: string | null;
    otherNotes?: string | null;
    relevanceQuotient?: string | null;
    costquotient?: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Enriched fields
    characters?: (Pick<Character, "id" | "name" | "description"> & { type: string })[];
    movieName?: string | null;
}

interface Montage {
    id: string;
    sceneId: string | null;
    seqNumber: number;
    ieFlag?: string | null;
    slFlag?: string | null;
    location?: string | null;
    subLocation?: string | null;
    weather?: string | null;
    time?: string | null;
    description?: string | null;
    expLength?: number | null;
    numExtras?: number | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Enriched fields
    sceneNumber?: number | null;
    sceneDescription?: string | null;
    movieName?: string | null;
}

type SearchResultType =
    | { entity: "Movies"; results: Movie[] }
    | { entity: "Characters"; results: Character[] }
    | { entity: "Scenes"; results: Scene[] }
    | { entity: "Montages"; results: Montage[] }
    | { entity: ""; results: [] };

export default function SearchPanel() {
    const [entity, setEntity] = useState<string>("");
    const [filters, setFilters] = useState<Filter[]>([]);
    const [showDialog, setShowDialog] = useState(false);

    const [searchResults, setSearchResults] = useState<SearchResultType>({
        entity: "",
        results: [],
    });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);

    const { ref, inView } = useInView({ threshold: 0.5 });

    useEffect(() => {
        handleReset(); // Mimic reset on first load
    }, []);

    useEffect(() => {
        if (inView && hasMore && !loading && searchResults && searchResults.results.length > 0) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [inView, hasMore, loading]);

    useEffect(() => {
        if (page > 1) {
            handleSearch(true); // Pass `true` to indicate pagination
        }
    }, [page]);

    const handleEntityChange = (newEntity: string) => {
        const firstField = entityFields[newEntity][0].label;
        const firstValue = fieldOptions(entity, firstField)?.[0] || ""; // Select first value if dropdown
        setEntity(newEntity);
        setFilters([{ field: firstField, value: firstValue }]);
    };

    const addFilter = () => {
        if (entity) {
            const firstField = entityFields[entity][0].label;
            const firstValue = fieldOptions(entity, firstField)?.[0] || ""; // Handle dropdown selection
            setFilters([...filters, { field: firstField, value: firstValue }]);
        }
    };

    const updateFilter = (index: number, key: keyof Filter, newValue: string) => {
        const newFilters = [...filters];

        if (key === "field") {
            const firstValue = fieldOptions(entity, newValue)?.[0] || "";
            newFilters[index] = { field: newValue, value: firstValue };
        } else {
            newFilters[index][key] = newValue;
        }

        setFilters(newFilters);
    };

    const removeFilter = (index: number) => {
        setFilters(filters.filter((_, i) => i !== index));
    };

    const handleSearch = async (isPagination: boolean) => {

        const hasValidFilter = filters.some(({ value }) => value.trim() !== "");
        if (!entity || !hasValidFilter) {
            setShowDialog(true);
            handleReset();
            return;
        }

        if (loading) return;
        setFirstLoad(false);

        // Reset page to 1 if it's a new search
        if (!isPagination) {
            setSearchResults({ entity: "", results: [] });
            setPage(1);
            setHasMore(false);
            setLoading(false);
        }

        setLoading(true);
        try {
            const response = await fetch("/api/db/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity,
                    filters,
                    page: isPagination ? page : 1, // Use the current page for pagination, else reset to 1
                    limit: 5,
                }),
            });

            if (!response.ok) {
                throw new Error(`Search API Error: ${response.statusText}`);
            }

            const data = await response.json();

            setSearchResults((prevResults) => ({
                entity: data.results.entity,
                results: isPagination ? [...(prevResults?.results ?? []), ...(data.results.enrichedResults ?? [])] : data.results.enrichedResults ?? [],
            }));

            setHasMore(Array.isArray(data.results.enrichedResults) && data.results.enrichedResults.length === 5); // If less than 5 results, no more pages
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        const defaultEntity = "Movies";
        const firstField = entityFields[defaultEntity][0].label;
        const firstValue = fieldOptions(entity, firstField)?.[0] || ""; // Handle dropdown selection
        setEntity(defaultEntity);
        setFilters([{ field: firstField, value: firstValue }]);
        setSearchResults({ entity: "", results: [] });
        setPage(1);
        setHasMore(false);
        setLoading(false);
        setFirstLoad(true);
    };

    return (
        <div className="space-y-6 p-6 w-full lg:w-8/12 mx-auto">
            <div className="block text-3xl text-center font-semibold">Search</div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invalid Search</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-700">
                        Please enter at least one search criterion!
                    </p>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button
                            onClick={() => setShowDialog(false)}
                            className="bg-black text-white rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700"
                        >
                            Ok
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Card className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Search for</CardTitle>
                    <select
                        className="w-50 p-2 rounded-md"
                        value={entity}
                        onChange={(e) => handleEntityChange(e.target.value)}
                    >
                        {Object.keys(entityFields).map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </CardHeader>
                <CardContent className="space-y-2">
                    {filters.map((filter, index) => {
                        const fieldType = entityFields[entity].find(f => f.label === filter.field)?.type || "text";

                        // Common keydown handler for "Enter" key
                        const handleKeyDown = (e: React.KeyboardEvent) => {
                            if (e.key === "Enter") {
                                e.preventDefault(); // Prevent default form submission behavior
                                handleSearch(false);
                            }
                        };

                        return (
                            <div key={index} className="flex items-center space-x-4">
                                <select
                                    className="w-40 p-2 border border-gray-300 rounded-md text-xs md:text-sm"
                                    value={filter.field}
                                    onChange={(e) => updateFilter(index, "field", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                >
                                    {entityFields[entity]?.map(({ label }) => (
                                        <option key={label} value={label}>{label}</option>
                                    ))}
                                </select>

                                {/* Conditionally render input or dropdown based on field type */}
                                {fieldType === "select" ? (
                                    <select
                                        className="p-2 border border-gray-300 rounded-md flex-1 text-xs md:text-sm"
                                        value={filter.value}
                                        onChange={(e) => updateFilter(index, "value", e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    >
                                        {fieldOptions(entity, filter.field)?.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        className="p-2 border border-gray-300 rounded-md flex-1 text-xs md:text-sm"
                                        value={filter.value}
                                        onChange={(e) => updateFilter(index, "value", e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Enter value"
                                    />
                                )}

                                <Button variant="outline" onClick={() => removeFilter(index)} className="cursor-pointer">
                                    <Trash2 size={20} className="text-black" />
                                </Button>
                            </div>
                        );
                    })}
                    <div>
                        <Button variant="outline" onClick={addFilter} disabled={!entity} className="cursor-pointer">
                            <PlusCircle className="mr-2" size={18} /> Add Filter
                        </Button>
                    </div>
                    <div className="flex items-end gap-4 justify-end">
                        <Button variant="outline" onClick={handleReset} className="bg-white text-gray-700 rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700">Reset</Button>
                        <Button onClick={() => handleSearch(false)} className="bg-black text-white rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700">Search</Button>
                    </div>
                </CardContent>
            </Card>

            {searchResults && Array.isArray(searchResults.results) && searchResults.results.length > 0 && <div className="block text-3xl text-center font-semibold">Search Results</div>}

            {searchResults && Array.isArray(searchResults.results) && searchResults.results.length > 0 && searchResults.results.map((commonResult, index) => {
                switch (searchResults.entity) {
                    case "Movies":
                        const movieResult = commonResult as Movie;
                        return (
                            <Card key={index} className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">{movieResult.name}</CardTitle>
                                    <p className="text-sm text-gray-500">{movieResult.logline}</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-700">{movieResult.description}</p>
                                    <div>
                                        <h3 className="font-semibold">Main Characters:</h3>
                                        {movieResult.mainCharacters && movieResult.mainCharacters.length > 0 ? (
                                            <ul className="list-disc list-inside text-gray-600">
                                                {movieResult.mainCharacters.map((character: string) => (
                                                    <li key={character}>{character}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-400 italic">No main characters listed.</p>
                                        )}
                                    </div>
                                    <p className="text-gray-700 font-semibold">Total Scenes: {movieResult.sceneCount}</p>
                                </CardContent>
                            </Card>
                        );
                    case "Characters":
                        const characterResult = commonResult as Character;
                        return (
                            <Card key={index} className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">{characterResult.name} | {characterResult.movieName}</CardTitle>
                                    <p className="text-sm text-gray-500">
                                        {genderLabels[characterResult.gender] || "Unknown"} | Age: {characterResult.lowerAge}-{characterResult.upperAge}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-700">{characterResult.description}</p>
                                    <p className="text-gray-700 font-semibold">Expected Screen Time: {characterResult.expScreenTime} mins</p>

                                    <div>
                                        <h3 className="font-semibold">Scenes:</h3>
                                        {characterResult.scenes && characterResult.scenes.length > 0 ? (
                                            <SceneList scenes={characterResult.scenes} />
                                        ) : (
                                            <p className="text-gray-400 italic">No associated scenes.</p>
                                        )}
                                    </div>

                                    {characterResult.notes && <p className="text-gray-500 italic">Notes: {characterResult.notes}</p>}
                                </CardContent>
                            </Card>
                        );
                    case "Scenes":
                        const sceneResult = commonResult as Scene;
                        return (
                            <Card key={index} className="p-4 rounded-2xl shadow-md border border-gray-300 relative">        
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">
                                        {sceneResult.movieName} | {sceneResult.number}.&nbsp; {IE_LABELS[sceneResult.ieFlag ?? ""] || sceneResult.ieFlag}{" "} {sceneResult.location} {sceneResult.subLocation ? `/ ${sceneResult.subLocation}` : ""} - {sceneResult.time} - {sceneResult.weather}
                                    </CardTitle>
                                    <p className="text-sm text-gray-500">
                                        Act {sceneResult.act} | {SL_LABELS[sceneResult.slFlag ?? ""] || sceneResult.slFlag} | {TYPE_LABELS[sceneResult.type ?? ""] || sceneResult.type} | {sceneResult.expLength} min | {RELEVANCE_LABELS[sceneResult.relevanceQuotient ?? ""] || sceneResult.relevanceQuotient} | {COST_LABELS[sceneResult.costquotient ?? ""] || sceneResult.costquotient}
                                    </p>
                                </CardHeader>
        
                                <CardContent className="space-y-4">
                                    <p className="text-gray-700">{sceneResult.description}</p>
        
                                    {/* Characters */}
                                    <div>
                                        <h3 className="font-semibold">Characters:</h3>
                                        {sceneResult.characters && sceneResult.characters.length > 0 ? (
                                            <div className="pl-5 text-gray-600 text-sm space-y-1">
                                                {CHARACTER_TYPES.map(({ value, label }) => {
                                                    const filteredCharacters = (sceneResult.characters as SceneCharacter[])?.
                                                        filter((character: SceneCharacter) => character.type === value).
                                                        map((character: SceneCharacter) => character.name) ?? [];
        
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
                                            <li>Number of Extras: {sceneResult.numExtras}</li>
                                            <li>Camera: {sceneResult.cameraNotes}</li>
                                            <li>Lighting: {sceneResult.lightingNotes}</li>
                                            <li>Sound: {sceneResult.soundNotes}</li>
                                            <li>Color: {sceneResult.colorNotes}</li>
                                            <li>Props: {sceneResult.propNotes}</li>
                                            <li>Other: {sceneResult.otherNotes}</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>                        
                        );
                    case "Montages":
                        const montageResult = commonResult as Montage;
                        return (
                            <Card key={index} className="p-4 rounded-2xl shadow-md border border-gray-300 mb-6 relative">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">
                                        {montageResult.movieName} | {"Scene"} {montageResult.sceneNumber} | {"Sequence"} {montageResult.seqNumber}
                                    </CardTitle>
                                    <p className="text-sm text-gray-500">
                                        {montageResult.sceneDescription}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 border border-gray-300 rounded-lg shadow-sm mb-4 relative">
                                        <h3 className="text-lg font-bold">
                                            Sequence {montageResult.seqNumber}.&nbsp;
                                            {IE_LABELS[montageResult.ieFlag ?? ""] || montageResult.ieFlag}{" "}
                                            {montageResult.location} {montageResult.subLocation ? `/ ${montageResult.subLocation}` : ""} - {montageResult.time} - {montageResult.weather}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {SL_LABELS[montageResult.slFlag ?? ""] || montageResult.slFlag} | {montageResult.expLength} seconds
                                        </p>
                                        <p className="text-gray-700">{montageResult.description}</p>
                                        <p className="text-gray-600 text-sm">Number of Extras: {montageResult.numExtras}</p>
                                        <p className="text-gray-600 text-sm">Notes: {montageResult.notes}</p>
                                    </div>
                                </CardContent>
                            </Card>                    
                        );
                    default:
                        return null;
                }
            })}

            {(loading || hasMore) && <LoadingElement />}
            {!loading && searchResults && searchResults.results.length === 0 && !hasMore && !firstLoad && <NoDataElement />}

            {hasMore && <div ref={ref} className="h-10"></div>}

        </div>
    );
}
