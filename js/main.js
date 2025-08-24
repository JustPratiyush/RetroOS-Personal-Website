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

/**
 * Brings a given element to the front of the z-index stack.
 * @param {HTMLElement} el The element to bring to the front.
 */
function bringToFront(el) {
  if (!el) return;
  zTop += 1;
  el.style.zIndex = zTop;
}

/**
 * Updates the battery status icon if the API is available.
 */
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
// ICON & WINDOW MANAGEMENT
// -----------------------------------------------------------------------------

let isTerminalInitialized = false;

/**
 * Reliably finds the VISIBLE dock icon for an app and sets its active state.
 * @param {string} appName The name of the app (e.g., 'music').
 * @param {boolean} isActive Whether to add or remove the 'active' class.
 */
function setAppIconActive(appName, isActive) {
  const allIcons = document.querySelectorAll(
    `.dock-icon[data-app="${appName}"]`
  );
  if (allIcons.length === 0) return;

  allIcons.forEach((icon) => icon.classList.remove("active"));

  if (isActive) {
    const visibleIcon = Array.from(allIcons).find(
      (icon) => icon.offsetParent !== null
    );
    if (visibleIcon) {
      visibleIcon.classList.add("active");
    }
  }
}

/**
 * Opens a window, bringing it to the front and setting its state.
 * @param {string} id The ID of the window to open.
 */
function openWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;

  // --- THIS IS THE FIX ---
  // If we are opening the music app, stop the dock animation immediately.
  if (id === "music") {
    if (typeof stopDockNoteLoop === "function") {
      stopDockNoteLoop();
    }
    createMusicPlayer();
  }

  const currentState = windowStates[id] || "closed";
  if (currentState === "minimized" || currentState === "closed") {
    el.style.display = "block";
    windowStates[id] = "open";
    setAppIconActive(id, true);

    if (id === "finder") renderFinderContent("desktop");
    if (id === "trash") renderTrashContent();
    if (id === "clockApp") updateClock(true);
    if (id === "terminal" && !isTerminalInitialized) {
      initTerminal();
      isTerminalInitialized = true;
    }
    if (id === "terminal") focusTerminal();
  }

  bringToFront(el);

  const appDrawer = document.getElementById("app-drawer");
  const hamburgerIcon = document.getElementById("hamburger-icon");
  if (appDrawer && appDrawer.classList.contains("show")) {
    appDrawer.classList.remove("show");
    hamburgerIcon.classList.remove("active");
  }
}

/**
 * Closes a window and updates its state.
 * @param {string} id The ID of the window to close.
 */
function closeWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
  windowStates[id] = "closed";
  setAppIconActive(id, false);

  if (id === "music") {
    destroyMusicPlayer();
  }

  if (id === "projects" || id === "readme") {
    el.parentElement?.removeChild(el);
  }
}

/**
 * Minimizes a window and updates its state.
 * @param {string} id The ID of the window to minimize.
 */
function minimizeWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
  windowStates[id] = "minimized";
  setAppIconActive(id, true);

  if (id === "music") {
    stopWindowNoteLoop();
    if (typeof isMusicPlaying === "function" && isMusicPlaying()) {
      startDockNoteLoop();
    }
  }
}

// (The rest of main.js remains unchanged)

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
    default:
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

let currentWallpaperState = localStorage.getItem("currentWallpaper") || "1";
let currentWallpaperIndex = parseInt(
  localStorage.getItem("currentWallpaperIndex") || "1",
  10
);

function setWallpaper(style) {
  if (style === "classic") {
    document.body.style.backgroundImage =
      "url('assets/wallpapers/wallpaper0.webp')";
    currentWallpaperState = "classic";
    localStorage.setItem("currentWallpaper", "classic");
  } else if (style === "alt") {
    currentWallpaperIndex = (currentWallpaperIndex % 5) + 1;
    document.body.style.backgroundImage = `url('assets/wallpapers/wallpaper${currentWallpaperIndex}.webp')`;
    currentWallpaperState = String(currentWallpaperIndex);
    localStorage.setItem("currentWallpaper", String(currentWallpaperIndex));
    localStorage.setItem(
      "currentWallpaperIndex",
      String(currentWallpaperIndex)
    );
  } else if (!isNaN(style)) {
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

function toggleGrayscale(isChecked) {
  document.body.style.filter = isChecked ? "grayscale(100%)" : "none";
}

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

      if (!hasShownWelcome) {
        const welcomeWindow = document.createElement("div");
        welcomeWindow.className = "window";
        welcomeWindow.id = "welcome-window";
        welcomeWindow.style.cssText =
          "display:block; left:50%; top:50%; transform: translate(-50%, -50%); width: 500px; max-width: 90%;";
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
  document.querySelectorAll(".window").forEach((win) => makeDraggable(win));
  document.querySelectorAll(".desktop-icon").forEach(makeIconDraggable);

  window.addEventListener("click", (e) => {
    if (!e.target.closest(".top-bar .icon") && !e.target.closest(".menu")) {
      closeAllMenus();
    }

    const appDrawer = document.getElementById("app-drawer");
    const hamburgerIcon = document.getElementById("hamburger-icon");
    if (appDrawer && hamburgerIcon) {
      if (
        appDrawer.classList.contains("show") &&
        !appDrawer.contains(e.target) &&
        !e.target.closest("#hamburger-icon")
      ) {
        appDrawer.classList.remove("show");
        hamburgerIcon.classList.remove("active");
      }
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

  const savedWallpaper = localStorage.getItem("currentWallpaper") || "1";
  setWallpaper(savedWallpaper === "alt" ? "1" : savedWallpaper);

  if (typeof renderTrashContent === "function") renderTrashContent();
  updateBatteryStatus();
  if (typeof initCalculator === "function") initCalculator();
  if (typeof initClock === "function") initClock();
}

function toggleAppDrawer() {
  const appDrawer = document.getElementById("app-drawer");
  const hamburgerIcon = document.getElementById("hamburger-icon");
  if (!appDrawer || !hamburgerIcon) return;

  if (!appDrawer.classList.contains("show")) {
    appDrawer.classList.add("show");
    hamburgerIcon.classList.add("active");
  }
}
