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
    this.currentFilter = { genre: "", year: "", sort: "" };

    this.init();
  }

  async init() {
    await this.loadHeroSection();
    await this.loadTrendingMovies();
    await this.loadGenres();
    this.setupYearFilter();
    this.setupEventListeners();
    await this.loadRandomMovies();
  }

  //play trailer functionality

  async playTrailer(movieId) {
    const modal = document.getElementById("trailerModal");
    const iframe = document.getElementById("trailerFrame");
    const closeBtn = document.getElementById("closeTrailer");

    try {
      const response = await fetch(
        `${this.BASE_URL}/movie/${movieId}/videos?api_key=${this.API_KEY}`
      );
      const data = await response.json();

      // Filter for official YouTube trailer
      const trailer = data.results.find(
        (vid) =>
          vid.site === "YouTube" &&
          (vid.type === "Trailer" || vid.type === "Teaser")
      );

      if (trailer) {
        iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
        modal.classList.add("show");
      } else {
        alert("No trailer available for this movie.");
      }

      // Close modal
      closeBtn.onclick = () => {
        iframe.src = "";
        modal.classList.remove("show");
      };

      // Close when clicking outside the video
      modal.onclick = (e) => {
        if (e.target === modal) {
          iframe.src = "";
          modal.classList.remove("show");
        }
      };
    } catch (error) {
      console.error("Error fetching trailer:", error);
      alert("Failed to load trailer.");
    }
  }
  // -----------------------------
  // Hero Section
  // -----------------------------

  async loadHeroSection() {
    try {
      const response = await fetch(
        `${this.BASE_URL}/trending/movie/week?api_key=${this.API_KEY}`
      );
      const data = await response.json();
      const topMovies = data.results.slice(0, 3); // top 3 trending

      const heroSlider = document.getElementById("heroSlider");
      heroSlider.innerHTML = topMovies
        .map((movie, index) => this.createHeroSlide(movie, index === 0))
        .join("");

      this.startHeroSlider();
    } catch (error) {
      console.error("Error loading hero section:", error);
      document.getElementById("heroSlider").innerHTML =
        "<div>Failed to load featured movies.</div>";
    }
  }

  createHeroSlide(movie, isActive) {
    const backdropPath = movie.backdrop_path
      ? `${this.IMAGE_BASE_URL}${movie.backdrop_path}`
      : this.FALLBACK_IMAGE_URL;

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : "TBA";

    return `
    <div class="hero-slide ${isActive ? "active" : ""}" 
         style="background-image: url('${backdropPath}')">
      <div class="hero-overlay">
        <div class="hero-title">${movie.title}</div>
        <div class="hero-info">⭐ ${rating} | 📅 ${year}</div>
        <button class="play-btn" onclick="app.playTrailer(${movie.id})">
  ▶ Play Trailer
</button>
      </div>
    </div>
  `;
  }

  startHeroSlider() {
    const slides = document.querySelectorAll(".hero-slide");
    let currentSlide = 0;

    setInterval(() => {
      slides[currentSlide].classList.remove("active");
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add("active");
    }, 5000); // change slide every 5 seconds
  }

  // -----------------------------
  // Event Listeners Setup
  // -----------------------------
  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    const genreSelect = document.getElementById("genreSelect");
    const yearSelect = document.getElementById("yearSelect");
    const sortSelect = document.getElementById("sortSelect");
    const clearBtn = document.getElementById("clearbtn");
    const trendingPrev = document.getElementById("trendingprev");
    const trendingNext = document.getElementById("trendingnext");

    let searchTimeout;

    // Debounced search
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.handleSearchInput(e.target.value);
      }, 500);
    });

    genreSelect.addEventListener("change", () => this.handleFilterChange());
    yearSelect.addEventListener("change", () => this.handleFilterChange());
    sortSelect.addEventListener("change", () => this.handleFilterChange());

    clearBtn.addEventListener("click", () => this.clearAllFilters());
    trendingPrev.addEventListener("click", () => this.scrollCarousel("prev"));
    trendingNext.addEventListener("click", () => this.scrollCarousel("next"));

    const loadMoreBtn = document.getElementById("loadMoreBtn");
    loadMoreBtn.addEventListener("click", () => {
      this.loadMoreMovies();
    });
  }

  //load more button functionality

  async loadMoreMovies() {
    try {
      this.currentPage++; // go to next page

      let url;

      if (this.isSearching) {
        // When user is searching
        const searchInput = document.getElementById("searchInput").value.trim();
        url = `${this.BASE_URL}/search/movie?api_key=${
          this.API_KEY
        }&query=${encodeURIComponent(searchInput)}&page=${this.currentPage}`;
      } else if (
        this.currentFilter.genre ||
        this.currentFilter.year ||
        this.currentFilter.sort
      ) {
        // When filters are applied
        url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${this.currentPage}`;
        if (this.currentFilter.sort)
          url += `&sort_by=${this.currentFilter.sort}`;
        if (this.currentFilter.genre)
          url += `&with_genres=${this.currentFilter.genre}`;
        if (this.currentFilter.year)
          url += `&primary_release_year=${this.currentFilter.year}`;
      } else {
        // Default random/discover mode
        url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${this.currentPage}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      const movies = data.results || [];
      const container = document.getElementById("movielist");

      // Append instead of replace:
      container.insertAdjacentHTML(
        "beforeend",
        movies.map((m) => this.createMovieCard(m)).join("")
      );

      // Hide button if no more pages
      if (this.currentPage >= data.total_pages) {
        document.getElementById("loadMoreBtn").style.display = "none";
      }
    } catch (error) {
      console.error("Error loading more movies:", error);
    }
  }

  // -----------------------------
  // Load Genres
  // -----------------------------
  async loadGenres() {
    try {
      const response = await fetch(
        `${this.BASE_URL}/genre/movie/list?api_key=${this.API_KEY}`
      );
      const data = await response.json();
      data.genres.forEach((genre) => {
        this.genres[genre.id] = genre.name;
      });

      const genreSelect = document.getElementById("genreSelect");
      data.genres.forEach((genre) => {
        const option = document.createElement("option");
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading genres:", error);
    }
  }

  // -----------------------------
  // Year Filter Setup
  // -----------------------------
  setupYearFilter() {
    const yearSelect = document.getElementById("yearSelect");
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1900; year--) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
  }

  // -----------------------------
  // Trending Movies
  // -----------------------------
  async loadTrendingMovies() {
    try {
      const response = await fetch(
        `${this.BASE_URL}/trending/movie/week?api_key=${this.API_KEY}`
      );
      const data = await response.json();
      const trendingMovies = data.results.slice(0, 10);
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

    const genreNames =
      movie.genre_ids?.length > 0
        ? movie.genre_ids
            .slice(0, 2)
            .map((id) => this.genres[id] || "Unknown")
            .join(", ")
        : "N/A";

    return `
      <div class="trending-card">
        <img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy"
          onerror="this.src='${this.FALLBACK_IMAGE_URL}'" />
        <div class="trending-rank">#${rank}</div>
        <div class="trending-overlay">
          <div class="trending-title">${movie.title}</div>
          <div class="trending-details">
            <span class="trending-year">${year}</span>
            <span class="trending-rating">⭐ ${rating}</span>
          </div>
          <div class="trending-genres">${genreNames}</div>
        </div>
      </div>
    `;
  }

  // -----------------------------
  // Discover / Random Movies
  // -----------------------------
  async loadRandomMovies() {
    try {
      const randomPage = Math.floor(Math.random() * 500) + 1;
      let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${randomPage}`;

      if (this.currentFilter.sort) url += `&sort_by=${this.currentFilter.sort}`;
      if (this.currentFilter.genre)
        url += `&with_genres=${this.currentFilter.genre}`;
      if (this.currentFilter.year)
        url += `&primary_release_year=${this.currentFilter.year}`;

      const response = await fetch(url);
      const data = await response.json();
      this.displayMovies(data.results, "movielist");
    } catch (error) {
      console.error("Error loading random movies:", error);
      document.getElementById("movielist").innerHTML =
        "<div>Failed to load movies. Try again later.</div>";
    }
  }

  // -----------------------------
  // Display Movie Cards
  // -----------------------------
  displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!movies || movies.length === 0) {
      container.innerHTML = `
        <div>
          <h2>No movies found.</h2>
          <p>Try adjusting your search or filter criteria.</p>
        </div>`;
      return;
    }

    container.innerHTML = movies.map((m) => this.createMovieCard(m)).join("");
  }

  createMovieCard(movie) {
    const posterPath = movie.poster_path
      ? `${this.IMAGE_BASE_URL}${movie.poster_path}`
      : this.FALLBACK_IMAGE_URL;

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : "TBA";
    const description = movie.overview || "No description available.";
    const genreNames =
      movie.genre_ids?.length > 0
        ? movie.genre_ids
            .slice(0, 2)
            .map((id) => this.genres[id] || "Unknown")
            .join(", ")
        : "N/A";

    return `
      <div class="movie-card">
        <img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy"
          onerror="this.src='${this.FALLBACK_IMAGE_URL}'" />

          

        <div class="movie-info">
          <div class="movie-title">${movie.title}</div>
          <div class="movie-meta">
            <span>${year}</span>
            <span>⭐ ${rating}</span>
          </div>
          <div class="movie-genres">${genreNames}</div>
          <div class="movie-description">${description}</div>
        </div>
      </div>
    `;
  }

  // -----------------------------
  // Search Functionality
  // -----------------------------
  async handleSearchInput(query) {
    const trimmedQuery = query.trim();
    const clearBtn = document.getElementById("clearbtn");
    const sectionTitle = document.getElementById("randomsectiontitle");
    const trendingSection = document.getElementById("trendingsection");

    if (trimmedQuery === "") {
      this.isSearching = false;
      clearBtn.classList.remove("show");
      sectionTitle.textContent = "Discover Movies";
      trendingSection.style.display = "block";
      await this.loadRandomMovies();
      return;
    }

    this.isSearching = true;
    clearBtn.classList.add("show");
    sectionTitle.textContent = `Search Results for "${trimmedQuery}"`;
    trendingSection.style.display = "none";

    try {
      document.getElementById("movielist").innerHTML =
        "<div>Loading search results...</div>";

      let url = `${this.BASE_URL}/search/movie?api_key=${
        this.API_KEY
      }&query=${encodeURIComponent(trimmedQuery)}&page=1`;

      if (this.currentFilter.year)
        url += `&primary_release_year=${this.currentFilter.year}`;

      const response = await fetch(url);
      const data = await response.json();
      let results = data.results;

      if (this.currentFilter.genre) {
        results = results.filter((movie) =>
          movie.genre_ids.includes(parseInt(this.currentFilter.genre))
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

  // -----------------------------
  // Filter Logic
  // -----------------------------
  async handleFilterChange() {
    const searchInput = document.getElementById("searchInput");
    const genreSelect = document.getElementById("genreSelect");
    const yearSelect = document.getElementById("yearSelect");
    const sortSelect = document.getElementById("sortSelect");
    const clearBtn = document.getElementById("clearbtn");
    const trendingSection = document.getElementById("trendingsection");

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
      clearBtn.classList.add("show");
    } else {
      clearBtn.classList.remove("show");
    }

    if (searchInput.value.trim()) {
      trendingSection.style.display = "none";
      await this.handleSearchInput(searchInput.value);
    } else {
      if (
        this.currentFilter.genre ||
        this.currentFilter.year ||
        this.currentFilter.sort
      ) {
        trendingSection.style.display = "none";
        document.getElementById("randomsectiontitle").textContent =
          "Filtered Movies";
      } else {
        trendingSection.style.display = "block";
        document.getElementById("randomsectiontitle").textContent =
          "Discover Movies";
      }
      await this.loadFilterMovies();
    }
  }

  async loadFilterMovies() {
    try {
      document.getElementById("movielist").innerHTML =
        "<div>Loading filtered movies...</div>";

      let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=1`;
      if (this.currentFilter.sort) url += `&sort_by=${this.currentFilter.sort}`;
      if (this.currentFilter.genre)
        url += `&with_genres=${this.currentFilter.genre}`;
      if (this.currentFilter.year)
        url += `&primary_release_year=${this.currentFilter.year}`;

      const response = await fetch(url);
      const data = await response.json();
      this.displayMovies(data.results, "movielist");
    } catch (error) {
      console.error("Error loading filtered movies:", error);
      document.getElementById("movielist").innerHTML =
        "<div>Failed to load filtered movies. Try again later.</div>";
    }
  }

  // -----------------------------
  // Clear All Filters
  // -----------------------------
  clearAllFilters() {
    const searchInput = document.getElementById("searchInput");
    const genreSelect = document.getElementById("genreSelect");
    const yearSelect = document.getElementById("yearSelect");
    const sortSelect = document.getElementById("sortSelect");
    const clearBtn = document.getElementById("clearbtn");
    const trendingSection = document.getElementById("trendingsection");
    const sectionTitle = document.getElementById("randomsectiontitle");

    searchInput.value = "";
    genreSelect.value = "";
    yearSelect.value = "";
    sortSelect.value = "";

    this.currentFilter = { genre: "", year: "", sort: "" };
    this.isSearching = false;
    clearBtn.classList.remove("show");
    sectionTitle.textContent = "Discover Movies";
    trendingSection.style.display = "block";

    this.loadRandomMovies();
  }

  // -----------------------------
  // Carousel Scrolling
  // -----------------------------
  scrollCarousel(direction) {
    const carousel = document.getElementById("trendingcarousel");
    const scrollAmount = 320;
    carousel.scrollBy({
      left: direction === "prev" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new MovieExplorer();
});
