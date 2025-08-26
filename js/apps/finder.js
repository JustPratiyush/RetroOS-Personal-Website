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
    demoUrl: "https://www.oldportfolio.abhinavkuchhal.com",
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

// Inside js/apps/finder.js

// In js/apps/finder.js

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

  // Populate the sidebar with project items
  const sidebar = win.querySelector(".projects-sidebar");
  if (sidebar) {
    sidebar.innerHTML = projectsData
      .map(
        (project, index) => `
      <div class="sidebar-project-item" onclick="selectProject(${index})">
        <h4>${project.title}</h4>
        <p>${project.date}</p>
      </div>`
      )
      .join("");
  }

  // Set up the toggle button for the slide-out menu
  const toggleBtn = win.querySelector(".projects-toggle-btn");
  const contentArea = win.querySelector(".projects-window-content");

  if (toggleBtn && contentArea) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      contentArea.classList.toggle("sidebar-visible");
    });
  }

  // Show the first project by default
  showProjectDetails(0);
}

function selectProject(index) {
  // Show the details for the clicked project
  showProjectDetails(index);

  // Find the window and close the sidebar (for mobile view)
  const contentArea = document.querySelector(
    "#projects .projects-window-content"
  );
  if (contentArea) {
    contentArea.classList.remove("sidebar-visible");
  }
}

// In js/apps/finder.js

function showProjectDetails(index) {
  const project = projectsData[index];
  // 🎯 TARGET THE NEW CONTAINER, NOT THE ENTIRE .projects-main AREA
  const detailsContainer = document.querySelector(
    "#projects .project-details-container"
  );

  if (!project || !detailsContainer) {
    console.error("Project data or details container not found!");
    return;
  }

  // Highlight the active project in the sidebar
  document
    .querySelectorAll("#projects .sidebar-project-item")
    .forEach((item, i) => {
      item.classList.toggle("active", i === index);
    });

  // ✅ THIS IS THE FIX: We now only update the container's HTML.
  // The button is a sibling to this container and is never touched.
  detailsContainer.innerHTML = `
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

// In js/apps/finder.js

function selectFinderLocation(location) {
  // 1. Render the content for the selected location
  renderFinderContent(location);

  // 2. Find the window and close the sidebar
  const contentArea = document.querySelector("#finder .finder-content");
  if (contentArea) {
    contentArea.classList.remove("sidebar-visible");
  }
}

function renderFinderContent(location) {
  // 🎯 TARGET THE NEW CONTAINER, NOT THE WHOLE .finder-main AREA
  const mainContainer = document.querySelector(
    "#finder .finder-main-container"
  );
  if (!mainContainer) return;

  mainContainer.innerHTML = ""; // Clear only the container

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
      mainContainer.innerHTML += iconHTML;
    });
  } else {
    mainContainer.innerHTML = `<p style="color:#555; padding: 10px;">This folder is empty.</p>`;
  }
}

function handleFinderClick(name) {
  if (name === "ReadMe.txt") openReadMe();
  else if (name === "Projects") openProjectsFolder();
}
