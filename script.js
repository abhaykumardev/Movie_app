class MovieExplorer {
  constructor() {
    this.API_KEY = "129ae02015efceb484546c5ac4be2b3a";
    this.BASE_URL = "https://api.themoviedb.org/3";
    this.IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
    this.FALLBACK_IMAGE_URL =
      "https://via.placeholder.com/500x750?text=No+Image";
    this.genres = {};
    this.currentPage = 1;
    this.isSearching = false;
    this.currentFilter = {
      genre: "",
      year: "",
      sort: "",
    };
    this.init();
  }

  async init() {
    await this.loadTrendingMovies();
  }

  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    const genreSelect = document.getElementById("genreSelect");
    const yearSelect = document.getElementById("yearSelect");
    const sortSelect = document.getElementById("sortSelect");
    const clearbtn = document.getElementById("clearbtn");
    const trendingprev = document.getElementById("trendingprev");
    const trendingnext = document.getElementById("trendingnext");

    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.handleSearchInput(e.target.value);
      }, 500);
    });

    genreSelect.addEventListener("change", (e) => {
      this.handleFilterChange();
    });

    yearSelect.addEventListener("change", (e) => {
      this.handleFilterChange();
    });

    sortSelect.addEventListener("change", (e) => {
      this.handleFilterChange();
    });

    clearbtn.addEventListener("click", () => {
      this.clearallfilter();
    });

    trendingprev.addEventListener("click", () => {
      this.scrollcarousel("prev");
    });

    trendingnext.addEventListener("click", () => {
      this.scrollcarousel("next");
    });
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

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

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

  async loadrandomMovies() {
    try {
      const randompage = math.floor(math.random() * 500) + 1;

      let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${randompage}`;
      if (this.currentFilter.sort) {
        url += `&sort_by=${this.currentFilter.sort}`;
      }
      if (this.currentFilter.genre) {
        url += `&with_genres=${this.currentFilter.genre}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      const movies = data.results;
      this.displayMovies(data.results, "movielist");
    } catch (error) {
      console.error("Error in loading movies:", error);
      document.getElementById("movielist").innerHTML =
        "<div>Failed to load movies. Try Again</div>";
    }
  }

  displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (movies.length === 0) {
      container.innerHTML = `<div>
      <h2>No movies found.</h2>
      <p>Try adjusting your search or filter criteria.</p>
      </div>`;
      return;
    }
    container.innerHTML = movies
      .map((movie) => this.createMovieCard(movie))
      .join("");
  }

  createMovieCard(movie) {
    const posterPath = movie.poster_path
      ? `${this.IMAGE_BASE_URL}${movie.poster_path}`
      : this.FALLBACK_IMAGE_URL;

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : "TBA";

    const description = movie.overview
      ? movie.overview
      : "No description available.";

    const genre =
      movie.genre_ids && movie.genre_ids.length > 0
        ? movie.genre_ids.slice(0, 2).join(", ")
        : "N/A";

    return `
      <div class="movie-card">
        <img src="${posterPath}" alt="${movie.title} Poster" class="movie-poster" loading="lazy"
          onerror="this.src='${this.FALLBACK_IMAGE_URL}'" />
      
        <div class="movie-info">
          <div class="movie-title">${movie.title}</div>
          <div class="movie-info">
            <span class="movie-details">${year}</span>
            <span class="movie-rating">${rating}</span>
          </div>
          <div class="movie-genres">${genre}</div>
          <div class="movie-description">${description}</div>
        </div>
      </div>
    `;
  }

  async handleSearchInput(query) {
    // Implementation for handling search input
    const trimmedQuery = query.trim();
    const clearbtn = document.getElementById("clearbtn");
    const sectiontitle = document.getElementById("randomsectiontitle");

    const trendingsection = document.getElementById("trendingsection");

    if (trimmedQuery === "") {
      this.isSearching = false;
      clearbtn.classList.remove("show");
      sectiontitle.textContent = "Discover Movies";
      trendingsection.style.display = "block";
      await this.loadrandomMovies();
      return;
    }

    this.isSearching = true;
    clearbtn.classList.add("show");
    sectiontitle.textContent = `Search Results for "${trimmedQuery}"`;
    trendingsection.style.display = "none";
    try {
      document.getElementById("movielist").innerHTML =
        "<div>Loading search results...</div>";
      let url = `${this.BASE_URL}/search/movie?api_key=${
        this.API_KEY
      }&query=${encodeURIComponent(trimmedQuery)}&page=1`;
      if (this.currentFilter.year) {
        url += `&primary_realese_year=${this.currentFilter.year}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      const movies = data.results;
      if (this.currentFilter.genre) {
        results = movies.filter((movie) =>
          movie.genre_ids.includes(parseInt(this.currentFilter.genre, 10))
        );
      }

      if (this.currentFilter.sort) {
        results = this.sortMovies(results, this.currentFilter.sort);
      }
      this.displayMovies(results, "movielist");
    } catch (error) {
      console.error("Error searching movies:", error);
      document.getElementById("movielist").innerHTML =
        "<div>Failed to load search results.</div>";
    }
  }

  sortMovies(movies, sortBy) {
    switch (sortBy) {
      case "popularity.desc":
        return movies.sort((a, b) => b.popularity - a.popularity);

      case "vote_average.desc":
        return movies.sort((a, b) => b.vote_average - a.vote_average);

      case "release_date.desc":
        return movies.sort(
          (a, b) => new Date(b.release_date) - new Date(a.release_date)
        );

      case "title.asc":
        return movies.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return movies;
    }
  }

  async handleFilterChange() {
    const searchInput = document.getElementById("searchInput");
    const genreSelect = document.getElementById("genreSelect");
    const yearSelect = document.getElementById("yearSelect");
    const sortSelect = document.getElementById("sortSelect");
    const clearbtn = document.getElementById("clearbtn");
    const trendingsection = document.getElementById("trendingsection");

    this.currentFilter = {
      genre: genreSelect.value,
      year: yearSelect.value,
      sort: sortSelect.value,
    };

    if (
      this.currentFilter.genre ||
      this.currentFilter.year ||
      this.currentFilter.sort ||
      searchInput.value.trim()
    ) {
      clearbtn.classList.add("show");
    } else {
      clearbtn.classList.remove("show");
    }

    if (searchInput.value.trim()) {
      trendingsection.style.display = "none";
      await this.handleSearchInput(searchInput.value);
    } else {
      if (
        this.currentFilter.genre ||
        this.currentFilter.year ||
        this.currentFilter.sort
      ) {
        trendingsection.style.display = "none";
        document.getElementById("randomsectiontitle").textContent =
          "Filtered Movies";
      } else {
        trendingsection.style.display = "block";
        document.getElementById("randomsectiontitle").textContent =
          "Discover Movies";
      }
      await this.loadfilterMovies();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new MovieExplorer();
});
