import { NextRequest, NextResponse } from "next/server";
import {
    getMovieScenes,
    getSceneById,
    createScene,
    editScene,
    deleteScene
} from "@/app/api/db/scenesActions";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const search = searchParams.get("search") || "";

    // Pagination logic
    const paginatedScenes = await getMovieScenes(page, limit, search);

    return NextResponse.json(paginatedScenes);
}

export async function POST(req: NextRequest) {
    const { type, sceneId, sceneData } = await req.json();

    switch (type) {
        case "CREATE":
            if (!sceneData) {
                return NextResponse.json({ error: "Invalid scene data" }, { status: 400 });
            }
            const newScene = await createScene(sceneData);
            return NextResponse.json(newScene);

        case "GET_SCENE_BY_ID":
            if (!sceneId) {
                return NextResponse.json({ error: "Invalid scene ID" }, { status: 400 });
            }
            const sceneDetails = await getSceneById(sceneId);
            if (!sceneDetails) {
                return NextResponse.json({ error: "Scene not found" }, { status: 404 });
            }
            return NextResponse.json(sceneDetails);

        case "EDIT":
            if (!sceneId || !sceneData) {
                return NextResponse.json({ error: "Invalid scene ID or data" }, { status: 400 });
            }
            const editedScene = await editScene(sceneId, sceneData);
            return NextResponse.json(editedScene);

        case "DELETE":
            if (!sceneId) {
                return NextResponse.json({ error: "Invalid scene ID" }, { status: 400 });
            }
            const deleteSuccess = await deleteScene(sceneId);
            return NextResponse.json(deleteSuccess);

        default:
            return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
}