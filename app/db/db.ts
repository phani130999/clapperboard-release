import dotenv from 'dotenv';
dotenv.config();

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
    url: process.env.DATABASE_URL!,
    syncUrl: undefined,
    authToken: undefined
});

export const db = drizzle(client, { schema });