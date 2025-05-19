import { db } from "@/app/db/db";
import { movies, characters, scenes, sceneCharMap, montages } from "@/app/db/schema";
import { eq, and, count, sql, inArray, lte, gte, or, asc } from "drizzle-orm";
import { getUserId } from "@/app/api/userInfo";

interface Movie {
    id: string;
    name: string;
    userId: string | null;
    logline: string | null;
    description: string | null;
    defaultFlag: string | null;
    createdAt: Date;
    updatedAt: Date;
};

interface Character {
    id: string;
    movieId: string | null;
    name: string;
    gender: string;
    lowerAge: number | null;
    upperAge: number | null;
    type: string;
    description: string | null;
    expScreenTime: number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface Scene {
    id: string;
    movieId: string | null;
    number: number;
    act?: string | null;
    ieFlag?: string | null;
    slFlag?: string | null;
    type?: string | null;
    location?: string | null;
    subLocation?: string | null;
    weather?: string | null;
    time?: string | null;
    description?: string | null;
    expLength?: number | null;
    numExtras?: number | null;
    cameraNotes?: string | null;
    lightingNotes?: string | null;
    soundNotes?: string | null;
    colorNotes?: string | null;
    propNotes?: string | null;
    otherNotes?: string | null;
    relevanceQuotient?: string | null;
    costquotient?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface Montage {
    id: string;
    sceneId: string | null;
    seqNumber: number;
    ieFlag?: string | null;
    slFlag?: string | null;
    location?: string | null;
    subLocation?: string | null;
    weather?: string | null;
    time?: string | null;
    description?: string | null;
    expLength?: number | null;
    numExtras?: number | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface Filter {
    field: string;
    value: string;
}

export async function fetchSearchResults(entity: string, filters: Filter[], page: number, limit: number) {
    try {
        // Get the logged-in user's ID
        const userId = await getUserId();
        if (!userId) throw new Error("Unauthorized");

        let query;
        let whereClause;

        switch (entity) {
            case "Movies":
                whereClause = buildMoviesWhereClause(filters);
                break;
            case "Characters":
                whereClause = buildCharactersWhereClause(filters);
                break;
            case "Scenes":
                whereClause = buildScenesWhereClause(filters);
                break;
            case "Montages":
                whereClause = buildMontagesWhereClause(filters);
                break;
        }

        const resolvedWhereClause = await whereClause;

        let results;

        switch (entity) {
            case "Movies":
                query = db.select()
                    .from(movies)
                    .where(resolvedWhereClause ? and(eq(movies.userId, userId), resolvedWhereClause) : eq(movies.userId, userId))
                    .orderBy(asc(movies.name))
                    .limit(limit)
                    .offset((page - 1) * limit);
                results = await query as Movie[];
                break;

            case "Characters":
                query = db.select()
                    .from(characters)
                    .where(
                        resolvedWhereClause
                            ? and(
                                resolvedWhereClause,
                                inArray(
                                    characters.movieId,
                                    db.select({ id: movies.id })
                                        .from(movies)
                                        .where(eq(movies.userId, userId))
                                )
                            )
                            : inArray(
                                characters.movieId,
                                db.select({ id: movies.id })
                                    .from(movies)
                                    .where(eq(movies.userId, userId))
                            )
                    )
                    .orderBy(
                        asc(db.select({ name: movies.name }).from(movies).where(eq(movies.id, characters.movieId))),
                        asc(characters.name)
                    )
                    .limit(limit)
                    .offset((page - 1) * limit);
                results = await query as Character[];
                break;

            case "Scenes":
                query = db.select()
                    .from(scenes)
                    .where(
                        resolvedWhereClause
                            ? and(
                                resolvedWhereClause,
                                inArray(
                                    scenes.movieId,
                                    db.select({ id: movies.id })
                                        .from(movies)
                                        .where(eq(movies.userId, userId))
                                )
                            )
                            : inArray(
                                scenes.movieId,
                                db.select({ id: movies.id })
                                    .from(movies)
                                    .where(eq(movies.userId, userId))
                            )
                    )
                    .orderBy(
                        asc(db.select({ name: movies.name }).from(movies).where(eq(movies.id, scenes.movieId))),
                        asc(scenes.number)
                    )
                    .limit(limit)
                    .offset((page - 1) * limit);
                results = await query as Scene[];
                break;

            case "Montages":
                query = db.select()
                    .from(montages)
                    .where(
                        resolvedWhereClause
                            ? and(
                                resolvedWhereClause,
                                inArray(
                                    montages.sceneId,
                                    db.select({ id: scenes.id })
                                        .from(scenes)
                                        .where(
                                            inArray(
                                                scenes.movieId,
                                                db.select({ id: movies.id })
                                                    .from(movies)
                                                    .where(eq(movies.userId, userId))
                                            )
                                        )
                                )
                            )
                            : inArray(
                                montages.sceneId,
                                db.select({ id: scenes.id })
                                    .from(scenes)
                                    .where(
                                        inArray(
                                            scenes.movieId,
                                            db.select({ id: movies.id })
                                                .from(movies)
                                                .where(eq(movies.userId, userId))
                                        )
                                    )
                            )
                    )
                    .orderBy(
                        asc(db.select({ name: movies.name }).from(movies).where(eq(movies.id, db.select({ movieId: scenes.movieId }).from(scenes).where(eq(scenes.id, montages.sceneId))))),
                        asc(db.select({ number: scenes.number }).from(scenes).where(eq(scenes.id, montages.sceneId))),
                        asc(montages.seqNumber)
                    )
                    .limit(limit)
                    .offset((page - 1) * limit);
                results = await query as Montage[];
                break;

            default:
                throw new Error("Invalid entity type");
        }

        let enrichedResults;

        switch (entity) {
            case "Movies":
                enrichedResults = await Promise.all(
                    (results as Movie[]).map(async (movie) => {
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
                break;
            
            case "Characters":
                if ((results as Character[]).length === 0) return { entity, results }

                const characterIds = (results as Character[]).map((char) => char.id);
                const movieIds = [...new Set((results as Character[]).map((char) => char.movieId))].filter(Boolean) as string[];

                // Fetch movie details
                const movieDetails = await db.query.movies.findMany({
                    columns: { id: true, name: true },
                    where: inArray(movies.id, movieIds),
                });

                // Fetch character-scene mappings
                const sceneMappings = await db.query.sceneCharMap.findMany({
                    columns: { charId: true, sceneId: true },
                    where: inArray(sceneCharMap.charId, characterIds),
                });

                if (sceneMappings.length === 0) {
                    enrichedResults = (results as Character[]).map((char) => ({
                        ...char,
                        scenes: [],
                        movieName: movieDetails.find((movie) => movie.id === char.movieId)?.name || null,
                    }));
                }

                else {

                    // Extract unique Scene IDs
                    const sceneIds: string[] = [...new Set(sceneMappings.map((map) => map.sceneId))].filter(Boolean) as string[];

                    // Fetch scene details
                    const sceneDetails = await db.query.scenes.findMany({
                        columns: { id: true, number: true, description: true, expLength: true },
                        where: inArray(scenes.id, sceneIds),
                    });

                    // Map scenes & movie names back to characters
                    enrichedResults = (results as Character[]).map((char) => {
                        const relevantScenes = sceneMappings
                            .filter((map) => map.charId === char.id)
                            .map((map) => sceneDetails.find((scene) => scene.id === map.sceneId))
                            .filter(Boolean); // Remove undefined values

                        return {
                            ...char,
                            scenes: relevantScenes,
                            movieName: movieDetails.find((movie) => movie.id === char.movieId)?.name || null,
                        };
                    });
                }
                break;
            
            case "Scenes":
                if ((results as Scene[]).length === 0) return { entity, results }

                // Step 3: Fetch Character IDs for each Scene
                const sceneIds = (results as Scene[]).map((scene) => scene.id);

                const sceneMovieIds = [...new Set((results as Character[]).map((char) => char.movieId))].filter(Boolean) as string[];

                // Fetch movie details
                const sceneMovieDetails = await db.query.movies.findMany({
                    columns: { id: true, name: true },
                    where: inArray(movies.id, sceneMovieIds),
                });

                const characterMappings = await db.query.sceneCharMap.findMany({
                    columns: { sceneId: true, charId: true, type: true },
                    where: inArray(sceneCharMap.sceneId, sceneIds),
                });

                if (characterMappings.length === 0) {
                    enrichedResults = (results as Scene[]).map((scene) => ({
                        ...scene,
                        characters: [],
                        movieName: sceneMovieDetails.find((movie) => movie.id === scene.movieId)?.name || null,
                    }));
                }

                else {
                    // Extract unique Character IDs
                    const sceneCharacterIds: string[] = [...new Set(characterMappings.map((map) => map.charId))].filter(Boolean) as string[];

                    // Fetch character details
                    const characterDetails = await db.query.characters.findMany({
                        columns: { id: true, name: true, description: true },
                        where: inArray(characters.id, sceneCharacterIds),
                    });

                    // Map characters back to scenes
                    enrichedResults = (results as Scene[]).map((scene) => {
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
                            movieName: sceneMovieDetails.find((movie) => movie.id === scene.movieId)?.name || null,
                        };
                    });
                }
                break;
            case "Montages":
                if ((results as Montage[]).length === 0) return { entity, results };

                const montageSceneIds = [...new Set((results as Montage[]).map((montage) => montage.sceneId))].filter(Boolean) as string[];

                // Fetch scene details
                const montageSceneDetails = await db.query.scenes.findMany({
                    columns: { id: true, number: true, description: true, movieId: true },
                    where: inArray(scenes.id, montageSceneIds),
                });

                // Extract unique Movie IDs from fetched scenes
                const montageMovieIds = [...new Set(montageSceneDetails.map((scene) => scene.movieId))].filter(Boolean) as string[];

                // Fetch movie details
                const montageMovieDetails = await db.query.movies.findMany({
                    columns: { id: true, name: true },
                    where: inArray(movies.id, montageMovieIds),
                });

                // Map Scene & Movie Info to Montages
                enrichedResults = (results as Montage[]).map((montage) => {
                    const scene = montageSceneDetails.find((scene) => scene.id === montage.sceneId);
                    const movieName = scene ? montageMovieDetails.find((movie) => movie.id === scene.movieId)?.name || null : null;

                    return {
                        ...montage,
                        sceneNumber: scene?.number || null,
                        sceneDescription: scene?.description || null,
                        movieName,
                    };
                });
                break;
        }

        return { entity, enrichedResults };
    } catch (error) {
        console.error("Error fetching search results:", error);
        throw new Error("Failed to fetch search results");
    }
}

function buildMoviesWhereClause(filters: { field: string; value: string }[]) {
    const conditions = filters
        .filter(({ value }) => value.trim() !== "") // Remove empty values
        .map(({ field, value }) => {
            const likeValue = `%${value.toLowerCase()}%`;

            switch (field) {
                case "Name":
                    return sql`LOWER(${movies.name}) LIKE ${likeValue}`;
                case "Logline":
                    return sql`LOWER(${movies.logline}) LIKE ${likeValue}`;
                case "Description":
                    return sql`LOWER(${movies.description}) LIKE ${likeValue}`;
                default:
                    throw new Error(`Unsupported field: ${field}`);
            }
        });

    return conditions.length > 0 ? and(...conditions) : undefined;
}

async function buildCharactersWhereClause(filters: { field: string; value: string }[]) {
    const conditions = [];

    for (const { field, value } of filters) {
        if (value.trim() === "") continue;

        switch (field) {
            case "Movie": {
                const matchingMovies = await db
                    .select({ id: movies.id })
                    .from(movies)
                    .where(sql`LOWER(${movies.name}) LIKE ${`%${value.toLowerCase()}%`}`);

                const movieIds = matchingMovies.map((movie) => movie.id);
                if (movieIds.length > 0) {
                    conditions.push(inArray(characters.movieId, movieIds));
                }
                break;
            }
            case "Name":
                conditions.push(
                    sql`LOWER(${characters.name}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            case "Description":
                conditions.push(
                    sql`LOWER(${characters.description}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            case "Gender": {
                const genderMap: Record<string, string> = {
                    "Male": "M",
                    "Female": "F",
                    "Other": "O"
                };
                const dbValue = genderMap[value];
                if (dbValue) {
                    conditions.push(eq(characters.gender, dbValue));
                }
                break;
            }
            case "Age": {
                const ageRanges: Record<string, { min: number; max: number }> = {
                    "< 10": { min: 0, max: 10 },
                    "10 - 20": { min: 10, max: 20 },
                    "20 - 30": { min: 20, max: 30 },
                    "30 - 40": { min: 30, max: 40 },
                    "40 - 50": { min: 40, max: 50 },
                    "50 - 60": { min: 50, max: 60 },
                    "60 - 70": { min: 60, max: 70 },
                    "70 - 80": { min: 70, max: 80 },
                    "80 - 90": { min: 80, max: 90 },
                    "> 90": { min: 90, max: 120 }
                };

                const range = ageRanges[value];
                if (range) {
                    conditions.push(
                        and(
                            lte(characters.lowerAge, range.max),
                            gte(characters.upperAge, range.min)
                        )
                    );
                }
                break;
            }
            case "Type": {
                const typeMapping: Record<string, string> = {
                    "Main": "M",
                    "Primary": "P",
                    "Secondary": "S",
                    "Tertiary": "T",
                    "Other": "O"
                };

                const dbValue = typeMapping[value];
                if (dbValue) {
                    conditions.push(eq(characters.type, dbValue));
                }
                break;
            }
            case "Screen Time": {
                const screenTimeRanges: Record<string, { min: number; max: number }> = {
                    "< 5 min": { min: 0, max: 5 },
                    "5 - 10 min": { min: 5, max: 10 },
                    "10 - 20 min": { min: 10, max: 20 },
                    "20 - 40 min": { min: 20, max: 40 },
                    "40 - 80 min": { min: 40, max: 80 },
                    "> 80 min": { min: 80, max: 300 }
                };

                const range = screenTimeRanges[value];
                if (range) {
                    conditions.push(
                        and(
                            gte(characters.expScreenTime, range.min),
                            lte(characters.expScreenTime, range.max)
                        )
                    );
                }
                break;
            }
            case "Notes":
                conditions.push(
                    sql`LOWER(${characters.notes}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            default:
                throw new Error(`Unsupported field: ${field}`);
        }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
}

async function buildScenesWhereClause(filters: { field: string; value: string }[]) {
    const conditions = [];

    for (const { field, value } of filters) {
        if (value.trim() === "") continue;

        switch (field) {
            case "Movie": {
                const matchingMovies = await db
                    .select({ id: movies.id })
                    .from(movies)
                    .where(sql`LOWER(${movies.name}) LIKE ${`%${value.toLowerCase()}%`}`);

                const movieIds = matchingMovies.map((movie) => movie.id);
                if (movieIds.length > 0) {
                    conditions.push(inArray(scenes.movieId, movieIds));
                }
                break;
            }
            case "Character": {
                const matchingCharacters = await db
                    .select({ id: characters.id })
                    .from(characters)
                    .where(sql`LOWER(${characters.name}) LIKE ${`%${value.toLowerCase()}%`}`);

                const characterIds = matchingCharacters.map((char) => char.id);
                if (characterIds.length > 0) {
                    const sceneMappings = await db.query.sceneCharMap.findMany({
                        columns: { sceneId: true },
                        where: inArray(sceneCharMap.charId, characterIds),
                    });

                    const sceneIds = sceneMappings.map((map) => map.sceneId).filter(Boolean) as string[];
                    if (sceneIds.length > 0) {
                        conditions.push(inArray(scenes.id, sceneIds));
                    }
                }
                break;
            }
            case "Number":
                conditions.push(
                    sql`LOWER(${scenes.number}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            case "Description":
                conditions.push(
                    sql`LOWER(${scenes.description}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            case "Act":
                conditions.push(
                    sql`LOWER(${scenes.act}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            case "Int Ext": {
                const ieMap: Record<string, string> = {
                    "INT.": "I",
                    "EXT.": "E",
                    "INT./EXT.": "IE",
                };
                const mappedValue = ieMap[value];
                if (mappedValue) {
                    conditions.push(eq(scenes.ieFlag, mappedValue));
                }
                break;
            }
            case "Set Loc": {
                const slMap: Record<string, string> = {
                    "Set": "S",
                    "Location": "L",
                    "Set/Location": "SL",
                };
                const mappedValue = slMap[value];
                if (mappedValue) {
                    conditions.push(eq(scenes.slFlag, mappedValue));
                }
                break;
            }
            case "Type": {
                const typeMap: Record<string, string> = {
                    "Dialogue": "D",
                    "Action": "A",
                    "Balanced": "B",
                    "Montage": "M",
                    "Title": "T",
                    "Stunt": "S",
                    "Graphical": "G",
                    "Others": "O",
                };
                const mappedValue = typeMap[value];
                if (mappedValue) {
                    conditions.push(eq(scenes.type, mappedValue));
                }
                break;
            }
            case "Location":
                conditions.push(
                    sql`LOWER(${scenes.location}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            case "Sublocation":
                conditions.push(
                    sql`LOWER(${scenes.subLocation}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            case "Weather":
                conditions.push(
                    sql`LOWER(${scenes.weather}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            case "Time":
                conditions.push(
                    sql`LOWER(${scenes.time}) LIKE ${`%${value.toLowerCase()}%`}`
                );
                break;
            case "Length": {
                const lengthRanges: Record<string, { min: number; max: number }> = {
                    "< 1 min": { min: 0, max: 1 },
                    "1 - 3 min": { min: 1, max: 3 },
                    "3 - 5 min": { min: 3, max: 5 },
                    "5 - 10 min": { min: 5, max: 10 },
                    "10 - 20 min": { min: 10, max: 20 },
                    "> 20 min": {min: 20, max: 120}
                };
                const range = lengthRanges[value];
                if (range) {
                    conditions.push(
                        and(
                            gte(scenes.expLength, range.min),
                            lte(scenes.expLength, range.max)
                        )
                    );
                }
                break;
            }
            case "Extras": {
                const extrasRanges: Record<string, { min: number; max: number }> = {
                    "< 5": { min: 0, max: 5 },
                    "5 - 10": { min: 5, max: 10 },
                    "10 - 20": { min: 10, max: 20 },
                    "20 - 40": { min: 20, max: 40 },
                    "40 - 80": { min: 40, max: 80 },
                    "> 80": { min: 80, max: 10000 },
                };

                const range = extrasRanges[value];

                if (range) {
                    conditions.push(
                        and(
                            gte(scenes.numExtras, range.min),
                            lte(scenes.numExtras, range.max)
                        )
                    );
                }
                break;
            }
            case "Relevance": {
                const relevanceMap: Record<string, string> = {
                    "Must-have": "M",
                    "Good-to-have": "G",
                    "Value-addition": "V",
                    "Filler": "F",
                    "Unimportant": "U",
                };

                const relevanceValue = relevanceMap[value];
                if (relevanceValue) {
                    conditions.push(eq(scenes.relevanceQuotient, relevanceValue));
                }
                break;
            }
            case "Cost": {
                const costMap: Record<string, string> = {
                    "Inexpensive": "I",
                    "Reasonably-expensive": "R",
                    "Moderately-expensive": "M",
                    "Very-expensive": "V",
                    "Extremely-expensive": "E",
                };

                const costValue = costMap[value];
                if (costValue) {
                    conditions.push(eq(scenes.costquotient, costValue));
                }
                break;
            }
            case "Notes": {
                const notesColumns = [
                    scenes.cameraNotes,
                    scenes.lightingNotes,
                    scenes.soundNotes,
                    scenes.colorNotes,
                    scenes.propNotes,
                    scenes.otherNotes,
                ];

                const noteConditions = notesColumns.map(col =>
                    sql`LOWER(${col}) LIKE ${`%${value.toLowerCase()}%`}`
                  );

                if (noteConditions.length > 0) {
                    conditions.push(or(...noteConditions));
                }
                break;
            }
            default:
                throw new Error(`Unsupported field: ${field}`);
        }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
}

async function buildMontagesWhereClause(filters: { field: string; value: string }[]) {
    const conditions = [];

    for (const { field, value } of filters) {
        if (value.trim() === "") continue;

        switch (field) {
            case "Movie": {
                const matchingMovies = await db
                    .select({ id: movies.id })
                    .from(movies)
                    .where(sql`LOWER(${movies.name}) LIKE ${`%${value.toLowerCase()}%`}`);

                const movieIds = matchingMovies.map((movie) => movie.id);
                if (movieIds.length > 0) {
                    const sceneIds = await db
                        .select({ id: scenes.id })
                        .from(scenes)
                        .where(inArray(scenes.movieId, movieIds));

                    const montageSceneIds = sceneIds.map((scene) => scene.id);
                    if (montageSceneIds.length > 0) {
                        conditions.push(inArray(montages.sceneId, montageSceneIds));
                    }
                }
                break;
            }
            case "Scene Number": {
                const matchingScenes = await db
                    .select({ id: scenes.id })
                    .from(scenes)
                    .where(sql`CAST(${scenes.number} AS TEXT) LIKE ${`%${value.toLowerCase()}%`}`);

                const sceneIds = matchingScenes.map((scene) => scene.id);
                if (sceneIds.length > 0) {
                    conditions.push(inArray(montages.sceneId, sceneIds));
                }
                break;
            }
            case "Description":
                conditions.push(sql`LOWER(${montages.description}) LIKE ${`%${value.toLowerCase()}%`}`);
                break;
            case "Int Ext": {
                const ieMap: Record<string, string> = {
                    "INT.": "I",
                    "EXT.": "E",
                    "INT./EXT.": "IE",
                };
                const mappedValue = ieMap[value];
                if (mappedValue) {
                    conditions.push(eq(montages.ieFlag, mappedValue));
                }
                break;
            }
            case "Set Loc": {
                const slMap: Record<string, string> = {
                    "Set": "S",
                    "Location": "L",
                    "Set/Location": "SL",
                };
                const mappedValue = slMap[value];
                if (mappedValue) {
                    conditions.push(eq(montages.slFlag, mappedValue));
                }
                break;
            }
            case "Location":
                conditions.push(sql`LOWER(${montages.location}) LIKE ${`%${value.toLowerCase()}%`}`);
                break;
            case "Sublocation":
                conditions.push(sql`LOWER(${montages.subLocation}) LIKE ${`%${value.toLowerCase()}%`}`);
                break;
            case "Weather":
                conditions.push(sql`LOWER(${montages.weather}) LIKE ${`%${value.toLowerCase()}%`}`);
                break;
            case "Time":
                conditions.push(sql`LOWER(${montages.time}) LIKE ${`%${value.toLowerCase()}%`}`);
                break;
            case "Length": {
                const lengthRanges: Record<string, { min: number; max: number }> = {
                    "< 10 seconds": { min: 0, max: 10 },
                    "10 - 20 seconds": { min: 10, max: 20 },
                    "20 - 30 seconds": { min: 20, max: 30 },
                    "30 - 40 seconds": { min: 30, max: 40 },
                    "40 - 50 seconds": { min: 40, max: 50 },
                    "> 50 seconds": { min: 50, max: 6000 },
                };
                const range = lengthRanges[value];
                if (range) {
                    conditions.push(
                        and(gte(montages.expLength, range.min), lte(montages.expLength, range.max))
                    );
                }
                break;
            }
            case "Extras": {
                const extrasRanges: Record<string, { min: number; max: number }> = {
                    "< 5": { min: 0, max: 5 },
                    "5 - 10": { min: 5, max: 10 },
                    "10 - 20": { min: 10, max: 20 },
                    "20 - 40": { min: 20, max: 40 },
                    "40 - 80": { min: 40, max: 80 },
                    "> 80": { min: 80, max: 10000 },
                };
                const range = extrasRanges[value];

                if (range) {
                    conditions.push(
                        and(gte(montages.numExtras, range.min), lte(montages.numExtras, range.max))
                    );
                }
                break;
            }
            case "Notes":
                conditions.push(sql`LOWER(${montages.notes}) LIKE ${`%${value.toLowerCase()}%`}`);
                break;
            default:
                throw new Error(`Unsupported field: ${field}`);
        }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
}