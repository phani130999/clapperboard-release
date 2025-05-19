"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackMenu } from "../../components";

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

export default function EditScene() {
    const [seqNumber, setSeqNumber] = useState("");
    const [sceneId, setSceneId] = useState("");
    const [ieFlag, setIeFlag] = useState("I");
    const [location, setLocation] = useState("");
    const [subLocation, setSubLocation] = useState("");
    const [time, setTime] = useState("");
    const [weather, setWeather] = useState("");
    const [slFlag, setSlFlag] = useState("S");
    const [expLength, setExpLength] = useState("");
    const [description, setDescription] = useState("");
    const [numExtras, setNumExtras] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [movieName, setMovieName] = useState("");
    const [sceneNum, setSceneNum] = useState("");
    const [sceneDesc, setSceneDesc] = useState("");
    const router = useRouter();

    const [textRows, setTextRows] = useState(4);

    useEffect(() => {

        const defaultFetch = async () => {
            const sceneId = sessionStorage.getItem("scene_id");
            setSceneId(sceneId ? sceneId : "");

            fetch(`/api/db/scenes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "GET_SCENE_BY_ID",
                    sceneId: sceneId,
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (!data || !data.number) {
                        throw new Error("Invalid scene data.");
                    }
                    setSceneNum(data.number);
                    setSceneDesc(data.description);
                })
                .catch((error) => {
                    console.error("Error fetching scene details:", error);
                    alert("Failed to fetch scene details. Please try again.");
                });

            const movieName = sessionStorage.getItem("movie_name");
            setMovieName(movieName ? movieName : " ");
        };

        defaultFetch();

        const editMontageId = sessionStorage.getItem("edit_montage_id");

        if (!editMontageId) {
            alert("Montage ID not found. Redirecting...");
            router.push("/dashboard/montages");
            return;
        }

        fetch(`/api/db/montages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "GET_MONTAGE_BY_ID",
                sequenceId: editMontageId,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data || !data.seqNumber) {
                    throw new Error("Invalid sequence data.");
                }
                setSeqNumber(data.seqNumber);
                setIeFlag(data.ieFlag);
                setLocation(data.location);
                setSubLocation(data.subLocation);
                setTime(data.time);
                setWeather(data.weather);
                setSlFlag(data.slFlag);
                setExpLength(data.expLength);
                setDescription(data.description);
                setNumExtras(data.numExtras);
                setNotes(data.notes);
            })
            .catch((error) => {
                console.error("Error fetching sequence details:", error);
                alert("Failed to fetch sequence details. Please try again.");
            });

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
        const editMontageId = sessionStorage.getItem("edit_montage_id");

        try {
            const response = await fetch("/api/db/montages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "EDIT",
                    sequenceId: editMontageId,
                    sequenceData: {
                        sceneId,
                        seqNumber,
                        ieFlag,
                        slFlag,
                        location,
                        subLocation,
                        weather,
                        time,
                        description,
                        expLength,
                        numExtras,
                        notes,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save sequence.");
            }

            router.push("/dashboard/montages");
        } catch (error) {
            console.error("Error saving sequence:", error);
            alert("Failed to save sequence.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6 w-full lg:w-8/12 mx-auto">
            <BackMenu basePath="/dashboard/montages" baseObject="Montages" />
            <div className="block text-center font-semibold">
                <div className="text-3xl">Edit Sequence</div>
                <div className="text-2xl ">{movieName}</div>
            </div>
            <Card className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        {"Scene"} {sceneNum}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        {sceneDesc}
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border border-gray-300 rounded-lg shadow-sm mb-4 relative">
                        <h3 className="text-lg font-bold">
                            Sequence
                            <input
                                type="text"
                                value={seqNumber}
                                onChange={(e) => setSeqNumber(e.target.value)}
                                className="w-12 bg-transparent outline-none border-b border-gray-300 text-center font-bold"
                                placeholder="Num"
                            />.&nbsp;
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
                        </h3>
                        <p className="text-sm text-gray-500">
                            <select
                                value={slFlag}
                                onChange={(e) => setSlFlag(e.target.value)}
                                className="bg-transparent outline-none border-none w-32"
                            >
                                {Object.entries(SL_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select> |
                            <input type="text" value={expLength} onChange={(e) => setExpLength(e.target.value)} className="w-8 bg-transparent outline-none border-b border-gray-300 text-center" /> seconds
                        </p>
                        <br></br>
                        <p className="text-gray-700">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description"
                                rows={textRows}
                                className="w-full outline-none bg-transparent text-gray-700 border border-gray-300 p-2 rounded-md"
                            />
                        </p>
                        <p className="text-gray-600 text-sm">
                            Number of Extras:
                            <input
                                type="text"
                                value={numExtras}
                                onChange={(e) => setNumExtras(e.target.value)}
                                placeholder=""
                                className="w-12 bg-transparent outline-none border-b border-gray-300 text-center ml-2"
                            />
                        </p>
                        <p className="text-gray-600 text-sm flex items-center">
                            Notes: <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder=""
                                className="flex-1 bg-transparent outline-none border-b border-gray-300 text-start ml-2"
                            />
                        </p>
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
