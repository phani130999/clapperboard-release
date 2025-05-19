import { NextRequest, NextResponse } from "next/server";
import {
    getUserMovies,
    getMovies,
    getDefaultMovie,
    updateDefaultMovie,
    createMovie,
    getMovieById,
    editMovie,
    deleteMovie
} from "@/app/api/db/moviesActions";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const search = searchParams.get("search") || "";
    const defaultParam = searchParams.get("default") || "";

    if (defaultParam === "true") {
        const defaultMovie = await getDefaultMovie();
        return NextResponse.json(defaultMovie);
    }

    // If no pagination params are provided, return all movies
    if (!searchParams.has("page") && !searchParams.has("limit")) {
        const movies = await getUserMovies();
        return NextResponse.json(movies);
    }

    // Pagination logic
    const paginatedMovies = await getMovies(page, limit, search);

    return NextResponse.json(paginatedMovies);
}

export async function POST(req: NextRequest) {
    const { type, movieId, movieData } = await req.json();

    switch (type) {
        case "UPDATE_DEFAULT":
            if (!movieId) {
                return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
            }
            const updateSuccess = await updateDefaultMovie(movieId);
            return updateSuccess
                ? NextResponse.json({ message: "Default movie updated successfully" })
                : NextResponse.json({ error: "Failed to update default movie" }, { status: 500 });

        case "CREATE":
            if (!movieData) {
                return NextResponse.json({ error: "Invalid movie data" }, { status: 400 });
            }
            const newMovie = await createMovie(movieData);
            return NextResponse.json(newMovie);
        
        case "GET_MOVIE_BY_ID":
            if (!movieId) {
                return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
            }
            const movieDetailsByID = await getMovieById(movieId);
            if (!movieDetailsByID) {
                return NextResponse.json({ error: "Movie not found" }, { status: 404 });
            }
            return NextResponse.json(movieDetailsByID);

        case "EDIT":
            if (!movieId || !movieData) {
                return NextResponse.json({ error: "Invalid movie ID or data" }, { status: 400 });
            }
            const editedMovie = await editMovie(movieId, movieData);
            return NextResponse.json(editedMovie);

        case "DELETE":
            if (!movieId) {
                return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
            }
            const deleteSuccess = await deleteMovie(movieId);
            return NextResponse.json(deleteSuccess);

        default:
            return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
}
