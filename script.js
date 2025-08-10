// Global state and utility
let zTop = 1000;
function bringToFront(el) {
  zTop += 1;
  el.style.zIndex = zTop;
}

// --- Clock in top bar ---
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("clock").textContent = h + ":" + m;
  const bigClock = document.getElementById("bigClock");
  if (bigClock) {
    bigClock.textContent = now.toLocaleTimeString();
  }
}
setInterval(updateClock, 1000);
updateClock();

// --- Menu handling ---
function toggleMenu(menuId, el) {
  const menu = document.getElementById(menuId);
  if (!menu) return;

  const isAlreadyOpen = menu.style.display === "block";

  // Close all menus first
  closeAllMenus();

  if (isAlreadyOpen) {
    return; // If it was open, just close it and do nothing else.
  }

  const rect = el.getBoundingClientRect();
  menu.style.left = Math.max(6, rect.left) + "px";
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

// Close menus when clicking outside
window.addEventListener("click", (e) => {
  if (!e.target.closest(".top-bar .icon") && !e.target.closest(".menu")) {
    closeAllMenus();
  }
});

// --- Window Management ---
function openWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
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
  document.querySelectorAll(".dock-icon").forEach((d) => {
    if (d.dataset.app === id) d.classList.remove("active");
  });
  // Special handling for dynamically created windows
  if (id === "projects" || id === "readme") {
    el.remove();
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

// --- Draggable Windows ---
function makeDraggable(win) {
  const header = win.querySelector(".title");
  let isDown = false,
    offX = 0,
    offY = 0;

  function handleMouseDown(e) {
    if (e.target.classList.contains("ctrl")) {
      return;
    }
    isDown = true;
    bringToFront(win);
    offX = e.clientX - win.offsetLeft;
    offY = e.clientY - win.offsetTop;
    document.body.style.userSelect = "none";
  }

  function handleMouseUp() {
    isDown = false;
    document.body.style.userSelect = "auto";
  }

  function handleMouseMove(e) {
    if (!isDown) return;
    win.style.left = e.clientX - offX + "px";
    win.style.top = e.clientY - offY + "px";
  }

  header.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("mousemove", handleMouseMove);
}

// --- Draggable Desktop Icons (NEW) ---
function makeIconDraggable(icon) {
  let isDragging = false;
  let hasMoved = false;
  let offX = 0,
    offY = 0;

  icon.addEventListener("mousedown", (e) => {
    isDragging = true;
    hasMoved = false;
    icon.classList.add("dragging");
    bringToFront(icon);

    offX = e.clientX - icon.offsetLeft;
    offY = e.clientY - icon.offsetTop;

    // We need to remove the 'right' property if it exists, to drag with 'left'
    if (icon.style.right) {
      icon.style.left = icon.offsetLeft + "px";
      icon.style.right = "";
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    hasMoved = true;
    let newX = e.clientX - offX;
    let newY = e.clientY - offY;
    icon.style.left = `${newX}px`;
    icon.style.top = `${newY}px`;
  });

  window.addEventListener("mouseup", () => {
    if (isDragging && !hasMoved) {
      // This was a click, not a drag
      if (icon.id === "icon-projects") {
        openProjectsFolder();
      } else if (icon.id === "icon-readme") {
        openReadMe();
      }
    }
    isDragging = false;
    icon.classList.remove("dragging");
  });
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Make all static windows draggable
  document.querySelectorAll(".window").forEach((w) => {
    makeDraggable(w);
  });

  // Make all desktop icons draggable
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    makeIconDraggable(icon);
  });

  loadNotepad();
  updateClock();
  document.addEventListener("keydown", handleCalcKeyDown);
});

// --- Dock Context Menu ---
function dockContext(e, app) {
  e.preventDefault();
  const existingMenu = document.getElementById("context-menu");
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement("div");
  menu.id = "context-menu";
  menu.className = "menu";
  menu.style.position = "absolute";
  menu.style.left = e.clientX + "px";
  menu.style.top = e.clientY + "px";
  menu.style.display = "block";
  menu.innerHTML = `
    <div onclick="openWindow('${app}'); this.parentElement.remove();">Open</div>
    <div onclick="createMessageWindow('Info: ${app}', 'This is the ${app} application.'); this.parentElement.remove();">Show Info</div>
    <hr style="border: none; border-top: 1px solid #ccc; margin: 2px 0;">
    <div onclick="this.parentElement.remove();">Cancel</div>`;
  document.body.appendChild(menu);
  bringToFront(menu);
  setTimeout(() => {
    window.addEventListener("click", () => menu.remove(), { once: true });
  }, 0);
}

// --- Generic Message Window ---
function createMessageWindow(title, message) {
  const id = "msg_" + Date.now();
  const win = document.createElement("div");
  win.className = "window";
  win.id = id;
  win.style.left = "220px";
  win.style.top = "160px";
  win.style.width = "340px";
  win.style.display = "block";
  win.innerHTML = `
    <div class="title">
      <span>${title}</span>
      <span class="controls">
        <span class="ctrl ctrl-close" title="Close" onclick="document.getElementById('${id}').remove()">×</span>
      </span>
    </div>
    <div class="content" style="padding: 15px;">${message}</div>`;
  document.body.appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}

// --- Menu Action Handler ---
function menuAction(action) {
  closeAllMenus();
  switch (action) {
    case "About This Mac":
      createMessageWindow(
        "About This Mac",
        "<strong>Retro OS v1.0</strong><br>Created by Abhinav Kuchhal.<br><br>A fun, interactive portfolio website inspired by classic Mac OS. Enjoy your stay!"
      );
      break;
    case "System Info":
      createMessageWindow(
        "System Info",
        "<strong>Processor:</strong> 1.21 GHz PowerPC (Emulated)<br><strong>Memory:</strong> 128 MB VRAM (Virtual RAM)<br><strong>Graphics:</strong> Imagination Engine II<br><strong>Serial Number:</strong> AK20241337"
      );
      break;
    case "Licenses":
      createMessageWindow(
        "Licenses",
        "All icons and images are used for personal, non-commercial purposes. Fonts are from Google Fonts. This project is a tribute and not affiliated with Apple Inc."
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
      createMessageWindow("Menu Action", 'You clicked: "' + action + '"');
      break;
  }
}

// --- Notepad App ---
function saveNotepad() {
  const text = document.getElementById("notepadArea").value;
  localStorage.setItem("notepadContent", text);
  const el = document.getElementById("notepadSaved");
  el.textContent = "Saved: " + new Date().toLocaleTimeString();
}
function loadNotepad() {
  const text = localStorage.getItem("notepadContent") || "";
  document.getElementById("notepadArea").value = text;
  document.getElementById("notepadSaved").textContent = "Loaded";
}

// --- Calculator App ---
function calcInput(v) {
  const d = document.getElementById("calcDisplay");
  if (d.value === "Error") d.value = "";
  d.value = (d.value || "") + v;
}
function calculate() {
  const d = document.getElementById("calcDisplay");
  let expression = d.value;
  if (!expression) return;
  try {
    expression = expression.replace(/\^/g, "**").replace(/√/g, "Math.sqrt");
    const result = new Function("return " + expression)();
    d.value = String(
      Number.isInteger(result) ? result : parseFloat(result.toFixed(8))
    );
  } catch (e) {
    d.value = "Error";
  }
}
function clearCalc() {
  document.getElementById("calcDisplay").value = "";
}
function handleCalcKeyDown(e) {
  const calculator = document.getElementById("calculator");
  if (!calculator || calculator.style.display === "none") return;
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
      d.value = d.value.slice(0, -1);
    }
  }
}

// --- Settings App ---
let currentWallpaper = 1;

function setWallpaper(which) {
  if (which === "classic") {
    currentWallpaper = 0;
    document.body.style.backgroundImage = "url('images/wallpaper0.webp')";
  } else {
    currentWallpaper = (currentWallpaper % 5) + 1;
    document.body.style.backgroundImage = `url('images/wallpaper${currentWallpaper}.webp')`;
  }
  localStorage.setItem("currentWallpaper", currentWallpaper);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedWallpaper = localStorage.getItem("currentWallpaper");
  if (savedWallpaper !== null) {
    currentWallpaper = parseInt(savedWallpaper, 10);
    document.body.style.backgroundImage = `url('images/wallpaper${currentWallpaper}.webp')`;
  }
});
function toggleGrayscale(yes) {
  document.body.style.filter = yes ? "grayscale(1)" : "none";
}

// --- Projects Folder ---
function openProjectsFolder() {
  let projectsWindow = document.getElementById("projects");
  if (projectsWindow) {
    bringToFront(projectsWindow);
    return;
  }
  const win = document.createElement("div");
  win.className = "window";
  win.id = "projects";
  win.style.cssText =
    "display: block; width: 500px; height: auto; left: 100px; top: 100px;";
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
            <li><strong>Data Visualization Dashboard:</strong> A dashboard for visualizing complex datasets using D3.js.</li>
        </ul>
        <p>More projects coming soon...</p>
    </div>`;
  document.getElementById("projects-container").appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}

// --- ReadMe File (NEW) ---
function openReadMe() {
  let readmeWindow = document.getElementById("readme");
  if (readmeWindow) {
    bringToFront(readmeWindow);
    return;
  }
  const win = document.createElement("div");
  win.className = "window";
  win.id = "readme";
  win.style.cssText =
    "display: block; width: 450px; height: auto; left: 150px; top: 150px;";
  win.innerHTML = `
    <div class="title">
      <span>ReadMe.txt</span>
      <span class="controls">
        <span class="ctrl ctrl-min" title="Minimize" onclick="minimizeWindow('readme')">−</span>
        <span class="ctrl ctrl-close" title="Close" onclick="closeWindow('readme')">×</span>
      </span>
    </div>
    <div class="content" style="padding: 15px; font-size: 16px; line-height: 1.6;">
        <h3>Abhinav Kuchhal</h3>
        <p>A passionate developer with a love for creating intuitive and engaging digital experiences.</p>
        <hr style="border:none; border-top: 1px solid #ccc; margin: 10px 0;">
        <h4>Education</h4>
        <p>
            <strong>Bachelor of Technology, Computer Science</strong><br>
            XYZ University (2020 - 2024)
        </p>
        <h4>Skills</h4>
        <p>
            <strong>Languages:</strong> JavaScript, HTML, CSS, Python, SQL<br>
            <strong>Frameworks:</strong> React, Node.js, Express<br>
            <strong>Tools:</strong> Git, Docker, Webpack, Figma
        </p>
    </div>`;
  document.getElementById("readme-container").appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}

// --- Internet App ---
function handleInternetSearch(event) {
  event.preventDefault();
  const input = document.getElementById("internetSearchInput");
  let query = input.value.trim();
  if (!query) return;
  const hasProtocol = /^[a-zA-Z]+:\/\//.test(query);
  const isLikelyUrl = query.includes(".") && !query.includes(" ");
  try {
    let url;
    if (hasProtocol) {
      url = new URL(query).href;
    } else if (isLikelyUrl) {
      url = "https://" + query;
      new URL(url);
    } else {
      url = "https://www.google.com/search?q=" + encodeURIComponent(query);
    }
    window.open(url, "_blank");
  } catch (e) {
    const searchUrl =
      "https://www.google.com/search?q=" + encodeURIComponent(query);
    window.open(searchUrl, "_blank");
  }
  input.value = "";
}
