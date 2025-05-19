import { db } from "@/app/db/db";
import { montages, scenes } from "@/app/db/schema";
import { eq, and, or, inArray, sql, gt, lt, gte, lte, desc } from "drizzle-orm";
import { getDefaultMovie } from "./moviesActions";
import { v4 as uuidv4 } from "uuid";

export const getMovieMontages = async (page: number, limit: number, search: string) => {
    // Get default movie ID and name
    const { id: defaultMovieId, name: movieName } = await getDefaultMovie();

    const searchTerm = search.trim().toLowerCase();

    // Fetch paginated scenes of type 'M' (Montage) for the default movie, filtering by search
    const scenesRecords = await db.query.scenes.findMany({
        columns: {
            id: true,
            number: true,
            description: true,
            location: true,
            subLocation: true,
        },
        where: and(
            eq(scenes.movieId, defaultMovieId),
            eq(scenes.type, "M"),
            search.trim()
                ? or(
                    sql`CAST(${scenes.number} AS TEXT) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.location}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.subLocation}) LIKE ${`%${searchTerm}%`}`,
                    sql`LOWER(${scenes.description}) LIKE ${`%${searchTerm}%`}`
                )
                : undefined
        ),
        orderBy: (scenes, { asc }) => [asc(scenes.number)], // Ensure consistent ordering
        limit: limit,
        offset: (page - 1) * limit
    });

    if (scenesRecords.length === 0) {
        return { montagesByScene: [], movieName };
    }

    const sceneIdList = scenesRecords.map((scene) => scene.id);

    // Fetch montages related to those scenes
    const montagesRecords = await db.query.montages.findMany({
        columns: {
            id: true,
            sceneId: true,
            seqNumber: true,
            ieFlag: true,
            slFlag: true,
            location: true,
            subLocation: true,
            weather: true,
            time: true,
            description: true,
            expLength: true,
            numExtras: true,
            notes: true,
        },
        where: inArray(montages.sceneId, sceneIdList),
        orderBy: (montages, { asc }) => [asc(montages.seqNumber)],
    });

    // Organize montages under their respective scenes
    const montagesByScene = scenesRecords.map((scene) => ({
        sceneId: scene.id,
        number: scene.number,
        description: scene.description,
        location: scene.location,
        subLocation: scene.subLocation,
        movieName: movieName,
        montages: montagesRecords.filter((montage) => montage.sceneId === scene.id),
    }));
    
    return { montagesByScene, movieName };
};

export const createSequence = async (sequenceData: {
    sceneId: string;
    seqNumber: number;
    ieFlag: string;
    slFlag: string;
    location?: string;
    subLocation?: string;
    weather?: string;
    time?: string;
    description?: string;
    expLength?: number;
    numExtras?: number;
    notes?: string;
}) => {
    // Step 1: Validate input
    const {
        sceneId, seqNumber, ieFlag, slFlag, location = "", subLocation = "", weather = "", time = "",
        description = "", expLength, numExtras, notes = ""
    } = sequenceData;

    if (!sceneId) {
        throw new Error("Scene ID is required.");
    }

    if (!seqNumber || seqNumber < 1) {
        throw new Error("Sequence number must be a positive integer.");
    }

    const validIeFlags = ["I", "E", "IE"];
    if (!validIeFlags.includes(ieFlag.trim())) {
        throw new Error("Invalid ieFlag. Allowed values: 'I', 'E', 'IE'.");
    }

    const validSlFlags = ["S", "L", "SL"];
    if (!validSlFlags.includes(slFlag.trim())) {
        throw new Error("Invalid slFlag. Allowed values: 'S', 'L', 'SL'.");
    }

    // Step 2: Check the current maximum sequence number in the scene
    const maxSequence = await db.query.montages.findFirst({
        where: eq(montages.sceneId, sceneId),
        orderBy: [desc(montages.seqNumber)],
    });

    const maxSeqNumber = maxSequence ? maxSequence.seqNumber : 0;

    if (seqNumber > maxSeqNumber + 1) {
        throw new Error(`Sequence number can only be at most '1' greater than the current max sequence number (${maxSeqNumber}).`);
    }

    // Step 3: Shift existing sequences if necessary
    const existingSequence = await db.query.montages.findFirst({
        where: and(eq(montages.sceneId, sceneId), eq(montages.seqNumber, seqNumber)),
    });

    // Step 4: Use a transaction ONLY for the update and insert
    return await db.transaction(async (trx) => {
        if (existingSequence) {
            await trx.update(montages)
                .set({ seqNumber: sql`${montages.seqNumber} + 1` })
                .where(and(eq(montages.sceneId, sceneId), gte(montages.seqNumber, seqNumber)));
        }

        const [newSequence] = await trx
            .insert(montages)
            .values({
                id: uuidv4(),
                sceneId,
                seqNumber,
                ieFlag: ieFlag.trim(),
                slFlag: slFlag.trim(),
                location: location.trim(),
                subLocation: subLocation.trim(),
                weather: weather.trim(),
                time: time.trim(),
                description: description.trim(),
                expLength,
                numExtras,
                notes: notes.trim(),
            })
            .returning({ id: montages.id });

        if (!newSequence) {
            throw new Error("Failed to create montage sequence.");
        }

        return newSequence;
    });
};

export const getSequenceById = async (id: string) => {
    // Step 1: Validate input
    if (!id) {
        throw new Error("Sequence ID is required.");
    }

    // Step 2: Fetch the Montage Sequence by ID
    const sequence = await db.query.montages.findFirst({
        columns: {
            sceneId: true,
            seqNumber: true,
            ieFlag: true,
            slFlag: true,
            location: true,
            subLocation: true,
            weather: true,
            time: true,
            description: true,
            expLength: true,
            numExtras: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
        },
        where: eq(montages.id, id),
    });

    // Step 3: Error handling
    if (!sequence) {
        throw new Error("Montage Sequence not found.");
    }

    return sequence;
};

export const editSequence = async (sequenceId: string, sequenceData: {
    seqNumber?: number;
    ieFlag?: string;
    slFlag?: string;
    location?: string;
    subLocation?: string;
    weather?: string;
    time?: string;
    description?: string;
    expLength?: number;
    numExtras?: number;
    notes?: string;
}) => {
    if (!sequenceId.trim()) {
        throw new Error("Sequence ID is required.");
    }

    const {
        seqNumber, ieFlag, slFlag, location, subLocation, weather, time,
        description, expLength, numExtras, notes
    } = sequenceData;

    // Validate ieFlag
    const validIeFlags = ["I", "E", "IE"];
    if (ieFlag && !validIeFlags.includes(ieFlag.trim())) {
        throw new Error("Invalid ieFlag. Allowed values: 'I', 'E', 'IE'.");
    }

    // Validate slFlag
    const validSlFlags = ["S", "L", "SL"];
    if (slFlag && !validSlFlags.includes(slFlag.trim())) {
        throw new Error("Invalid slFlag. Allowed values: 'S', 'L', 'SL'.");
    }

    // Fetch existing sequence details
    const existingSequence = await db.query.montages.findFirst({
        where: eq(montages.id, sequenceId)
    });

    if (!existingSequence) {
        throw new Error("Montage Sequence not found.");
    }

    // Fetch max sequence number in the scene
    const maxSequence = await db.query.montages.findFirst({
        where: eq(montages.sceneId, existingSequence.sceneId as string),
        orderBy: [desc(montages.seqNumber)],
    });

    const maxSeqNumber = maxSequence ? maxSequence.seqNumber : 0;

    if (seqNumber !== undefined && seqNumber < 1) {
        throw new Error("Sequence number must be a positive integer.");
    }

    if (seqNumber && seqNumber > maxSeqNumber) {
        throw new Error(`Sequence number cannot be greater than the current max sequence number (${maxSeqNumber}).`);
    }

    return await db.transaction(async (tx) => {
        // Adjust sequence numbers if changed
        if (seqNumber && seqNumber !== existingSequence.seqNumber) {
            if (existingSequence.seqNumber > seqNumber) {
                await tx.update(montages)
                    .set({ seqNumber: sql`${montages.seqNumber} + 1` })
                    .where(and(
                        eq(montages.sceneId, existingSequence.sceneId as string),
                        gte(montages.seqNumber, seqNumber),
                        lt(montages.seqNumber, existingSequence.seqNumber)
                    ));
            } else {
                await tx.update(montages)
                    .set({ seqNumber: sql`${montages.seqNumber} - 1` })
                    .where(and(
                        eq(montages.sceneId, existingSequence.sceneId as string),
                        gt(montages.seqNumber, existingSequence.seqNumber),
                        lte(montages.seqNumber, seqNumber)
                    ));
            }
        }

        // Update the sequence
        const [updatedSequence] = await tx
            .update(montages)
            .set({
                seqNumber,
                ieFlag: ieFlag?.trim(),
                slFlag: slFlag?.trim(),
                location: location?.trim(),
                subLocation: subLocation?.trim(),
                weather: weather?.trim(),
                time: time?.trim(),
                description: description?.trim(),
                expLength,
                numExtras,
                notes: notes?.trim(),
                updatedAt: new Date()
            })
            .where(eq(montages.id, sequenceId))
            .returning({ id: montages.id });

        if (!updatedSequence) {
            throw new Error("Failed to update montage sequence.");
        }

        return updatedSequence;
    });
};

export const deleteSequence = async (sequenceId: string) => {
    if (!sequenceId.trim()) {
        throw new Error("Sequence ID is required.");
    }

    // Fetch the existing sequence details
    const existingSequence = await db.query.montages.findFirst({
        where: eq(montages.id, sequenceId)
    });

    if (!existingSequence) {
        throw new Error("Montage Sequence not found.");
    }

    const { sceneId, seqNumber } = existingSequence;

    return await db.transaction(async (tx) => {
        // Step 1: Delete the sequence from the Montages table
        const deletedSequence = await tx
            .delete(montages)
            .where(eq(montages.id, sequenceId))
            .returning({ id: montages.id });

        if (!deletedSequence.length) {
            throw new Error("Failed to delete montage sequence.");
        }

        // Step 2: Shift up seqNumber for remaining sequences
        await tx.update(montages)
            .set({ seqNumber: sql`${montages.seqNumber} - 1` })
            .where(and(
                eq(montages.sceneId, sceneId as string),
                gt(montages.seqNumber, seqNumber)
            ));

        return { message: "Montage sequence deleted successfully." };
    });
};