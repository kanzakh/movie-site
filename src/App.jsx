import { useEffect, useState } from 'react'
import { categories, fetchList, searchMovies, fetchDetails, img } from './api.js'

function useDebounced(value, ms = 400) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function MovieCard({ movie, onOpen }) {
  const poster = img(movie.poster_path)
  const year = movie.release_date?.slice(0, 4)
  return (
    <button className="card" onClick={() => onOpen(movie.id)}>
      <div className="poster">
        {poster ? <img src={poster} alt="" loading="lazy" /> : <span className="noposter">No poster</span>}
        {movie.vote_average > 0 && <span className="score">{movie.vote_average.toFixed(1)}</span>}
      </div>
      <h3>{movie.title}</h3>
      {year && <p className="year">{year}</p>}
    </button>
  )
}

function Detail({ id, onClose }) {
  const [movie, setMovie] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDetails(id).then(setMovie).catch((e) => setError(e.message))
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [id, onClose])

  const trailer = movie?.videos?.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
  const backdrop = img(movie?.backdrop_path, 'w780')

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        {error && <p className="error">{error}</p>}
        {!movie && !error && <p className="status">Loading…</p>}
        {movie && (
          <>
            {backdrop && <img className="hero-img" src={backdrop} alt="" />}
            <div className="modal-body">
              <h2>{movie.title}</h2>
              {movie.tagline && <p className="tagline">{movie.tagline}</p>}
              <p className="facts">
                {[movie.release_date?.slice(0, 4), movie.runtime && `${movie.runtime} min`, movie.vote_average > 0 && `${movie.vote_average.toFixed(1)} / 10`]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <ul className="genres">
                {movie.genres.map((g) => <li key={g.id}>{g.name}</li>)}
              </ul>
              <p className="overview">{movie.overview || 'No description available.'}</p>
              {trailer && (
                <a className="btn" href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer">
                  Watch trailer
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [category, setCategory] = useState('popular')
  const [query, setQuery] = useState('')
  const q = useDebounced(query.trim())
  const [page, setPage] = useState(1)
  const [movies, setMovies] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  // Reset to page 1 whenever the search or category changes
  useEffect(() => { setPage(1) }, [category, q])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const request = q ? searchMovies(q, page) : fetchList(category, page)
    request
      .then((data) => {
        if (cancelled) return
        setMovies((prev) => (page === 1 ? data.results : [...prev, ...data.results]))
        setTotalPages(data.total_pages)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [category, q, page])

  const heading = q ? `Results for “${q}”` : categories.find((c) => c.id === category).label

  return (
    <>
      <header className="top">
        <p className="brand">Second Feature</p>
        <h1>What are we watching tonight?</h1>
        <input
          className="search"
          type="search"
          placeholder="Search for a movie"
          aria-label="Search for a movie"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <nav className="tabs" aria-label="Movie lists">
          {categories.map((c) => (
            <button
              key={c.id}
              className={!q && c.id === category ? 'tab active' : 'tab'}
              onClick={() => { setQuery(''); setCategory(c.id) }}
            >
              {c.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <h2 className="list-title">{heading}</h2>
        {error && <p className="error">{error}</p>}
        {!error && !loading && movies.length === 0 && (
          <p className="status">No movies found. Try a different title.</p>
        )}
        <div className="grid">
          {movies.map((m) => <MovieCard key={m.id} movie={m} onOpen={setOpenId} />)}
        </div>
        {loading && <p className="status">Loading…</p>}
        {!loading && !error && page < totalPages && (
          <button className="btn more" onClick={() => setPage((p) => p + 1)}>Show more</button>
        )}
      </main>

      {openId && <Detail id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
