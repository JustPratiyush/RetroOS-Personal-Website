/**
 * App: Finder & Desktop
 * Handles logic for the Finder, desktop icons, and dynamically created windows.
 */

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
    document.querySelectorAll(".desktop-icon").forEach((icon) => {
      const name = icon.querySelector("span")?.textContent || "Untitled";
      const imgSrc = icon.querySelector("img")?.src || "";
      const iconHTML = `<div class="finder-icon" ondblclick="handleFinderClick('${name.replace(
        /'/g,
        "\\'"
      )}')"><img src="${imgSrc}" alt="${name}"><span>${name}</span></div>`;
      mainContent.innerHTML += iconHTML;
    });
  } else {
    mainContent.innerHTML = `<p style="color:#555; padding: 10px;">This folder is empty.</p>`;
  }
}

function handleFinderClick(name) {
  if (name === "ReadMe.txt") openReadMe();
  else if (name === "Projects") openProjectsFolder();
}

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
      <div class="title"><span>Projects</span><span class="controls">
        <span class="ctrl ctrl-close" title="Close" onclick="closeWindow('projects')">×</span>
      </span></div>
      <div class="content" style="padding: 15px;">
        <p>Here are some of the projects I'm proud of.</p>
        <ul>
          <li><strong>This Retro OS Website:</strong> An interactive portfolio.</li>
          <li><strong>E-commerce Platform:</strong> A full-stack web application.</li>
          <li><strong>Data Visualization Dashboard:</strong> A dashboard using D3.js.</li>
        </ul>
      </div>`;
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
    "display:block; width:450px; height:auto; left:150px; top:100px;";
  win.innerHTML = `
      <div class="title"><span>ReadMe.txt</span><span class="controls">
        <span class="ctrl ctrl-close" title="Close" onclick="closeWindow('readme')">×</span>
      </span></div>
      <div class="content" style="padding:15px; font-size:16px; line-height:1.6;">
        <h2 style="font-family: 'VT323', monospace;font-size:32px;">Hey! I am Abhinav Kuchhal</h2>
        <p>A passionate developer with a love for creating intuitive and engaging digital experiences.</p>
        <hr style="border:none; border-top: 1px solid #ccc; margin: 10px 0;">

        <h4>Education</h4>
        <p><strong>Manipal University Jaipur (2023 - 2027)</strong>
        <br>
        Bachelor of Technology, Computer Science
        <h4>Skills</h4>
        <strong>Languages:</strong> JavaScript, HTML, CSS, Python
        <br>
        <strong>Frameworks:</strong> React, Node.js
        <br>
        <strong>Tools:</strong> Git, Docker, Webpack, Figma</p>
      </div>`;
  document.getElementById("readme-container").appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}
