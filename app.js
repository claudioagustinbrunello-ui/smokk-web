const $ = (selector) => document.querySelector(selector);
const intro = $("#intro");
const site = $("#site");
const audio = $("#audioPlayer");
const video = $("#backgroundVideo");
const installButton = $("#installButton");
let installPrompt = null;
let tracks = [];
let currentTrack = -1;
let managedVideos = [];
let legacyVideos = [];
let videoPlaylist = [];
let videoIndex = -1;
let videoAttempts = 0;
let musicEnabled = false;
let tracksPromise = null;
let backgroundVideosReady = false;

function normalizeMediaPath(value, folder) {
  return mediaUrl(value, folder);
}
async function loadBackgroundVideos() {
  if (backgroundVideosReady) return;
  backgroundVideosReady = true;
  try {
    const response = await fetch("content/videos.json", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      managedVideos = (Array.isArray(data.videos) ? data.videos : [])
        .filter(item => item && item.archivo)
        .map((item, index) => ({ ...item, _orden: Number(item.orden) || index + 1 }))
        .sort((a, b) => a._orden - b._orden);
      if (!managedVideos.length && data.usarVideosExistentes !== false) {
        legacyVideos = [1, 2, 3, 4].map(n => `material/videos/fondo${n}.mp4`);
      }
    } else {
      legacyVideos = [1, 2, 3, 4].map(n => `material/videos/fondo${n}.mp4`);
    }
  } catch (_) {
    legacyVideos = [1, 2, 3, 4].map(n => `material/videos/fondo${n}.mp4`);
  }
  videoPlaylist = managedVideos.length
    ? managedVideos.map(item => normalizeMediaPath(item.archivo, "material/videos/"))
    : legacyVideos;
}
async function startBackgroundVideo() {
  await loadBackgroundVideos();
  videoIndex = -1;
  videoAttempts = 0;
  if (!videoPlaylist.length) {
    video.removeAttribute("src");
    video.load();
    return;
  }
  playNextBackgroundVideo();
}
function playNextBackgroundVideo() {
  if (!videoPlaylist.length) return;
  if (videoAttempts >= videoPlaylist.length) {
    video.pause();
    video.removeAttribute("src");
    video.load();
    return;
  }
  videoIndex = (videoIndex + 1) % videoPlaylist.length;
  videoAttempts++;
  video.src = videoPlaylist[videoIndex];
  video.load();
  const p = video.play();
  if (p && p.catch) p.catch(() => {});
}
video.addEventListener("ended", () => {
  videoAttempts = 0;
  playNextBackgroundVideo();
});
video.addEventListener("error", () => {
  // Skip missing/invalid files without getting stuck in an endless error loop.
  playNextBackgroundVideo();
});

function mediaUrl(value, fallbackFolder = "material/subidas/") {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("material/") || raw.startsWith("./material/")) return raw;
  return `${fallbackFolder}${raw}`;
}
function safeExternalLink(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch (_) { return ""; }
}
function setNowPlaying(track) {
  const title = track?.titulo || track?.archivo || "SMOKK";
  const artist = track?.artista || "SMOKK";
  const label = `${title} — ${artist}`;
  $("#trackStatusTitle").textContent = title;
  $("#trackStatusArtist").textContent = artist;
  $("#nowPlayingText").textContent = label;
  $("#nowPlayingTextClone").textContent = label;
  $("#nowPlayingTicker").hidden = !musicEnabled || audio.paused;
  $("#bottomStatus").textContent = audio.paused ? "Música en pausa" : label;
}
function loadTracks() {
  if (tracksPromise) return tracksPromise;
  tracksPromise = (async () => {
    try {
      const response = await fetch("content/canciones.json", { cache: "no-store" });
      if (!response.ok) throw new Error("No hay lista de canciones");
      const data = await response.json();
      tracks = (Array.isArray(data.canciones) ? data.canciones : []).filter(t => t && t.archivo).slice(0, 3);
    } catch (_) {
      tracks = [];
    }
    if (!tracks.length) {
      $("#trackStatusTitle").textContent = "Todavía no hay canciones cargadas";
      $("#trackStatusArtist").textContent = "SMOKK";
    }
    return tracks;
  })();
  return tracksPromise;
}
function playTrack(index) {
  if (!tracks.length) return;
  currentTrack = ((index % tracks.length) + tracks.length) % tracks.length;
  const track = tracks[currentTrack];
  const file = mediaUrl(track.archivo, "material/canciones/");
  audio.src = file;
  setNowPlaying(track);
  const promise = audio.play();
  if (promise && promise.catch) promise.catch(() => {
    $("#trackStatusTitle").textContent = "No se pudo iniciar el audio";
    $("#trackStatusArtist").textContent = "Revisá el archivo de la canción";
    $("#nowPlayingTicker").hidden = true;
  });
}
function playNextTrack() {
  if (musicEnabled && tracks.length) playTrack((currentTrack + 1) % tracks.length);
}
audio.addEventListener("ended", playNextTrack);
audio.addEventListener("play", () => {
  setNowPlaying(tracks[currentTrack] || { titulo: "SMOKK", artista: "SMOKK" });
  $("#nowPlayingTicker").hidden = !musicEnabled;
});
audio.addEventListener("pause", () => {
  $("#nowPlayingTicker").hidden = true;
});
audio.addEventListener("error", () => {
  if (musicEnabled && tracks.length > 1) playNextTrack();
  else $("#nowPlayingTicker").hidden = true;
});

async function enter(withMusic) {
  musicEnabled = withMusic;
  intro.classList.add("leaving");
  intro.style.transition = "opacity .55s ease";
  intro.style.opacity = "0";
  // Begin audio directly from the entry interaction when the playlist is ready.
  if (withMusic && tracks.length) playTrack(0);
  window.setTimeout(async () => {
    intro.hidden = true;
    site.hidden = false;
    document.body.classList.remove("locked");
    startBackgroundVideo();
    if (withMusic && !tracks.length) {
      await loadTracks();
      if (tracks.length) playTrack(0);
      else {
        $("#trackStatusTitle").textContent = "Todavía no hay canciones cargadas";
        $("#trackStatusArtist").textContent = "Agregalas desde el panel de administración";
      }
    }
    $("#nowPlayingTicker").hidden = !withMusic || audio.paused;
  }, 560);
}
$("#enterMusic").addEventListener("click", () => enter(true));
$("#enterSilent").addEventListener("click", () => enter(false));

function getYoutubeId(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0];
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/");
    const embedIndex = parts.findIndex(p => ["embed", "shorts", "live"].includes(p));
    return embedIndex >= 0 ? parts[embedIndex + 1] : "";
  } catch (_) { return /^[\w-]{11}$/.test(value) ? value : ""; }
}
function makePlatformLink(label, href, className) {
  const valid = safeExternalLink(href);
  if (!valid) return null;
  const a = document.createElement("a");
  a.className = `platform-button ${className} collab-platform-button`;
  a.href = valid;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = label;
  return a;
}
async function loadGallery() {
  const section = $("#galeria");
  const container = $("#galleryItems");
  try {
    const response = await fetch("content/galeria.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No gallery content");
    const data = await response.json();
    const items = Array.isArray(data.galeria) ? data.galeria.filter(item => item && item.imagen) : [];
    if (!items.length) return;
    container.replaceChildren();
    items.forEach(item => {
      const card = document.createElement("figure");
      card.className = "gallery-card";
      const img = document.createElement("img");
      img.src = mediaUrl(item.imagen);
      img.alt = item.titulo || "Imagen de SMOKK";
      img.loading = "lazy";
      card.append(img);
      if (item.titulo) {
        const caption = document.createElement("figcaption");
        caption.textContent = item.titulo;
        card.append(caption);
      }
      container.append(card);
    });
  } catch (_) { /* Keep the CMS guidance placeholder visible. */ }
}
async function loadCollaborations() {
  const container = $("#collaborationItems");
  try {
    const response = await fetch("content/colaboraciones.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No collaborations content");
    const data = await response.json();
    const items = Array.isArray(data.colaboraciones) ? data.colaboraciones.filter(item => item && item.titulo) : [];
    if (!items.length) return;
    container.replaceChildren();
    items.forEach(item => {
      const card = document.createElement("article");
      card.className = "collab-card";
      const title = document.createElement("h3");
      title.textContent = item.titulo;
      card.append(title);
      if (item.video) {
        const videoEl = document.createElement("video");
        videoEl.className = "collab-media";
        videoEl.src = mediaUrl(item.video);
        videoEl.muted = true;
        videoEl.autoplay = true;
        videoEl.loop = true;
        videoEl.playsInline = true;
        videoEl.controls = false;
        videoEl.preload = "metadata";
        card.append(videoEl);
      } else if (item.imagen) {
        const img = document.createElement("img");
        img.className = "collab-media";
        img.src = mediaUrl(item.imagen);
        img.alt = item.titulo;
        img.loading = "lazy";
        card.append(img);
      }
      if (item.descripcion) {
        const description = document.createElement("p");
        description.className = "collab-description";
        description.textContent = item.descripcion;
        card.append(description);
      }
      const links = document.createElement("div");
      links.className = "collab-links";
      const youtube = makePlatformLink("▶ YouTube", item.youtube, "platform-youtube");
      const spotify = makePlatformLink("Spotify", item.spotify, "platform-spotify");
      if (youtube) links.append(youtube);
      if (spotify) links.append(spotify);
      if (links.children.length) card.append(links);
      container.append(card);
    });
  } catch (_) { /* Keep the CMS guidance placeholder visible. */ }
}
async function loadContent() {
  try {
    const response = await fetch("content/site.json", { cache: "no-store" });
    if (response.ok) {
      const config = await response.json();
      if (config.nombre) document.title = `${config.nombre} — Experiencia oficial`;
      if (config.instagram) document.querySelectorAll('a[href*="instagram.com"]').forEach(a => a.href = config.instagram);
      if (config.youtube) {
        document.querySelectorAll('a[href*="youtube.com"]').forEach(a => a.href = config.youtube);
        $("#channelButton").href = config.youtube;
      }
      if (config.spotify) document.querySelectorAll('a[href*="open.spotify.com"]').forEach(a => a.href = config.spotify);
      if (config.telefono) $("#contactLine").textContent = config.telefono;
      if (config.videoPermanente) {
        const id = getYoutubeId(config.videoPermanente);
        if (id) $("#featuredVideo").src = `https://www.youtube-nocookie.com/embed/${id}`;
      }
    }
  } catch (_) {}
  try {
    const response = await fetch("content/lanzamientos.json", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      const now = Date.now();
      const visible = (data.lanzamientos || [])
        .filter(item => item.visible !== false && (!item.fecha || new Date(item.fecha).getTime() <= now))
        .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
      const latest = visible[0];
      if (latest) {
        $("#releaseTitle").textContent = latest.titulo || "VIDEO DESTACADO · SMOKK";
        $("#releaseDescription").textContent = latest.descripcion || "Mirá el último lanzamiento.";
        const id = getYoutubeId(latest.youtube);
        if (id) $("#featuredVideo").src = `https://www.youtube-nocookie.com/embed/${id}`;
        else if (latest.youtube) $("#featuredVideo").src = `https://www.youtube-nocookie.com/embed/${latest.youtube}`;
      }
    }
  } catch (_) {}
  await Promise.all([loadGallery(), loadCollaborations()]);
}
loadContent();
// Load the playlist before the visitor chooses whether to start music.
loadTracks();
$("#year").textContent = new Date().getFullYear();

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener("click", async () => {
  if (!installPrompt) {
    $("#bottomStatus").textContent = "En iPhone: Compartir → Añadir a pantalla de inicio";
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener("appinstalled", () => {
  installButton.hidden = true;
  $("#bottomStatus").textContent = "Aplicación instalada";
});
// Animaciones de entrada al desplazarse: se aplican a la mayoría de los bloques,
// con algunas secciones deliberadamente estáticas para dar ritmo visual.
function setupScrollReveals() {
  const targets = document.querySelectorAll(
    "#site main > section:not(.hero):not(.platform-access), .section-heading, .platform-access-heading, .platform-buttons, .now-playing-card, .bio-copy > *, .gallery-card, .collab-card, .youtube-frame, .always-video > *"
  );
  targets.forEach((element, index) => {
    if (element.closest("#intro") || element.classList.contains("scroll-reveal")) return;
    element.classList.add("scroll-reveal");
    if (index % 4 === 1) element.classList.add("scroll-reveal-left");
    else if (index % 4 === 3) element.classList.add("scroll-reveal-scale");
  });
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".scroll-reveal").forEach(el => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  document.querySelectorAll(".scroll-reveal").forEach(el => observer.observe(el));
}
setupScrollReveals();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
