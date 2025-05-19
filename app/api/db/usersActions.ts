import { db } from "@/app/db/db";
import { users } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { getUserId } from "@/app/api/userInfo";

export async function getUserDetails() {
    const userId = await getUserId();

    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, name: true, email: true }
    });

    if (!user) {
        throw new Error("User not found.");
    }

    return user;
}