import axios from 'axios';

const TMDB = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: { Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}` },
  timeout: 8000,
});

export async function searchPerson(query) {
  const { data } = await TMDB.get('/search/person', {
    params: { query, language: 'en-US', page: 1 }
  });
  return data.results[0] || null;
}

export async function searchPersonList(query) {
  const { data } = await TMDB.get('/search/person', {
    params: { query, language: 'en-US', page: 1 }
  });
  return data.results;
}

export async function getPersonDetails(personId) {
  const { data } = await TMDB.get(`/person/${personId}`, {
    params: { language: 'en-US', append_to_response: 'movie_credits,tv_credits' }
  });
  return data;
}

export async function getPersonCredits(personId) {
  const { data } = await TMDB.get(`/person/${personId}/combined_credits`, {
    params: { language: 'en-US' }
  });
  return data;
}

export async function getPersonMovieCredits(personId) {
  const { data } = await TMDB.get(`/person/${personId}/movie_credits`, {
    params: { language: 'en-US' }
  });
  return data;
}

export async function getPersonTVCredits(personId) {
  const { data } = await TMDB.get(`/person/${personId}/tv_credits`, {
    params: { language: 'en-US' }
  });
  return data;
}