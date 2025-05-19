import { db } from "@/app/db/db";
import { movies, characters, scenes, sceneCharMap, montages } from "@/app/db/schema";
import { eq, and, count, or, inArray, sql } from "drizzle-orm";
import { getUserId } from "@/app/api/userInfo";
import { v4 as uuidv4 } from "uuid";

export async function getDefaultMovie() {
    const userId = await getUserId();

    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const movie = await db.query.movies.findFirst({
        where: and(
            eq(movies.userId, userId),
            eq(movies.defaultFlag, "Y")
        ),
        columns: { id: true, name: true }
    });

    if (!movie) {
        throw new Error("No default movie found. Please set a default movie.");
    }

    return movie;
}

export async function updateDefaultMovie(movieId: string) {
    const userId = await getUserId();
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const targetMovie = await db.query.movies.findFirst({
        where: and(
            eq(movies.userId, userId),
            eq(movies.id, movieId)
        ),
        columns: { id: true, defaultFlag: true }
    });

    if (!targetMovie) return false;

    if (targetMovie.defaultFlag === "Y") return true;

    // Use transaction ONLY for updates
    return db.transaction(async (tx) => {
        // Reset the current default movie (if any)
        await tx.update(movies)
            .set({ defaultFlag: "N" })
            .where(and(eq(movies.userId, userId), eq(movies.defaultFlag, "Y")));

        // Set the new default movie
        await tx.update(movies)
            .set({ defaultFlag: "Y" })
            .where(and(eq(movies.id, movieId), eq(movies.userId, userId)));

        return true;
    });
}

export const getUserMovies = async () => {
    const userId = await getUserId();
    const userMovies = await db.query.movies.findMany({
        where: eq(movies.userId, userId),
        columns: { id: true, name: true, defaultFlag: true },
        orderBy: (movies, { desc }) => [desc(movies.createdAt)]
    });
    return userMovies;
}

export const getMovies = async (page: number, limit: number, search: string) => {
    const userId = await getUserId();

    const searchTerm = search.trim().toLowerCase();

    // Fetch movies with necessary fields
    const movieData = await db.query.movies.findMany({
        columns: {
            id: true,
            name: true,
            logline: true,
            description: true,
        },
        where: search.trim()
            ? and(
                eq(movies.userId, userId),
                or(
                    sql`LOWER(${movies.name}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${movies.logline}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${movies.description}) LIKE ${`%${searchTerm}%`}`
                )
            )
            : eq(movies.userId, userId),
        orderBy: (movies, { desc }) => [desc(movies.createdAt)],
        limit: limit,
        offset: (page - 1) * limit
    });

    // Fetch additional details for each movie
    const enrichedMovies = await Promise.all(
        movieData.map(async (movie) => {
            const mainCharacters = await db.query.characters.findMany({
                columns: { name: true },
                where: and(
                    eq(characters.movieId, movie.id),
                    eq(characters.type, "M")
                ),
            });

            const sceneCount = await db
                .select({ count: count() })
                .from(scenes)
                .where(eq(scenes.movieId, movie.id));

            return {
                id: movie.id,
                name: movie.name,
                logline: movie.logline,
                description: movie.description,
                mainCharacters: mainCharacters.map((char) => char.name),
                sceneCount: sceneCount[0]?.count || 0,
            };
        })
    );

    return enrichedMovies;
};

export async function createMovie(movieData: {
    name: string;
    logline?: string;
    description?: string;
}) {

    const { name, logline = "", description = "" } = movieData;
    if (!name.trim()) {
        throw new Error("Movie name is required.");
    }

    const userId = await getUserId();
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    return await db.transaction(async (tx) => {
        // Insert new movie
        const [newMovie] = await tx
            .insert(movies)
            .values({
                id: uuidv4(),
                name: name.trim(),
                logline: logline.trim(),
                description: description.trim(),
                userId: userId
            })
            .returning({ id: movies.id });

        if (!newMovie) {
            throw new Error("Failed to create movie.");
        }

        // Set all existing movies to non-default
        await tx
            .update(movies)
            .set({ defaultFlag: "N" })
            .where(and(eq(movies.userId, userId), eq(movies.defaultFlag, "Y")));

        // Set the newly created movie as default
        await tx
            .update(movies)
            .set({ defaultFlag: "Y" })
            .where(and(eq(movies.id, newMovie.id), eq(movies.userId, userId)));

        return newMovie;
    });
}

export const getMovieById = async (movieId: string) => {
    const userId = await getUserId();
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const movieDetails = await db.query.movies.findFirst({
        where: and(
            eq(movies.userId, userId),
            eq(movies.id, movieId)
        ),
        columns: { name: true, logline: true, description: true }
    });

    return movieDetails;

}

export async function editMovie(movieId: string, movieData: {
    name: string;
    logline?: string;
    description?: string;
}) {

    const { name, logline = "", description = "" } = movieData;
    if (!name.trim()) {
        throw new Error("Movie name is required.");
    }

    const userId = await getUserId();
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const existingMovie = await db.query.movies.findFirst({
        where: and(eq(movies.id, movieId), eq(movies.userId, userId))
    });

    if (!existingMovie) {
        throw new Error("Movie not found or unauthorized.");
    }

    return await db.transaction(async (tx) => {
        // Update movie details
        const [updatedMovie] = await tx
            .update(movies)
            .set({
                name: name.trim(),
                logline: logline.trim(),
                description: description.trim()
            })
            .where(and(eq(movies.id, movieId), eq(movies.userId, userId)))
            .returning({ id: movies.id });

        if (!updatedMovie) {
            throw new Error("Failed to update movie.");
        }

        // Set all existing movies to non-default
        await tx
            .update(movies)
            .set({ defaultFlag: "N" })
            .where(and(eq(movies.userId, userId), eq(movies.defaultFlag, "Y")));

        // Set the edited movie as default
        await tx
            .update(movies)
            .set({ defaultFlag: "Y" })
            .where(and(eq(movies.id, updatedMovie.id), eq(movies.userId, userId)));

        return updatedMovie;
    });
}

export const deleteMovie = async (movieId: string) => {
    const userId = await getUserId();
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const movieToDelete = await db.query.movies.findFirst({
        where: and(eq(movies.id, movieId), eq(movies.userId, userId)),
        columns: { defaultFlag: true }
    });

    if (!movieToDelete) {
        throw new Error("Movie not found or unauthorized.");
    }

    const { defaultFlag } = movieToDelete;

    // Step 2: Get Scene IDs for this movie
    const sceneIds = await db.query.scenes.findMany({
        where: eq(scenes.movieId, movieId),
        columns: { id: true }
    });

    const sceneIdList = sceneIds.map(scene => scene.id);

    return await db.transaction(async (tx) => {
        // Step 1: Delete related records in cascade order
        if (sceneIdList.length > 0) {
            await tx.delete(montages).where(inArray(montages.sceneId, sceneIdList));
            await tx.delete(sceneCharMap).where(inArray(sceneCharMap.sceneId, sceneIdList));
        }

        await tx.delete(characters).where(eq(characters.movieId, movieId));
        await tx.delete(scenes).where(eq(scenes.movieId, movieId));
        await tx.delete(movies).where(eq(movies.id, movieId));

        // Step 2: If deleted movie had DEFAULT_FLAG = 'Y', assign a new default movie
        if (defaultFlag === "Y") {
            const latestMovie = await tx.query.movies.findFirst({
                where: eq(movies.userId, userId),
                orderBy: (movies, { desc }) => [desc(movies.createdAt)],
                columns: { id: true }
            });

            if (latestMovie) {
                await tx.update(movies)
                    .set({ defaultFlag: "Y" })
                    .where(eq(movies.id, latestMovie.id));
            }
        }

        return { success: true, message: "Movie deleted successfully." };
    });
};