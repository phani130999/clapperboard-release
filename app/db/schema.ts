import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// USERS Table
export const users = sqliteTable("users", {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// MOVIES Table
export const movies = sqliteTable("movies", {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    userId: text("user_id").references(() => users.id),
    logline: text("logline"),
    description: text("description"),
    defaultFlag: text("default_flag"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// CHARACTERS Table
export const characters = sqliteTable("characters", {
    id: text("id").primaryKey().notNull(),
    movieId: text("movie_id").references(() => movies.id),
    name: text("name").notNull(),
    gender: text("gender").notNull(),
    lowerAge: integer("lower_age"),
    upperAge: integer("upper_age"),
    type: text("type").notNull(),
    description: text("description"),
    expScreenTime: integer("exp_screen_time"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// SCENES Table
export const scenes = sqliteTable("scenes", {
    id: text("id").primaryKey().notNull(),
    movieId: text("movie_id").references(() => movies.id),
    number: integer("number").notNull(),
    act: text("act"),
    ieFlag: text("ie_flag"),
    slFlag: text("sl_flag"),
    type: text("type"),
    location: text("location"),
    subLocation: text("sub_location"),
    weather: text("weather"),
    time: text("time"),
    description: text("description"),
    expLength: integer("exp_length"),
    numExtras: integer("num_extras"),
    cameraNotes: text("camera_notes"),
    lightingNotes: text("lighting_notes"),
    soundNotes: text("sound_notes"),
    colorNotes: text("color_notes"),
    propNotes: text("prop_notes"),
    otherNotes: text("other_notes"),
    relevanceQuotient: text("relevance_quotient"),
    costquotient: text("cost_quotient"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// SCENE_CHAR_MAP Table
export const sceneCharMap = sqliteTable("scene_char_map", {
    id: text("id").primaryKey().notNull(),
    sceneId: text("scene_id").references(() => scenes.id),
    charId: text("char_id").references(() => characters.id),
    type: text("type"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// MONTAGES Table
export const montages = sqliteTable("montages", {
    id: text("id").primaryKey().notNull(),
    sceneId: text("scene_id").references(() => scenes.id),
    seqNumber: integer("seq_number").notNull(),
    ieFlag: text("ie_flag"),
    slFlag: text("sl_flag"),
    location: text("location"),
    subLocation: text("sub_location"),
    weather: text("weather"),
    time: text("time"),
    description: text("description"),
    expLength: integer("exp_length"),
    numExtras: integer("num_extras"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});
