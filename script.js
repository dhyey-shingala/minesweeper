const minefield = document.getElementById('minefield');
const boardSizeSelect = document.getElementById('board-size');
const remainingMinesDisplay = document.getElementById('remaining-mines');
const gameOverOverlay = document.getElementById('game-over-overlay');

let gridSize = 8; // Default to 8x8 grid
let minePositions = []; // Store positions of mines
let revealed = []; // Track revealed squares
let flagged = []; // Track flagged squares
let mineCount = 0;

// Function to create the minefield
function createMinefield(size) {
  minefield.innerHTML = ''; // Clear the existing minefield
  gameOverOverlay.style.visibility = 'hidden'; // Hide the GAME OVER overlay
  minefield.style.pointerEvents = 'auto'; // Re-enable interactions
  gridSize = size;
  revealed = [];
  flagged = [];
  minePositions = []; // Empty for now, to be populated after the first click
  mineCount = Math.floor(size * size * 0.15); // 15% of the grid will be mines

  // Initialize revealed and flagged arrays
  for (let i = 0; i < size; i++) {
    revealed[i] = [];
    flagged[i] = [];
    for (let j = 0; j < size; j++) {
      revealed[i][j] = false;
      flagged[i][j] = false;
    }
  }

  // Create the squares
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.dataset.row = row;
      square.dataset.col = col;

      // Alternating colors for squares
      if ((row + col) % 2 === 0) {
        square.classList.add('green');
      } else {
        square.classList.add('yellowgreen');
      }

      // Event listeners for left and right clicks
      square.addEventListener('click', handleFirstClick); // Use a specialized handler for the first click
      square.addEventListener('contextmenu', handleRightClick); // Right-click for flagging

      fragment.appendChild(square);
    }
  }

  minefield.appendChild(fragment);

  // Adjust grid styling based on size
  minefield.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  minefield.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  // Ensure the grid has enough space and the squares have equal width/height
  const squareSize = Math.min(window.innerWidth * 0.9 / size, window.innerHeight * 0.7 / size);
  const squares = document.querySelectorAll('.square');
  squares.forEach(square => {
    square.style.width = `${squareSize}px`;
    square.style.height = `${squareSize}px`;
  });

  updateRemainingMines();
}


function handleFirstClick(event) {
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);

  // Generate mines, excluding the clicked tile and its neighbors
  generateMines(row, col);

  // Replace the first click handler with the regular left-click handler
  const squares = document.querySelectorAll('.square');
  squares.forEach(square => {
    square.removeEventListener('click', handleFirstClick);
    square.addEventListener('click', handleLeftClick);
  });

  // Simulate a left-click on the first tile
  handleLeftClick(event);
}

function generateMines(firstRow, firstCol) {
  const exclusions = new Set();

  // Exclude the first clicked tile and its neighbors
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const r = firstRow + i;
      const c = firstCol + j;
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        exclusions.add(`${r},${c}`);
      }
    }
  }

  // Place mines
  while (minePositions.length < mineCount) {
    const position = Math.floor(Math.random() * gridSize * gridSize);
    const row = Math.floor(position / gridSize);
    const col = position % gridSize;

    if (!exclusions.has(`${row},${col}`) && !minePositions.some(([r, c]) => r === row && c === col)) {
      minePositions.push([row, col]);
    }
  }
}



// Left click event: step on a square
function handleLeftClick(event) {
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);

  // Ignore if already revealed or flagged
  if (revealed[row][col] || flagged[row][col]) return;

  revealed[row][col] = true;
  event.target.classList.add('revealed'); // Add the "revealed" class

  // Check if the tile contains a mine
  if (minePositions.some(([r, c]) => r === row && c === col)) {
    revealAllMines(); // Show all mines
    gameOverOverlay.style.visibility = 'visible'; // Show the GAME OVER overlay
    minefield.style.pointerEvents = 'none'; // Disable interactions with the grid
    return;
  }

  // Determine if the tile was originally green or yellowgreen
  if (event.target.classList.contains('green')) {
    event.target.classList.add('green'); // Mark as green tile
  } else if (event.target.classList.contains('yellowgreen')) {
    event.target.classList.add('yellowgreen'); // Mark as yellowgreen tile
  }

  // If it's a mine, reveal all mines and end the game
  if (minePositions.some(([r, c]) => r === row && c === col)) {
    revealAllMines(); // Show all mines
    gameOverOverlay.style.visibility = 'visible'; // Show the GAME OVER overlay
    minefield.style.pointerEvents = 'none'; // Disable interactions with the grid
    return;
  }

  // Otherwise, count the adjacent mines and reveal the number
  const adjacentMines = countAdjacentMines(row, col);
  if (adjacentMines > 0) {
    event.target.textContent = adjacentMines;
    event.target.setAttribute('data-number', adjacentMines); // Set the number as a data attribute
  }

  // Optionally, reveal adjacent squares if there are no adjacent mines
  if (adjacentMines === 0) {
    revealAdjacentSquares(row, col);
  }
}

  

function handleRightClick(event) {
  event.preventDefault(); // Prevent the default right-click menu

  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);

  // Ignore if already revealed
  if (revealed[row][col]) return;

  // Toggle flag state
  if (flagged[row][col]) {
    flagged[row][col] = false;
    event.target.innerHTML = ''; // Remove the flag
  } else {
    flagged[row][col] = true;
    event.target.innerHTML = '<div class="flag">🚩</div>'; // Add a red flag icon
  }

  // Update remaining mines
  updateRemainingMines();
}

  

// Count the number of adjacent mines
function countAdjacentMines(row, col) {
  let count = 0;

  // Check all adjacent squares
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const r = row + i;
      const c = col + j;

      // Make sure we're within bounds and not the square itself
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && !(i === 0 && j === 0)) {
        if (minePositions.some(([mr, mc]) => mr === r && mc === c)) {
          count++;
        }
      }
    }
  }

  return count;
}

// Reveal adjacent squares if there are no adjacent mines
function revealAdjacentSquares(row, col) {
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const r = row + i;
      const c = col + j;

      // Make sure we're within bounds and not the square itself
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && !revealed[r][c] && !flagged[r][c]) {
        const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        square.click(); // Recursively reveal the square
      }
    }
  }
}

function updateRemainingMines() {
  const flaggedCount = flagged.flat().filter(f => f).length; // Count flagged squares
  const remainingMines = mineCount - flaggedCount; // Remaining mines
  remainingMinesDisplay.textContent = remainingMines;
}

function revealAllMines() {
  minePositions.forEach(([row, col]) => {
    const mineSquare = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

    // Ensure the square is cleared and revealed
    mineSquare.innerHTML = ''; // Remove any flag or text
    flagged[row][col] = false; // Reset flag state
    revealed[row][col] = true; // Mark as revealed

    // Style the mine square
    mineSquare.classList.add('revealed');
    mineSquare.style.backgroundColor = 'red'; // Set the red color
  });
}





// Initialize the minefield with the default size (8x8)
createMinefield(8);
updateRemainingMines(); // Set the initial value for the remaining mines

// Ensure the dropdown is set to 8x8 when the page loads or is refreshed
window.addEventListener('load', () => {
  boardSizeSelect.value = '8';  // Set dropdown to 8x8 by default
});

// Listen for changes to the dropdown and update the board size
boardSizeSelect.addEventListener('change', function () {
  const selectedSize = parseInt(boardSizeSelect.value, 10);
  createMinefield(selectedSize);
});

// Adjust the board size when the window is resized
window.addEventListener('resize', () => {
  const selectedSize = parseInt(boardSizeSelect.value, 10);
  createMinefield(selectedSize);
});
