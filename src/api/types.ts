/** Shapes returned by OMDb (via our /api/omdb proxy). OMDb uses "N/A" for missing values. */

export interface MovieSummary {
  imdbID: string;
  Title: string;
  Year: string;
  Type: 'movie' | 'series' | 'episode' | 'game' | string;
  Poster: string;
}

export interface SearchResponse {
  Search: MovieSummary[];
  totalResults: string;
  Response: 'True';
}

export interface Rating {
  Source: string;
  Value: string;
}

export interface MovieDetails extends MovieSummary {
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Ratings: Rating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  BoxOffice?: string;
  Response: 'True';
}

export interface SearchPage {
  movies: MovieSummary[];
  total: number;
}
