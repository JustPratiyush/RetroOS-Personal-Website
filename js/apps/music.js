/**
 * App: Music Player (FINAL & ROBUST VERSION)
 * Plays real audio files, handles a loading state, and includes dynamic animations.
 */

// --- 1. CONFIGURE YOUR ALBUMS HERE ---
const songs = [
  {
    title: "Death by Clubbing",
    artist: "Matrix Vector",
    filePath: "assets/music/song1.mp3",
    artworkPath: "assets/music/CoverArt/AlbumCover1.png",
  },
  {
    title: "My Way",
    artist: "Your Name",
    filePath: "assets/music/song2.mp3",
    artworkPath: "assets/music/CoverArt/AlbumCover2.png",
  },
];

// --- Core Player & State Variables ---
let player = null;
let currentSongIndex = 0;
let isPlaying = false;
let isLoading = false; // <-- NEW: State to track loading
let dockNoteAnimationInterval = null;
let windowNoteAnimationInterval = null;

// --- 2. FINAL & ROBUST PLAYER LOGIC ---
function playMusic() {
  if (isPlaying || isLoading) return; // Don't do anything if already playing or loading

  const song = songs[currentSongIndex];
  if (!song || !song.filePath) {
    document.getElementById("musicStatus").textContent = "Error: No song file.";
    return;
  }

  isLoading = true;
  document.getElementById("musicStatus").textContent = "Loading...";

  // --- FIX IS HERE ---
  // We must start the audio context before creating a player.
  Tone.start()
    .then(() => {
      player = new Tone.Player(song.filePath, () => {
        // This callback runs once the audio is loaded successfully
        isLoading = false;
        isPlaying = true;
        player.start();
        document.getElementById("playPauseBtn").textContent = "❚❚";
        document.getElementById(
          "musicStatus"
        ).textContent = `Playing: ${song.title}`;
        startWindowNoteLoop();
      }).toDestination();

      // Handle potential loading errors or when the song finishes
      player.onstop = () => {
        if (!isPlaying) return; // Avoids firing on manual stop
        stopMusic();
      };
    })
    .catch((error) => {
      // This runs if the user's browser blocks audio entirely
      isLoading = false;
      console.error("Audio context could not be started:", error);
      document.getElementById("musicStatus").textContent = "Audio blocked.";
    });
}

function stopMusic() {
  if (player) {
    player.stop();
    player.dispose();
  }
  isPlaying = false;
  isLoading = false; // <-- NEW: Ensure loading is reset
  document.getElementById("playPauseBtn").textContent = "▶";
  document.getElementById("musicStatus").textContent = "Stopped";
  stopDockNoteLoop();
  stopWindowNoteLoop();
}

function togglePlay() {
  if (isLoading) return; // Prevent action while loading
  isPlaying ? stopMusic() : playMusic();
}

// --- 3. EFFICIENT & REFACTORED ANIMATION LOGIC ---

// A single, efficient function to create any note element
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

// Creates a note from the DOCK icon
function createDockNote() {
  const el = document.querySelector('.dock-icon[data-app="music"]');
  if (!el) return;
  const rect = el.getBoundingClientRect();
  createNoteElement({
    x: rect.left + rect.width / 2,
    y: rect.top,
    zIndex: 4999, // Behind dock
  });
}

// Creates a note from the WINDOW
function createWindowNote() {
  const el = document.getElementById("music");
  if (!el || el.style.display === "none") return;
  const rect = el.getBoundingClientRect();
  createNoteElement({
    x: rect.left + Math.random() * rect.width,
    y: rect.top,
    zIndex: parseInt(el.style.zIndex || 100) - 1, // Behind window
  });
}

// Loop controls for both animations
function startDockNoteLoop() {
  if (dockNoteAnimationInterval) clearInterval(dockNoteAnimationInterval);
  dockNoteAnimationInterval = setInterval(createDockNote, 400);
}
function stopDockNoteLoop() {
  clearInterval(dockNoteAnimationInterval);
  dockNoteAnimationInterval = null;
}
function startWindowNoteLoop() {
  if (windowNoteAnimationInterval) clearInterval(windowNoteAnimationInterval);
  windowNoteAnimationInterval = setInterval(createWindowNote, 200);
}
function stopWindowNoteLoop() {
  clearInterval(windowNoteAnimationInterval);
  windowNoteAnimationInterval = null;
}

// --- DISPLAY AND CONTROL LOGIC ---
function updateSongDisplay() {
  const song = songs[currentSongIndex];
  if (!song) return;
  document.getElementById("songTitle").textContent = song.title;
  document.getElementById("songArtist").textContent = song.artist;
  document.getElementById("albumArtImg").src = song.artworkPath;
  document.getElementById("musicStatus").textContent = "Press ▶ to start.";
}

function nextSong() {
  if (isLoading) return; // Prevent action while loading
  const wasPlaying = isPlaying;
  if (wasPlaying) stopMusic();
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  updateSongDisplay();
  if (wasPlaying) playMusic();
}

function prevSong() {
  if (isLoading) return; // Prevent action while loading
  const wasPlaying = isPlaying;
  if (wasPlaying) stopMusic();
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  updateSongDisplay(); // <-- FIX: Corrected typo here
  if (wasPlaying) playMusic();
}

function initMusicPlayer() {
  document
    .getElementById("playPauseBtn")
    ?.addEventListener("click", togglePlay);
  document.getElementById("nextBtn")?.addEventListener("click", nextSong);
  document.getElementById("prevBtn")?.addEventListener("click", prevSong);
  if (songs.length > 0) {
    updateSongDisplay();
  }
}

function isMusicPlaying() {
  return isPlaying;
}
