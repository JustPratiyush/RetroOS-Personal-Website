/**
 * App: Finder & Desktop
 * Handles logic for the Finder, desktop icons, and dynamically created windows.
[cite_start][cite: 279] */

// --- START: NEW PROJECTS CODE  ---

const projectsData = [
  {
    title: "Retro OS Portfolio",
    description:
      "The interactive portfolio website you are currently viewing, inspired by classic MacOS.",
    date: "Aug 23, 2025",
    technologies: ["HTML5", "CSS3", "JavaScript"],
    demoUrl: "#",
    codeUrl: "#",
  },
  {
    title: "HackYours",
    description:
      "A Fullstack AI Powered Hackathon Guide. This Project helps you Ideate and Create roadmaps for your Hackathon Competition like what tech stack to use and can also generate pitches. Led the design thinking, logo, UX/UI, and animations.",
    date: "March 15, 2025",
    technologies: ["Frontend", "UX/UI", "Photoshop"],
    demoUrl: "https://hackyours.raghavkatta.xyz/",
    codeUrl: "https://github.com/raghavxkatta/HackYours-BinaryBrains",
  },
  {
    title: "Causeway",
    description:
      "UX/UI concept for an app encouraging volunteering through community rewards.",
    date: "Feb 28, 2024",
    technologies: ["Figma"],
    demoUrl:
      "https://www.figma.com/design/qTIFz2HWxLFwJiPy1Xgz6J/Causeway-App?node-id=0-1",
    codeUrl: "#",
  },
  {
    title: "AI Medical Assistant",
    description:
      "AI tool offering potential diagnoses, causes, and recovery advice.",
    date: "Nov 15, 2024",
    technologies: ["Python", "Gemini API", "Rag"],
    demoUrl: "#",
    codeUrl: "https://github.com/JustPratiyush/AI-Powered-Medical-Assistant",
  },

  {
    title: "Old Personal Website",
    description:
      "My primary personal portfolio website showcasing my skills, projects, and professional journey.",
    date: "Jun 22, 2025",
    technologies: ["Vanilla Frontend"],
    demoUrl: "https://abhinavkuchhal.com",
    codeUrl: "#",
  },
];

// 2. Function to display details of a selected project
function showProjectDetails(index) {
  const project = projectsData[index];
  const mainContent = document.querySelector("#projects .projects-main");

  if (!project || !mainContent) return;

  // Highlight the active project in the sidebar
  document
    .querySelectorAll("#projects .sidebar-project-item")
    .forEach((item, i) => {
      item.classList.toggle("active", i === index);
    });

  mainContent.innerHTML = `
    <h2 class="project-title">${project.title}</h2>
    <p class="project-date">${project.date}</p>
    <p class="project-description">${project.description}</p>
    <div class="project-tech">
      ${project.technologies.map((tech) => `<span>${tech}</span>`).join("")}
    </div>
    <div class="project-buttons">
      ${
        project.demoUrl !== "#"
          ? `<a href="${project.demoUrl}" target="_blank" class="btn-retro btn-demo">Live Demo</a>`
          : ""
      }
      ${
        project.codeUrl !== "#"
          ? `<a href="${project.codeUrl}" target="_blank" class="btn-retro btn-code">Source Code</a>`
          : ""
      }
    </div>
  `;
}

// 3. The function to open the Projects window
function openProjectsFolder() {
  if (document.getElementById("projects")) {
    bringToFront(document.getElementById("projects"));
    return;
  }
  const win = document.createElement("div");
  win.className = "window";
  win.id = "projects";
  win.style.cssText =
    "display:block; width:700px; height:450px; left:100px; top:100px;";

  const sidebarItems = projectsData
    .map(
      (project, index) => `
    <div class="sidebar-project-item" onclick="showProjectDetails(${index})">
      <h4>${project.title}</h4>
      <p>${project.date}</p>
    </div>
  `
    )
    .join("");

  win.innerHTML = `
    <div class="title"><span>Projects</span><span class="controls">
      <span class="ctrl ctrl-close" title="Close" onclick="closeWindow('projects')">×</span>
    </span></div>
    <div class="content projects-window-content">
      <div class="projects-sidebar">
        ${sidebarItems}
      </div>
      <div class="projects-main">
        </div>
    </div>`;

  document.getElementById("projects-container").appendChild(win);
  makeDraggable(win);
  bringToFront(win);

  showProjectDetails(0); // Show the first project by default
}

// --- END: NEW PROJECTS CODE ---

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
        <h2 style="font-family: 'VT323', monospace;font-size:32px;">Hey!
 I am Abhinav Kuchhal</h2>
        <p>A passionate developer with a love for creating intuitive and engaging digital experiences.</p>
        <hr style="border:none; border-top: 1px solid #ccc; margin: 10px 0;">

        <h4>Education</h4>
        <p><strong>Manipal University Jaipur (2023 - 2027)</strong>
        <br>
        Bachelor of Technology, Computer Science
        <h4>Skills</h4>
        <strong>Languages:</strong> JavaScript, HTML, CSS, 
 Python
        <br>
        <strong>Frameworks:</strong> React, Node.js
        <br>
        <strong>Tools:</strong> Git, Docker, Webpack, Figma</p>
      </div>`;
  document.getElementById("readme-container").appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}
