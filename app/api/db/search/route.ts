import { NextRequest, NextResponse } from "next/server";
import { fetchSearchResults } from "@/app/api/db/searchActions";

export async function POST(req: NextRequest) {
    try {
        const { entity, filters, page, limit } = await req.json();

        if (!entity || !Array.isArray(filters)) {
            return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
        }

        const results = await fetchSearchResults(entity, filters, page, limit);
        return NextResponse.json({ results }, { status: 200 });
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
