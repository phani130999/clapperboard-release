import { NextRequest, NextResponse } from "next/server";
import {
    getSceneCharacters,
    getMovieCharacters,
    getCharacterById,
    createCharacter,
    editCharacter,
    deleteCharacter
} from "@/app/api/db/charactersActions";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const search = searchParams.get("search") || "";

    // Pagination logic
    const paginatedCharacters = await getMovieCharacters(page, limit, search);

    return NextResponse.json(paginatedCharacters);
}

export async function POST(req: NextRequest) {
    const { type, characterId, characterData, sceneId, movieId } = await req.json();

    switch (type) {
        case "CREATE":
            if (!characterData) {
                return NextResponse.json({ error: "Invalid character data" }, { status: 400 });
            }
            const newCharacter = await createCharacter(characterData);
            return NextResponse.json(newCharacter);
        
        case "GET_SCENE_CHARACTERS": {
            const charactersData = await getSceneCharacters(movieId ?? null, sceneId ?? null);
            return NextResponse.json(charactersData)
        }

        case "GET_CHARACTER_BY_ID":
            if (!characterId) {
                return NextResponse.json({ error: "Invalid character ID" }, { status: 400 });
            }
            const characterDetails = await getCharacterById(characterId);
            if (!characterDetails) {
                return NextResponse.json({ error: "Character not found" }, { status: 404 });
            }
            return NextResponse.json(characterDetails);

        case "EDIT":
            if (!characterId || !characterData) {
                return NextResponse.json({ error: "Invalid character ID or data" }, { status: 400 });
            }
            const editedCharacter = await editCharacter(characterId, characterData);
            return NextResponse.json(editedCharacter);

        case "DELETE":
            if (!characterId) {
                return NextResponse.json({ error: "Invalid character ID" }, { status: 400 });
            }
            const deleteSuccess = await deleteCharacter(characterId);
            return NextResponse.json(deleteSuccess);

        default:
            return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
}
