const minefield = document.getElementById('minefield');
const boardSizeSelect = document.getElementById('board-size');
let gridSize = 8; // Default to 8x8 grid
let minePositions = []; // Store positions of mines
let revealed = []; // Track revealed squares
let flagged = []; // Track flagged squares
let mineCount = 0;

// Function to create the minefield
function createMinefield(size) {
  minefield.innerHTML = ''; // Clear the existing minefield
  gridSize = size;
  minePositions = [];
  revealed = [];
  flagged = [];
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

  // Randomly place mines
  while (minePositions.length < mineCount) {
    const position = Math.floor(Math.random() * size * size);
    const row = Math.floor(position / size);
    const col = position % size;

    if (!minePositions.some(([r, c]) => r === row && c === col)) {
      minePositions.push([row, col]);
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
      square.addEventListener('click', handleLeftClick);
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
}

// Left click event: step on a square
function handleLeftClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
  
    // Ignore if already revealed or flagged
    if (revealed[row][col] || flagged[row][col]) return;
  
    revealed[row][col] = true;
    event.target.classList.add('revealed'); // Add the "revealed" class
  
    // Determine if the tile was originally green or yellowgreen
    if (event.target.classList.contains('green')) {
      event.target.classList.add('green'); // Mark as green tile
    } else if (event.target.classList.contains('yellowgreen')) {
      event.target.classList.add('yellowgreen'); // Mark as yellowgreen tile
    }
  
    // If it's a mine, the game ends
    if (minePositions.some(([r, c]) => r === row && c === col)) {
      event.target.style.backgroundColor = 'red'; // Reveal mine
      alert('Game Over! You hit a mine.');
      return;
    }
  
    // Otherwise, count the adjacent mines and reveal the number
    const adjacentMines = countAdjacentMines(row, col);
    if (adjacentMines > 0) {
      event.target.textContent = adjacentMines;
      event.target.setAttribute('data-number', adjacentMines);  // Set the number as a data attribute
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
      // Remove the flag
      flagged[row][col] = false;
      event.target.innerHTML = ''; // Ensure the flag is removed
  
      // Optionally, you can also remove any other visual indicator
      event.target.classList.remove('flagged'); // If you've added a 'flagged' class
    } else {
      // Place a flag
      flagged[row][col] = true;
      event.target.innerHTML = '<div class="flag">🚩</div>'; // Add the flag icon
    }
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

// Initialize the minefield with the default size (8x8)
createMinefield(8);

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
