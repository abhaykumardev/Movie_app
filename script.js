class MovieExplorer {
  constructor() {
    this.API_KEY = "129ae02015efceb484546c5ac4be2b3a";
    this.BASE_URL = "https://api.themoviedb.org/3";
    this.IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
    this.FALLBACK_IMAGE_URL = "https://via.placeholder.com/500x750?text=No+Image";
    this.genres = {};
    this.currentPage = 1;
    this.isSearching = false;
    this.currentFilter = {
      genre: "",
      year: "",
      sort: ""
    };
    this.init();
  }

  async init() {
    await this.loadTrendingMovies();
  }

  async loadTrendingMovies() {
    try {
      const response = await fetch(
        `${this.BASE_URL}/trending/movie/week?api_key=${this.API_KEY}`
      );
      const data = await response.json();
      const trendingMovies = data.results.slice(0, 10); // Top 10 movies
      this.displayTrendingMovies(trendingMovies);
    } catch (error) {
      console.error("Error loading trending movies:", error);
      document.getElementById("trendingcarousel").innerHTML =
        "<div>Failed to load trending movies.</div>";
    }
  }

  displayTrendingMovies(movies) {
    const carousel = document.getElementById("trendingcarousel");
    carousel.innerHTML = movies
      .map((movie, index) => this.createTrendingCard(movie, index + 1))
      .join("");
  }

  createTrendingCard(movie, rank) {
    const posterPath = movie.poster_path
      ? `${this.IMAGE_BASE_URL}${movie.poster_path}`
      : this.FALLBACK_IMAGE_URL;

    const rating = movie.vote_average
      ? movie.vote_average.toFixed(1)
      : "N/A";

    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : "TBA";

    const genre =
      movie.genre_ids && movie.genre_ids.length > 0
        ? movie.genre_ids.slice(0, 2).join(", ")
        : "N/A";

    return `
      <div class="trending-card">
        <img src="${posterPath}" alt="${movie.title} Poster" class="movie-poster" loading="lazy"
          onerror="this.src='${this.FALLBACK_IMAGE_URL}'" />
        <div class="trending-rank">#${rank}</div>
        <div class="trending-overlay">
          <div class="trending-title">${movie.title}</div>
          <div class="trending-details">
            <span class="trending-year">${year}</span>
            <span class="trending-rating">${rating}</span>
          </div>
          <div class="trending-genres">${genre}</div>
        </div>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new MovieExplorer();
});
