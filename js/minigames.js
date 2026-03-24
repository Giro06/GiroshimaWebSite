/* ========================================
   HERO MINI-GAMES - Tic Tac Toe & Brick Breaker
   Fun interactive elements in the hero section
   ======================================== */

(function() {
    'use strict';

    // ---- TIC TAC TOE ----
    function initTicTacToe() {
        const canvas = document.getElementById('tictactoe-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const cellSize = size / 3;
        const accent = '#e94560';
        const lineColor = 'rgba(234, 234, 234, 0.3)';

        let board = Array(9).fill(null);
        let playerTurn = true;
        let gameOver = false;
        let winLine = null;
        let resetTimer = null;

        function drawGrid() {
            ctx.clearRect(0, 0, size, size);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;

            for (let i = 1; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellSize, 4);
                ctx.lineTo(i * cellSize, size - 4);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(4, i * cellSize);
                ctx.lineTo(size - 4, i * cellSize);
                ctx.stroke();
            }
        }

        function drawX(row, col) {
            const x = col * cellSize + cellSize / 2;
            const y = row * cellSize + cellSize / 2;
            const pad = cellSize * 0.25;

            ctx.strokeStyle = accent;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.shadowColor = accent;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.moveTo(x - pad, y - pad);
            ctx.lineTo(x + pad, y + pad);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + pad, y - pad);
            ctx.lineTo(x - pad, y + pad);
            ctx.stroke();

            ctx.shadowBlur = 0;
        }

        function drawO(row, col) {
            const x = col * cellSize + cellSize / 2;
            const y = row * cellSize + cellSize / 2;
            const rad = cellSize * 0.25;

            ctx.strokeStyle = '#0f3460';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#0f3460';
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowBlur = 0;
        }

        function drawWinLine() {
            if (!winLine) return;
            const [a, b] = winLine;
            const ax = (a % 3) * cellSize + cellSize / 2;
            const ay = Math.floor(a / 3) * cellSize + cellSize / 2;
            const bx = (b % 3) * cellSize + cellSize / 2;
            const by = Math.floor(b / 3) * cellSize + cellSize / 2;

            ctx.strokeStyle = accent;
            ctx.lineWidth = 4;
            ctx.shadowColor = accent;
            ctx.shadowBlur = 15;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        function render() {
            drawGrid();
            for (let i = 0; i < 9; i++) {
                const row = Math.floor(i / 3);
                const col = i % 3;
                if (board[i] === 'X') drawX(row, col);
                else if (board[i] === 'O') drawO(row, col);
            }
            drawWinLine();
        }

        const wins = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];

        function checkWin(mark) {
            for (const [a, b, c] of wins) {
                if (board[a] === mark && board[b] === mark && board[c] === mark) {
                    winLine = [a, c];
                    return true;
                }
            }
            return false;
        }

        function aiMove() {
            if (gameOver) return;
            const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
            if (empty.length === 0) return;

            // Simple AI: try to win, then block, then center, then random
            for (const mark of ['O', 'X']) {
                for (const i of empty) {
                    board[i] = mark;
                    if (checkWin(mark)) {
                        board[i] = null;
                        winLine = null;
                        if (mark === 'O') {
                            board[i] = 'O';
                            checkWin('O');
                            gameOver = true;
                            render();
                            scheduleReset();
                            return;
                        } else {
                            board[i] = 'O';
                            playerTurn = true;
                            render();
                            return;
                        }
                    }
                    board[i] = null;
                    winLine = null;
                }
            }

            if (board[4] === null) {
                board[4] = 'O';
            } else {
                const pick = empty[Math.floor(Math.random() * empty.length)];
                board[pick] = 'O';
            }

            if (checkWin('O')) {
                gameOver = true;
                render();
                scheduleReset();
                return;
            }

            if (board.every(c => c !== null)) {
                gameOver = true;
                scheduleReset();
            }

            playerTurn = true;
            render();
        }

        function scheduleReset() {
            clearTimeout(resetTimer);
            resetTimer = setTimeout(resetGame, 2000);
        }

        function resetGame() {
            board = Array(9).fill(null);
            playerTurn = true;
            gameOver = false;
            winLine = null;
            render();
        }

        canvas.addEventListener('click', function(e) {
            if (!playerTurn || gameOver) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = size / rect.width;
            const scaleY = size / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const col = Math.floor(x / cellSize);
            const row = Math.floor(y / cellSize);
            const idx = row * 3 + col;

            if (board[idx] !== null) return;

            board[idx] = 'X';
            if (checkWin('X')) {
                gameOver = true;
                render();
                scheduleReset();
                return;
            }
            if (board.every(c => c !== null)) {
                gameOver = true;
                render();
                scheduleReset();
                return;
            }

            playerTurn = false;
            render();
            setTimeout(aiMove, 400);
        });

        render();
    }

    // ---- BRICK BREAKER ----
    function initBrickBreaker() {
        const canvas = document.getElementById('brickbreaker-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const accent = '#e94560';

        const paddleW = 50, paddleH = 8;
        let paddleX = (W - paddleW) / 2;
        const ballR = 4;
        let ballX, ballY, ballDX, ballDY;

        const brickRows = 4, brickCols = 6;
        const brickW = (W - 20) / brickCols;
        const brickH = 10;
        const brickPad = 2;
        const brickOffsetTop = 12;
        const brickOffsetLeft = 10;
        let bricks = [];

        const brickColors = ['#e94560', '#ff6b81', '#0f3460', '#533483'];
        let animId = null;
        let paused = false;

        function initBricks() {
            bricks = [];
            for (let r = 0; r < brickRows; r++) {
                bricks[r] = [];
                for (let c = 0; c < brickCols; c++) {
                    bricks[r][c] = { alive: true };
                }
            }
        }

        function resetBall() {
            ballX = W / 2;
            ballY = H - 30;
            ballDX = 1.5 * (Math.random() > 0.5 ? 1 : -1);
            ballDY = -1.5;
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);

            // Bricks
            for (let r = 0; r < brickRows; r++) {
                for (let c = 0; c < brickCols; c++) {
                    if (!bricks[r][c].alive) continue;
                    const bx = brickOffsetLeft + c * brickW;
                    const by = brickOffsetTop + r * (brickH + brickPad);
                    ctx.fillStyle = brickColors[r % brickColors.length];
                    ctx.shadowColor = brickColors[r % brickColors.length];
                    ctx.shadowBlur = 4;
                    ctx.beginPath();
                    ctx.roundRect(bx, by, brickW - brickPad, brickH, 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            // Paddle
            ctx.fillStyle = '#eaeaea';
            ctx.shadowColor = '#eaeaea';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.roundRect(paddleX, H - 14, paddleW, paddleH, 4);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Ball
            ctx.fillStyle = accent;
            ctx.shadowColor = accent;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        function update() {
            ballX += ballDX;
            ballY += ballDY;

            // Wall collisions
            if (ballX - ballR <= 0 || ballX + ballR >= W) ballDX = -ballDX;
            if (ballY - ballR <= 0) ballDY = -ballDY;

            // Paddle collision
            if (ballY + ballR >= H - 14 && ballX >= paddleX && ballX <= paddleX + paddleW) {
                ballDY = -Math.abs(ballDY);
                // Angle based on hit position
                const hit = (ballX - paddleX) / paddleW - 0.5;
                ballDX = hit * 3;
            }

            // Ball lost
            if (ballY > H + 10) {
                resetBall();
                initBricks();
            }

            // Brick collisions
            for (let r = 0; r < brickRows; r++) {
                for (let c = 0; c < brickCols; c++) {
                    const b = bricks[r][c];
                    if (!b.alive) continue;
                    const bx = brickOffsetLeft + c * brickW;
                    const by = brickOffsetTop + r * (brickH + brickPad);
                    if (ballX + ballR > bx && ballX - ballR < bx + brickW - brickPad &&
                        ballY + ballR > by && ballY - ballR < by + brickH) {
                        b.alive = false;
                        ballDY = -ballDY;
                    }
                }
            }

            // All bricks cleared
            if (bricks.every(row => row.every(b => !b.alive))) {
                initBricks();
                resetBall();
            }
        }

        function loop() {
            if (!paused) {
                update();
                draw();
            }
            animId = requestAnimationFrame(loop);
        }

        // Mouse/touch controls
        canvas.addEventListener('mousemove', function(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width;
            paddleX = (e.clientX - rect.left) * scaleX - paddleW / 2;
            paddleX = Math.max(0, Math.min(W - paddleW, paddleX));
        });

        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width;
            const touch = e.touches[0];
            paddleX = (touch.clientX - rect.left) * scaleX - paddleW / 2;
            paddleX = Math.max(0, Math.min(W - paddleW, paddleX));
        }, { passive: false });

        // Pause when not visible
        const observer = new IntersectionObserver(function(entries) {
            paused = !entries[0].isIntersecting;
        }, { threshold: 0.1 });
        observer.observe(canvas);

        initBricks();
        resetBall();
        loop();
    }

    // Init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initTicTacToe();
            initBrickBreaker();
        });
    } else {
        initTicTacToe();
        initBrickBreaker();
    }
})();
