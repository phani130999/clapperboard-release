import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

interface Character {
    id: string;
    movieId: string | null;
    name: string;
    gender: string;
    lowerAge?: number | null;
    upperAge?: number | null;
    type: string;
    description?: string | null;
    expScreenTime?: number | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface CharactersCardProps {
    data: {
        main: Character[];
        primary: Character[];
        secondary: Character[];
    };
}

export default function CharactersCard({ data }: CharactersCardProps) {
    return (
        <Card className="p-4 rounded-2xl shadow-md border border-gray-300 relative">
            <Link
                href="/dashboard/characters"
                className="absolute group bottom-4 right-4 flex items-center gap-1 text-black hover:scale-105 transition-all"
            >
                <FontAwesomeIcon icon={faUpRightFromSquare} className="text-xl" />
                <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                    Open
                </span>
            </Link>
            <CardHeader>
                <CardTitle className="text-xl font-bold">Characters Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {[
                    { label: "Main Characters", characters: data.main },
                    { label: "Primary Characters", characters: data.primary },
                    { label: "Secondary Characters", characters: data.secondary }
                ].map(({ label, characters }) => (
                    <div key={label}>
                        <h3 className="font-semibold">{label}:</h3>
                        {characters.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-600">
                                {characters.map((char) => (
                                    <li key={char.name}>{char.name} - {char.description} - {char.notes}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 italic">No {label.toLowerCase()} listed.</p>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
