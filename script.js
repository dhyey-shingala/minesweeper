// Constants and Configuration
const MINE_DENSITY = 0.15; // 15% of grid will be mines
const COLORS = {
  green: '#a2d149',
  yellowgreen: '#aad751',
  revealedGreen: '#d7b899',
  revealedYellowGreen: '#e5c29f'
};

// DOM Element Selectors
const DOM = {
  minefield: document.getElementById('minefield'),
  boardSizeSelect: document.getElementById('board-size'),
  remainingMinesDisplay: document.getElementById('remaining-mines'),
  gameOverOverlay: document.getElementById('game-over-overlay'),
  playAgainButton: document.getElementById('play-again')
};

// Game State Management
class MinesweeperGame {
  constructor(size = 8) {
    this.gridSize = size;
    this.minePositions = [];
    this.revealed = [];
    this.flagged = [];
    this.mineCount = 0;
    this.gameOver = false;
    
    this.initializeGame();
  }

  initializeGame() {
    this.mineCount = Math.floor(this.gridSize * this.gridSize * MINE_DENSITY);
    this.resetArrays();
    this.createMinefield();
    this.updateRemainingMines();
  }

  resetArrays() {
    this.revealed = Array.from({ length: this.gridSize }, () => 
      Array(this.gridSize).fill(false)
    );
    this.flagged = Array.from({ length: this.gridSize }, () => 
      Array(this.gridSize).fill(false)
    );
  }

  createMinefield() {
    DOM.minefield.innerHTML = '';
    DOM.gameOverOverlay.style.visibility = 'hidden';
    DOM.minefield.style.pointerEvents = 'auto';

    const fragment = document.createDocumentFragment();

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const square = this.createSquare(row, col);
        fragment.appendChild(square);
      }
    }

    DOM.minefield.appendChild(fragment);
    this.adjustGridStyle();
  }

  createSquare(row, col) {
    const square = document.createElement('div');
    square.classList.add('square', (row + col) % 2 === 0 ? 'green' : 'yellowgreen');
    square.dataset.row = row;
    square.dataset.col = col;

    square.addEventListener('click', this.handleFirstClick.bind(this));
    square.addEventListener('contextmenu', this.handleRightClick.bind(this));

    return square;
  }

  adjustGridStyle() {
    const size = this.gridSize;
    DOM.minefield.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    DOM.minefield.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    const squareSize = Math.min(
      window.innerWidth * 0.9 / size, 
      window.innerHeight * 0.7 / size
    );

    document.querySelectorAll('.square').forEach(square => {
      square.style.width = `${squareSize}px`;
      square.style.height = `${squareSize}px`;
    });
  }

  handleFirstClick(event) {
    const { row, col } = this.getSquareCoordinates(event.target);
    this.generateMines(row, col);

    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
      square.removeEventListener('click', this.handleFirstClick.bind(this));
      square.addEventListener('click', this.handleLeftClick.bind(this));
    });

    this.handleLeftClick(event);
  }

  generateMines(firstRow, firstCol) {
    const exclusions = new Set();
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const r = firstRow + i, c = firstCol + j;
        if (this.isValidSquare(r, c)) {
          exclusions.add(`${r},${c}`);
        }
      }
    }

    while (this.minePositions.length < this.mineCount) {
      const position = Math.floor(Math.random() * this.gridSize * this.gridSize);
      const row = Math.floor(position / this.gridSize);
      const col = position % this.gridSize;

      if (!exclusions.has(`${row},${col}`) && 
          !this.minePositions.some(([r, c]) => r === row && c === col)) {
        this.minePositions.push([row, col]);
      }
    }
  }

  handleLeftClick(event) {
    const { row, col } = this.getSquareCoordinates(event.target);
    
    if (this.revealed[row][col] || this.flagged[row][col]) return;

    this.revealSquare(row, col, event.target);
  }

  revealSquare(row, col, squareElement) {
    this.revealed[row][col] = true;
    squareElement.classList.add('revealed');

    if (this.isMine(row, col)) {
      this.handleGameOver();
      return;
    }

    const adjacentMines = this.countAdjacentMines(row, col);
    if (adjacentMines > 0) {
      squareElement.textContent = adjacentMines;
      squareElement.setAttribute('data-number', adjacentMines);
    }

    if (adjacentMines === 0) {
      this.revealAdjacentSquares(row, col);
    }

    this.checkForWin();
  }

  handleRightClick(event) {
    event.preventDefault();
    
    const { row, col } = this.getSquareCoordinates(event.target);
    
    if (this.revealed[row][col]) return;

    this.toggleFlag(row, col, event.target);
  }

  toggleFlag(row, col, squareElement) {
    this.flagged[row][col] = !this.flagged[row][col];
    
    squareElement.innerHTML = this.flagged[row][col] 
      ? '<div class="flag">🚩</div>' 
      : '';

    this.updateRemainingMines();
    this.checkForWin();
  }

  countAdjacentMines(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const r = row + i, c = col + j;
        if (this.isValidSquare(r, c) && this.isMine(r, c)) {
          count++;
        }
      }
    }
    return count;
  }

  revealAdjacentSquares(row, col) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const r = row + i, c = col + j;
        if (this.isValidSquare(r, c) && !this.revealed[r][c] && !this.flagged[r][c]) {
          const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
          square.click();
        }
      }
    }
  }

  checkForWin() {
    if (this.gameOver) return;

    // Check if all non-mine squares are revealed
    const allNonMinesRevealed = this.revealed.flat().every((r, index) => {
        const row = Math.floor(index / this.gridSize);
        const col = index % this.gridSize;
        return r || this.isMine(row, col);
    });

    // Check if all mines are flagged correctly
    const allMinesFlagged = this.minePositions.every(([row, col]) => this.flagged[row][col]);

    // Win condition: All non-mine squares revealed and all mines flagged
    if (allNonMinesRevealed && allMinesFlagged) {
        this.handleWin();
    }
  }

  handleGameOver() {
    this.gameOver = true;
    this.revealAllMines();
    DOM.gameOverOverlay.style.visibility = 'visible';
    DOM.gameOverOverlay.innerHTML = `
      <div id="game-over-text">GAME OVER</div>
      <button id="play-again">Play Again</button>
    `;
    DOM.minefield.style.pointerEvents = 'none';
    
    const playAgainButton = document.getElementById('play-again');
    playAgainButton.addEventListener('click', () => this.resetGame());
  }

  handleWin() {
    this.gameOver = true;
    DOM.gameOverOverlay.style.visibility = 'visible';
    DOM.gameOverOverlay.innerHTML = `
      <div id="game-over-text">You Win! 🎉</div>
      <button id="play-again">Play Again</button>
    `;
    DOM.minefield.style.pointerEvents = 'none';
    
    // Use the existing play again button
    // DOM.playAgainButton.addEventListener('click', () => this.resetGame());
    const playAgainButton = document.getElementById('play-again');
    playAgainButton.addEventListener('click', () => this.resetGame());
    
  }

  revealAllMines() {
    this.minePositions.forEach(([row, col]) => {
      const mineSquare = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (!this.flagged[row][col]) {
        mineSquare.classList.add('revealed');
        mineSquare.style.backgroundColor = 'red';
      }
    });

    DOM.gameOverOverlay.style.display = 'flex';
  }

  resetGame() {
    this.minePositions = []; // Clear previous mine positions
    this.gameOver = false;   // Reset game over status
    this.initializeGame();   // Reinitialize the game
    DOM.gameOverOverlay.style.visibility = 'hidden';
    DOM.gameOverOverlay.innerHTML = '';
    DOM.minefield.style.pointerEvents = 'auto';
  }


  updateRemainingMines() {
    const flaggedCount = this.flagged.flat().filter(f => f).length;
    const remainingMines = this.mineCount - flaggedCount;
    DOM.remainingMinesDisplay.textContent = remainingMines;
  }

  // Utility Methods
  getSquareCoordinates(element) {
    return {
      row: parseInt(element.dataset.row),
      col: parseInt(element.dataset.col)
    };
  }

  isValidSquare(row, col) {
    return row >= 0 && row < this.gridSize && 
           col >= 0 && col < this.gridSize;
  }

  isMine(row, col) {
    return this.minePositions.some(([r, c]) => r === row && c === col);
  }
}

// Game Initialization and Event Listeners
let game = new MinesweeperGame();

DOM.boardSizeSelect.addEventListener('change', function () {
  const selectedSize = parseInt(this.value, 10);
  game = new MinesweeperGame(selectedSize);
});

window.addEventListener('resize', () => {
  game.adjustGridStyle();
});

// Initial setup
DOM.boardSizeSelect.value = '8';