export type TmdbMovieResult = {
  id: number;
  title?: string;
  original_title?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string;
};

export type TmdbTvResult = {
  id: number;
  name?: string;
  original_name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
};

export type TmdbVideoItem = {
  key: string;
  name: string;
  type: string;
  site: string;
};

export type TmdbImageItem = {
  file_path: string;
};

export type TmdbProviderItem = {
  provider_name: string;
  logo_path: string;
};

export type TmdbWatchRegion = {
  link?: string;
  flatrate?: TmdbProviderItem[];
  rent?: TmdbProviderItem[];
  buy?: TmdbProviderItem[];
};

export type TmdbCastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
};

export type TmdbCrewMember = {
  job: string;
  name: string;
  profile_path: string | null;
};

export type TmdbMovieDetails = TmdbMovieResult & {
  tagline?: string | null;
  runtime?: number | null;
  vote_count?: number;
  popularity?: number;
  status?: string | null;
  budget?: number;
  revenue?: number;
  imdb_id?: string | null;
  original_language?: string | null;
  spoken_languages?: Array<{ english_name?: string; name?: string }>;
  production_countries?: Array<{ name: string }>;
  production_companies?: Array<{ name: string; logo_path: string | null }>;
  genres?: Array<{ id: number; name: string }>;
};

export type TmdbTvDetails = TmdbTvResult & {
  tagline?: string | null;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  vote_count?: number;
  popularity?: number;
  status?: string | null;
  original_language?: string | null;
  spoken_languages?: Array<{ english_name?: string; name?: string }>;
  production_countries?: Array<{ name: string }>;
  production_companies?: Array<{ name: string; logo_path: string | null }>;
  genres?: Array<{ id: number; name: string }>;
  seasons?: Array<{
    id: number;
    season_number: number;
    name: string;
    episode_count?: number;
    air_date?: string | null;
    poster_path?: string | null;
  }>;
  created_by?: Array<{ name: string }>;
};
