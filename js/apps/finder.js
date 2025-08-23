/**
 * App: Finder & Desktop (Refactored)
 * Handles logic for the Finder, desktop icons, and dynamically created windows.
 */

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

/**
 * Creates a new window from an HTML template and appends it to a container.
 * @param {string} templateId The ID of the <template> element.
 * @param {string} containerId The ID of the element to append the new window to.
 * @returns {HTMLElement|null} The created window element or null if failed.
 */
function createWindowFromTemplate(templateId, containerId) {
  const template = document.getElementById(templateId);
  const container = document.getElementById(containerId);
  if (!template || !container) {
    console.error("Template or container not found for", templateId);
    return null;
  }

  const windowClone = template.content.cloneNode(true);
  const windowEl = windowClone.querySelector(".window");

  container.appendChild(windowClone);
  makeDraggable(windowEl);
  bringToFront(windowEl);

  return windowEl;
}

function openReadMe() {
  const existingWindow = document.getElementById("readme");
  if (existingWindow) {
    bringToFront(existingWindow);
    return;
  }
  createWindowFromTemplate("readme-template", "readme-container");
}

function openProjectsFolder() {
  const existingWindow = document.getElementById("projects");
  if (existingWindow) {
    bringToFront(existingWindow);
    return;
  }

  const win = createWindowFromTemplate(
    "projects-template",
    "projects-container"
  );
  if (!win) return;

  const sidebar = win.querySelector(".projects-sidebar");
  const sidebarItems = projectsData
    .map(
      (project, index) => `
    <div class="sidebar-project-item" onclick="showProjectDetails(${index})">
      <h4>${project.title}</h4>
      <p>${project.date}</p>
    </div>`
    )
    .join("");
  sidebar.innerHTML = sidebarItems;

  showProjectDetails(0); // Show the first project by default
}

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

function renderFinderContent(location) {
  const mainContent = document.querySelector("#finder .finder-main");
  if (!mainContent) return;
  mainContent.innerHTML = "";

  document.querySelectorAll("#finder .sidebar-item").forEach((item) => {
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
      )}')">
          <img src="${imgSrc}" alt="${name}">
          <span>${name}</span>
        </div>`;
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
