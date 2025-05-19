import { db } from "@/app/db/db";
import { characters, scenes, sceneCharMap } from "@/app/db/schema";
import { eq, and, or, inArray, sql, asc } from "drizzle-orm";
import { getDefaultMovie } from "./moviesActions";
import { v4 as uuidv4 } from "uuid";

export const getSceneCharacters = async (movieId: string | null, sceneId: string | null) => {

    if (!movieId && !sceneId) {
        throw new Error("Missing movieId and sceneId");
    }

    // If movieId is null, retrieve it from the scenes table
    if (!movieId && sceneId) {
        const scene = await db
            .select({ movieId: scenes.movieId })
            .from(scenes)
            .where(eq(scenes.id, sceneId))
            .limit(1);

        movieId = scene[0]?.movieId || null;

        if (!movieId) {
            throw new Error("MovieId not found for the given SceneId");
        }
    }

    // Fetch all characters for the movie
    const movieCharacters = await db
        .select({ id: characters.id, name: characters.name })
        .from(characters)
        .where(eq(characters.movieId, movieId as string));

    // If sceneId is null, return all characters with empty type
    if (!sceneId) {
        return movieCharacters.map(({ id, name }) => ({
            id,
            name,
            type: "",
        }));
    }

    // Fetch character mappings for the scene
    const sceneCharacterMappings = await db
        .select({ charId: sceneCharMap.charId, type: sceneCharMap.type })
        .from(sceneCharMap)
        .where(eq(sceneCharMap.sceneId, sceneId));

    // Create a Map for quick lookups, filtering out null charIds
    const typeMap = new Map<string, string>();
    sceneCharacterMappings.forEach(({ charId, type }) => {
        if (charId) {
            typeMap.set(charId, type ? type : "");
        }
    });

    // Merge data: assign type from sceneCharMap or empty string
    const charactersData = movieCharacters.map(({ id, name }) => ({
        id,
        name,
        type: typeMap.get(id) || "",
    }));

    return charactersData;
};

export const getMovieCharacters = async (page: number, limit: number, search: string) => {
    // Step 1: Retrieve default movie
    const { id: defaultMovieId, name: movieName } = await getDefaultMovie();

    const searchTerm = search.trim().toLowerCase();

    // Step 2: Fetch characters for the default movie
    const characterData = await db.query.characters.findMany({
        columns: {
            id: true,
            name: true,
            gender: true,
            lowerAge: true,
            upperAge: true,
            type: true,
            description: true,
            expScreenTime: true,
            notes: true
        },
        where: search.trim()
            ? and(
                eq(characters.movieId, defaultMovieId),
                or(
                    sql`LOWER(${characters.name}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${characters.description}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${characters.notes}) LIKE ${`%${searchTerm}%`}`
                )
            )
            : eq(characters.movieId, defaultMovieId),
        orderBy: [
            sql`CASE 
            WHEN ${characters.type} = 'M' THEN 1 
            WHEN ${characters.type} = 'P' THEN 2 
            WHEN ${characters.type} = 'S' THEN 3 
            WHEN ${characters.type} = 'T' THEN 4 
            WHEN ${characters.type} = 'O' THEN 5 
            ELSE 6 END`,
            asc(characters.name) // Secondary order by name
        ],
        limit: limit,
        offset: (page - 1) * limit
    });

    if (characterData.length === 0) return [];

    // Step 3: Fetch Scene IDs for each character
    const characterIds = characterData.map((char) => char.id);

    const sceneMappings = await db.query.sceneCharMap.findMany({
        columns: { charId: true, sceneId: true },
        where: inArray(sceneCharMap.charId, characterIds),
    });

    if (sceneMappings.length === 0) {
        return characterData.map((char) => ({
            ...char,
            scenes: [],
            movieName
        }));
    }

    // Extract unique Scene IDs
    const sceneIds: string[] = [...new Set(sceneMappings.map((map) => map.sceneId))].filter(Boolean) as string[];

    // Fetch scene details
    const sceneDetails = await db.query.scenes.findMany({
        columns: { id: true, number: true, description: true, expLength: true },
        where: inArray(scenes.id, sceneIds),
    });

    // Map scenes back to characters
    const characterSceneMap = characterData.map((char) => {
        const relevantScenes = sceneMappings
            .filter((map) => map.charId === char.id)
            .map((map) => sceneDetails.find((scene) => scene.id === map.sceneId))
            .filter(Boolean); // Remove undefined values

        return {
            ...char,
            scenes: relevantScenes,
            movieName
        };
    });

    return characterSceneMap;
};

export const createCharacter = async (characterData: {
    name: string;
    gender: string;
    lowerAge?: number;
    upperAge?: number;
    type: string;
    description?: string;
    expScreenTime?: number;
    notes?: string;
}) => {
    // Step 1: Validate input
    const { name, gender, lowerAge, upperAge, type, description = "", expScreenTime, notes = "" } = characterData;

    if (!name.trim()) {
        throw new Error("Character name is required.");
    }

    // Validate gender
    const validGenders = ["M", "F", "O"];
    if (!validGenders.includes(gender.trim())) {
        throw new Error("Invalid gender. Allowed values: 'M', 'F', 'O'.");
    }

    // Validate type
    const validTypes = ["M", "P", "S", "T", "O"];
    if (!validTypes.includes(type.trim())) {
        throw new Error("Invalid character type. Allowed values: 'M', 'P', 'S', 'T', 'O'.");
    }

    // Validate age range
    if (
        (lowerAge !== undefined && (isNaN(lowerAge) || lowerAge < 0 || lowerAge > 125)) ||
        (upperAge !== undefined && (isNaN(upperAge) || upperAge < 0 || upperAge > 125))
    ) {
        throw new Error("Age must be between 0 and 125.");
    }

    if (lowerAge !== undefined && upperAge !== undefined && lowerAge > upperAge) {
        throw new Error("Lower age cannot be greater than upper age.");
    }

    // Step 2: Retrieve the default movie
    const { id: defaultMovieId } = await getDefaultMovie();

    // Step 3: Insert character into the database
    const [newCharacter] = await db
        .insert(characters)
        .values({
            id: uuidv4(),
            movieId: defaultMovieId,
            name: name.trim(),
            gender: gender.trim(),
            lowerAge,
            upperAge,
            type: type.trim(),
            description: description.trim(),
            expScreenTime,
            notes: notes.trim(),
        })
        .returning({ id: characters.id });

    // Step 4: Error handling
    if (!newCharacter) {
        throw new Error("Failed to create character.");
    }

    return newCharacter;
};

export const getCharacterById = async (characterId: string) => {

    const { id: defaultMovieId } = await getDefaultMovie();

    const characterDetails = await db.query.characters.findFirst({
        where: and(
            eq(characters.movieId, defaultMovieId),
            eq(characters.id, characterId)
        ),
        columns: { name: true, gender: true, lowerAge: true, upperAge: true, type: true, description: true, expScreenTime: true, notes: true, movieId: true }
    });

    return characterDetails;

}

export const editCharacter = async (characterId: string, characterData: {
    name: string;
    gender: string;
    lowerAge?: number;
    upperAge?: number;
    type: string;
    description?: string;
    expScreenTime?: number;
    notes?: string;
}) => {
    if (!characterId.trim()) {
        throw new Error("Character ID is required.");
    }

    const { name, gender, lowerAge, upperAge, type, description = "", expScreenTime, notes = "" } = characterData;

    if (!name.trim()) {
        throw new Error("Character name is required.");
    }

    const validGenders = ["M", "F", "O"];
    if (!validGenders.includes(gender)) {
        throw new Error("Invalid gender. Allowed values are 'M', 'F', or 'O'.");
    }

    const validTypes = ["M", "P", "S", "T", "O"];
    if (!validTypes.includes(type)) {
        throw new Error("Invalid character type. Allowed values are 'M', 'P', 'S', 'T', or 'O'.");
    }

    const { id: defaultMovieId } = await getDefaultMovie();

    // Ensure character belongs to the default movie
    const existingCharacter = await db.query.characters.findFirst({
        where: and(eq(characters.movieId, defaultMovieId), eq(characters.id, characterId))
    });

    if (!existingCharacter) {
        throw new Error("Character not found.");
    }

    const [updatedCharacter] = await db
        .update(characters)
        .set({
            name: name.trim(),
            gender,
            lowerAge,
            upperAge,
            type,
            description: description.trim(),
            expScreenTime,
            notes: notes.trim(),
            updatedAt: new Date()
        })
        .where(and(eq(characters.movieId, defaultMovieId), eq(characters.id, characterId)))
        .returning({ id: characters.id });

    if (!updatedCharacter) {
        throw new Error("Failed to update character.");
    }

    return updatedCharacter;
};

export const deleteCharacter = async (characterId: string) => {

    if (!characterId.trim()) {
        throw new Error("Character ID is required.");
    }

    const { id: defaultMovieId } = await getDefaultMovie();

    // Ensure character exists and belongs to the default movie
    const existingCharacter = await db.query.characters.findFirst({
        where: and(eq(characters.movieId, defaultMovieId), eq(characters.id, characterId))
    });

    if (!existingCharacter) {
        throw new Error("Character not found.");
    }

    // Use transaction ONLY for delete operations
    return await db.transaction(async (tx) => {
        // Step 1: Delete all records in SceneCharMap where charId matches
        await tx.delete(sceneCharMap).where(eq(sceneCharMap.charId, characterId));

        // Step 2: Delete the character from Characters table
        const deletedCharacter = await tx
            .delete(characters)
            .where(and(eq(characters.movieId, defaultMovieId), eq(characters.id, characterId)))
            .returning({ id: characters.id });

        if (!deletedCharacter.length) {
            throw new Error("Failed to delete character.");
        }

        return { message: "Character deleted successfully." };
    });
};
