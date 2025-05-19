import { db } from "./db";
import { users, movies, characters, scenes, sceneCharMap, montages } from "./schema";
import { v4 as uuidv4 } from "uuid";

async function seed() {
    console.log("Starting database seeding...");

    // Insert Users
    const [user1] = await db.insert(users).values([
        { id: uuidv4(), name: "Default User", email: "default.user@email.com" }
    ]).returning();

    // Insert Movies
    const [movie1] = await db.insert(movies).values([
        {
            id: uuidv4(),
            name: "The Last Page (Demo Movie)",
            userId: user1.id,
            logline: "On his last day as a librarian, an elderly man discovers an unfinished story from his past that helps him make peace with old regrets.",
            description: "A poignant tale about memory, love, and closure — a librarian on his final day finds a notebook with a story that mirrors his life, triggering a series of reflections that lead to an unexpected reunion.",
            defaultFlag: "Y"
        }
    ]).returning();

    // Insert Characters
    const characterData = [
        { name: "Raghav", gender: "M", lowerAge: 55, upperAge: 65, type: "M", description: "An aging librarian on his final day of work.", expScreenTime: 15, notes: "Soft-spoken, wears reading glasses." },
        { name: "Maya", gender: "F", lowerAge: 55, upperAge: 65, type: "M", description: "A schoolteacher who reconnects with Raghav.", expScreenTime: 10, notes: "Warm smile, graceful presence." },
        { name: "Young Raghav", gender: "M", lowerAge: 20, upperAge: 25, type: "P", description: "Raghav in his youth, full of dreams and hesitations.", expScreenTime: 5, notes: "Seen in flashback." },
        { name: "Young Maya", gender: "F", lowerAge: 20, upperAge: 25, type: "P", description: "Lively and expressive; deeply fond of young Raghav.", expScreenTime: 5, notes: "Seen in flashback." },
        { name: "Child", gender: "M", lowerAge: 10, upperAge: 12, type: "S", description: "A curious child who unknowingly connects the past.", expScreenTime: 2, notes: "Carries a satchel and wide-eyed curiosity." }
    ];

    const insertedChars = await db.insert(characters).values(
        characterData.map(c => ({ ...c, id: uuidv4(), movieId: movie1.id }))
    ).returning();

    // Insert Scenes
    const sceneData = [
        {
            number: 1, act: "1", ieFlag: "I", slFlag: "L",
            type: "D", location: "Library", subLocation: "Entrance",
            weather: "Sunny", time: "Morning",
            description: "Raghav opens the library; a child gives him an old notebook that triggers his past.",
            expLength: 2, numExtras: 1,
            cameraNotes: "Wide shot of dusty interiors, over-the-shoulder on notebook.",
            lightingNotes: "Soft golden morning light.",
            soundNotes: "Footsteps, faint ticking clock.",
            colorNotes: "Warm earthy tones.",
            relevanceQuotient: "M",
            costquotient: "I"
        },
        {
            number: 2, act: "1", ieFlag: "IE", slFlag: "L",
            type: "M", location: "Library/Train Station", subLocation: "Varied",
            weather: "Varied", time: "Varied",
            description: "Montage: Young Raghav and Maya's past unfolds through the story.",
            expLength: 5, numExtras: 5,
            cameraNotes: "Dreamy, shallow focus transitions.",
            lightingNotes: "Soft glows for nostalgia.",
            soundNotes: "Music with light page-flip sound FX.",
            colorNotes: "Sepia tint with slight film grain.",
            relevanceQuotient: "M",
            costquotient: "R"
        },
        {
            number: 3, act: "2", ieFlag: "I", slFlag: "L",
            type: "D", location: "Library", subLocation: "Main Desk",
            weather: "Cloudy", time: "Evening",
            description: "Maya visits; she and Raghav reconnect quietly.",
            expLength: 5, numExtras: 5,
            cameraNotes: "Alternating medium shots with long pauses.",
            lightingNotes: "Soft and moody with natural window light.",
            soundNotes: "Clock ticking louder now.",
            colorNotes: "Cool tones with warm accents.",
            relevanceQuotient: "M",
            costquotient: "I"
        },
        {
            number: 4, act: "3", ieFlag: "I", slFlag: "L",
            type: "D", location: "Library", subLocation: "Back Corner",
            weather: "Calm", time: "Late Evening",
            description: "Raghav and Maya find emotional closure. She returns the notebook to the shelf.",
            expLength: 5, numExtras: 0,
            cameraNotes: "Tight close-ups on expressions, gentle dolly movement.",
            lightingNotes: "Dim, symbolic light from a single desk lamp.",
            soundNotes: "Soft ambient hum.",
            colorNotes: "Desaturated but warm glow on faces.",
            relevanceQuotient: "M",
            costquotient: "I"
        },
        {
            number: 5, act: "3", ieFlag: "E", slFlag: "L",
            type: "A", location: "Library", subLocation: "Exit",
            weather: "Clear", time: "Night",
            description: "Raghav locks up the library, leaves his name badge, and walks into the street with peace.",
            expLength: 3, numExtras: 0,
            cameraNotes: "Back shot of Raghav walking away under streetlamp.",
            lightingNotes: "Night lighting with streetlamp glow.",
            soundNotes: "Distant dog bark, soft ambient music.",
            colorNotes: "Blue-grey street with warm badge close-up.",
            relevanceQuotient: "M",
            costquotient: "I"
        }
    ];

    const insertedScenes = await db.insert(scenes).values(
        sceneData.map(s => ({ ...s, id: uuidv4(), movieId: movie1.id }))
    ).returning();

    // Insert Scene_Character_Mappings
    const sceneCharMapRecords = [
        {
            id: uuidv4(),
            sceneId: insertedScenes[0].id,
            charId: insertedChars.find(c => c.name === "Raghav")!.id,
            type: "D"
        },
        {
            id: uuidv4(),
            sceneId: insertedScenes[0].id,
            charId: insertedChars.find(c => c.name === "Child")!.id,
            type: "D"
        },
        {
            id: uuidv4(),
            sceneId: insertedScenes[1].id,
            charId: insertedChars.find(c => c.name === "Young Raghav")!.id,
            type: "N"
        },
        {
            id: uuidv4(),
            sceneId: insertedScenes[1].id,
            charId: insertedChars.find(c => c.name === "Young Maya")!.id,
            type: "N"
        },
        {
            id: uuidv4(),
            sceneId: insertedScenes[2].id,
            charId: insertedChars.find(c => c.name === "Raghav")!.id,
            type: "D"
        },
        {
            id: uuidv4(),
            sceneId: insertedScenes[2].id,
            charId: insertedChars.find(c => c.name === "Maya")!.id,
            type: "D"
        },
        {
            id: uuidv4(),
            sceneId: insertedScenes[3].id,
            charId: insertedChars.find(c => c.name === "Raghav")!.id,
            type: "D"
        },
        {
            id: uuidv4(),
            sceneId: insertedScenes[3].id,
            charId: insertedChars.find(c => c.name === "Maya")!.id,
            type: "D"
        },
        {
            id: uuidv4(),
            sceneId: insertedScenes[4].id,
            charId: insertedChars.find(c => c.name === "Raghav")!.id,
            type: "N"
        }
    ];

    await db.insert(sceneCharMap).values(sceneCharMapRecords);

    // Insert Montages
    const montageData = [
        {
            seqNumber: 1, ieFlag: "I", slFlag: "L", location: "Library", subLocation: "Study Desk",
            weather: "Sunny", time: "Afternoon", description: "Young Raghav writes, tears pages, hesitates.",
            expLength: 120, numExtras: 1, notes: "Emotive close-ups of frustration and hope."
        },
        {
            seqNumber: 2, ieFlag: "E", slFlag: "L", location: "Library", subLocation: "Outside Steps",
            weather: "Windy", time: "Late Afternoon", description: "Young Maya reads his notes, waits outside.",
            expLength: 90, numExtras: 1, notes: "Wind-blown hair, hopeful eyes."
        },
        {
            seqNumber: 3, ieFlag: "E", slFlag: "L", location: "Train Station", subLocation: "Platform",
            weather: "Overcast", time: "Evening", description: "Unsent letter, Maya departs as Young Raghav arrives too late.",
            expLength: 90, numExtras: 5, notes: "Symbolic train departure with poetic stillness."
        }
    ];

    await db.insert(montages).values(
        montageData.map(m => ({ ...m, id: uuidv4(), sceneId: insertedScenes[1].id }))
    );

    console.log("Database seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Error during seeding:", err);
    process.exit(1);
});
