/**
 * Retro OS - Main Script
 * Handles core OS functionalities like window management, boot sequence,
 * and initialization of all applications.
 */

// -----------------------------------------------------------------------------
// CORE OS STATE & UTILITIES
// -----------------------------------------------------------------------------

let zTop = 1000;
const windowStates = {}; // States: 'closed', 'open', 'minimized'

function bringToFront(el) {
  if (!el) return;
  zTop += 1;
  el.style.zIndex = zTop;
}

function updateBatteryStatus() {
  if (!("getBattery" in navigator)) {
    const batteryIconEl = document.getElementById("battery-icon");
    if (batteryIconEl) batteryIconEl.style.display = "none";
    return;
  }
  navigator.getBattery().then(function (battery) {
    const batteryLevelEl = document.getElementById("battery-level");
    const batteryIconEl = document.getElementById("battery-icon");

    function updateAllBatteryInfo() {
      if (!batteryLevelEl || !batteryIconEl) return;
      const levelPercent = Math.round(battery.level * 100);
      batteryLevelEl.style.width = levelPercent + "%";
      batteryLevelEl.style.backgroundColor =
        levelPercent < 20 ? "#ff6b6b" : "#32cd32";
      batteryIconEl.title = `Battery: ${levelPercent}%`;
    }

    updateAllBatteryInfo();
    battery.addEventListener("levelchange", updateAllBatteryInfo);
  });
}

// -----------------------------------------------------------------------------
// UI MANAGEMENT (WINDOWS, MENUS, DRAGGING)
// -----------------------------------------------------------------------------

// A flag to ensure we only initialize the terminal once
let isTerminalInitialized = false;

function openWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;

  // --- START: Updated Music Logic ---
  if (id === "music") {
    stopDockNoteLoop();
    createMusicPlayer();
  }
  // --- END: Updated Music Logic ---

  const currentState = windowStates[id] || "closed";
  if (currentState === "minimized") {
    el.style.display = "block";
    bringToFront(el);
    windowStates[id] = "open";
  } else if (currentState === "closed") {
    el.style.display = "block";
    bringToFront(el);
    windowStates[id] = "open";
    if (id === "finder") renderFinderContent("desktop");
    if (id === "trash") renderTrashContent();
    if (id === "clockApp") updateClock(true);
    if (id === "terminal") {
      if (!isTerminalInitialized) {
        initTerminal();
        isTerminalInitialized = true;
      }
      focusTerminal();
    }
    const dockIcon = document.querySelector(`.dock-icon[data-app="${id}"]`);
    if (dockIcon) dockIcon.classList.add("active");
  } else {
    bringToFront(el);
  }
}

function closeWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
  windowStates[id] = "closed";

  // --- START: Updated Music Logic ---
  if (id === "music") {
    destroyMusicPlayer(); // Properly destroys the player and stops all animations
  }
  // --- END: Updated Music Logic ---

  const dockIcon = document.querySelector(`.dock-icon[data-app="${id}"]`);
  if (dockIcon) dockIcon.classList.remove("active");
  if (id === "projects" || id === "readme") {
    el.parentElement?.removeChild(el);
  }
}

function minimizeWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
  windowStates[id] = "minimized";

  // --- START: Updated Music Logic ---
  // We can use isMusicPlaying() again because it's now accurate!
  if (id === "music") {
    stopWindowNoteLoop(); // Window is hidden, so stop its animation
    if (isMusicPlaying()) {
      startDockNoteLoop(); // If music is playing, start the dock animation
    }
  }
  // --- END: Updated Music Logic ---
}

function makeDraggable(win) {
  const header = win.querySelector(".title");
  if (!header) return;
  let isDown = false,
    offX = 0,
    offY = 0;

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
  let isDragging = false,
    offX = 0,
    offY = 0;

  icon.addEventListener("mousedown", (e) => {
    isDragging = true;
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
    icon.style.left = `${e.clientX - offX}px`;
    icon.style.top = `${e.clientY - offY}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  icon.addEventListener("dblclick", () => {
    if (icon.id === "icon-projects") openProjectsFolder();
    else if (icon.id === "icon-readme") openReadMe();
  });
}

// -----------------------------------------------------------------------------
// DYNAMIC CONTENT, MENUS & SETTINGS
// -----------------------------------------------------------------------------

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

function menuAction(action) {
  closeAllMenus();
  switch (action) {
    case "About This Mac":
      createMessageWindow(
        "About This Mac",
        `<strong>Retro OS v2.1</strong><br>Created by Abhinav Kuchhal.
        <br><br>A fun, interactive portfolio website inspired by classic Mac OS. Enjoy your stay!
        `
      );
      break;
    case "System Info":
      createMessageWindow(
        "System Info",
        `<strong>Processor:</strong> 1.21 GHz PowerPC (Emulated)<br><strong>Memory:</strong> 128 MB VRAM (Virtual RAM)<br><strong>Graphics:</strong> Imagination Engine II <br><strong>Serial Number:</strong> AK47000593`
      );
      break;
    case "Licenses":
      createMessageWindow(
        "Licenses",
        `<strong style="font-size: 16px; font-family: monospace;">© 2025 ABHINAV KUCHHAL</strong><br><br>All icons and images are used for personal, non-commercial purposes. Fonts are from Google Fonts. This project is a tribute and not affiliated with Apple Inc.<br><br><strong style="font-family: monospace;">All Rights Reserved.</strong>`
      );
      break;
    case "Shut Down":
      createMessageWindow(
        "Shut Down",
        'Shut down functionality is disabled in this demo. <br><br> <button onclick="window.close()">Proceed Anyway</button>'
      );
      break;
    // File, View, and Edit menu items are now decorative and don't perform any action
    default:
      // No action for other menu items
      break;
  }
}

function createMessageWindow(title, message) {
  const id = "msg_" + Date.now();
  const win = document.createElement("div");
  win.className = "window";
  win.id = id;
  win.style.cssText = "display:block; left:220px; top:160px; width:340px;";
  win.innerHTML = `<div class="title"><span>${title}</span><span class="controls"><span class="ctrl ctrl-close" title="Close" onclick="document.getElementById('${id}').remove()">×</span></span></div><div class="content" style="padding: 15px;">${message}</div>`;
  document.body.appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}

// Wallpaper functions
let currentWallpaperState = localStorage.getItem("currentWallpaper") || "1";
let currentWallpaperIndex = parseInt(
  localStorage.getItem("currentWallpaperIndex") || "1",
  10
);

function setWallpaper(style) {
  if (style === "classic") {
    // Set to classic wallpaper (wallpaper0.webp)
    document.body.style.backgroundImage =
      "url('assets/wallpapers/wallpaper0.webp')";
    currentWallpaperState = "classic";
    localStorage.setItem("currentWallpaper", "classic");
  } else if (style === "alt") {
    // Manually cycle to the next wallpaper (1-5)
    currentWallpaperIndex = (currentWallpaperIndex % 5) + 1; // Cycle 1-5
    document.body.style.backgroundImage = `url('assets/wallpapers/wallpaper${currentWallpaperIndex}.webp')`;
    currentWallpaperState = String(currentWallpaperIndex);
    localStorage.setItem("currentWallpaper", String(currentWallpaperIndex));
    localStorage.setItem(
      "currentWallpaperIndex",
      String(currentWallpaperIndex)
    );
  } else if (!isNaN(style)) {
    // For direct numeric access
    const index = parseInt(style, 10);
    if (index >= 0 && index <= 5) {
      document.body.style.backgroundImage = `url('assets/wallpapers/wallpaper${index}.webp')`;
      currentWallpaperState = String(index);
      currentWallpaperIndex = index;
      localStorage.setItem("currentWallpaper", String(index));
      localStorage.setItem("currentWallpaperIndex", String(index));
    }
  }
}

function cycleWallpaper() {
  // This function is kept for compatibility but not used in the UI
  setWallpaper("alt");
}

function toggleGrayscale(isChecked) {
  document.body.style.filter = isChecked ? "grayscale(100%)" : "none";
}

// -----------------------------------------------------------------------------
// BOOT SEQUENCE & INITIALIZATION
// -----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const bootScreen = document.getElementById("boot-screen");
  const enterBtn = document.getElementById("boot-enter");

  let hasShownWelcome = false;

  function finishBoot() {
    const startupSound = new Audio("assets/sounds/startup-sound.mp3");
    startupSound.volume = 0.5;
    startupSound
      .play()
      .catch((e) => console.log("Could not play startup sound:", e));
    bootScreen.classList.add("boot-hide");
    setTimeout(() => {
      bootScreen.style.display = "none";
      initApp();

      // Show welcome notification after initialization (only once)
      if (!hasShownWelcome) {
        const welcomeWindow = document.createElement("div");
        welcomeWindow.className = "window";
        welcomeWindow.id = "welcome-window";
        welcomeWindow.style.cssText =
          "display:block; left:30%; top:30%; transform: translate(-50%, -50%); width: 500px; max-width: 90%;";
        welcomeWindow.innerHTML = `
          <div class="title">
            <span>Welcome</span>
            <span class="controls">
              <span class="ctrl ctrl-close" title="Close" onclick="document.getElementById('welcome-window').remove()">×</span>
            </span>
          </div>
          <div class="content" style="padding: 20px; font-family: 'VT323', monospace; font-size: 18px; line-height: 1.6; text-align: center;">
            <h2 style="margin: 0 0 15px 0; font-size: 28px;">Welcome to My Digital Space!</h2>
            <p style="margin-bottom: 15px;">This is my portfolio + an interactive GUI inspired by classic MacOS in a retro-pixelated style. So feel free to click around, explore the apps, and discover more about me.</p>
            <p style="margin: 0;">Enjoy your stay!</p>
          </div>`;
        document.body.appendChild(welcomeWindow);
        makeDraggable(welcomeWindow);
        bringToFront(welcomeWindow);
        hasShownWelcome = true;
      }
    }, 1000);
  }

  const progressEl = document.getElementById("boot-progress");
  const percentEl = document.getElementById("boot-percent");
  const caption = document.getElementById("boot-caption");
  let loaded = 0;
  const assets = Array.from(document.images);
  const total = assets.length;

  if (total === 0) {
    caption.textContent = "Ready to Start";
    enterBtn.style.display = "inline-block";
    enterBtn.focus();
  } else {
    assets.forEach((img) => {
      const image = new Image();
      image.src = img.src;
      image.onload = image.onerror = () => {
        loaded++;
        const percent = Math.round((loaded / total) * 100);
        if (progressEl) progressEl.style.width = `${percent}%`;
        if (percentEl) percentEl.textContent = `${percent}%`;
        if (loaded === total) {
          setTimeout(() => {
            caption.textContent = "Ready to Start";
            enterBtn.style.display = "inline-block";
            enterBtn.focus();
          }, 300);
        }
      };
    });
  }

  enterBtn?.addEventListener("click", finishBoot);
  window.addEventListener("keydown", function onKey(e) {
    if (e.key === "Enter" && enterBtn?.style.display !== "none") {
      finishBoot();
      window.removeEventListener("keydown", onKey);
    }
  });
});

function initApp() {
  // Make all windows draggable
  document.querySelectorAll(".window").forEach((win) => makeDraggable(win));

  // Make sure terminal window is draggable
  const terminalWindow = document.getElementById("terminal-window");
  if (terminalWindow) {
    makeDraggable(terminalWindow);
  }

  document.querySelectorAll(".desktop-icon").forEach(makeIconDraggable);

  // Event Listeners
  window.addEventListener("click", (e) => {
    if (!e.target.closest(".top-bar .icon") && !e.target.closest(".menu")) {
      closeAllMenus();
    }
  });

  document
    .getElementById("internetSearchForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const queryInput = document.getElementById("internetSearchInput");
      const query = queryInput?.value.trim();
      if (!query) return;
      const url =
        query.includes(".") && !query.includes(" ")
          ? `https://${query}`
          : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(url, "_blank");
      if (queryInput) queryInput.value = "";
    });

  // Initialize wallpaper - default to wallpaper1.webp on first load
  const savedWallpaper = localStorage.getItem("currentWallpaper") || "1";
  setWallpaper(savedWallpaper === "alt" ? "1" : savedWallpaper);

  renderTrashContent();
  updateBatteryStatus();

  // Initialize App-Specific Logic
  initCalculator();
  initClock();
}
