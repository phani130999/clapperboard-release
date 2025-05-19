import { db } from "@/app/db/db";
import { characters, scenes, sceneCharMap, montages } from "@/app/db/schema";
import { eq, and, or, inArray, desc, sql, gte, lte, gt, lt } from "drizzle-orm";
import { getDefaultMovie } from "./moviesActions";
import { v4 as uuidv4 } from "uuid";

type Transaction = Parameters<Parameters<typeof db["transaction"]>[0]>[0];

export const getMovieScenes = async (page: number, limit: number, search: string) => {
    // Step 1: Retrieve default movie
    const { id: defaultMovieId, name: movieName } = await getDefaultMovie();

    const searchTerm = search.trim().toLowerCase();

    // Step 2: Fetch scenes for the default movie
    const sceneData = await db.query.scenes.findMany({
        columns: {
            id: true,
            number: true,
            act: true,
            ieFlag: true,
            slFlag: true,
            type: true,
            location: true,
            subLocation: true,
            weather: true,
            time: true,
            description: true,
            expLength: true,
            numExtras: true,
            cameraNotes: true,
            lightingNotes: true,
            soundNotes: true,
            colorNotes: true,
            propNotes: true,
            otherNotes: true,
            relevanceQuotient: true,
            costquotient: true
        },
        where: search.trim()
            ? and(
                eq(scenes.movieId, defaultMovieId),
                or(
                    sql`LOWER(${sql.raw('scenes.number')}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.location}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.subLocation}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.description}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.cameraNotes}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.lightingNotes}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.soundNotes}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.colorNotes}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.propNotes}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.otherNotes}) LIKE ${`%${searchTerm}%`}`
                )
            )
            : eq(scenes.movieId, defaultMovieId),
        orderBy: (scenes, { asc }) => [asc(scenes.number)],
        limit: limit,
        offset: (page - 1) * limit
    });

    if (sceneData.length === 0) return [];

    // Step 3: Fetch Character IDs for each Scene
    const sceneIds = sceneData.map((scene) => scene.id);

    const characterMappings = await db.query.sceneCharMap.findMany({
        columns: { sceneId: true, charId: true, type:true },
        where: inArray(sceneCharMap.sceneId, sceneIds),
    });

    if (characterMappings.length === 0) {
        return sceneData.map((scene) => ({
            ...scene,
            characters: [],
            movieName
        }));
    }

    // Extract unique Character IDs
    const characterIds: string[] = [...new Set(characterMappings.map((map) => map.charId))].filter(Boolean) as string[];

    // Fetch character details
    const characterDetails = await db.query.characters.findMany({
        columns: { id: true, name: true, description: true },
        where: inArray(characters.id, characterIds),
    });

    // Map characters back to scenes
    const sceneCharacterMap = sceneData.map((scene) => {
        const relevantCharacters = characterMappings
            .filter((map) => map.sceneId === scene.id)
            .map((map) => {
                const character = characterDetails.find((char) => char.id === map.charId);
                return character ? { ...character, type: map.type } : null;
            })
            .filter(Boolean);

        return {
            ...scene,
            characters: relevantCharacters,
            movieName
        };
    });

    return sceneCharacterMap;
};

export const createScene = async (sceneData: {
    number: number;
    act?: string;
    ieFlag: string;
    slFlag: string;
    type: string;
    location?: string;
    subLocation?: string;
    weather?: string;
    time?: string;
    description?: string;
    expLength?: number;
    numExtras?: number;
    cameraNotes?: string;
    lightingNotes?: string;
    soundNotes?: string;
    colorNotes?: string;
    propNotes?: string;
    otherNotes?: string;
    relevanceQuotient?: string;
    costquotient?: string;
    charactersData: { id: string; name: string; type: string }[];
}) => {
    // Step 1: Validate input
    const {
        number, act, ieFlag, slFlag, type, location = "", subLocation = "", weather = "", time = "",
        description = "", expLength, numExtras, cameraNotes = "", lightingNotes = "",
        soundNotes = "", colorNotes = "", propNotes = "", otherNotes = "",
        relevanceQuotient, costquotient, charactersData
    } = sceneData;

    if (!number || number < 1) {
        throw new Error("Scene number must be a positive integer.");
    }

    const validIeFlags = ["I", "E", "IE"];
    if (!validIeFlags.includes(ieFlag.trim())) {
        throw new Error("Invalid ieFlag. Allowed values: 'I', 'E', 'IE'.");
    }

    const validSlFlags = ["S", "L", "SL"];
    if (!validSlFlags.includes(slFlag.trim())) {
        throw new Error("Invalid slFlag. Allowed values: 'S', 'L', 'SL'.");
    }

    const validTypes = ["M", "D", "A", "T", "S", "G", "O", "B"];
    if (!validTypes.includes(type.trim())) {
        throw new Error("Invalid scene type. Allowed values: 'M', 'D', 'A', 'T', 'S', 'G', 'O', 'B'.");
    }

    const validRelevanceQuotients = ["M", "G", "F", "V", "U"];
    if (relevanceQuotient && !validRelevanceQuotients.includes(relevanceQuotient.trim())) {
        throw new Error("Invalid relevanceQuotient. Allowed values: 'M', 'G', 'F', 'V', 'U'.");
    }

    const validCostQuotients = ["E", "V", "M", "R", "I"];
    if (costquotient && !validCostQuotients.includes(costquotient.trim())) {
        throw new Error("Invalid costquotient. Allowed values: 'E', 'V', 'M', 'R', 'I'.");
    }

    // Step 2: Retrieve the default movie
    const { id: defaultMovieId } = await getDefaultMovie();

    // Fetch the max scene number in the movie
    const maxScene = await db.query.scenes.findFirst({
        where: eq(scenes.movieId, defaultMovieId),
        orderBy: [desc(scenes.number)],
    });

    const maxSceneNumber = maxScene ? maxScene.number : 0;

    if (sceneData.number > maxSceneNumber + 1) {
        throw new Error(`Scene number can only be at most '1' greater than the current max scene number (${maxSceneNumber}).`);
    }

    // Check if a scene with the same number exists
    const existingScene = await db.query.scenes.findFirst({
        where: and(eq(scenes.movieId, defaultMovieId), eq(scenes.number, sceneData.number)),
    });

    return await db.transaction(async (tx) => {
        // Step 3: Shift existing scenes' numbers if needed
        if (existingScene) {
            await tx.update(scenes)
                .set({ number: sql`${scenes.number} + 1` })
                .where(and(eq(scenes.movieId, defaultMovieId), gte(scenes.number, sceneData.number)));
        }

        // Step 4: Insert new scene
        const [newScene] = await tx
            .insert(scenes)
            .values({
                id: uuidv4(),
                movieId: defaultMovieId,
                number,
                act: act?.trim() || null,
                ieFlag: ieFlag.trim(),
                slFlag: slFlag.trim(),
                type: type.trim(),
                location: location.trim(),
                subLocation: subLocation.trim(),
                weather: weather.trim(),
                time: time.trim(),
                description: description.trim(),
                expLength,
                numExtras,
                cameraNotes: cameraNotes.trim(),
                lightingNotes: lightingNotes.trim(),
                soundNotes: soundNotes.trim(),
                colorNotes: colorNotes.trim(),
                propNotes: propNotes.trim(),
                otherNotes: otherNotes.trim(),
                relevanceQuotient: relevanceQuotient?.trim() || null,
                costquotient: costquotient?.trim() || null,
            })
            .returning({ id: scenes.id });

        if (!newScene) {
            throw new Error("Failed to create scene.");
        }

        // Step 5: Insert mappings
        await createMappings(tx, newScene.id, charactersData);

        return newScene;
    });
};

export const getSceneById = async (sceneId: string) => {
    const { id: defaultMovieId } = await getDefaultMovie();

    const sceneDetails = await db.query.scenes.findFirst({
        where: and(
            eq(scenes.movieId, defaultMovieId),
            eq(scenes.id, sceneId)
        ),
        columns: {
            number: true,
            act: true,
            ieFlag: true,
            slFlag: true,
            type: true,
            location: true,
            subLocation: true,
            weather: true,
            time: true,
            description: true,
            expLength: true,
            numExtras: true,
            cameraNotes: true,
            lightingNotes: true,
            soundNotes: true,
            colorNotes: true,
            propNotes: true,
            otherNotes: true,
            relevanceQuotient: true,
            costquotient: true,
            movieId: true,
        }
    });

    return sceneDetails;
};

export const editScene = async (sceneId: string, sceneData: {
    number?: number;
    act?: string;
    ieFlag?: string;
    slFlag?: string;
    type?: string;
    location?: string;
    subLocation?: string;
    weather?: string;
    time?: string;
    description?: string;
    expLength?: number;
    numExtras?: number;
    cameraNotes?: string;
    lightingNotes?: string;
    soundNotes?: string;
    colorNotes?: string;
    propNotes?: string;
    otherNotes?: string;
    relevanceQuotient?: string;
    costquotient?: string;
    charactersData: { id: string; name: string; type: string }[];
}) => {
    if (!sceneId.trim()) {
        throw new Error("Scene ID is required.");
    }

    const {
        number, act, ieFlag, slFlag, type, location, subLocation, weather, time,
        description, expLength, numExtras, cameraNotes, lightingNotes, soundNotes,
        colorNotes, propNotes, otherNotes, relevanceQuotient, costquotient, charactersData
    } = sceneData;

    if (number !== undefined && number < 1) {
        throw new Error("Scene number must be a positive integer.");
    }

    const validIeFlags = ["I", "E", "IE"];
    if (ieFlag && !validIeFlags.includes(ieFlag.trim())) {
        throw new Error("Invalid ieFlag. Allowed values: 'I', 'E', 'IE'.");
    }

    const validSlFlags = ["S", "L", "SL"];
    if (slFlag && !validSlFlags.includes(slFlag.trim())) {
        throw new Error("Invalid slFlag. Allowed values: 'S', 'L', 'SL'.");
    }

    const validTypes = ["M", "D", "A", "T", "S", "G", "O", "B"];
    if (type && !validTypes.includes(type.trim())) {
        throw new Error("Invalid scene type. Allowed values: 'M', 'D', 'A', 'T', 'S', 'G', 'O', 'B'.");
    }

    const validRelevanceQuotients = ["M", "G", "F", "V", "U"];
    if (relevanceQuotient && !validRelevanceQuotients.includes(relevanceQuotient.trim())) {
        throw new Error("Invalid relevanceQuotient. Allowed values: 'M', 'G', 'F', 'V', 'U'.");
    }

    const validCostQuotients = ["E", "V", "M", "R", "I"];
    if (costquotient && !validCostQuotients.includes(costquotient.trim())) {
        throw new Error("Invalid costquotient. Allowed values: 'E', 'V', 'M', 'R', 'I'.");
    }

    const { id: defaultMovieId } = await getDefaultMovie();

    const maxScene = await db.query.scenes.findFirst({
        where: eq(scenes.movieId, defaultMovieId),
        orderBy: [desc(scenes.number)],
    });

    const maxSceneNumber = maxScene ? maxScene.number : 0;

    const newNumber = number ? number : 0;

    if (newNumber > maxSceneNumber ) {
        throw new Error(`Scene number cannot be greater than the current max scene number (${maxSceneNumber}).`);
    }

    // Ensure scene belongs to the default movie
    const existingScene = await db.query.scenes.findFirst({
        where: and(eq(scenes.movieId, defaultMovieId), eq(scenes.id, sceneId))
    });

    if (!existingScene) {
        throw new Error("Scene not found.");
    }

    // Start transaction for UPDATES/INSERTS only
    return db.transaction(async (tx) => {
        if (newNumber !== existingScene.number) {
            if (existingScene.number > newNumber) {
                await tx.update(scenes)
                    .set({ number: sql`${scenes.number} + 1` })
                    .where(and(
                        eq(scenes.movieId, defaultMovieId),
                        gte(scenes.number, newNumber),
                        lt(scenes.number, existingScene.number)
                    ));
            } else {
                await tx.update(scenes)
                    .set({ number: sql`${scenes.number} - 1` })
                    .where(and(
                        eq(scenes.movieId, defaultMovieId),
                        gt(scenes.number, existingScene.number),
                        lte(scenes.number, newNumber)
                    ));
            }
        }

        const [updatedScene] = await tx
            .update(scenes)
            .set({
                number,
                act: act?.trim(),
                ieFlag: ieFlag?.trim(),
                slFlag: slFlag?.trim(),
                type: type?.trim(),
                location: location?.trim(),
                subLocation: subLocation?.trim(),
                weather: weather?.trim(),
                time: time?.trim(),
                description: description?.trim(),
                expLength,
                numExtras,
                cameraNotes: cameraNotes?.trim(),
                lightingNotes: lightingNotes?.trim(),
                soundNotes: soundNotes?.trim(),
                colorNotes: colorNotes?.trim(),
                propNotes: propNotes?.trim(),
                otherNotes: otherNotes?.trim(),
                relevanceQuotient: relevanceQuotient?.trim(),
                costquotient: costquotient?.trim(),
                updatedAt: new Date()
            })
            .where(and(eq(scenes.movieId, defaultMovieId), eq(scenes.id, sceneId)))
            .returning({ id: scenes.id });

        if (!updatedScene) {
            throw new Error("Failed to update scene.");
        }

        // Use the same transaction for `createMappings`
        await createMappings(tx, updatedScene.id, charactersData);

        return updatedScene;
    });
};

const createMappings = async (tx: Transaction, sceneId: string, charactersData: { id: string; name: string; type: string | null }[]) => {
    if (!sceneId.trim()) {
        throw new Error("Scene ID is required.");
    }

    const validTypes = new Set(["D", "N", "O", "B"]);

    // Step 1: Discard characters with empty or null type
    const filteredCharacters = charactersData.filter(({ type }) => type !== "" && type !== null);

    // Step 2: Validate character data against valid types
    if (
        !Array.isArray(filteredCharacters) ||
        filteredCharacters.some(({ id, type }) => !id.trim() || !validTypes.has(type ? type.trim() : ""))
    ) {
        throw new Error("Invalid CharactersData format or type.");
    }

    // Step 3: Delete existing mappings for this scene (Using transaction)
    await tx.delete(sceneCharMap).where(eq(sceneCharMap.sceneId, sceneId));

    // Step 4: Insert new mappings (Using transaction)
    if (filteredCharacters.length > 0) {
        await tx.insert(sceneCharMap).values(
            filteredCharacters.map(({ id, type }) => ({
                id: uuidv4(),
                sceneId: sceneId,
                charId: id,
                type: type,
            }))
        );
    }

    return { message: "Scene-Character mappings updated successfully." };
};

export const deleteScene = async (sceneId: string) => {
    if (!sceneId.trim()) {
        throw new Error("Scene ID is required.");
    }

    const { id: defaultMovieId } = await getDefaultMovie();

    // Ensure scene exists and belongs to the default movie
    const existingScene = await db.query.scenes.findFirst({
        where: and(eq(scenes.movieId, defaultMovieId), eq(scenes.id, sceneId))
    });

    if (!existingScene) {
        throw new Error("Scene not found.");
    }

    const sceneNumber = existingScene.number;

    // **Start Transaction for Deletes**
    return db.transaction(async (tx) => {
        // Step 1: Delete all records in SceneCharMap where sceneId matches
        await tx.delete(sceneCharMap).where(eq(sceneCharMap.sceneId, sceneId));

        // Step 2: Delete all records in Montages table where sceneId matches
        await tx.delete(montages).where(eq(montages.sceneId, sceneId));

        // Step 3: Delete the scene from Scenes table
        const deletedScene = await tx
            .delete(scenes)
            .where(and(eq(scenes.movieId, defaultMovieId), eq(scenes.id, sceneId)))
            .returning({ id: scenes.id });

        if (!deletedScene.length) {
            throw new Error("Failed to delete scene.");
        }

        // Step 4: Shift down scene numbers for remaining scenes
        await tx.update(scenes)
            .set({ number: sql`${scenes.number} - 1` })
            .where(and(
                eq(scenes.movieId, defaultMovieId),
                gt(scenes.number, sceneNumber)
            ));

        return { message: "Scene deleted successfully." };
    });
};