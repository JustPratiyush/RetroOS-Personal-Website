/**
 * App: Trash
 * Handles all logic for the trash can, including the easter egg.
 */

let secretFolderOpened = false;

function renderTrashContent() {
  const trashContent = document.getElementById("trashContent");
  if (!trashContent) return;

  if (secretFolderOpened) {
    trashContent.innerHTML = `<div style="padding:12px;">Trash is empty.</div>`;
  } else {
    trashContent.innerHTML = `
      <div class="finder-icon" ondblclick="revealEasterEgg()" style="margin-top:6px;">
        <img src="assets/icons/folderIcon.webp" alt="Secret Folder">
        <span>DO NOT OPEN</span>
      </div>`;
  }
}

function revealEasterEgg() {
  const trashContent = document.getElementById("trashContent");
  if (!trashContent) return;
  trashContent.innerHTML = `
    <div class="secret-content" style="font-family:monospace; white-space:pre-wrap;">
/\\_/\\
( o.o )
 > ^ <
<span class="highlight">Woof! You found me!</span>

> <span style="text-decoration: underline; cursor:pointer;" onclick="createMessageWindow('Pixel Dog', 'You pet the dog. It seems happy!')">Pet the dog</span>
> <span style="text-decoration: underline; cursor:pointer;" onclick="emptyTrash()">Empty Trash</span>
    </div>`;
}

function emptyTrash() {
  secretFolderOpened = true;
  renderTrashContent();
  createMessageWindow("Trash", "The secret is gone... for now.");
}
