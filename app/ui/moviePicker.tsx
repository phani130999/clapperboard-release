"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import { useMovie } from "@/app/ui/movieContext";

export default function MoviePickerDialog({
    open,
    onClose,
    movies,
    selectedMovieId,
    setSelectedMovieId
}: {
    open: boolean;
    onClose: () => void;
    movies: Array<{ id: string; name: string; defaultFlag: string | null }>;
    selectedMovieId: string | null;
    setSelectedMovieId: (id: string | null) => void;
}) {

    const router = useRouter();
    const { setMovieChangeFlag } = useMovie();

    const handleMovieChange = async (movieId: string) => {
        if (movieId === selectedMovieId) return;

        try {
            const response = await fetch("/api/db/movies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "UPDATE_DEFAULT", movieId })
            });

            if (!response.ok) throw new Error("Failed to update default movie");
            setSelectedMovieId(movieId);
            setMovieChangeFlag(movieId);

            onClose();
            setTimeout(() => router.refresh(), 200);
        } catch (error) {
            console.error("Error updating default movie:", error);
            alert("Failed to update default movie. Please try again.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pick a Movie</DialogTitle>
                </DialogHeader>

                <RadioGroup
                    value={selectedMovieId?.toString()}
                    onValueChange={(val) => handleMovieChange(val)}
                >
                    {movies.map((movie) => (
                        <div key={String(movie.id)} className="flex items-center space-x-2 my-2">
                            <RadioGroupItem
                                value={movie.id.toString()}
                                id={`movie-${movie.id}`}
                            />
                            <label htmlFor={`movie-${movie.id}`} className="cursor-pointer">
                                {movie.name}
                            </label>
                        </div>
                    ))}
                </RadioGroup>

                <div className="flex justify-end space-x-2">
                    <Button onClick={onClose} className="bg-black text-white rounded-md text-sm cursor-pointer hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-md shadow-gray-500 hover:shadow-lg hover:shadow-gray-700">Cancel</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
