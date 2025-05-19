import { db } from "@/app/db/db";
import { eq, and } from "drizzle-orm";
import { movies, characters, scenes } from "@/app/db/schema";
import { getUserId } from "@/app/api/userInfo";

export const getDefaultMovieId = async () => {
    const userId = await getUserId();
    const defaultMovie = await db.query.movies.findFirst({
        where: and(
            eq(movies.userId, userId),
            eq(movies.defaultFlag, "Y")
        ),
    });
    if (!defaultMovie?.id) {
        throw new Error("No default movie found. Please set a default movie.");
    }
    return defaultMovie.id;
}

export const getDashboardData = async (movieParam : string) => {

    const userId = await getUserId();
    const movie = await db.query.movies.findFirst({
        where: and(
            eq(movies.userId, userId),
            eq(movies.id, movieParam)
        ),
    });

    if (!movie) throw new Error("Movie not found");

    const movieId = movie.id;

    const movieCharacters = await db.query.characters.findMany({
        where: eq(characters.movieId, movieId),
    }) || [];

    const mainCharacters = movieCharacters.filter((char) => char.type === "M");
    const primaryCharacters = movieCharacters.filter((char) => char.type === "P");
    const secondaryCharacters = movieCharacters.filter((char) => char.type === "S");

    const movieScenes = await db.query.scenes.findMany({
        where: eq(scenes.movieId, movieId),
    }) || [];

    const totalScenes = movieScenes.length;
    const setScenes = movieScenes.filter((scene) => scene.slFlag === "S").length || 0;
    const locationScenes = movieScenes.filter((scene) => scene.slFlag === "L").length || 0;
    const montageScenes = movieScenes.filter((scene) => scene.type === "M").length || 0;
    const dialogueScenes = movieScenes.filter((scene) => scene.type === "D").length || 0;
    const actionScenes = movieScenes.filter((scene) => scene.type === "A").length || 0;
    const stuntScenes = movieScenes.filter((scene) => scene.type === "S").length || 0;

    const longestScenes = movieScenes
        ? [...movieScenes]
            .filter((scene) => scene.expLength)
            .sort((a, b) => (b.expLength || 0) - (a.expLength || 0))
            .slice(0, 5)
        : [];

    return {
        movieDetails: {
            title: movie.name,
            logline: movie.logline,
            description: movie.description,
            mainCharacters: mainCharacters.map((char) => char.name) || [],
            sceneCount: totalScenes,
        },
        characters: {
            main: mainCharacters,
            primary: primaryCharacters,
            secondary: secondaryCharacters
        },
        scenes: {
            longest: longestScenes,
            set: setScenes,
            location: locationScenes,
            montage: montageScenes,
            dialogue: dialogueScenes,
            action: actionScenes,
            stunt: stuntScenes
        },
    };
}