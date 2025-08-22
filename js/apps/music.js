/**
 * App: Music Player
 * Handles all logic for the music player application using Tone.js.
 */

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
  if (window.Tone && !synth) {
    try {
      synth = new Tone.Synth().toDestination();
    } catch (e) {
      console.warn("Tone.js init failed", e);
    }
  }
}

function playMusic() {
  initToneIfNeeded();
  if (!synth) {
    const status = document.getElementById("musicStatus");
    if (status) status.textContent = "Audio engine failed.";
    return;
  }
  Tone.start()
    .then(() => {
      const song = songs[currentSongIndex];
      if (musicSequence) musicSequence.stop(0).dispose();
      musicSequence = new Tone.Sequence(
        (time, note) => {
          synth.triggerAttackRelease(note, "8n", time);
        },
        song.notes,
        "4n"
      ).start(0);
      Tone.Transport.start();
      isPlaying = true;
      document.getElementById("playPauseBtn").textContent = "❚❚";
      document.getElementById(
        "musicStatus"
      ).textContent = `Playing: ${song.title}`;
    })
    .catch((err) => {
      document.getElementById("musicStatus").textContent =
        "Browser blocked audio.";
    });
}

function stopMusic() {
  if (musicSequence) {
    try {
      musicSequence.stop(0).dispose();
      musicSequence = null;
      Tone.Transport.stop();
    } catch (e) {
      /* ignore */
    }
  }
  isPlaying = false;
  document.getElementById("playPauseBtn").textContent = "▶";
  document.getElementById("musicStatus").textContent = "Stopped";
}

function togglePlay() {
  isPlaying ? stopMusic() : playMusic();
}

function updateSongDisplay() {
  const song = songs[currentSongIndex];
  document.getElementById("songTitle").textContent = song.title;
  document.getElementById("songArtist").textContent = song.artist;
  document.getElementById("musicStatus").textContent =
    "Press ▶ to start audio.";
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

function initMusicPlayer() {
  document
    .getElementById("playPauseBtn")
    ?.addEventListener("click", togglePlay);
  document.getElementById("nextBtn")?.addEventListener("click", nextSong);
  document.getElementById("prevBtn")?.addEventListener("click", prevSong);
}
