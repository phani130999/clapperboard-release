import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const CHARACTER_TYPES = [
    { value: "D", label: "Dialogue" },
    { value: "N", label: "No-Dialogue" },
    { value: "O", label: "Off-Screen" },
    { value: "B", label: "Background" },
];

interface Character {
    id: string;
    name: string;
    type: string;
}

interface CharacterDataDialogProps {
    characters: Character[];
    isOpen: boolean;
    onClose: (data: Character[] | null) => void;
    setIsOpen: (open: boolean) => void;
}

export default function CharacterDataDialog({ characters, isOpen, onClose, setIsOpen }: CharacterDataDialogProps) {
    const [selectedCharacters, setSelectedCharacters] = useState<Record<string, string>>({});

    useEffect(() => {
        const initialSelection: Record<string, string> = {};
        characters.forEach(({ id, type }) => {
            if (type) {
                initialSelection[id] = type;
            }
        });
        setSelectedCharacters(initialSelection);
    }, [characters]);

    const handleCheckboxChange = (charId: string) => {
        setSelectedCharacters((prev) => {
            const updated = { ...prev };
            if (updated[charId]) {
                delete updated[charId];
            } else {
                updated[charId] = "D"; // Default to Dialogue
            }
            return updated;
        });
    };

    const handleTypeChange = (charId: string, type: string) => {
        setSelectedCharacters((prev) => ({
            ...prev,
            [charId]: type,
        }));
    };

    const handleDone = () => {
        const mappedCharacters = characters.map(({ id, name }) => ({
            id,
            name,
            type: selectedCharacters[id] || "",
        }));
        onClose(mappedCharacters);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Characters</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {characters.map(({ id, name }) => (
                        <div key={id} className="flex items-center justify-between gap-4">
                            <label
                                htmlFor={`checkbox-${id}`}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <Checkbox
                                    id={`checkbox-${id}`}
                                    checked={!!selectedCharacters[id]}
                                    onCheckedChange={() => handleCheckboxChange(id)}
                                    className="cursor-pointer"
                                />
                                <span>{name}</span>
                            </label>
                            {selectedCharacters[id] && (
                                <select
                                    value={selectedCharacters[id]}
                                    onChange={(e) => handleTypeChange(id, e.target.value)}
                                    className="bg-transparent outline-none border-none w-36"
                                >
                                    {CHARACTER_TYPES.map(({ value, label }) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-white text-gray-700 rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700">Cancel</Button>
                    <Button onClick={handleDone} className="bg-black text-white rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700">Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
