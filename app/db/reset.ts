import { db } from "./db";
import { characters, scenes, sceneCharMap, montages, movies, users } from "./schema";

async function main() {
    await db.delete(sceneCharMap);
    await db.delete(montages);
    await db.delete(characters);
    await db.delete(scenes);
    await db.delete(movies);
    await db.delete(users);

    console.log("Database reset successfully!");
}

main();
