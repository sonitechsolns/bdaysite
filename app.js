/*
  Birthday site configuration
  ---------------------------
  Put the finished files into the folders in assets/ and add their relative paths here.
  Keep paths quoted, and separate each item with a comma.
*/
const APP_CONFIG = {
  birthdayName: "my favourite human",
  heroImage: "assets/hero.jpg",
  // Use the hero image as the portrait-reference by default. To use a different photo for the mosaic, set a path here.
  referenceImage: "",
  memoryPhotos: [
    // "assets/memories/photo-001.jpg",
    // "assets/memories/photo-002.jpg",
    // Add 400–1,500 image paths here.
  ],
  songs: [
    // { title: "Song title", src: "assets/music/song-01.mp3" },
    // Add 30–50 tracks here if you'd like a full playlist.
  ],
  spotifyPlaylistUrl: "",
  videoSrc: "" // Example: "assets/videos/friends-wishes.mp4"
};

(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const state = {
    uploadedHero: "",
    uploadedPhotos: [],
    uploadedSongs: [],
    uploadedVideo: "",
    activePhotos: [],
    currentSongIndex: -1,
    lightboxIndex: 0,
    imageSources: [],
    referenceImage: null,
    previousFocus: null
  };

  const heroPhoto = $("#heroPhoto");
  const portraitPlaceholder = $("#portraitPlaceholder");
  const mosaicGrid = $("#mosaicGrid");
  const mosaicRunway = $("#mosaicRunway");
  const mosaicStage = $("#mosaicStage");
  const explosionCopy = $("#explosionCopy");
  const hoverPreview = $("#hoverPreview");
  const hoverPreviewImage = $("#hoverPreviewImage");
  const hoverPreviewCaption = $("#hoverPreview span");
  const photoLightbox = $("#photoLightbox");
  const lightboxImage = $("#lightboxImage");
  const lightboxCaption = $("#lightboxCaption");
  const audioPlayer = $("#birthdayAudio");
  const songMenu = $("#songMenu");
  const changeSongBtn = $("#changeSongBtn");
  const songList = $("#songList");
  const nowPlaying = $("#nowPlaying");
  const audioStatus = $("#audioStatus");
  const playPauseBtn = $("#playPauseBtn");
  const slideshowTrack = $("#slideshowTrack");
  const birthdayVideo = $("#birthdayVideo");
  const videoPlaceholder = $("#videoPlaceholder");
  const uploadStatus = $("#uploadStatus");
  const spotifyLink = $("#spotifyLink");

  function normalisePhoto(item, index) {
    if (typeof item === "string") return { src: item, alt: `Memory ${index + 1}`, name: `Memory ${index + 1}` };
    return { src: item.src, alt: item.alt || item.title || `Memory ${index + 1}`, name: item.name || item.title || `Memory ${index + 1}` };
  }

  function currentPhotos() {
    if (state.uploadedPhotos.length) return state.uploadedPhotos;
    const configured = (APP_CONFIG.memoryPhotos || []).filter(Boolean).map(normalisePhoto);
    if (configured.length || !hasExactMosaic()) return configured;
    return window.MOSAIC_DATA.photos.map((_, i) => {
      const photo = exactPhoto(i);
      return { src: photo.mid, alt: photo.caption, name: photo.caption };
    });
  }

  /* ---------- Exact mosaic (built from assets/mosaic/mosaic-data.js) ---------- */
  function hasExactMosaic() {
    const data = window.MOSAIC_DATA;
    return !!(data && Array.isArray(data.cells) && data.cells.length && Array.isArray(data.photos) && data.photos.length);
  }

  function formatMemoryDate(value) {
    if (!value) return "a little memory";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "a little memory";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  function exactPhoto(index) {
    const data = window.MOSAIC_DATA;
    const [id, date] = data.photos[index];
    const base = data.base || "assets/mosaic/";
    return { id, tile: `${base}tile/${id}.jpg`, mid: `${base}mid/${id}.jpg`, full: `${base}full/${id}.jpg`, caption: formatMemoryDate(date) };
  }

  function renderExactMosaic() {
    const data = window.MOSAIC_DATA;
    const cols = data.cols, rows = data.rows;
    const frag = document.createDocumentFragment();
    data.cells.forEach((photoIndex, cellIndex) => {
      const row = Math.floor(cellIndex / cols);
      const col = cellIndex % cols;
      const photo = exactPhoto(photoIndex);
      const dx = (col - (cols - 1) / 2) * (6 + Math.random() * 7);
      const dy = (row - (rows - 1) / 2) * (6 + Math.random() * 7);
      const rot = (Math.random() * 2 - 1) * 38;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "memory-tile";
      button.dataset.src = photo.mid;
      button.dataset.photoIndex = String(photoIndex);
      button.dataset.caption = photo.caption;
      button.dataset.dx = dx.toFixed(1);
      button.dataset.dy = dy.toFixed(1);
      button.dataset.rot = rot.toFixed(1);
      button.setAttribute("aria-label", `Open memory — ${photo.caption}`);
      const img = document.createElement("img");
      img.src = photo.tile;
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      button.appendChild(img);
      frag.appendChild(button);
    });
    // The portrait also sits underneath the tiles, so sub-pixel seams show the face rather than a dark line.
    const underlay = document.createElement("div");
    underlay.className = "mosaic-underlay";
    underlay.setAttribute("aria-hidden", "true");
    if (data.overlay) underlay.style.backgroundImage = `url("${data.overlay}")`;
    frag.insertBefore(underlay, frag.firstChild);
    const overlay = document.createElement("div");
    overlay.className = "mosaic-overlay";
    overlay.setAttribute("aria-hidden", "true");
    if (data.overlay) overlay.style.backgroundImage = `url("${data.overlay}")`;
    frag.appendChild(overlay);

    clearMosaic();
    mosaicGrid.classList.add("is-exact");
    mosaicGrid.style.setProperty("--grid-cols", String(cols));
    mosaicGrid.style.aspectRatio = `${cols} / ${rows}`;
    mosaicGrid.style.setProperty("--scatter", "0");
    mosaicGrid.style.setProperty("--zoom", "0");
    mosaicGrid.style.transform = "scale(1)";
    mosaicGrid.appendChild(frag);
    // The lightbox walks through every photo in date order, not just the ones used as tiles.
    state.imageSources = data.photos.map((_, i) => {
      const photo = exactPhoto(i);
      return { src: photo.full, alt: `A memory — ${photo.caption}`, caption: `${photo.caption}  ·  ${i + 1} of ${data.photos.length}` };
    });
    updateExplosion.lastScatter = -1;
    const label = $("#memoryCountLabel");
    label.textContent = `${data.photos.length.toLocaleString()} memories · ${data.cells.length.toLocaleString()} tiles · one face`;
    label.removeAttribute("title");
    const note = $(".mosaic-note");
    if (note) note.innerHTML = `<span>✦</span> One face, made from ${data.photos.length.toLocaleString()} little pieces of happiness. Hover any tile — or tap it on a phone.`;
    renderSlideshow();
    if (typeof updateExplosion === "function") updateExplosion();
  }

  function currentSongs() {
    const configured = (APP_CONFIG.songs || []).filter(song => song && song.src).map(song => ({ title: song.title || fileTitle(song.src), src: song.src }));
    return state.uploadedSongs.length ? state.uploadedSongs : configured;
  }

  function fileTitle(path) {
    const tail = String(path || "").split(/[\\/]/).pop() || "Song";
    return tail.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Song";
  }

  function safeSetImage(image, src, onSuccess, onFailure) {
    if (!src) {
      image.removeAttribute("src");
      if (onFailure) onFailure();
      return;
    }
    image.onload = () => onSuccess && onSuccess();
    image.onerror = () => onFailure && onFailure();
    image.src = src;
  }

  function configureHero(src) {
    state.uploadedHero = src || "";
    if (!src) {
      heroPhoto.style.display = "none";
      portraitPlaceholder.style.display = "block";
      state.referenceImage = null;
      renderMosaic();
      return;
    }
    safeSetImage(heroPhoto, src, () => {
      heroPhoto.style.display = "block";
      portraitPlaceholder.style.display = "none";
      if (!APP_CONFIG.referenceImage) state.referenceImage = heroPhoto;
      renderMosaic();
    }, () => {
      heroPhoto.style.display = "none";
      portraitPlaceholder.style.display = "block";
      state.referenceImage = null;
      renderMosaic();
    });
  }

  function loadConfiguredReference() {
    const referenceSrc = APP_CONFIG.referenceImage;
    if (referenceSrc && referenceSrc.trim()) {
      const image = new Image();
      image.onload = () => { state.referenceImage = image; renderMosaic(); };
      image.onerror = () => { state.referenceImage = heroPhoto.naturalWidth ? heroPhoto : null; renderMosaic(); };
      image.src = referenceSrc;
    } else if (APP_CONFIG.heroImage) {
      // The hero image load will trigger a redraw when available.
      state.referenceImage = null;
    }
  }

  function sampleReference(cols, rows) {
    const reference = state.referenceImage || (heroPhoto.naturalWidth ? heroPhoto : null);
    if (reference && reference.naturalWidth) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = cols;
        canvas.height = rows;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(reference, 0, 0, cols, rows);
        const data = context.getImageData(0, 0, cols, rows).data;
        const result = [];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const lum = (r * .2126 + g * .7152 + b * .0722) / 255;
          result.push({ r, g, b, lum });
        }
        return result;
      } catch (_) {
        // Cross-origin images may not be readable by canvas; use the fallback palette instead.
      }
    }

    const result = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col / Math.max(1, cols - 1)) * 2 - 1;
        const y = (row / Math.max(1, rows - 1)) * 2 - 1;
        const faceShade = Math.max(0, 1 - Math.abs(x) * .55 - Math.abs(y) * .23);
        const highlight = Math.exp(-((x - .15) ** 2 + (y + .1) ** 2) / .12) * .18;
        const shade = Math.min(1, Math.max(0, .57 + faceShade * .25 + highlight - Math.abs(x) * .08));
        const r = Math.round(135 + shade * 105);
        const g = Math.round(111 + shade * 107);
        const b = Math.round(169 + shade * 82);
        result.push({ r, g, b, lum: shade });
      }
    }
    return result;
  }

  function isInsidePortrait(col, row, cols, rows) {
    const x = (col / Math.max(1, cols - 1)) * 2 - 1;
    const y = (row / Math.max(1, rows - 1)) * 2 - 1;
    const absX = Math.abs(x);
    let maxWidth;
    if (y < -.52) maxWidth = .45 + (y + 1) * 1.05;
    else if (y < .38) maxWidth = .95;
    else if (y < .68) maxWidth = .94;
    else maxWidth = Math.max(.35, .94 - (y - .68) * 1.75);
    return absX <= maxWidth && y >= -1 && y <= 1;
  }

  function clearMosaic() {
    mosaicGrid.replaceChildren();
  }

  function renderMosaic() {
    if (!mosaicGrid) return;
    if (!state.uploadedPhotos.length && hasExactMosaic()) return renderExactMosaic();
    mosaicGrid.classList.remove("is-exact");
    const photos = currentPhotos();
    const desiredVisible = photos.length ? Math.min(1500, Math.max(500, photos.length)) : 520;
    const slotCount = Math.min(2050, Math.max(680, Math.ceil(desiredVisible / .83)));
    const cols = Math.max(22, Math.round(Math.sqrt(slotCount * .74)));
    const rows = Math.ceil(slotCount / cols);
    const tones = sampleReference(cols, rows);
    const frag = document.createDocumentFragment();
    const visibleSources = [];
    let visibleIndex = 0;
    let placeholderIndex = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const flatIndex = row * cols + col;
        if (flatIndex >= slotCount || !isInsidePortrait(col, row, cols, rows)) continue;
        const tone = tones[flatIndex] || { r: 203, g: 187, b: 228, lum: .7 };
        const dx = (col - (cols - 1) / 2) * (11 + Math.random() * 11);
        const dy = (row - (rows - 1) / 2) * (9 + Math.random() * 9);
        const rot = (Math.random() * 2 - 1) * 38;
        const shadeOpacity = Math.min(.56, Math.max(.1, .58 - tone.lum * .46));
        const button = document.createElement("button");
        button.type = "button";
        button.className = "memory-tile";
        button.style.setProperty("--tone", `rgb(${tone.r}, ${tone.g}, ${tone.b})`);
        button.style.setProperty("--brightness", (0.66 + tone.lum * .64).toFixed(2));
        button.style.setProperty("--tone-opacity", shadeOpacity.toFixed(2));
        button.dataset.dx = dx.toFixed(1);
        button.dataset.dy = dy.toFixed(1);
        button.dataset.rot = rot.toFixed(1);

        if (photos.length) {
          const photo = photos[visibleIndex % photos.length];
          const src = photo.src;
          button.dataset.src = src;
          button.dataset.photoIndex = String(visibleSources.length);
          button.setAttribute("aria-label", `Open ${photo.alt || photo.name || "memory"}`);
          const img = document.createElement("img");
          img.src = src;
          img.alt = photo.alt || "";
          img.loading = "lazy";
          img.draggable = false;
          button.appendChild(img);
          visibleSources.push({ src, alt: photo.alt || photo.name || `Memory ${visibleIndex + 1}`, caption: photo.alt || photo.name || "a little memory" });
          visibleIndex++;
        } else {
          button.classList.add("is-placeholder");
          button.dataset.placeholder = "true";
          button.setAttribute("aria-label", "Photo placeholder — add memory photos in Personalise this page");
          const mark = document.createElement("span");
          mark.className = "placeholder-mark";
          mark.textContent = ["✳", "♡", "✦", "·", "✧"][placeholderIndex % 5];
          button.appendChild(mark);
          placeholderIndex++;
        }
        frag.appendChild(button);
      }
    }

    clearMosaic();
    mosaicGrid.style.setProperty("--grid-cols", String(cols));
    mosaicGrid.style.aspectRatio = `${cols} / ${rows}`;
    mosaicGrid.style.setProperty("--scatter", "0");
    mosaicGrid.style.setProperty("--zoom", "0");
    mosaicGrid.style.transform = "scale(1)";
    mosaicGrid.appendChild(frag);
    state.imageSources = visibleSources;
    updateExplosion.lastScatter = -1;
    $("#memoryCountLabel").textContent = photos.length ? `${Math.min(photos.length, 1500).toLocaleString()} photos · one portrait` : "your photos will go here";
    if (!photos.length) {
      $("#memoryCountLabel").setAttribute("title", "Use Personalise this page at the bottom to preview your photo collection.");
    }
    renderSlideshow();
    if (typeof updateExplosion === "function") updateExplosion();
  }

  function renderSlideshow() {
    const photos = currentPhotos();
    slideshowTrack.replaceChildren();
    if (!photos.length) {
      const labels = ["your favourite moments", "the little things", "all the versions of you", "a thousand reasons to smile", "memories on repeat"];
      for (let repeat = 0; repeat < 2; repeat++) {
        labels.forEach((label, index) => {
          const card = document.createElement("div");
          card.className = "slideshow-placeholder";
          const icon = document.createElement("span");
          icon.className = "slideshow-placeholder-icon";
          icon.textContent = ["♡", "✳", "✦", "✧", "❋"][index % 5];
          const text = document.createElement("span");
          text.textContent = label;
          card.append(icon, text);
          slideshowTrack.appendChild(card);
        });
      }
      return;
    }

    const maxFrames = Math.min(40, photos.length);
    const frames = [];
    for (let i = 0; i < maxFrames; i++) {
      const photoIndex = Math.floor(i * photos.length / maxFrames);
      frames.push(photos[photoIndex]);
    }
    // Duplicate the run so the horizontal slideshow loops without a visible jump.
    for (let repeat = 0; repeat < 2; repeat++) {
      frames.forEach((photo, index) => {
        const card = document.createElement("div");
        card.className = "slideshow-photo";
        card.style.setProperty("--tilt", `${((index % 5) - 2) * .8}deg`);
        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = photo.alt || "A birthday memory";
        img.loading = "lazy";
        card.appendChild(img);
        slideshowTrack.appendChild(card);
      });
    }
  }

  function showHoverPreview(tile, event) {
    if (!tile || tile.dataset.placeholder === "true" || !tile.dataset.src) return hideHoverPreview();
    hoverPreviewImage.src = tile.dataset.src;
    hoverPreviewImage.alt = tile.dataset.caption || tile.querySelector("img")?.alt || "A memory";
    hoverPreviewCaption.textContent = tile.dataset.caption || "one little memory";
    hoverPreview.classList.add("is-visible");
    hoverPreview.setAttribute("aria-hidden", "false");
    moveHoverPreview(event);
  }

  function moveHoverPreview(event) {
    if (!hoverPreview.classList.contains("is-visible")) return;
    const margin = 12;
    const width = hoverPreview.offsetWidth || 210;
    const height = hoverPreview.offsetHeight || 200;
    let left = event.clientX + 22;
    let top = event.clientY + 18;
    if (left + width + margin > window.innerWidth) left = event.clientX - width - 22;
    if (top + height + margin > window.innerHeight) top = event.clientY - height - 18;
    hoverPreview.style.left = `${Math.max(margin, left)}px`;
    hoverPreview.style.top = `${Math.max(margin, top)}px`;
  }

  function hideHoverPreview() {
    hoverPreview.classList.remove("is-visible");
    hoverPreview.setAttribute("aria-hidden", "true");
  }

  function showLightboxImage(index) {
    const sources = state.imageSources;
    if (!sources.length) return false;
    state.lightboxIndex = (index + sources.length) % sources.length;
    const item = sources[state.lightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt || "A birthday memory";
    lightboxCaption.textContent = item.caption || item.alt || "a little memory";
    // Warm up the neighbours so the arrows feel instant.
    [1, -1].forEach(step => {
      const next = sources[(state.lightboxIndex + step + sources.length) % sources.length];
      if (next) { const preload = new Image(); preload.src = next.src; }
    });
    return true;
  }

  function openLightbox(index) {
    state.previousFocus = document.activeElement;
    if (!showLightboxImage(index)) return;
    photoLightbox.hidden = false;
    document.body.classList.add("modal-open");
    $("#lightboxClose").focus();
    hideHoverPreview();
  }

  function moveLightbox(delta) {
    showLightboxImage(state.lightboxIndex + delta);
  }

  function closeLightbox() {
    photoLightbox.hidden = true;
    document.body.classList.remove("modal-open");
    if (state.previousFocus && typeof state.previousFocus.focus === "function") state.previousFocus.focus();
  }

  function updateExplosion() {
    const rect = mosaicRunway.getBoundingClientRect();
    const scrollable = Math.max(1, mosaicRunway.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
    const scatter = Math.max(0, Math.min(1, (progress - .19) / .62));
    mosaicGrid.style.setProperty("--zoom", (progress * 1.08).toFixed(3));
    mosaicGrid.style.setProperty("--scatter", scatter.toFixed(3));
    mosaicGrid.style.transform = `scale(${(1 + progress * 1.08).toFixed(3)})`;
    // Calculate the burst in JS instead of relying on newer CSS typed multiplication syntax.
    // This keeps the effect reliable in a wide range of browsers.
    if (Math.abs(scatter - (updateExplosion.lastScatter ?? -1)) > .012) {
      $$(".memory-tile", mosaicGrid).forEach(tile => {
        const dx = Number(tile.dataset.dx || 0) * scatter;
        const dy = Number(tile.dataset.dy || 0) * scatter;
        const rot = Number(tile.dataset.rot || 0) * scatter;
        tile.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${(1 - scatter * .88).toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
        tile.style.opacity = String(1 - scatter * .95);
      });
      updateExplosion.lastScatter = scatter;
    }
    mosaicGrid.style.setProperty("--overlay-fade", Math.max(0, 1 - scatter * 2.2).toFixed(3));
    if (scatter > .02) hideHoverPreview();
    explosionCopy.style.setProperty("--scatter", scatter.toFixed(3));
    explosionCopy.style.opacity = Math.max(0, Math.min(1, (progress - .49) * 2.4)).toFixed(3);
    explosionCopy.style.transform = `translateY(${((1 - scatter) * 16).toFixed(1)}px)`;
    explosionCopy.setAttribute("aria-hidden", progress < .5 ? "true" : "false");
    mosaicStage.classList.toggle("is-exploding", scatter > .03);
  }

  let scrollQueued = false;
  function requestExplosionUpdate() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(() => {
      updateExplosion();
      scrollQueued = false;
    });
  }

  function setAudioStatus(message) {
    audioStatus.textContent = message;
  }

  function attemptPlayAudio() {
    const songs = currentSongs();
    if (!songs.length || !audioPlayer.src) {
      setAudioStatus("Add songs in Personalise this page to fill the soundtrack.");
      return;
    }
    const result = audioPlayer.play();
    if (result && typeof result.then === "function") {
      result.then(() => {
        playPauseBtn.textContent = "Ⅱ";
        playPauseBtn.setAttribute("aria-label", "Pause soundtrack");
        setAudioStatus("now playing — just for you");
      }).catch(() => {
        playPauseBtn.textContent = "▶";
        playPauseBtn.setAttribute("aria-label", "Play soundtrack");
        setAudioStatus("Tap play to start the soundtrack — your browser blocked autoplay.");
      });
    }
  }

  function selectSong(index, shouldPlay = true) {
    const songs = currentSongs();
    if (!songs.length || !songs[index]) return;
    state.currentSongIndex = index;
    const song = songs[index];
    audioPlayer.src = song.src;
    audioPlayer.load();
    nowPlaying.textContent = song.title || fileTitle(song.src);
    renderSongMenu();
    setAudioStatus(`ready to play — ${song.title || fileTitle(song.src)}`);
    if (shouldPlay) attemptPlayAudio();
  }

  function renderSongMenu() {
    const songs = currentSongs();
    songList.replaceChildren();
    if (!songs.length) {
      const empty = document.createElement("p");
      empty.className = "song-empty";
      empty.textContent = "Your songs will live here. Add downloaded audio files or list them in APP_CONFIG in app.js.";
      songList.appendChild(empty);
    } else {
      songs.forEach((song, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `song-option${index === state.currentSongIndex ? " is-active" : ""}`;
        const number = document.createElement("span");
        number.className = "song-option-index";
        number.textContent = String(index + 1).padStart(2, "0");
        const title = document.createElement("span");
        title.textContent = song.title || fileTitle(song.src);
        btn.append(number, title);
        btn.addEventListener("click", () => {
          selectSong(index, true);
          closeSongMenu();
        });
        songList.appendChild(btn);
      });
    }
    if (APP_CONFIG.spotifyPlaylistUrl && /^https:\/\//i.test(APP_CONFIG.spotifyPlaylistUrl)) {
      spotifyLink.href = APP_CONFIG.spotifyPlaylistUrl;
      spotifyLink.hidden = false;
    } else {
      spotifyLink.hidden = true;
    }
  }

  function openSongMenu() {
    songMenu.hidden = false;
    changeSongBtn.setAttribute("aria-expanded", "true");
  }

  function closeSongMenu() {
    songMenu.hidden = true;
    changeSongBtn.setAttribute("aria-expanded", "false");
  }

  function setVideoSource(src) {
    if (!src) {
      birthdayVideo.pause();
      birthdayVideo.removeAttribute("src");
      birthdayVideo.load();
      birthdayVideo.style.display = "none";
      videoPlaceholder.style.display = "flex";
      return;
    }
    birthdayVideo.src = src;
    birthdayVideo.muted = true;
    birthdayVideo.loop = true;
    birthdayVideo.playsInline = true;
    birthdayVideo.style.display = "block";
    videoPlaceholder.style.display = "none";
    birthdayVideo.load();
    // The observer will start it when the wishes section is on screen.
  }

  function reportUploadStatus(message) {
    uploadStatus.textContent = message;
  }

  function bindUploads() {
    $("#heroUpload").addEventListener("change", event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      configureHero(url);
      reportUploadStatus(`Portrait loaded: ${file.name}. Use the memory picker to add the rest of the photos.`);
    });

    $("#photoUpload").addEventListener("change", event => {
      const files = Array.from(event.target.files || []).filter(file => file.type.startsWith("image/")).slice(0, 1500);
      if (!files.length) return;
      state.uploadedPhotos = files.map(file => ({ src: URL.createObjectURL(file), alt: file.name, name: file.name }));
      renderMosaic();
      reportUploadStatus(`${state.uploadedPhotos.length.toLocaleString()} memory photos loaded for this preview. They will not be saved to the site automatically.`);
    });

    const musicInputs = [$("#musicUpload"), $("#musicUploadVisible")];
    musicInputs.forEach(input => input.addEventListener("change", event => {
      const files = Array.from(event.target.files || []).filter(file => file.type.startsWith("audio/"));
      if (!files.length) return;
      // The visible and menu pickers replace the local preview playlist with the selected collection.
      state.uploadedSongs = files.map(file => ({ title: fileTitle(file.name), src: URL.createObjectURL(file) }));
      state.currentSongIndex = 0;
      selectSong(0, true);
      openSongMenu();
      reportUploadStatus(`${state.uploadedSongs.length} song${state.uploadedSongs.length === 1 ? "" : "s"} loaded for this preview. Add the audio files to assets/music for the published site.`);
      input.value = "";
    }));

    const videoInputs = [$("#videoUpload"), $("#videoUploadVisible")];
    videoInputs.forEach(input => input.addEventListener("change", event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      state.uploadedVideo = URL.createObjectURL(file);
      setVideoSource(state.uploadedVideo);
      reportUploadStatus(`Video loaded: ${file.name}. Add it to assets/videos and configure videoSrc before publishing.`);
      input.value = "";
    }));

    $("#addSongsFromMenu").addEventListener("click", () => $("#musicUpload").click());
    $("#addVideoFromPlaceholder").addEventListener("click", () => $("#videoUpload").click());
  }

  function bindMosaicInteractions() {
    mosaicGrid.addEventListener("pointerover", event => {
      if (event.pointerType === "touch") return; // phones: a tap opens the photo instead
      const tile = event.target.closest(".memory-tile");
      if (!tile || !mosaicGrid.contains(tile)) return;
      showHoverPreview(tile, event);
    });
    mosaicGrid.addEventListener("pointermove", event => {
      if (event.pointerType !== "touch") moveHoverPreview(event);
    });
    mosaicGrid.addEventListener("pointerout", event => {
      const fromTile = event.target.closest(".memory-tile");
      const toTile = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(".memory-tile") : null;
      if (fromTile && fromTile !== toTile) hideHoverPreview();
    });
    mosaicGrid.addEventListener("click", event => {
      const tile = event.target.closest(".memory-tile");
      if (!tile || !tile.dataset.src) return;
      const index = Number(tile.dataset.photoIndex);
      if (index >= 0) openLightbox(index);
    });
    $("#lightboxClose").addEventListener("click", closeLightbox);
    $("#lightboxPrev").addEventListener("click", () => moveLightbox(-1));
    $("#lightboxNext").addEventListener("click", () => moveLightbox(1));
    photoLightbox.addEventListener("click", event => { if (event.target === photoLightbox) closeLightbox(); });
    document.addEventListener("keydown", event => {
      if (!photoLightbox.hidden) {
        if (event.key === "Escape") closeLightbox();
        if (event.key === "ArrowLeft") moveLightbox(-1);
        if (event.key === "ArrowRight") moveLightbox(1);
      }
      if (event.key === "Escape") closeSongMenu();
    });
    window.addEventListener("resize", hideHoverPreview);
  }

  function bindAudio() {
    changeSongBtn.addEventListener("click", () => {
      if (songMenu.hidden) openSongMenu();
      else closeSongMenu();
    });
    $("#closeSongMenu").addEventListener("click", closeSongMenu);
    document.addEventListener("click", event => {
      if (!songMenu.hidden && !songMenu.contains(event.target) && !changeSongBtn.contains(event.target)) closeSongMenu();
    });

    playPauseBtn.addEventListener("click", () => {
      if (!currentSongs().length) {
        openSongMenu();
        return;
      }
      if (audioPlayer.paused) {
        if (state.currentSongIndex < 0) selectSong(0, true);
        else attemptPlayAudio();
      } else {
        audioPlayer.pause();
      }
    });
    audioPlayer.addEventListener("play", () => {
      playPauseBtn.textContent = "Ⅱ";
      playPauseBtn.setAttribute("aria-label", "Pause soundtrack");
      setAudioStatus("now playing — just for you");
    });
    audioPlayer.addEventListener("pause", () => {
      playPauseBtn.textContent = "▶";
      playPauseBtn.setAttribute("aria-label", "Play soundtrack");
    });
    audioPlayer.addEventListener("ended", () => {
      const songs = currentSongs();
      if (songs.length > 1) selectSong((state.currentSongIndex + 1) % songs.length, true);
    });
    renderSongMenu();
    const songs = currentSongs();
    if (songs.length) {
      state.currentSongIndex = 0;
      audioPlayer.src = songs[0].src;
      nowPlaying.textContent = songs[0].title || fileTitle(songs[0].src);
      renderSongMenu();
      setAudioStatus("The soundtrack will try to play when this section appears.");
    }
  }

  function bindAutoplayObservers() {
    const musicSection = $("#soundtrack");
    const wishesSection = $("#wishes");
    let musicWasStarted = false;
    const musicObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > .22 && !musicWasStarted) {
          musicWasStarted = true;
          if (currentSongs().length) attemptPlayAudio();
          else setAudioStatus("Add songs in Personalise this page to fill the soundtrack.");
        }
      });
    }, { threshold: [.22, .35] });
    musicObserver.observe(musicSection);

    const videoObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > .2) {
          if (birthdayVideo.src) {
            birthdayVideo.muted = true;
            const playAttempt = birthdayVideo.play();
            if (playAttempt && playAttempt.catch) playAttempt.catch(() => { /* The visible play controls remain available. */ });
          }
        } else {
          if (birthdayVideo.src && !birthdayVideo.paused) birthdayVideo.pause();
        }
      });
    }, { threshold: [.2, .35] });
    videoObserver.observe(wishesSection);
  }

  function init() {
    const birthdayName = $("#birthdayNameText");
    if (APP_CONFIG.birthdayName) birthdayName.textContent = APP_CONFIG.birthdayName;

    safeSetImage(heroPhoto, APP_CONFIG.heroImage, () => {
      heroPhoto.style.display = "block";
      portraitPlaceholder.style.display = "none";
      if (!APP_CONFIG.referenceImage) state.referenceImage = heroPhoto;
      renderMosaic();
    }, () => {
      heroPhoto.style.display = "none";
      portraitPlaceholder.style.display = "block";
      if (!APP_CONFIG.referenceImage) state.referenceImage = null;
      renderMosaic();
    });
    loadConfiguredReference();
    if (APP_CONFIG.videoSrc) setVideoSource(APP_CONFIG.videoSrc);
    if (APP_CONFIG.spotifyPlaylistUrl && /^https:\/\//i.test(APP_CONFIG.spotifyPlaylistUrl)) {
      spotifyLink.href = APP_CONFIG.spotifyPlaylistUrl;
      spotifyLink.hidden = false;
    }

    renderMosaic();
    renderSongMenu();
    bindUploads();
    bindMosaicInteractions();
    bindAudio();
    bindAutoplayObservers();
    window.addEventListener("scroll", requestExplosionUpdate, { passive: true });
    window.addEventListener("resize", requestExplosionUpdate);
    updateExplosion();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
