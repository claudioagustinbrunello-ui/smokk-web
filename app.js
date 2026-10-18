const $ = (selector) => document.querySelector(selector);
const intro = $("#intro");
const site = $("#site");
const audio = $("#audioPlayer");
const video = $("#backgroundVideo");
const trackList = $("#trackList");
const installButton = $("#installButton");
let installPrompt = null;
let tracks = [];
let currentTrack = -1;
let videoIndex = -1;
let shuffleVideos = [];
let musicEnabled = false;

function shuffledVideoOrder() {
  const order = [1,2,3,4].filter(n => n !== videoIndex);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  shuffleVideos = order;
}
function nextVideo() {
  if (!shuffleVideos.length) shuffledVideoOrder();
  videoIndex = shuffleVideos.pop() ?? (Math.floor(Math.random()*4)+1);
  video.src = `material/videos/fondo${videoIndex}.mp4`;
  video.load();
  const p = video.play();
  if (p && p.catch) p.catch(() => {});
}
video.addEventListener("ended", nextVideo);
video.addEventListener("error", () => {
  // A missing video should not break the page; retry a different available file.
  if (videoIndex >= 0) {
    const next = (videoIndex % 4) + 1;
    if (next !== videoIndex) {
      videoIndex = next;
      video.src = `material/videos/fondo${videoIndex}.mp4`;
      video.load();
      video.play().catch(() => {});
    }
  }
});

async function loadTracks() {
  try {
    const response = await fetch("material/canciones/lista.json");
    if (!response.ok) throw new Error("No hay lista de canciones");
    const data = await response.json();
    tracks = Array.isArray(data.canciones) ? data.canciones : [];
  } catch (_) {
    tracks = [];
  }
  renderTracks();
}
function renderTracks() {
  if (!tracks.length) {
    trackList.innerHTML = '<p class="empty-state">Todavía no hay canciones cargadas. Agregá los archivos en <code>material/canciones/</code> y sus datos en <code>material/canciones/lista.json</code>.</p>';
    return;
  }
  trackList.innerHTML = "";
  tracks.forEach((track, index) => {
    const row = document.createElement("div");
    row.className = "track" + (index === currentTrack ? " active" : "");
    const play = document.createElement("button");
    play.className = "track-play";
    play.setAttribute("aria-label", `Reproducir ${track.titulo || "canción"}`);
    play.textContent = index === currentTrack && !audio.paused ? "Ⅱ" : "▶";
    play.addEventListener("click", () => playTrack(index));
    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "track-title";
    title.textContent = track.titulo || track.archivo;
    const meta = document.createElement("div");
    meta.className = "track-meta";
    meta.textContent = track.detalle || "SMOKK";
    info.append(title, meta);
    const tag = document.createElement("span");
    tag.className = "track-tag";
    tag.textContent = index === currentTrack && !audio.paused ? "REPRODUCIENDO" : "ESCUCHAR";
    row.append(play, info, tag);
    trackList.append(row);
  });
}
async function playTrack(index) {
  if (!tracks[index]) return;
  if (currentTrack === index && !audio.paused) {
    audio.pause();
  } else {
    currentTrack = index;
    audio.src = `material/canciones/${tracks[index].archivo}`;
    try { await audio.play(); musicEnabled = true; } catch (_) {}
  }
  renderTracks();
  $("#bottomStatus").textContent = audio.paused ? "Música en pausa" : (tracks[currentTrack]?.titulo || "Reproduciendo");
  $("#soundToggle").innerHTML = audio.paused ? "♫ <span>MÚSICA</span>" : "Ⅱ <span>PAUSAR</span>";
}
audio.addEventListener("ended", () => {
  if (tracks.length) playTrack((currentTrack + 1) % tracks.length);
});
audio.addEventListener("play", () => {
  $("#bottomStatus").textContent = tracks[currentTrack]?.titulo || "Reproduciendo";
  $("#soundToggle").innerHTML = "Ⅱ <span>PAUSAR</span>";
});
audio.addEventListener("pause", () => {
  $("#soundToggle").innerHTML = "♫ <span>MÚSICA</span>";
  renderTracks();
});

async function enter(withMusic) {
  musicEnabled = withMusic;
  intro.classList.add("leaving");
  intro.style.transition = "opacity .55s ease";
  intro.style.opacity = "0";
  window.setTimeout(() => {
    intro.hidden = true;
    site.hidden = false;
    document.body.classList.remove("locked");
    nextVideo();
    loadTracks();
    if (withMusic) {
      loadTracks().then(() => {
        if (tracks.length) playTrack(Math.floor(Math.random() * tracks.length));
      });
    }
  }, 560);
}
$("#enterMusic").addEventListener("click", () => enter(true));
$("#enterSilent").addEventListener("click", () => enter(false));
$("#soundToggle").addEventListener("click", async () => {
  if (!tracks.length) await loadTracks();
  if (!tracks.length) {
    $("#bottomStatus").textContent = "Agregá canciones a la carpeta";
    return;
  }
  if (!audio.paused) audio.pause();
  else if (currentTrack >= 0) audio.play().catch(() => {});
  else playTrack(Math.floor(Math.random() * tracks.length));
});

function getYoutubeId(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0];
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/");
    const embedIndex = parts.findIndex(p => ["embed","shorts","live"].includes(p));
    return embedIndex >= 0 ? parts[embedIndex + 1] : "";
  } catch (_) { return /^[\w-]{11}$/.test(value) ? value : ""; }
}
async function loadContent() {
  try {
    const response = await fetch("content/site.json");
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
    const response = await fetch("content/lanzamientos.json");
    if (!response.ok) return;
    const data = await response.json();
    const now = Date.now();
    const visible = (data.lanzamientos || [])
      .filter(item => item.visible !== false && (!item.fecha || new Date(item.fecha).getTime() <= now))
      .sort((a,b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    const latest = visible[0];
    if (latest) {
      $("#releaseTitle").textContent = latest.titulo || "VIDEO DESTACADO · SMOKK";
      $("#releaseDescription").textContent = latest.descripcion || "Mirá el último lanzamiento.";
      const id = getYoutubeId(latest.youtube);
      if (id) $("#featuredVideo").src = `https://www.youtube-nocookie.com/embed/${id}`;
      else if (latest.youtube) $("#featuredVideo").src = `https://www.youtube-nocookie.com/embed/${latest.youtube}`;
    }
  } catch (_) {}
}
loadContent();
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
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
