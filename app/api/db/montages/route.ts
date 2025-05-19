import { NextRequest, NextResponse } from "next/server";
import {
    getMovieMontages,
    getSequenceById,
    createSequence,
    editSequence,
    deleteSequence
} from "@/app/api/db/montagesActions";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const search = searchParams.get("search") || "";

    // Pagination logic
    const paginatedMontages = await getMovieMontages(page, limit, search);

    return NextResponse.json(paginatedMontages);
}

export async function POST(req: NextRequest) {
    const { type, sequenceId, sequenceData } = await req.json();

    switch (type) {
        case "CREATE":
            if (!sequenceData) {
                return NextResponse.json({ error: "Invalid montage data" }, { status: 400 });
            }
            const newMontage = await createSequence(sequenceData);
            return NextResponse.json(newMontage);

        case "GET_MONTAGE_BY_ID":
            if (!sequenceId) {
                return NextResponse.json({ error: "Invalid montage ID" }, { status: 400 });
            }
            const montageDetails = await getSequenceById(sequenceId);
            if (!montageDetails) {
                return NextResponse.json({ error: "Montage not found" }, { status: 404 });
            }
            return NextResponse.json(montageDetails);

        case "EDIT":
            if (!sequenceId || !sequenceData) {
                return NextResponse.json({ error: "Invalid montage ID or data" }, { status: 400 });
            }
            const editedMontage = await editSequence(sequenceId, sequenceData);
            return NextResponse.json(editedMontage);

        case "DELETE":
            if (!sequenceId) {
                return NextResponse.json({ error: "Invalid montage ID" }, { status: 400 });
            }
            const deleteSuccess = await deleteSequence(sequenceId);
            return NextResponse.json(deleteSuccess);

        default:
            return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
}
