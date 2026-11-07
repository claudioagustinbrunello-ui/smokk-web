// ============================
// SMOKK — app.js (versión corregida)
// ============================

const RUTAS = {
  site: "content/site.json",
  lanzamientos: "content/lanzamientos.json",
  canciones: "material/canciones/lista.json",
};

let canciones = [];
let indiceActual = 0;
let audio = null;
let reproduciendo = false;

// ---------- UTILIDADES ----------
async function cargarJSON(ruta) {
  try {
    const res = await fetch(ruta, { cache: "no-store" });
    if (!res.ok) throw new Error(`No se pudo cargar ${ruta}`);
    return await res.json();
  } catch (e) {
    console.warn(e);
    return null;
  }
}

// ---------- INTRO ----------
document.getElementById("btn-con-musica").addEventListener("click", () => {
  iniciarPagina(true);
});

document.getElementById("btn-sin-musica").addEventListener("click", () => {
  iniciarPagina(false);
});

async function iniciarPagina(conMusica) {
  document.getElementById("intro").classList.add("oculto");
  document.getElementById("contenido").classList.remove("oculto");
  document.getElementById("anio").textContent = new Date().getFullYear();

  await cargarContenido();

  if (conMusica) {
    prepararAudio();
    reproducirActual();
  }
}

// ---------- CONTENIDO ----------
async function cargarContenido() {
  const site = await cargarJSON(RUTAS.site);
  if (site) {
    renderizarBio(site);
    renderizarRedes(site.redes || []);
    renderizarVideo(site.videoDestacado);
  }

  const lanzamientos = await cargarJSON(RUTAS.lanzamientos);
  if (lanzamientos && Array.isArray(lanzamientos.items)) {
    renderizarLanzamientos(lanzamientos.items);
  }

  const lista = await cargarJSON(RUTAS.canciones);
  if (lista && Array.isArray(lista.items)) {
    canciones = lista.items;
    actualizarTituloCancion();
  }
}

function renderizarBio(site) {
  const cont = document.getElementById("bio-texto");
  if (!site.bio) return;
  const parrafos = Array.isArray(site.bio) ? site.bio : [site.bio];
  cont.innerHTML = parrafos.map((p) => `<p>${p}</p>`).join("");
}

function renderizarRedes(redes) {
  const cont = document.getElementById("redes-grid");
  cont.innerHTML = redes
    .map((r) => `<a href="${r.url}" target="_blank" rel="noopener">${r.nombre} ↗</a>`)
    .join("");
}

function renderizarVideo(video) {
  const cont = document.getElementById("video-contenedor");
  if (!video || !video.url) {
    cont.innerHTML = "<p style='color:#999'>Próximamente.</p>";
    return;
  }
  let embed = video.url;
  if (embed.includes("watch?v=")) {
    embed = embed.replace("watch?v=", "embed/");
  } else if (embed.includes("youtu.be/")) {
    const id = embed.split("youtu.be/")[1].split("?")[0];
    embed = `https://www.youtube.com/embed/${id}`;
  }
  cont.innerHTML = `<iframe src="${embed}" allowfullscreen loading="lazy"></iframe>`;
}

function renderizarLanzamientos(lanzamientos) {
  const cont = document.getElementById("lanzamientos-grid");
  const hoy = new Date();
  const visibles = lanzamientos.filter((l) => {
    if (!l.fecha) return true;
    return new Date(l.fecha) <= hoy;
  });

  if (visibles.length === 0) {
    cont.innerHTML = "<p style='color:#999'>Próximamente.</p>";
    return;
  }

  cont.innerHTML = visibles
    .map(
      (l) => `
      <div class="lanzamiento-card">
        <h3>${l.titulo}</h3>
        <p>${l.descripcion || ""}</p>
        ${l.enlace ? `<a href="${l.enlace}" target="_blank" rel="noopener">Escuchar ↗</a>` : ""}
      </div>`
    )
    .join("");
}

// ---------- AUDIO ----------
function prepararAudio() {
  if (audio) return;
  audio = new Audio();
  audio.addEventListener("ended", siguienteCancion);
  audio.addEventListener("error", () => {
    document.getElementById("player-estado").textContent =
      "No se pudo cargar el audio. Verificá la ruta del MP3.";
  });
}

function actualizarTituloCancion() {
  const titulo = document.getElementById("player-titulo");
  const estado = document.getElementById("player-estado");
  if (canciones.length === 0) {
    titulo.textContent = "Sin canciones cargadas";
    estado.textContent = "Agregá archivos en material/canciones/lista.json";
    return;
  }
  const c = canciones[indiceActual];
  titulo.textContent = c.titulo || "Canción";
  estado.textContent = `${indiceActual + 1} / ${canciones.length}`;
}

function reproducirActual() {
  if (!audio || canciones.length === 0) return;
  const c = canciones[indiceActual];
  audio.src = `material/canciones/${c.archivo}`;
  audio
    .play()
    .then(() => {
      reproduciendo = true;
      document.getElementById("btn-play").textContent = "⏸";
      document.getElementById("player-estado").textContent = "Reproduciendo";
    })
    .catch(() => {
      document.getElementById("player-estado").textContent =
        "Tocá ▶ para reproducir.";
    });
  actualizarTituloCancion();
}

function siguienteCancion() {
  if (canciones.length === 0) return;
  indiceActual = (indiceActual + 1) % canciones.length;
  reproducirActual();
}

document.getElementById("btn-play").addEventListener("click", () => {
  prepararAudio();
  if (reproduciendo) {
    audio.pause();
    reproduciendo = false;
    document.getElementById("btn-play").textContent = "▶";
    document.getElementById("player-estado").textContent = "En pausa";
  } else {
    if (!audio.src) reproducirActual();
    else audio.play().then(() => {
      reproduciendo = true;
      document.getElementById("btn-play").textContent = "⏸";
      document.getElementById("player-estado").textContent = "Reproduciendo";
    });
  }
});

document.getElementById("btn-next").addEventListener("click", () => {
  prepararAudio();
  siguienteCancion();
});
