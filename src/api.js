const KEY = import.meta.env.VITE_TMDB_KEY
const BASE = 'https://api.themoviedb.org/3'

export const img = (path, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

async function get(path, params = {}) {
  if (!KEY) throw new Error('Missing API key. Add VITE_TMDB_KEY to a .env file and restart the dev server.')
  const qs = new URLSearchParams({ api_key: KEY, language: 'en-US', ...params })
  const res = await fetch(`${BASE}${path}?${qs}`)
  if (!res.ok) throw new Error(`TMDB request failed (${res.status}). Check your API key.`)
  return res.json()
}

export const categories = [
  { id: 'popular', label: 'Popular' },
  { id: 'top_rated', label: 'Top rated' },
  { id: 'now_playing', label: 'In theaters' },
  { id: 'upcoming', label: 'Coming soon' },
]

export const fetchList = (category, page) => get(`/movie/${category}`, { page })
export const searchMovies = (query, page) => get('/search/movie', { query, page })
export const fetchDetails = (id) => get(`/movie/${id}`, { append_to_response: 'videos' })
