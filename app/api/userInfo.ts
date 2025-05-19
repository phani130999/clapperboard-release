import { db } from "@/app/db/db";
import { eq } from "drizzle-orm";
import { users } from "@/app/db/schema";

export const getUserId = async () => {

    const userEmail = "default.user@email.com"

    const user = await db.query.users.findFirst({
        where: eq(users.email, userEmail),
        columns: { id: true }
    });

    if (!user) throw new Error("User not found in database");

    return user.id;
};
