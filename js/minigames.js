/* ========================================
   HERO MINI-GAMES
   Snake, Pong, Tetris, Memory Cards
   ======================================== */

(function() {
    'use strict';

    // Shared: pause when not visible
    function observePause(canvas, cb) {
        const obs = new IntersectionObserver(function(entries) {
            cb(!entries[0].isIntersecting);
        }, { threshold: 0.1 });
        obs.observe(canvas);
    }

    // =====================
    // SNAKE (top-left)
    // =====================
    function initSnake() {
        const canvas = document.getElementById('snake-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const grid = 10;
        const cols = W / grid, rows = H / grid;
        let snake, dir, food, alive, tickTimer;
        let paused = false;
        const speed = 120;

        function reset() {
            const cx = Math.floor(cols / 2);
            const cy = Math.floor(rows / 2);
            snake = [{x: cx, y: cy}, {x: cx - 1, y: cy}, {x: cx - 2, y: cy}];
            dir = {x: 1, y: 0};
            alive = true;
            placeFood();
        }

        function placeFood() {
            do {
                food = {x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows)};
            } while (snake.some(s => s.x === food.x && s.y === food.y));
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);

            // Grid dots (subtle)
            ctx.fillStyle = 'rgba(234,234,234,0.03)';
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    ctx.fillRect(x * grid + grid / 2, y * grid + grid / 2, 1, 1);
                }
            }

            // Food
            ctx.fillStyle = '#e94560';
            ctx.shadowColor = '#e94560';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(food.x * grid + grid / 2, food.y * grid + grid / 2, grid / 2 - 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Snake
            snake.forEach(function(seg, i) {
                const alpha = 1 - (i / snake.length) * 0.6;
                ctx.fillStyle = i === 0 ? '#eaeaea' : 'rgba(234,234,234,' + alpha + ')';
                if (i === 0) {
                    ctx.shadowColor = '#eaeaea';
                    ctx.shadowBlur = 6;
                }
                ctx.beginPath();
                ctx.roundRect(seg.x * grid + 1, seg.y * grid + 1, grid - 2, grid - 2, 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });
        }

        function tick() {
            if (paused || !alive) return;
            const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

            // Wrap around
            if (head.x < 0) head.x = cols - 1;
            if (head.x >= cols) head.x = 0;
            if (head.y < 0) head.y = rows - 1;
            if (head.y >= rows) head.y = 0;

            // Self collision
            if (snake.some(s => s.x === head.x && s.y === head.y)) {
                alive = false;
                draw();
                setTimeout(reset, 1500);
                return;
            }

            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                placeFood();
            } else {
                snake.pop();
            }
            draw();
        }

        // Auto-play AI for demo
        function aiDir() {
            const head = snake[0];
            const dx = food.x - head.x;
            const dy = food.y - head.y;

            const options = [
                {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}
            ].filter(function(d) {
                // Don't reverse
                if (d.x === -dir.x && d.y === -dir.y) return false;
                const nx = (head.x + d.x + cols) % cols;
                const ny = (head.y + d.y + rows) % rows;
                return !snake.some(s => s.x === nx && s.y === ny);
            });

            if (options.length === 0) return;

            // Prefer moving toward food
            const toward = options.filter(function(d) {
                if (dx > 0 && d.x === 1) return true;
                if (dx < 0 && d.x === -1) return true;
                if (dy > 0 && d.y === 1) return true;
                if (dy < 0 && d.y === -1) return true;
                return false;
            });

            dir = toward.length > 0 ? toward[Math.floor(Math.random() * toward.length)] : options[Math.floor(Math.random() * options.length)];
        }

        // Player can take over with keyboard
        let playerControl = false;
        document.addEventListener('keydown', function(e) {
            if (!canvas.closest('.hero-minigame:hover')) return;
            playerControl = true;
            switch(e.key) {
                case 'ArrowUp': if (dir.y !== 1) dir = {x:0,y:-1}; break;
                case 'ArrowDown': if (dir.y !== -1) dir = {x:0,y:1}; break;
                case 'ArrowLeft': if (dir.x !== 1) dir = {x:-1,y:0}; break;
                case 'ArrowRight': if (dir.x !== -1) dir = {x:1,y:0}; break;
            }
        });

        canvas.addEventListener('mouseleave', function() { playerControl = false; });

        observePause(canvas, function(p) { paused = p; });

        reset();
        draw();
        setInterval(function() {
            if (!playerControl && alive) aiDir();
            tick();
        }, speed);
    }

    // =====================
    // PONG (bottom-left)
    // =====================
    function initPong() {
        const canvas = document.getElementById('pong-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        let paused = false;

        const paddleW = 6, paddleH = 30;
        let leftY = H / 2 - paddleH / 2;
        let rightY = H / 2 - paddleH / 2;
        const ballR = 4;
        let bx, by, bdx, bdy;
        let scoreL = 0, scoreR = 0;

        function resetBall() {
            bx = W / 2;
            by = H / 2;
            bdx = 1.5 * (Math.random() > 0.5 ? 1 : -1);
            bdy = 1.5 * (Math.random() - 0.5);
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);

            // Center line
            ctx.setLineDash([3, 4]);
            ctx.strokeStyle = 'rgba(234,234,234,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(W / 2, 0);
            ctx.lineTo(W / 2, H);
            ctx.stroke();
            ctx.setLineDash([]);

            // Score
            ctx.fillStyle = 'rgba(234,234,234,0.15)';
            ctx.font = '20px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(scoreL, W / 2 - 25, 25);
            ctx.fillText(scoreR, W / 2 + 25, 25);

            // Paddles
            ctx.fillStyle = '#0f3460';
            ctx.shadowColor = '#0f3460';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.roundRect(6, leftY, paddleW, paddleH, 3);
            ctx.fill();

            ctx.fillStyle = '#e94560';
            ctx.shadowColor = '#e94560';
            ctx.beginPath();
            ctx.roundRect(W - 12, rightY, paddleW, paddleH, 3);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Ball
            ctx.fillStyle = '#eaeaea';
            ctx.shadowColor = '#eaeaea';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(bx, by, ballR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        function update() {
            bx += bdx;
            by += bdy;

            if (by - ballR <= 0 || by + ballR >= H) bdy = -bdy;

            // Left paddle (AI)
            const lCenter = leftY + paddleH / 2;
            if (lCenter < by - 3) leftY += 1.5;
            else if (lCenter > by + 3) leftY -= 1.5;

            // Right paddle (AI)
            const rCenter = rightY + paddleH / 2;
            if (rCenter < by - 3) rightY += 1.5;
            else if (rCenter > by + 3) rightY -= 1.5;

            leftY = Math.max(0, Math.min(H - paddleH, leftY));
            rightY = Math.max(0, Math.min(H - paddleH, rightY));

            // Paddle collisions
            if (bx - ballR <= 12 && by >= leftY && by <= leftY + paddleH) {
                bdx = Math.abs(bdx) * 1.02;
                bdy += (by - lCenter) / paddleH * 2;
            }
            if (bx + ballR >= W - 12 && by >= rightY && by <= rightY + paddleH) {
                bdx = -Math.abs(bdx) * 1.02;
                bdy += (by - rCenter) / paddleH * 2;
            }

            // Speed cap
            bdx = Math.max(-3.5, Math.min(3.5, bdx));
            bdy = Math.max(-3, Math.min(3, bdy));

            // Score
            if (bx < -10) { scoreR++; resetBall(); }
            if (bx > W + 10) { scoreL++; resetBall(); }
            if (scoreL >= 5 || scoreR >= 5) { scoreL = 0; scoreR = 0; }
        }

        // Player can control right paddle
        canvas.addEventListener('mousemove', function(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleY = H / rect.height;
            rightY = (e.clientY - rect.top) * scaleY - paddleH / 2;
            rightY = Math.max(0, Math.min(H - paddleH, rightY));
        });

        observePause(canvas, function(p) { paused = p; });

        resetBall();
        (function loop() {
            if (!paused) { update(); draw(); }
            requestAnimationFrame(loop);
        })();
    }

    // =====================
    // TETRIS (top-right)
    // =====================
    function initTetris() {
        const canvas = document.getElementById('tetris-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const grid = 12;
        const cols = 10, rows = Math.floor(H / grid);
        const offsetX = (W - cols * grid) / 2;
        let paused = false;

        const colors = ['#e94560', '#0f3460', '#533483', '#ff6b81', '#00b894', '#fdcb6e', '#6c5ce7'];
        const shapes = [
            [[1,1,1,1]],
            [[1,1],[1,1]],
            [[0,1,0],[1,1,1]],
            [[1,0,0],[1,1,1]],
            [[0,0,1],[1,1,1]],
            [[1,1,0],[0,1,1]],
            [[0,1,1],[1,1,0]]
        ];

        let board = [];
        let piece, pieceX, pieceY, pieceColor;
        let dropTimer = 0;
        const dropSpeed = 500;
        let lastTime = 0;

        function initBoard() {
            board = [];
            for (let r = 0; r < rows; r++) {
                board[r] = Array(cols).fill(0);
            }
        }

        function newPiece() {
            const idx = Math.floor(Math.random() * shapes.length);
            piece = shapes[idx].map(function(row) { return row.slice(); });
            pieceColor = colors[idx];
            pieceX = Math.floor((cols - piece[0].length) / 2);
            pieceY = 0;
            if (collides(pieceX, pieceY, piece)) {
                initBoard();
            }
        }

        function collides(px, py, p) {
            for (let r = 0; r < p.length; r++) {
                for (let c = 0; c < p[r].length; c++) {
                    if (!p[r][c]) continue;
                    const nx = px + c, ny = py + r;
                    if (nx < 0 || nx >= cols || ny >= rows) return true;
                    if (ny >= 0 && board[ny][nx]) return true;
                }
            }
            return false;
        }

        function merge() {
            for (let r = 0; r < piece.length; r++) {
                for (let c = 0; c < piece[r].length; c++) {
                    if (piece[r][c]) {
                        const ny = pieceY + r;
                        if (ny >= 0) board[ny][pieceX + c] = pieceColor;
                    }
                }
            }
        }

        function clearLines() {
            for (let r = rows - 1; r >= 0; r--) {
                if (board[r].every(function(c) { return c !== 0; })) {
                    board.splice(r, 1);
                    board.unshift(Array(cols).fill(0));
                    r++;
                }
            }
        }

        function rotate(p) {
            const newP = [];
            for (let c = 0; c < p[0].length; c++) {
                const row = [];
                for (let r = p.length - 1; r >= 0; r--) {
                    row.push(p[r][c]);
                }
                newP.push(row);
            }
            return newP;
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);

            // Board border
            ctx.strokeStyle = 'rgba(234,234,234,0.08)';
            ctx.lineWidth = 1;
            ctx.strokeRect(offsetX, 0, cols * grid, rows * grid);

            // Placed blocks
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (board[r][c]) {
                        ctx.fillStyle = board[r][c];
                        ctx.shadowColor = board[r][c];
                        ctx.shadowBlur = 3;
                        ctx.beginPath();
                        ctx.roundRect(offsetX + c * grid + 1, r * grid + 1, grid - 2, grid - 2, 1);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }

            // Current piece
            if (piece) {
                ctx.fillStyle = pieceColor;
                ctx.shadowColor = pieceColor;
                ctx.shadowBlur = 6;
                for (let r = 0; r < piece.length; r++) {
                    for (let c = 0; c < piece[r].length; c++) {
                        if (piece[r][c]) {
                            ctx.beginPath();
                            ctx.roundRect(offsetX + (pieceX + c) * grid + 1, (pieceY + r) * grid + 1, grid - 2, grid - 2, 1);
                            ctx.fill();
                        }
                    }
                }
                ctx.shadowBlur = 0;
            }
        }

        // Auto-play AI
        function aiBestMove() {
            if (!piece) return;
            let bestScore = -Infinity, bestX = pieceX, bestRot = 0;

            for (let rot = 0; rot < 4; rot++) {
                let testPiece = piece.map(function(r) { return r.slice(); });
                for (let rr = 0; rr < rot; rr++) testPiece = rotate(testPiece);

                for (let tx = -2; tx < cols; tx++) {
                    let ty = pieceY;
                    if (collides(tx, ty, testPiece)) continue;
                    while (!collides(tx, ty + 1, testPiece)) ty++;

                    // Score: lower = better, penalize holes
                    let score = ty;
                    // Temporarily merge
                    const tempBoard = board.map(function(r) { return r.slice(); });
                    for (let r = 0; r < testPiece.length; r++) {
                        for (let c = 0; c < testPiece[r].length; c++) {
                            if (testPiece[r][c] && ty + r >= 0 && ty + r < rows) {
                                tempBoard[ty + r][tx + c] = 1;
                            }
                        }
                    }
                    // Clear lines bonus
                    let lines = 0;
                    for (let r = 0; r < rows; r++) {
                        if (tempBoard[r].every(function(c) { return c !== 0; })) lines++;
                    }
                    score += lines * 5;

                    if (score > bestScore) {
                        bestScore = score;
                        bestX = tx;
                        bestRot = rot;
                    }
                }
            }

            // Apply rotation
            for (let rr = 0; rr < bestRot; rr++) {
                const rotated = rotate(piece);
                if (!collides(pieceX, pieceY, rotated)) piece = rotated;
            }

            // Move toward target x
            if (pieceX < bestX && !collides(pieceX + 1, pieceY, piece)) pieceX++;
            else if (pieceX > bestX && !collides(pieceX - 1, pieceY, piece)) pieceX--;
        }

        function update(dt) {
            dropTimer += dt;
            if (dropTimer >= dropSpeed) {
                dropTimer = 0;
                aiBestMove();
                if (!collides(pieceX, pieceY + 1, piece)) {
                    pieceY++;
                } else {
                    merge();
                    clearLines();
                    newPiece();
                }
            }
        }

        observePause(canvas, function(p) { paused = p; });

        initBoard();
        newPiece();
        lastTime = performance.now();
        (function loop(now) {
            const dt = now - lastTime;
            lastTime = now;
            if (!paused) { update(dt); draw(); }
            requestAnimationFrame(loop);
        })(performance.now());
    }

    // =====================
    // MEMORY CARDS (bottom-right)
    // =====================
    function initMemory() {
        const canvas = document.getElementById('memory-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        const gridCols = 4, gridRows = 3;
        const cardW = (W - 20) / gridCols;
        const cardH = (H - 20) / gridRows;
        const padX = (W - gridCols * cardW) / 2;
        const padY = (H - gridRows * cardH) / 2;

        const symbols = ['◆', '★', '●', '▲', '♥', '■'];
        const symColors = ['#e94560', '#fdcb6e', '#00b894', '#6c5ce7', '#ff6b81', '#0f3460'];
        let cards = [];
        let flipped = [];
        let matched = [];
        let lockInput = false;

        function shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
            }
            return arr;
        }

        function initCards() {
            const pairs = symbols.slice(0, (gridCols * gridRows) / 2);
            const deck = shuffle(pairs.concat(pairs));
            cards = deck.map(function(sym, i) {
                return { sym: sym, color: symColors[symbols.indexOf(sym)], idx: i };
            });
            flipped = [];
            matched = [];
            lockInput = false;
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);

            cards.forEach(function(card, i) {
                const col = i % gridCols;
                const row = Math.floor(i / gridCols);
                const x = padX + col * cardW + 2;
                const y = padY + row * cardH + 2;
                const w = cardW - 4;
                const h = cardH - 4;

                const isFlipped = flipped.indexOf(i) >= 0 || matched.indexOf(i) >= 0;
                const isMatched = matched.indexOf(i) >= 0;

                if (isMatched) {
                    ctx.fillStyle = 'rgba(233, 69, 96, 0.1)';
                    ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
                } else if (isFlipped) {
                    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
                    ctx.strokeStyle = card.color;
                } else {
                    ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
                    ctx.strokeStyle = 'rgba(234,234,234,0.15)';
                }

                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, 4);
                ctx.fill();
                ctx.stroke();

                if (isFlipped || isMatched) {
                    ctx.fillStyle = card.color;
                    ctx.shadowColor = card.color;
                    ctx.shadowBlur = isMatched ? 4 : 8;
                    ctx.font = 'bold ' + Math.floor(h * 0.45) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(card.sym, x + w / 2, y + h / 2);
                    ctx.shadowBlur = 0;
                } else {
                    // Card back pattern
                    ctx.fillStyle = 'rgba(234,234,234,0.08)';
                    ctx.font = Math.floor(h * 0.3) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('?', x + w / 2, y + h / 2);
                }
            });
        }

        canvas.addEventListener('click', function(e) {
            if (lockInput) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width;
            const scaleY = H / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            for (var i = 0; i < cards.length; i++) {
                var col = i % gridCols;
                var row = Math.floor(i / gridCols);
                var x = padX + col * cardW + 2;
                var y = padY + row * cardH + 2;
                var w = cardW - 4;
                var h = cardH - 4;

                if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
                    if (flipped.indexOf(i) >= 0 || matched.indexOf(i) >= 0) return;
                    flipped.push(i);
                    draw();

                    if (flipped.length === 2) {
                        lockInput = true;
                        var a = flipped[0], b = flipped[1];
                        if (cards[a].sym === cards[b].sym) {
                            matched.push(a, b);
                            flipped = [];
                            lockInput = false;
                            draw();
                            if (matched.length === cards.length) {
                                setTimeout(function() { initCards(); draw(); }, 1500);
                            }
                        } else {
                            setTimeout(function() {
                                flipped = [];
                                lockInput = false;
                                draw();
                            }, 800);
                        }
                    }
                    return;
                }
            }
        });

        initCards();
        draw();
    }

    // Init all games
    function initAll() {
        initSnake();
        initPong();
        initTetris();
        initMemory();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
