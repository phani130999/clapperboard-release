import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

interface InformationCardProps {
    data: {
        title: string;
        logline: string | null;
        description: string | null;
        mainCharacters: string[];
        sceneCount: number;
    };
}

export default function InformationCard({ data }: InformationCardProps) {
    return (
        <Card className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
            <Link
                href="/dashboard/movies"
                className="absolute group bottom-4 right-4 flex items-center gap-1 text-black hover:scale-105 transition-all"
            >
                <FontAwesomeIcon icon={faUpRightFromSquare} className="text-xl" />
                <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                    Open
                </span>
            </Link>
            <CardHeader>
                <CardTitle className="text-2xl font-bold">
                    {data.title}
                </CardTitle>
                <p className="text-sm text-gray-500">{data.logline}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-gray-700">{data.description}</p>
                <div>
                    <h3 className="font-semibold">Main Characters:</h3>
                    {data.mainCharacters.length > 0 ? (
                        <ul className="list-disc list-inside text-gray-600">
                            {data.mainCharacters.map((character) => (
                                <li key={character}>{character}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 italic">No main characters listed.</p>
                    )}
                </div>
                <p className="text-gray-700 font-semibold">Total Scenes: {data.sceneCount}</p>
            </CardContent>
        </Card>
    );
};
