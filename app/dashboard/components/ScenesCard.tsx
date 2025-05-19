import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

interface Scene {
    id: string;
    movieId: string | null;
    number: number;
    act: string | null;
    ieFlag: string | null;
    slFlag: string | null;
    type: string | null;
    location: string | null;
    subLocation: string | null;
    weather: string | null;
    time: string | null;
    description: string | null;
    expLength: number | null;
    numExtras: number | null;
    cameraNotes: string | null;
    lightingNotes: string | null;
    soundNotes: string | null;
    colorNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface ScenesCardProps {
    data: {
        longest: Scene[];
        set: number;
        location: number;
        montage: number;
        dialogue: number;
        action: number;
        stunt: number;
    };
}

export default function ScenesCard({ data }: ScenesCardProps) {
    return (
        <Card className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
            <Link
                href="/dashboard/scenes"
                className="absolute group bottom-4 right-4 flex items-center gap-1 text-black hover:scale-105 transition-all"
            >
                <FontAwesomeIcon icon={faUpRightFromSquare} className="text-xl" />
                <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                    Open
                </span>
            </Link>
            <CardHeader>
                <CardTitle className="text-xl font-bold">Scenes Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-y-2 text-gray-700">
                    <p><span className="font-semibold">Set:</span> {data.set}</p>
                    <p><span className="font-semibold">Location:</span> {data.location}</p>
                    <p><span className="font-semibold">Montage:</span> {data.montage}</p>
                    <p><span className="font-semibold">Dialogue:</span> {data.dialogue}</p>
                    <p><span className="font-semibold">Action:</span> {data.action}</p>
                    <p><span className="font-semibold">Stunt:</span> {data.stunt}</p>
                </div>

                <div>
                    <h3 className="font-semibold mt-4">Top 5 Longest Scenes:</h3>
                    {data.longest.length > 0 ? (
                        <ul className="list-disc list-inside text-gray-600">
                            {data.longest.map((scene) => (
                                <li key={scene.number}>
                                    <span className="font-medium">Scene {scene.number}</span> — {scene.description} ({scene.expLength} min)
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 italic">No long scenes available.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
