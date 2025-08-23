/**
 * App: Terminal (Upgraded)
 * Handles all logic for the terminal application, now with more features!
 */

// --- State Management & Global Variables ---
let terminalHistory = [];
let historyIndex = -1;
let matrixInterval = null; // To control the matrix animation

// --- DOM Element References ---
let terminalOutput;
let terminalInput;

// --- Command Definitions ---
const commands = {
  help: () => `<pre>Available commands:
<span class="terminal-command">help</span>      - Show this help message      <span class="terminal-command">ls</span>        - List directory contents
<span class="terminal-command">clear</span>     - Clear the terminal screen     <span class="terminal-command">pwd</span>       - Show current directory
<span class="terminal-command">whoami</span>    - Show current user           <span class="terminal-command">date</span>      - Show current date and time
<span class="terminal-command">echo</span>      - Display a line of text      <span class="terminal-command">neofetch</span>  - Show system information
<span class="terminal-command">about</span>     - About Retro OS              <span class="terminal-command">contact</span>   - My contact information
<span class="terminal-command">details</span>   - Show system details         <span class="terminal-command">matrix</span>    - Enter the matrix</pre>`,

  clear: () => "CLEAR",

  ls: () => `<pre><span class="terminal-directory">Projects/</span>      <span class="terminal-directory">Applications/</span>  <span class="terminal-directory">Desktop/</span>
<span class="terminal-file">ReadMe.txt</span>       <span class="terminal-directory">Music/</span>         <span class="terminal-directory">Documents/</span></pre>`,

  pwd: () => `/Users/abhinavkuchhal`,
  whoami: () => "You are the Most Brilliant Person - Abhinav Kuchhal",
  date: () => new Date().toLocaleString(),
  echo: (args) => args.join(" "),

  neofetch: () => `<pre>
                    .:'
                 _ :'_
              .-:\`/   \\':-.        <span class="terminal-user">abhinavkuchhal</span><span class="terminal-prompt">@</span><span class="terminal-info">retro-os</span>
             /  :/-. .-\\;  \\       ---------------------
            /   :| o   o |;   \\      <span class="terminal-info">OS:</span> Retro OS v2.1
           /   :/ '\\___/' \\:   \\     <span class="terminal-info">Kernel:</span> RetroKernel 5.4.0
          /   :|   '---'   |:   \\    <span class="terminal-info">Uptime:</span> ${Math.floor(
            Math.random() * 24
          )} hours
         /   .:| .-'---'-. |:.   \\   <span class="terminal-info">Shell:</span> retrosh 1.0
        /   .:|/         \\|:.    \\   <span class="terminal-info">Terminal:</span> RetroTerm
       /   .: |\\  '---'  /| :.    \\  <span class="terminal-info">CPU:</span> 1.21 GHz PowerPC (Emulated)
      /   .:  | '\\     /' |  :.    \\ <span class="terminal-info">Memory:</span> 128 MB VRAM
     /   .:   |  |'---'|  |   :.    \\
    /   .:    |  | .-. |  |    :.    \\
   /   .:     |  |/   \\|  |     :.    \\
  /   .:      |  |}   {|  |      :.    \\
 /   .:       |  ||   ||  |       :.    \\
/   .:        |  ||   ||  |        :.    \\
</pre>`,

  about: () => `Retro OS v2.1 - An Interactive Portfolio by Abhinav Kuchhal.`,

  contact:
    () => `<pre><span class="terminal-info">GitHub:</span>   <a href="https://github.com/JustPratiyush" target="_blank">github.com/JustPratiyush</a>
<span class="terminal-info">LinkedIn:</span> <a href="https://www.linkedin.com/in/abhinav-kuchhal/" target="_blank">linkedin.com/in/abhinav-kuchhal</a>
<span class="terminal-info">Twitter:</span>  <a href="https://x.com/JustPratiyush" target="_blank">x.com/JustPratiyush</a></pre>`,

  // --- New Spicy Commands ---
  details: () => {
    const now = new Date();
    return `<pre>System Time:  ${now.toLocaleTimeString()}
System Date:  ${now.toLocaleDateString()}
Location:     Dahmi Kalan, Rajasthan, India
Status:       All systems nominal.</pre>`;
  },

  matrix: () => "MATRIX", // Special command to trigger the animation

  // --- Easter Egg Commands ---
  sudo: () =>
    "User is not in the sudoers file. This incident will be reported.",
};

/**
 * Initializes the terminal when the window is opened.
 */
function initTerminal() {
  terminalOutput = document.getElementById("terminalOutput");
  terminalInput = document.getElementById("terminalInput");

  if (!terminalInput || !terminalOutput) {
    console.error("Terminal elements not found!");
    return;
  }

  terminalInput.addEventListener("keydown", handleTerminalInput);
  displayWelcomeMessage();
}

/**
 * Displays the initial welcome message in the terminal.
 */
function displayWelcomeMessage() {
  // Clear any running matrix animation before clearing the terminal
  if (matrixInterval) {
    clearInterval(matrixInterval);
    matrixInterval = null;
  }

  terminalOutput.innerHTML = `
    <div class="terminal-line terminal-boot">Welcome to Retro OS Terminal v2.1</div>
    <div class="terminal-line terminal-boot">[INFO] Type 'help' to see available commands.</div>
  `;
}

/**
 * Handles keyboard events for the terminal input.
 * @param {KeyboardEvent} event The keyboard event.
 */
function handleTerminalInput(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    executeCommand();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    navigateHistory("up");
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    navigateHistory("down");
  }
}

/**
 * Main function to execute a command.
 */
function executeCommand() {
  const commandText = terminalInput.value.trim();
  if (commandText === "") return;

  // Stop the matrix animation if any other command is run
  if (commandText.toLowerCase() !== "matrix" && matrixInterval) {
    clearInterval(matrixInterval);
    matrixInterval = null;
  }

  if (terminalHistory[terminalHistory.length - 1] !== commandText) {
    terminalHistory.push(commandText);
  }
  historyIndex = terminalHistory.length;

  const [cmd, ...args] = commandText.split(" ");
  const commandFunc = commands[cmd.toLowerCase()];

  if (cmd.toLowerCase() === "clear") {
    displayWelcomeMessage();
    terminalInput.value = "";
    return;
  }

  // Special handling for the matrix command
  if (cmd.toLowerCase() === "matrix") {
    runMatrixAnimation();
    terminalInput.value = "";
    return;
  }

  const entryContainer = document.createElement("div");
  const commandLineHTML = `<div class="terminal-line"><span class="terminal-user">abhinavkuchhal</span><span class="terminal-prompt">@</span><span class="terminal-info">retro-os</span><span class="terminal-prompt">:</span><span class="terminal-path">~</span><span class="terminal-prompt">$ </span><span class="terminal-command">${commandText}</span></div>`;

  let resultHTML = "";
  if (commandFunc) {
    const result = commandFunc(args);
    resultHTML = `<div class="terminal-line">${result}</div>`;
  } else {
    resultHTML = `<div class="terminal-line terminal-error">Command not found: ${cmd}</div>`;
  }

  entryContainer.innerHTML = commandLineHTML + resultHTML;
  terminalOutput.appendChild(entryContainer);

  terminalInput.value = "";
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

/**
 * Navigates through the command history.
 * @param {'up' | 'down'} direction The direction to navigate.
 */
function navigateHistory(direction) {
  if (terminalHistory.length === 0) return;

  if (direction === "up" && historyIndex > 0) {
    historyIndex--;
    terminalInput.value = terminalHistory[historyIndex];
  } else if (direction === "down") {
    if (historyIndex < terminalHistory.length - 1) {
      historyIndex++;
      terminalInput.value = terminalHistory[historyIndex];
    } else {
      historyIndex = terminalHistory.length;
      terminalInput.value = "";
    }
  }

  setTimeout(
    () =>
      terminalInput.setSelectionRange(
        terminalInput.value.length,
        terminalInput.value.length
      ),
    0
  );
}

/**
 * Focuses the terminal input field.
 */
function focusTerminal() {
  setTimeout(() => terminalInput?.focus(), 50);
}

/**
 * Runs the Matrix animation effect in the terminal.
 */
function runMatrixAnimation() {
  terminalOutput.innerHTML = ""; // Clear the terminal for the animation

  const canvas = document.createElement("canvas");
  terminalOutput.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  // Set canvas dimensions to fill the terminal output area
  canvas.width = terminalOutput.clientWidth;
  canvas.height = terminalOutput.clientHeight;

  const katakana =
    "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";
  const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  const alphabet = katakana + latin + nums;

  const fontSize = 16;
  const columns = canvas.width / fontSize;
  const rainDrops = [];

  for (let x = 0; x < columns; x++) {
    rainDrops[x] = 1;
  }

  const draw = () => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0F0"; // Green text
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < rainDrops.length; i++) {
      const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

      if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        rainDrops[i] = 0;
      }
      rainDrops[i]++;
    }
  };

  matrixInterval = setInterval(draw, 33);
}
