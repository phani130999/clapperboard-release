import { NextRequest, NextResponse } from "next/server";
import {
    getUserDetails
} from "@/app/api/db/usersActions";

export async function GET(req: NextRequest) {

    void req;

    const user = await getUserDetails();

    return NextResponse.json(user);
}