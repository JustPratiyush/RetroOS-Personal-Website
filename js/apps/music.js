// --- Player State & API ---
let embedController = null;
let isSpotifyPlaying = false;
let spotifyApi = null; // Variable to hold the loaded API

/**
 * This function is called once the Spotify script is ready.
 * We just save the IFrameAPI object for later use.
 */
window.onSpotifyIframeApiReady = (IFrameAPI) => {
  spotifyApi = IFrameAPI;
};

/**
 * NEW: A reusable function to create the Spotify player.
 */
function createMusicPlayer() {
  // If the player already exists or the API isn't ready, do nothing.
  if (embedController || !spotifyApi) {
    return;
  }

  // =================================================================
  //  START: ADD THIS CODE BLOCK TO FIX THE REOPEN BUG
  // =================================================================
  // Ensure the target element exists, creating it if it doesn't.
  let element = document.getElementById("spotify-embed");
  if (!element) {
    const parentContainer = document.querySelector("#music .music-player");
    if (parentContainer) {
      element = document.createElement("div");
      element.id = "spotify-embed";
      element.style.height = "100%";
      parentContainer.appendChild(element);
    } else {
      // Failsafe in case the parent container is missing
      console.error("Music player container not found.");
      return;
    }
  }
  // =================================================================
  //  END: ADD THIS CODE BLOCK
  // =================================================================

  const options = {
    uri: "spotify:playlist:6TJxITfc7J0PKxMy44OtKB", // Example: "Lofi Beats" playlist
    width: "100%",
    height: "100%",
    theme: "dark",
  };

  const callback = (controller) => {
    embedController = controller;
    embedController.addListener("playback_update", (e) => {
      isSpotifyPlaying = !e.data.isPaused;
      const musicWindow = document.getElementById("music");
      if (!musicWindow) return;

      const isWindowVisible = musicWindow.style.display !== "none";

      if (isSpotifyPlaying && isWindowVisible) {
        startWindowNoteLoop();
      } else {
        stopWindowNoteLoop();
      }
    });
  };

  spotifyApi.createController(element, options, callback);
}

/**
 * Expose a function for main.js to check the playback state.
 */
function isMusicPlaying() {
  return isSpotifyPlaying;
}

/**
 * Expose a function for main.js to properly shut down the player.
 */
function destroyMusicPlayer() {
  if (embedController) {
    embedController.destroy();
    embedController = null;
    isSpotifyPlaying = false;
    stopWindowNoteLoop();
    stopDockNoteLoop();
  }
}

// --- Animation Logic (Unchanged) ---
let dockNoteAnimationInterval = null;
let windowNoteAnimationInterval = null;

function createNoteElement(config) {
  const notes = ["♪", "♫", "♬", "♩", "♭", "♮"];
  const noteEl = document.createElement("div");
  noteEl.classList.add("musical-note");
  noteEl.textContent = notes[Math.floor(Math.random() * notes.length)];
  noteEl.style.zIndex = config.zIndex;
  document.body.appendChild(noteEl);
  const duration = Math.random() * 1 + 1.5;
  const finalScale = Math.random() * 0.4 + 0.3;
  const horizontalDrift = (Math.random() - 0.5) * 80;
  noteEl.style.animationDuration = `${duration}s`;
  noteEl.style.setProperty("--random-x", `${horizontalDrift}px`);
  noteEl.style.setProperty("--random-scale", finalScale);
  noteEl.style.left = `${config.x}px`;
  noteEl.style.top = `${config.y}px`;
  setTimeout(() => noteEl.remove(), duration * 1000);
}

function createDockNote() {
  const el = document.querySelector('.dock-icon[data-app="music"]');
  if (!el) return;
  const rect = el.getBoundingClientRect();
  createNoteElement({
    x: rect.left + rect.width / 2,
    y: rect.top,
    zIndex: 4999,
  });
}

function createWindowNote() {
  const el = document.getElementById("music");
  if (!el || el.style.display === "none") return;
  const rect = el.getBoundingClientRect();
  createNoteElement({
    x: rect.left + Math.random() * rect.width,
    y: rect.top,
    zIndex: parseInt(el.style.zIndex || 100) - 1,
  });
}

function startDockNoteLoop() {
  if (dockNoteAnimationInterval) return;
  dockNoteAnimationInterval = setInterval(createDockNote, 400);
}

function stopDockNoteLoop() {
  clearInterval(dockNoteAnimationInterval);
  dockNoteAnimationInterval = null;
}

function startWindowNoteLoop() {
  if (windowNoteAnimationInterval) return;
  windowNoteAnimationInterval = setInterval(createWindowNote, 200);
}

function stopWindowNoteLoop() {
  clearInterval(windowNoteAnimationInterval);
  windowNoteAnimationInterval = null;
}
