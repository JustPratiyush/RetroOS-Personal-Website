// ---------------------
// core utilities + app code (updated to support boot loader + preloading)
// ---------------------

// Global z stacking
let zTop = 1000;
function bringToFront(el) {
  if (!el) return;
  zTop += 1;
  el.style.zIndex = zTop;
}

/* ---------------------------
   Clock
   --------------------------- */
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const clockEl = document.getElementById("clock");
  if (clockEl) clockEl.textContent = `${h}:${m}`;
  const bigClock = document.getElementById("bigClock");
  if (bigClock) bigClock.textContent = now.toLocaleTimeString();
}

/* Keep clock interval but don't start app UI until boot done.
   We update the clock even during boot so the value is current. */
setInterval(updateClock, 1000);
updateClock();

/* ---------------------------
   (existing functions) Menus, windows, drag, apps, etc.
   (UNCHANGED logic from earlier — trimmed here for brevity in comments)
   We'll keep same function implementations and then call initApp()
   after boot completes. 
   Full functions are included below exactly like before, with no behavior changes,
   except we moved initialization into initApp().
*/

// ---------- (All previously implemented functions remain unchanged) ----------
// For brevity I will keep the same function implementations (menu toggles, window controls,
// makeDraggable, makeIconDraggable, openWindow, closeWindow, minimizeWindow, menuAction,
// notepad save/load, calculator, wallpaper, projects/readme, finder, music (Tone.js safe handling),
// trash/easter egg, dockContext, createMessageWindow, etc).
// The important structural change: the DOMContentLoaded initialization has been converted to initApp()
// which will be executed after the preloader & ENTER click.

// ---------- BEGIN: full app code (copied & preserved; unchanged) ----------
/* ---------------------------
   Menus
   --------------------------- */
function toggleMenu(menuId, el) {
  const menu = document.getElementById(menuId);
  if (!menu) return;

  const isOpen = menu.style.display === "block";
  closeAllMenus();

  if (isOpen) return;

  const rect = el.getBoundingClientRect();
  menu.style.left = Math.max(6, rect.left) + "px";
  menu.style.top = rect.bottom + "px";
  menu.style.display = "block";
  el.classList.add("active");
  bringToFront(menu);
}

function closeAllMenus() {
  document.querySelectorAll(".menu").forEach((m) => (m.style.display = "none"));
  document
    .querySelectorAll(".top-bar .icon")
    .forEach((i) => i.classList.remove("active"));
}

window.addEventListener("click", (e) => {
  if (!e.target.closest(".top-bar .icon") && !e.target.closest(".menu")) {
    closeAllMenus();
  }
});

/* ---------------------------
   Window management
   --------------------------- */
function openWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;

  // populate dynamic content on open
  if (id === "finder") {
    renderFinderContent("desktop");
  } else if (id === "music") {
    updateSongDisplay();
    const musicStatus = document.getElementById("musicStatus");
    if (musicStatus) {
      musicStatus.textContent =
        "Press ▶ to start audio (browser gesture required).";
    }
  } else if (id === "trash") {
    renderTrashContent();
  }

  el.style.display = "block";
  bringToFront(el);

  document.querySelectorAll(".dock-icon").forEach((d) => {
    d.classList.toggle("active", d.dataset.app === id);
  });
}

function closeWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";

  if (id === "music") {
    try {
      stopMusic();
    } catch (e) {
      // ignore
    }
  }

  document.querySelectorAll(".dock-icon").forEach((d) => {
    if (d.dataset.app === id) d.classList.remove("active");
  });

  if (id === "projects" || id === "readme") {
    if (el.parentElement) el.parentElement.removeChild(el);
  }
}

function minimizeWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
  document.querySelectorAll(".dock-icon").forEach((d) => {
    if (d.dataset.app === id) d.classList.remove("active");
  });
}

/* ---------------------------
   Draggable windows & icons
   --------------------------- */
function makeDraggable(win) {
  const header = win.querySelector(".title");
  if (!header) return;
  let isDown = false;
  let offX = 0;
  let offY = 0;

  header.addEventListener("mousedown", function (e) {
    if (e.target.classList.contains("ctrl")) return;
    isDown = true;
    bringToFront(win);
    offX = e.clientX - win.offsetLeft;
    offY = e.clientY - win.offsetTop;
    document.body.style.userSelect = "none";
  });

  window.addEventListener("mouseup", function () {
    isDown = false;
    document.body.style.userSelect = "auto";
  });

  window.addEventListener("mousemove", function (e) {
    if (!isDown) return;
    win.style.left = e.clientX - offX + "px";
    win.style.top = e.clientY - offY + "px";
  });
}

function makeIconDraggable(icon) {
  let isDragging = false;
  let hasMoved = false;
  let startX = 0;
  let startY = 0;
  let offX = 0;
  let offY = 0;

  icon.addEventListener("mousedown", (e) => {
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    icon.classList.add("dragging");
    bringToFront(icon);

    const rect = icon.getBoundingClientRect();
    offX = e.clientX - rect.left;
    offY = e.clientY - rect.top;

    if (icon.style.right) {
      icon.style.left = rect.left + "px";
      icon.style.right = "";
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > 3 || dy > 3) hasMoved = true;
    icon.style.left = `${e.clientX - offX}px`;
    icon.style.top = `${e.clientY - offY}px`;
  });

  window.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    icon.classList.remove("dragging");
    if (!hasMoved) {
      if (icon.id === "icon-projects") openProjectsFolder();
      else if (icon.id === "icon-readme") openReadMe();
    }
  });
}

/* ---------------------------
   Dock context menu
   --------------------------- */
function dockContext(e, app) {
  e.preventDefault();
  const existing = document.getElementById("context-menu");
  if (existing) existing.remove();

  const menu = document.createElement("div");
  menu.id = "context-menu";
  menu.className = "menu";
  menu.style.position = "absolute";
  menu.style.left = `${e.clientX}px`;
  menu.style.top = `${e.clientY}px`;
  menu.style.display = "block";
  menu.innerHTML = `
    <div onclick="openWindow('${app}'); this.parentElement && this.parentElement.remove();">Open</div>
    <div onclick="createMessageWindow('Info: ${app}', 'This is the ${app} application.'); this.parentElement && this.parentElement.remove();">Show Info</div>
    <hr style="border:none;border-top:1px solid #ccc;margin:6px 0;">
    <div onclick="this.parentElement && this.parentElement.remove();">Cancel</div>
  `;
  document.body.appendChild(menu);
  bringToFront(menu);
  setTimeout(
    () => window.addEventListener("click", () => menu.remove(), { once: true }),
    0
  );
}

/* ---------------------------
   Generic message window
   --------------------------- */
function createMessageWindow(title, message) {
  const id = "msg_" + Date.now();
  const win = document.createElement("div");
  win.className = "window";
  win.id = id;
  win.style.cssText = "display:block; left:220px; top:160px; width:340px;";
  win.innerHTML = `
    <div class="title">
      <span>${title}</span>
      <span class="controls">
        <span class="ctrl ctrl-close" title="Close" onclick="document.getElementById('${id}') && document.getElementById('${id}').remove()">×</span>
      </span>
    </div>
    <div class="content" style="padding: 15px;">${message}</div>
  `;
  document.body.appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}

/* ---------------------------
   Menu action handler
   --------------------------- */
function menuAction(action) {
  closeAllMenus();
  switch (action) {
    case "About This Mac":
      createMessageWindow(
        "About This Mac",
        `<strong>Retro OS v1.1</strong><br>Created by Abhinav Kuchhal.`
      );
      break;
    case "System Info":
      createMessageWindow(
        "System Info",
        `<strong>Processor:</strong> 1.21 GHz PowerPC (Emulated)<br><strong>Memory:</strong> 128 MB VRAM (Virtual RAM)`
      );
      break;
    case "Licenses":
      createMessageWindow(
        "Licenses",
        `Icons and fonts are used for personal, non-commercial purposes.`
      );
      break;
    case "Shut Down":
      if (
        confirm(
          "Are you sure you want to shut down? This will close the website."
        )
      ) {
        window.close();
      }
      break;
    default:
      createMessageWindow("Menu Action", `You clicked: "${action}"`);
      break;
  }
}

/* ---------------------------
   Notepad
   --------------------------- */
function saveNotepad() {
  const area = document.getElementById("notepadArea");
  if (!area) return;
  localStorage.setItem("notepadContent", area.value);
  const status = document.getElementById("notepadSaved");
  if (status) status.textContent = "Saved: " + new Date().toLocaleTimeString();
}
function loadNotepad() {
  const area = document.getElementById("notepadArea");
  if (!area) return;
  area.value = localStorage.getItem("notepadContent") || "";
  const status = document.getElementById("notepadSaved");
  if (status) status.textContent = "Loaded";
}

/* ---------------------------
   Calculator
   --------------------------- */
function calcInput(v) {
  const d = document.getElementById("calcDisplay");
  if (!d) return;
  if (d.value === "Error") d.value = "";
  d.value = (d.value || "") + v;
}
function sanitizeExpression(expr) {
  let e = expr.replace(/\^/g, "**");
  e = e.replace(/√\(([^)]+)\)/g, "Math.sqrt($1)");
  e = e.replace(/√([0-9]+(\.[0-9]+)?)/g, "Math.sqrt($1)");
  e = e.replace(/([0-9]+(\.[0-9]+)?)%/g, "($1/100)");
  return e;
}
function calculate() {
  const d = document.getElementById("calcDisplay");
  if (!d) return;
  try {
    const sanitized = sanitizeExpression(d.value || "");
    const result = new Function("return " + sanitized)();
    if (typeof result === "number" && !Number.isFinite(result))
      throw new Error("Bad result");
    d.value = String(
      Number.isInteger(result) ? result : parseFloat(result.toFixed(8))
    );
  } catch (e) {
    d.value = "Error";
  }
}
function clearCalc() {
  const d = document.getElementById("calcDisplay");
  if (d) d.value = "";
}
function handleCalcKeyDown(e) {
  const calcWin = document.getElementById("calculator");
  if (!calcWin || calcWin.style.display !== "block") return;
  const keyMap = {
    Enter: "=",
    Backspace: "backspace",
    Escape: "clear",
    c: "clear",
  };
  if ("0123456789.+-*/^%".includes(e.key)) {
    e.preventDefault();
    calcInput(e.key);
  } else if (keyMap[e.key]) {
    e.preventDefault();
    if (keyMap[e.key] === "=") calculate();
    else if (keyMap[e.key] === "clear") clearCalc();
    else if (keyMap[e.key] === "backspace") {
      const d = document.getElementById("calcDisplay");
      if (d) d.value = d.value.slice(0, -1);
    }
  }
}

/* ---------------------------
   Wallpaper & settings
   --------------------------- */
function setWallpaper(which) {
  let wallpaperIndex = parseInt(
    localStorage.getItem("currentWallpaper") || "1",
    10
  );
  if (which === "classic") {
    wallpaperIndex = 1;
  } else {
    wallpaperIndex = ((wallpaperIndex || 1) % 5) + 1;
  }
  document.body.style.backgroundImage = `url('assets/wallpapers/wallpaper${wallpaperIndex}.webp')`;
  localStorage.setItem("currentWallpaper", wallpaperIndex);
}
function toggleGrayscale(yes) {
  document.body.style.filter = yes ? "grayscale(1)" : "none";
}

/* ---------------------------
   Projects & ReadMe
   --------------------------- */
function openProjectsFolder() {
  if (document.getElementById("projects")) {
    bringToFront(document.getElementById("projects"));
    return;
  }
  const win = document.createElement("div");
  win.className = "window";
  win.id = "projects";
  win.style.cssText =
    "display:block; width:500px; height:auto; left:100px; top:100px;";
  win.innerHTML = `
    <div class="title">
      <span>Projects</span>
      <span class="controls">
        <span class="ctrl ctrl-min" title="Minimize" onclick="minimizeWindow('projects')">−</span>
        <span class="ctrl ctrl-close" title="Close" onclick="closeWindow('projects')">×</span>
      </span>
    </div>
    <div class="content" style="padding: 15px;">
      <p>Here are some of the projects I'm proud of. You can find more on my GitHub!</p>
      <ul>
        <li><strong>This Retro OS Website:</strong> An interactive portfolio built with vanilla HTML, CSS, and JavaScript.</li>
        <li><strong>E-commerce Platform:</strong> A full-stack web application with user authentication, product catalog, and a shopping cart.</li>
        <li><strong>Data Visualization Dashboard:</strong> A dashboard using D3.js.</li>
      </ul>
    </div>
  `;
  document.getElementById("projects-container").appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}

function openReadMe() {
  if (document.getElementById("readme")) {
    bringToFront(document.getElementById("readme"));
    return;
  }
  const win = document.createElement("div");
  win.className = "window";
  win.id = "readme";
  win.style.cssText =
    "display:block; width:450px; height:auto; left:150px; top:150px;";
  win.innerHTML = `
    <div class="title">
      <span>ReadMe.txt</span>
      <span class="controls">
        <span class="ctrl ctrl-min" title="Minimize" onclick="minimizeWindow('readme')">−</span>
        <span class="ctrl ctrl-close" title="Close" onclick="closeWindow('readme')">×</span>
      </span>
    </div>
    <div class="content" style="padding:15px; font-size:16px; line-height:1.6;">
      <h3>Abhinav Kuchhal</h3>
      <p>A passionate developer with a love for creating intuitive and engaging digital experiences.</p>
      <hr style="border:none; border-top: 1px solid #ccc; margin: 10px 0;">
      <h4>Skills</h4>
      <p><strong>Languages:</strong> JavaScript, HTML, CSS, Python, SQL<br><strong>Frameworks:</strong> React, Node.js, Express<br><strong>Tools:</strong> Git, Docker, Webpack, Figma</p>
    </div>
  `;
  document.getElementById("readme-container").appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}

/* ---------------------------
   Internet app
   --------------------------- */
function handleInternetSearch(event) {
  event.preventDefault();
  const query = document.getElementById("internetSearchInput")?.value.trim();
  if (!query) return;
  const url =
    query.includes(".") && !query.includes(" ")
      ? `https://${query}`
      : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  window.open(url, "_blank");
  if (document.getElementById("internetSearchInput"))
    document.getElementById("internetSearchInput").value = "";
}

/* ---------------------------
   Finder
   --------------------------- */
function renderFinderContent(location) {
  const mainContent = document.querySelector("#finder .finder-main");
  if (!mainContent) return;
  mainContent.innerHTML = "";

  document.querySelectorAll(".sidebar-item").forEach((item) => {
    item.classList.toggle(
      "active",
      item.textContent.trim().toLowerCase() === location
    );
  });

  if (location === "desktop") {
    const desktopIcons = document.querySelectorAll(".desktop-icon");
    desktopIcons.forEach((icon) => {
      const name = icon.querySelector("span")?.textContent || "Untitled";
      const imgSrc = icon.querySelector("img")?.src || "";
      const iconHTML = `
        <div class="finder-icon" ondblclick="handleFinderClick('${name.replace(
          /'/g,
          "\\'"
        )}')">
          <img src="${imgSrc}" alt="${name}">
          <span>${name}</span>
        </div>`;
      mainContent.innerHTML += iconHTML;
    });
  } else {
    mainContent.innerHTML = `<p style="color:#555;">This folder is empty.</p>`;
  }
}

function handleFinderClick(name) {
  if (!name) return;
  if (name === "ReadMe.txt") openReadMe();
  else if (name === "Projects") openProjectsFolder();
  else createMessageWindow("File", `You opened ${name}`);
}

/* ---------------------------
   Music (Tone.js safe handling)
   --------------------------- */
let synth = null;
let musicSequence = null;
let currentSongIndex = 0;
let isPlaying = false;

const songs = [
  {
    title: "Pixel Dog Bop",
    artist: "DJ Abhinav",
    notes: ["C4", "E4", "G4", "C5"],
  },
  {
    title: "8-Bit Anthem",
    artist: "The Pixels",
    notes: ["G4", "G4", "A4", "G4", "C5", "B4"],
  },
  {
    title: "Retro Vibes",
    artist: "Synthwave Dog",
    notes: ["F4", "A4", "C5", "A4", "F4", "D4", "F4", "G4"],
  },
];

function initToneIfNeeded() {
  try {
    if (window.Tone && !synth) {
      synth = new Tone.Synth().toDestination();
    }
  } catch (e) {
    console.warn("Tone init failed", e);
    synth = null;
  }
}

function playMusic() {
  initToneIfNeeded();
  if (!synth || !window.Tone) {
    const status = document.getElementById("musicStatus");
    if (status)
      status.textContent =
        "Audio not available (Tone.js failed to initialize).";
    return;
  }
  Tone.start()
    .then(() => {
      try {
        const song = songs[currentSongIndex];
        if (musicSequence) {
          musicSequence.stop(0).dispose();
        }
        musicSequence = new Tone.Sequence(
          (time, note) => {
            synth.triggerAttackRelease(note, "8n", time);
          },
          song.notes,
          "4n"
        ).start(0);
        Tone.Transport.start();
        isPlaying = true;
        const playBtn = document.getElementById("playPauseBtn");
        if (playBtn) playBtn.textContent = "❚❚";
        const status = document.getElementById("musicStatus");
        if (status)
          status.textContent = `Playing: ${song.title} — ${song.artist}`;
      } catch (e) {
        console.warn("playMusic error", e);
        const status = document.getElementById("musicStatus");
        if (status) status.textContent = "Playback error.";
      }
    })
    .catch((err) => {
      console.warn("Tone.start() rejected", err);
      const status = document.getElementById("musicStatus");
      if (status)
        status.textContent = "Browser blocked audio. Press play again.";
    });
}

function stopMusic() {
  try {
    if (musicSequence) {
      musicSequence.stop(0).dispose();
      musicSequence = null;
    }
    Tone.Transport.stop();
  } catch (e) {}
  isPlaying = false;
  const playBtn = document.getElementById("playPauseBtn");
  if (playBtn) playBtn.textContent = "▶";
  const status = document.getElementById("musicStatus");
  if (status) status.textContent = "Stopped";
}

function togglePlay() {
  if (isPlaying) stopMusic();
  else playMusic();
}

function updateSongDisplay() {
  const title = document.getElementById("songTitle");
  const artist = document.getElementById("songArtist");
  if (title) title.textContent = songs[currentSongIndex].title;
  if (artist) artist.textContent = songs[currentSongIndex].artist;
}

function nextSong() {
  const wasPlaying = isPlaying;
  if (wasPlaying) stopMusic();
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  updateSongDisplay();
  if (wasPlaying) playMusic();
}

function prevSong() {
  const wasPlaying = isPlaying;
  if (wasPlaying) stopMusic();
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  updateSongDisplay();
  if (wasPlaying) playMusic();
}

/* ---------------------------
   Trash & easter egg
   --------------------------- */
let secretFolderOpened = false;
function renderTrashContent() {
  const trashContent = document.getElementById("trashContent");
  if (!trashContent) return;

  if (secretFolderOpened) {
    trashContent.innerHTML = `<div style="padding:12px;">Trash is empty.</div>`;
  } else {
    trashContent.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;flex-direction:column;">
        <div class="finder-icon" ondblclick="revealEasterEgg()" style="margin-top:6px;">
          <img src="assets/icons/folderIcon.webp" alt="Secret Folder" style="width:var(--file-icon-size);height:var(--file-icon-size);">
          <span>DO NOT OPEN</span>
        </div>
        <div style="font-size:12px;color:#666;">Double-click the folder to see what's inside.</div>
      </div>
    `;
  }
}

function revealEasterEgg() {
  const trashContent = document.getElementById("trashContent");
  if (!trashContent) return;
  trashContent.innerHTML = `
    <div class="secret-content" style="font-family:monospace; white-space:pre-wrap;">
/\\_/\\
( o.o )
 > ^ <
<span class="highlight">Woof! You found me!</span>

I'm the pixel dog.
I guard the trash.

> <span style="text-decoration: underline; cursor:pointer;" onclick="createMessageWindow('Pixel Dog', 'I give you a virtual high-five! 🙌')">Pet the dog</span>
> <span style="text-decoration: underline; cursor:pointer;" onclick="emptyTrash()">Empty Trash</span>
    </div>
  `;
}

function emptyTrash() {
  secretFolderOpened = true;
  renderTrashContent();
  createMessageWindow("Trash", "The secret is gone... for now.");
}
// ---------- END: full preserved app code ----------

// ---------------------------
// BOOT / PRELOADER IMPLEMENTATION
// ---------------------------

/**
 * Collect list of assets to preload.
 * Strategy:
 * - collect all <img> src attributes present in DOM
 * - add candidate wallpaper images (wallpaper1..5)
 * - deduplicate
 */
function gatherAssetsToPreload() {
  const assets = new Set();

  // collect images used in DOM
  document.querySelectorAll("img").forEach((img) => {
    const s = img.getAttribute("src");
    if (s) assets.add(s);
  });

  // candidate wallpapers (adjust number if you have more)
  for (let i = 1; i <= 5; i++) {
    assets.add(`assets/wallpapers/wallpaper${i}.webp`);
  }

  // include icons directory generically (if you prefer to add explicit filenames)
  // explicit list that we used around the UI (safe)
  [
    "assets/icons/finder.webp",
    "assets/icons/internet.webp",
    "assets/icons/calculator.webp",
    "assets/icons/music.webp",
    "assets/icons/clock.webp",
    "assets/icons/notepad.webp",
    "assets/icons/trash.webp",
    "assets/icons/TxtIcon.webp",
    "assets/icons/folderIcon.webp",
    "assets/icons/dog.webp",
    "assets/icons/snoogle.webp",
    "assets/icons/twitter.webp",
    "assets/icons/instagram.webp",
    "assets/icons/youtube.webp",
    "assets/icons/linkedin.webp",
    "assets/icons/github.webp",
  ].forEach((p) => assets.add(p));

  // If you have startup audio file, add it here:
  // assets.add('assets/audio/startup-chime.mp3');

  return Array.from(assets);
}

/**
 * Preload assets (images + audio). Report progress through onProgress(percent, loadedCount, total)
 * Returns Promise that resolves when all finished (successful or errored)
 */
function preloadAssets(assetList, onProgress) {
  const total = assetList.length;
  if (total === 0) {
    if (onProgress) onProgress(100, 0, 0);
    return Promise.resolve();
  }

  let loaded = 0;
  function markOne(src) {
    loaded++;
    const pct = Math.round((loaded / total) * 100);
    if (typeof onProgress === "function") onProgress(pct, loaded, total, src);
  }

  const promises = assetList.map((src) => {
    // decide by extension
    const lower = src.split("?")[0].toLowerCase();
    if (/\.(png|jpe?g|webp|gif|svg|bmp)$/.test(lower)) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          markOne(src);
          resolve({ src, ok: true });
        };
        img.onerror = () => {
          markOne(src);
          resolve({ src, ok: false });
        };
        // set src after handlers
        img.src = src;
      });
    } else if (/\.(mp3|wav|ogg|m4a)$/.test(lower)) {
      return new Promise((resolve) => {
        const aud = new Audio();
        aud.preload = "auto";
        aud.oncanplaythrough = () => {
          markOne(src);
          resolve({ src, ok: true });
        };
        aud.onerror = () => {
          markOne(src);
          resolve({ src, ok: false });
        };
        aud.src = src;
        // start load
        aud.load();
      });
    } else {
      // fallback: request via fetch (HEAD) to at least attempt
      return fetch(src, { method: "GET", mode: "no-cors" }).then(
        () => {
          markOne(src);
          return { src, ok: true };
        },
        () => {
          markOne(src);
          return { src, ok: false };
        }
      );
    }
  });

  return Promise.all(promises);
}

/**
 * Show boot progress UI. Called on page DOMContentLoaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  const bootScreen = document.getElementById("boot-screen");
  const progressEl = document.getElementById("boot-progress");
  const percentEl = document.getElementById("boot-percent");
  const enterBtn = document.getElementById("boot-enter");
  const caption = document.getElementById("boot-caption");

  // Mark body as booting (can be used by CSS to disable pointer events underlay)
  document.body.classList.add("booting");

  // gather and start preloading
  const assets = gatherAssetsToPreload();

  // small delay before starting visible progress (lets fonts render)
  setTimeout(() => {
    preloadAssets(assets, (pct, loaded, total, last) => {
      // update UI smoothly
      if (progressEl) progressEl.style.width = `${pct}%`;
      if (percentEl) percentEl.textContent = `${pct}%`;
      if (caption) caption.textContent = `Loading assets — ${loaded}/${total}`;
    }).then(() => {
      // ensure progress hits 100
      if (progressEl) progressEl.style.width = `100%`;
      if (percentEl) percentEl.textContent = `100%`;
      if (caption) caption.textContent = `Ready`;

      // show ENTER button after a short pause
      setTimeout(() => {
        if (enterBtn) {
          enterBtn.style.display = "inline-block";
          enterBtn.setAttribute("aria-hidden", "false");
          enterBtn.focus();
        }
      }, 300);
    });
  }, 100); // small UX delay

  // pressing ENTER key or clicking the button proceeds to the app
  function finishBoot() {
    // hide and remove boot screen with fade
    if (!bootScreen) return;
    bootScreen.classList.add("boot-hide");
    // allow interactions underneath after animation
    setTimeout(() => {
      bootScreen.style.display = "none";
      document.body.classList.remove("booting");
      // initialize the rest of the app
      initApp();
    }, 420); // match CSS transition duration
  }

  enterBtn?.addEventListener("click", finishBoot);
  // also allow Enter key to trigger
  window.addEventListener("keydown", function onKey(e) {
    if (
      (e.key === "Enter" || e.key === " ") &&
      document.getElementById("boot-enter")?.style.display !== "none"
    ) {
      finishBoot();
      window.removeEventListener("keydown", onKey);
    }
  });
});

/* ---------------------------
   initApp - previously inside DOMContentLoaded
   called after boot overlay hides (user pressed ENTER)
--------------------------- */
function initApp() {
  // Make all windows draggable
  document.querySelectorAll(".window").forEach((win) => {
    makeDraggable(win);
  });

  // Make icons draggable & clickable
  document.querySelectorAll(".desktop-icon").forEach(makeIconDraggable);

  // load notepad content if any
  loadNotepad();

  // keyboard calc handler
  document.addEventListener("keydown", handleCalcKeyDown);

  // safe wiring of music controls (only if buttons exist)
  const playBtn = document.getElementById("playPauseBtn");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  if (playBtn) playBtn.addEventListener("click", togglePlay);
  if (nextBtn) nextBtn.addEventListener("click", nextSong);
  if (prevBtn) prevBtn.addEventListener("click", prevSong);

  // wallpaper restore
  const savedWallpaper = localStorage.getItem("currentWallpaper");
  if (savedWallpaper) {
    document.body.style.backgroundImage = `url('assets/wallpapers/wallpaper${savedWallpaper}.webp')`;
  }

  // Ensure trash content is ready
  renderTrashContent();

  // update clock immediately
  updateClock();
}
