import { InformationCard, CharactersCard, ScenesCard } from "../components";
import { getDashboardData, getDefaultMovieId } from "../api/getDashboardData";

export default async function DashboardPage() {
  const defaultMovieId = await getDefaultMovieId();
  const { movieDetails, characters, scenes } = await getDashboardData(defaultMovieId);

  return (
    <div className="space-y-6 p-6 w-full lg:w-8/12 mx-auto">
      <div className="block text-3xl text-center font-semibold">Overview</div>
      <InformationCard data={movieDetails} />
      <CharactersCard data={characters} />
      <ScenesCard data={scenes} />
    </div>
  );
}