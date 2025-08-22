/**
 * App: Clock
 * Handles all logic for the clock in the top bar and the Clock application.
 */

function updateClock(forceUpdate = false) {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const clockEl = document.getElementById("clock");
  if (clockEl) clockEl.textContent = `${h}:${m}`;

  // Update the detailed clock display if it's open or if forced
  const clockApp = document.getElementById("clockApp");
  if (
    clockApp &&
    (forceUpdate ||
      !clockApp.style.display ||
      !clockApp.style.display.includes("none"))
  ) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    };
    const dateStr = now.toLocaleDateString(undefined, options);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const clockContent = `
        <div style="text-align: center; padding: 20px; font-family: 'VT323', monospace;">
          <div style="font-size: 48px; margin-bottom: 10px;">${h}:${m}</div>
          <div style="font-size: 18px; margin-bottom: 15px;">
            ${now.toLocaleDateString(undefined, { weekday: "long" })}, 
            ${now.toLocaleDateString(undefined, {
              month: "long",
            })} ${now.getDate()}, ${now.getFullYear()}
          </div>
          <div style="font-size: 16px; color: #666; margin-bottom: 10px;">
            ${timeZone.replace(/_/g, " ")}
          </div>
          <div style="font-size: 14px; color: #888;">
            Week ${Math.ceil(
              (now.getDate() +
                new Date(now.getFullYear(), now.getMonth(), 1).getDay()) /
                7
            )}
          </div>
        </div>
      `;

    document.querySelector("#clockApp .content").innerHTML = clockContent;
  }
}

function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}
