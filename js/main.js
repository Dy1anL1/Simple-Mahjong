// 游戏主控制器
class GameController {
    constructor() {
        this.game = new WuhanMahjongGame();
        this.canvas = null;
        this.ctx = null;
        this.selectedCardIndex = -1;
        this.waitingForResponse = false;
        this.availableActions = [];

        this.initializeCanvas();
        this.setupEventListeners();
        this.updateUI();
    }

    // 初始化Canvas
    initializeCanvas() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // 设置Canvas响应式大小
        this.resizeCanvas();

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.drawGame();
        });

        this.ctx.font = '16px Microsoft YaHei';
        this.ctx.textAlign = 'center';
    }

    // 调整Canvas大小
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        // 设置Canvas实际大小
        this.canvas.width = containerRect.width - 4; // 减去边框宽度
        this.canvas.height = Math.max(500, window.innerHeight * 0.7);

        console.log(`Canvas调整为: ${this.canvas.width} x ${this.canvas.height}`);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 开始游戏按钮
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });

        // 出牌按钮
        document.getElementById('discard').addEventListener('click', () => {
            this.handleDiscardButton();
        });

        // 操作按钮
        document.getElementById('chi').addEventListener('click', () => {
            this.handleAction('chi');
        });

        document.getElementById('peng').addEventListener('click', () => {
            this.handleAction('peng');
        });

        document.getElementById('gang').addEventListener('click', () => {
            this.handleAction('gang');
        });

        document.getElementById('hu').addEventListener('click', () => {
            this.handleAction('hu');
        });

        // Canvas点击事件
        this.canvas.addEventListener('click', (event) => {
            this.handleCanvasClick(event);
        });
    }

    // 开始游戏
    startGame() {
        try {
            const gameState = this.game.startNewGame();

            // 隐藏开始游戏覆盖层
            document.body.classList.add('game-started');

            this.updateUI();
            this.drawGame();
            toast.success('游戏开始！祝你好运！', '新游戏');
        } catch (error) {
            console.error('开始游戏失败:', error);
            toast.error(error.message, '开始游戏失败');
        }
    }

    // 处理Canvas点击
    handleCanvasClick(event) {
        if (this.game.gamePhase !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 检查是否点击了玩家手牌
        const humanPlayer = this.game.players[0];
        if (this.game.currentPlayerIndex === 0) {
            const cardIndex = this.getClickedCardIndex(x, y, humanPlayer.handCards.length);
            if (cardIndex !== -1) {
                console.log(`点击了第${cardIndex}张牌`);
                if (this.selectedCardIndex === cardIndex) {
                    // 双击同一张牌，打出
                    console.log('双击打牌');
                    this.discardCard(cardIndex);
                } else {
                    // 选择牌
                    console.log('选择牌');
                    this.selectedCardIndex = cardIndex;
                    humanPlayer.selectedCardIndex = cardIndex;
                    this.drawGame();
                }
            } else {
                console.log('点击区域无效', { x, y });
            }
        } else {
            console.log('不是玩家回合，当前玩家：', this.game.currentPlayerIndex);
        }
    }

    // 获取点击的牌的索引
    getClickedCardIndex(x, y, cardCount) {
        const cardWidth = this.getCardWidth();
        const cardHeight = this.getCardHeight();
        const startX = (this.canvas.width - cardCount * cardWidth) / 2;
        const cardY = this.canvas.height - cardHeight - 30;

        if (y >= cardY && y <= cardY + cardHeight) {
            const cardIndex = Math.floor((x - startX) / cardWidth);
            if (cardIndex >= 0 && cardIndex < cardCount) {
                return cardIndex;
            }
        }

        return -1;
    }

    // 获取牌的宽度（根据屏幕大小动态调整）
    getCardWidth() {
        return Math.max(50, Math.min(70, this.canvas.width / 20));
    }

    // 获取牌的高度（根据屏幕大小动态调整）
    getCardHeight() {
        return this.getCardWidth() * 1.4; // 保持宽高比
    }

    // 处理出牌按钮点击
    handleDiscardButton() {
        if (this.selectedCardIndex === -1) {
            toast.warning('请先选择一张牌', '出牌提示');
            return;
        }
        this.discardCard(this.selectedCardIndex);
    }

    // 打牌
    discardCard(cardIndex) {
        try {
            console.log('尝试打出第' + cardIndex + '张牌');
            const result = this.game.playerDiscard(0, cardIndex);
            this.selectedCardIndex = -1;

            console.log('出牌结果:', result);

            if (result && result.waitingForResponse) {
                this.handleWaitingForResponse(result.actions);
            } else {
                // 没有人要牌，游戏继续
                console.log('没有人要牌，游戏继续');
            }

            this.updateUI();
            this.drawGame();
        } catch (error) {
            console.error('打牌失败:', error);
            toast.error(error.message, '打牌失败');
        }
    }

    // 处理等待响应
    handleWaitingForResponse(actions) {
        this.waitingForResponse = true;
        this.availableActions = actions;

        // 检查是否有可用的操作按钮需要启用
        const humanPlayerActions = actions.find(action => action.playerIndex === 0);
        if (humanPlayerActions) {
            this.enableActionButtons(humanPlayerActions.actions);
        }

        // 设置超时，如果没有响应就继续游戏
        setTimeout(() => {
            if (this.waitingForResponse) {
                console.log('响应超时，继续游戏');
                this.game.playerResponse(0, 'pass'); // 人类玩家选择不响应
                this.waitingForResponse = false;
                this.updateUI();
                this.drawGame();
            }
        }, 5000);
    }

    // 启用操作按钮
    enableActionButtons(actions) {
        document.getElementById('chi').disabled = !actions.some(a => a.type === 'chi');
        document.getElementById('peng').disabled = !actions.some(a => a.type === 'peng');
        document.getElementById('gang').disabled = !actions.some(a => a.type === 'gang');
        document.getElementById('hu').disabled = !actions.some(a => a.type === 'hu');
    }

    // 处理玩家操作
    handleAction(actionType) {
        const gameState = this.game.getGameState();
        const isHumanTurn = gameState.currentPlayer === 0 && gameState.gamePhase === 'playing';

        try {
            // 如果是人类玩家回合，检查自摸胡牌和暗杠
            if (isHumanTurn) {
                if (actionType === 'hu') {
                    console.log('尝试自摸胡牌...');
                    const result = this.game.checkSelfWin(0);
                    if (result) {
                        toast.success('恭喜自摸！', '胡牌成功');
                        this.handleGameOver({ winner: 0, type: 'self_win' });
                        return;
                    } else {
                        toast.warning('当前手牌无法胡牌', '胡牌失败');
                        return;
                    }
                } else if (actionType === 'gang') {
                    console.log('尝试暗杠...');
                    const result = this.game.tryAnGang(0);
                    if (result) {
                        toast.success('暗杠成功！', '操作成功');
                        this.updateUI();
                        this.drawGame();
                        return;
                    } else {
                        toast.warning('没有可以暗杠的牌', '暗杠失败');
                        return;
                    }
                }
            }

            // 响应其他玩家的打牌（明杠、吃、碰、胡）
            if (!this.waitingForResponse) {
                console.log('当前没有可响应的操作');
                return;
            }

            const result = this.game.playerResponse(0, actionType);
            this.waitingForResponse = false;
            this.updateUI();
            this.drawGame();

            if (result && result.gameOver) {
                this.handleGameOver(result);
            }
        } catch (error) {
            console.error('操作失败:', error);
            toast.error(error.message, '操作失败');
        }
    }

    // 处理游戏结束
    handleGameOver(result) {
        if (result.winner !== undefined) {
            const winner = this.game.players[result.winner];
            toast.success(`${winner.name} 胡牌了！`, '游戏结束');
        } else {
            toast.info(`${result.reason}`, '游戏结束');
        }
    }

    // 更新UI
    updateUI() {
        const gameState = this.game.getGameState();

        // 更新癞子信息
        const laiziInfo = gameState.laiziInfo;
        if (laiziInfo.laiziCard) {
            document.getElementById('laizi-card').textContent = laiziInfo.laiziCard.getDisplayName();
        }

        // 更新按钮状态 - 首先确定是否为人类玩家回合
        const isHumanTurn = gameState.currentPlayer === 0 && gameState.gamePhase === 'playing';

        // 更新当前玩家显示
        const currentPlayerName = gameState.players[gameState.currentPlayer].name;
        document.getElementById('player-turn').textContent = currentPlayerName;

        // 调试：显示玩家手牌数
        if (gameState.gamePhase === 'playing') {
            const humanPlayer = gameState.players[0];
            console.log(`UI更新 - 人类玩家手牌数: ${humanPlayer.handCards.length}`);
            console.log(`当前轮到: ${currentPlayerName} (索引: ${gameState.currentPlayer})`);

            // 如果轮到人类玩家且手牌数正确，显示提示
            if (isHumanTurn && humanPlayer.handCards.length === 14) {
                console.log('轮到人类玩家，手牌14张，可以出牌');
            } else if (isHumanTurn && humanPlayer.handCards.length === 13) {
                console.log('轮到人类玩家，手牌13张，已自动摸牌');
            }
        }
        const gameStarted = gameState.gamePhase !== 'waiting';
        const hasSelectedCard = this.selectedCardIndex !== -1;

        document.getElementById('start-game').disabled = gameStarted;
        document.getElementById('discard').disabled = !isHumanTurn || !hasSelectedCard;

        // 更新操作按钮状态
        if (this.waitingForResponse) {
            // 如果在等待响应（其他玩家打牌后），显示相应的操作按钮
            // 这些按钮的启用状态由enableActionButtons方法设置
        } else {
            // 不在等待响应时，禁用吃碰，但杠牌和胡牌按钮在人类回合时可用
            document.getElementById('chi').disabled = true;
            document.getElementById('peng').disabled = true;

            // 杠牌按钮：人类回合时可用（暗杠），否则禁用
            document.getElementById('gang').disabled = !isHumanTurn;

            // 胡牌按钮：人类回合时可用（自摸），否则禁用
            document.getElementById('hu').disabled = !isHumanTurn;
        }
    }

    // 绘制游戏
    drawGame() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const gameState = this.game.getGameState();

        // 始终绘制牌桌背景
        this.drawTable();

        if (gameState.gamePhase === 'waiting') {
            // 等待阶段不绘制游戏内容，让HTML覆盖层显示
            return;
        }

        // 绘制玩家手牌（只绘制人类玩家的）
        this.drawPlayerHands(gameState);

        // 绘制打出的牌
        this.drawDiscardedCards(gameState);

        // 绘制癞子信息
        this.drawLaiziInfo(gameState);

        // 绘制游戏信息
        this.drawGameInfo(gameState);
    }


    // 绘制牌桌 - 真实麻将桌风格
    drawTable() {
        // 绘制整个牌桌背景
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, Math.min(this.canvas.width, this.canvas.height) / 2
        );
        gradient.addColorStop(0, '#2d5a3d');
        gradient.addColorStop(1, '#1a3a2a');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制中央牌河区域
        const centerWidth = this.canvas.width * 0.4;
        const centerHeight = this.canvas.height * 0.3;
        const centerX = this.canvas.width / 2 - centerWidth / 2;
        const centerY = this.canvas.height / 2 - centerHeight / 2;

        // 中央区域背景（稍深一些）
        this.ctx.fillStyle = '#1a4a2a';
        this.ctx.fillRect(centerX - 10, centerY - 10, centerWidth + 20, centerHeight + 20);

        // 中央区域边框
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(centerX - 10, centerY - 10, centerWidth + 20, centerHeight + 20);

        // 绘制四个玩家区域的分界线
        this.ctx.strokeStyle = '#6b4423';
        this.ctx.lineWidth = 1;

        // 水平分界线
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY + centerHeight / 2);
        this.ctx.lineTo(centerX + centerWidth, centerY + centerHeight / 2);
        this.ctx.stroke();

        // 垂直分界线
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + centerWidth / 2, centerY);
        this.ctx.lineTo(centerX + centerWidth / 2, centerY + centerHeight);
        this.ctx.stroke();

        // 添加角落装饰
        this.ctx.fillStyle = '#8b4513';
        const cornerSize = 8;
        [
            [centerX - 10, centerY - 10],
            [centerX + centerWidth + 10 - cornerSize, centerY - 10],
            [centerX - 10, centerY + centerHeight + 10 - cornerSize],
            [centerX + centerWidth + 10 - cornerSize, centerY + centerHeight + 10 - cornerSize]
        ].forEach(([x, y]) => {
            this.ctx.fillRect(x, y, cornerSize, cornerSize);
        });

        // 添加玩家方位标识
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Microsoft YaHei';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 下方 - 你
        this.ctx.fillText('你', centerX + centerWidth / 2, centerY + centerHeight + 25);

        // 右侧 - 电脑1
        this.ctx.save();
        this.ctx.translate(centerX + centerWidth + 25, centerY + centerHeight / 2);
        this.ctx.rotate(Math.PI / 2);
        this.ctx.fillText('电脑1', 0, 0);
        this.ctx.restore();

        // 上方 - 电脑2
        this.ctx.fillText('电脑2', centerX + centerWidth / 2, centerY - 15);

        // 左侧 - 电脑3
        this.ctx.save();
        this.ctx.translate(centerX - 25, centerY + centerHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('电脑3', 0, 0);
        this.ctx.restore();
    }

    // 绘制玩家手牌
    drawPlayerHands(gameState) {
        const humanPlayer = gameState.players[0];

        if (humanPlayer.handCards && humanPlayer.handCards.length > 0) {
            this.drawHumanPlayerCards(humanPlayer);
        }

        // 绘制其他玩家的牌背
        for (let i = 1; i < 4; i++) {
            this.drawOtherPlayerCards(gameState.players[i], i);
        }
    }

    // 绘制人类玩家手牌
    drawHumanPlayerCards(player) {
        const cardWidth = this.getCardWidth();
        const cardHeight = this.getCardHeight();
        const cards = player.handCards;
        const startX = (this.canvas.width - cards.length * cardWidth) / 2;
        const y = this.canvas.height - cardHeight - 30;

        cards.forEach((card, index) => {
            const x = startX + index * cardWidth;
            const isSelected = index === player.selectedCardIndex;

            // 如果选中，向上偏移
            const cardY = isSelected ? y - 20 : y;

            this.drawCard(card, x, cardY, cardWidth, cardHeight, isSelected);
        });
    }

    // 绘制其他玩家的牌背
    drawOtherPlayerCards(player, playerIndex) {
        const cardWidth = Math.max(35, this.getCardWidth() * 0.7);
        const cardHeight = Math.max(50, this.getCardHeight() * 0.7);
        const handSize = player.handSize;

        let startX, startY, isVertical = false;

        // 根据玩家位置确定牌的位置
        switch (playerIndex) {
            case 1: // 右侧玩家
                startX = this.canvas.width - cardWidth - 20;
                startY = (this.canvas.height - handSize * 20) / 2;
                isVertical = true;
                break;
            case 2: // 对面玩家
                startX = (this.canvas.width - handSize * 25) / 2;
                startY = 20;
                break;
            case 3: // 左侧玩家
                startX = 20;
                startY = (this.canvas.height - handSize * 20) / 2;
                isVertical = true;
                break;
        }

        for (let i = 0; i < handSize; i++) {
            let x, y;
            if (isVertical) {
                x = startX;
                y = startY + i * 20;
            } else {
                x = startX + i * 25;
                y = startY;
            }

            this.drawCardBack(x, y, cardWidth, cardHeight);
        }
    }

    // 绘制牌
    drawCard(card, x, y, width, height, isSelected = false) {
        // 绘制牌背景
        this.ctx.fillStyle = isSelected ? '#add8e6' : '#ffffff';
        this.ctx.fillRect(x, y, width, height);

        // 绘制边框
        this.ctx.strokeStyle = card.isLaizi ? '#ff0000' : '#000000';
        this.ctx.lineWidth = card.isLaizi ? 3 : 1;
        this.ctx.strokeRect(x, y, width, height);

        // 绘制牌面文字
        this.ctx.fillStyle = card.isHongZhong() ? '#ff0000' : '#000000';
        const fontSize = Math.max(12, Math.min(18, width * 0.3));
        this.ctx.font = `${fontSize}px Microsoft YaHei`;
        this.ctx.fillText(card.getDisplayName(), x + width / 2, y + height / 2 + 4);

        // 如果是癞子，添加标记
        if (card.isLaizi) {
            this.ctx.fillStyle = '#ff0000';
            const laiziSize = Math.max(8, Math.min(12, width * 0.2));
            this.ctx.font = `${laiziSize}px Microsoft YaHei`;
            this.ctx.fillText('癞', x + width - laiziSize, y + laiziSize + 2);
        }
    }

    // 绘制牌背
    drawCardBack(x, y, width, height) {
        this.ctx.fillStyle = '#0066cc';
        this.ctx.fillRect(x, y, width, height);

        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.fillStyle = '#ffffff';
        const backFontSize = Math.max(10, Math.min(16, width * 0.4));
        this.ctx.font = `${backFontSize}px Microsoft YaHei`;
        this.ctx.fillText('麻', x + width / 2, y + height / 2);
    }

    // 绘制打出的牌
    drawDiscardedCards(gameState) {
        // 为每个玩家绘制打出的牌
        for (let i = 0; i < this.game.players.length; i++) {
            const player = this.game.players[i];
            if (player.discardedCards.length > 0) {
                this.drawPlayerDiscardedCards(player, i);
            }
        }

        // 高亮显示最后一张打出的牌
        if (gameState.lastDiscarded) {
            const lastPlayer = this.game.players[gameState.lastDiscarded.player];
            const lastCard = gameState.lastDiscarded.card;
            const lastCardIndex = lastPlayer.discardedCards.length - 1;

            this.highlightLastDiscardedCard(gameState.lastDiscarded.player, lastCardIndex, lastCard);
        }
    }

    // 绘制单个玩家打出的牌 - 真实麻将桌布局
    drawPlayerDiscardedCards(player, playerIndex) {
        const cardWidth = Math.max(25, this.getCardWidth() * 0.5);
        const cardHeight = Math.max(35, this.getCardHeight() * 0.5);

        // 中央牌河区域尺寸
        const centerWidth = this.canvas.width * 0.4;
        const centerHeight = this.canvas.height * 0.3;
        const centerX = this.canvas.width / 2 - centerWidth / 2;
        const centerY = this.canvas.height / 2 - centerHeight / 2;

        let baseX, baseY, cardsPerRow, isVertical = false;

        // 根据玩家位置确定打牌区域 - 真实麻将桌布局
        switch (playerIndex) {
            case 0: // 人类玩家 - 下方牌河
                cardsPerRow = Math.floor(centerWidth / cardWidth);
                baseX = centerX;
                baseY = centerY + centerHeight - cardHeight * 2; // 下方区域
                break;
            case 1: // 右侧玩家 - 右侧牌河
                cardsPerRow = Math.floor(centerHeight / cardHeight);
                baseX = centerX + centerWidth - cardWidth * 2; // 右侧区域
                baseY = centerY;
                isVertical = true;
                break;
            case 2: // 上方玩家 - 上方牌河
                cardsPerRow = Math.floor(centerWidth / cardWidth);
                baseX = centerX;
                baseY = centerY; // 上方区域
                break;
            case 3: // 左侧玩家 - 左侧牌河
                cardsPerRow = Math.floor(centerHeight / cardHeight);
                baseX = centerX;
                baseY = centerY;
                isVertical = true;
                break;
        }

        // 确保每行至少有4张牌
        cardsPerRow = Math.max(4, cardsPerRow);

        // 绘制打出的牌 - 优化布局
        player.discardedCards.forEach((card, index) => {
            let x, y;

            if (isVertical) {
                // 垂直排列（左右玩家）
                const row = index % cardsPerRow;
                const col = Math.floor(index / cardsPerRow);

                if (playerIndex === 1) { // 右侧玩家
                    x = baseX - col * cardWidth;  // 从右向左排列
                    y = baseY + row * cardHeight;
                } else { // 左侧玩家
                    x = baseX + col * cardWidth;  // 从左向右排列
                    y = baseY + row * cardHeight;
                }
            } else {
                // 水平排列（上下玩家）
                const row = Math.floor(index / cardsPerRow);
                const col = index % cardsPerRow;

                if (playerIndex === 0) { // 下方玩家（人类）
                    x = baseX + col * cardWidth;
                    y = baseY - row * cardHeight; // 从下向上排列
                } else { // 上方玩家
                    x = baseX + col * cardWidth;
                    y = baseY + row * cardHeight; // 从上向下排列
                }
            }

            this.drawCard(card, x, y, cardWidth, cardHeight);
        });
    }

    // 高亮显示最后一张打出的牌 - 适配新布局
    highlightLastDiscardedCard(playerIndex, cardIndex, card) {
        const cardWidth = Math.max(25, this.getCardWidth() * 0.5);
        const cardHeight = Math.max(35, this.getCardHeight() * 0.5);

        // 中央牌河区域尺寸（与drawPlayerDiscardedCards保持一致）
        const centerWidth = this.canvas.width * 0.4;
        const centerHeight = this.canvas.height * 0.3;
        const centerX = this.canvas.width / 2 - centerWidth / 2;
        const centerY = this.canvas.height / 2 - centerHeight / 2;

        let baseX, baseY, cardsPerRow, isVertical = false;

        // 根据玩家位置确定打牌区域（与drawPlayerDiscardedCards保持一致）
        switch (playerIndex) {
            case 0: // 人类玩家 - 下方牌河
                cardsPerRow = Math.floor(centerWidth / cardWidth);
                baseX = centerX;
                baseY = centerY + centerHeight - cardHeight * 2;
                break;
            case 1: // 右侧玩家 - 右侧牌河
                cardsPerRow = Math.floor(centerHeight / cardHeight);
                baseX = centerX + centerWidth - cardWidth * 2;
                baseY = centerY;
                isVertical = true;
                break;
            case 2: // 上方玩家 - 上方牌河
                cardsPerRow = Math.floor(centerWidth / cardWidth);
                baseX = centerX;
                baseY = centerY;
                break;
            case 3: // 左侧玩家 - 左侧牌河
                cardsPerRow = Math.floor(centerHeight / cardHeight);
                baseX = centerX;
                baseY = centerY;
                isVertical = true;
                break;
        }

        cardsPerRow = Math.max(4, cardsPerRow);

        let x, y;

        if (isVertical) {
            // 垂直排列（左右玩家）
            const row = cardIndex % cardsPerRow;
            const col = Math.floor(cardIndex / cardsPerRow);

            if (playerIndex === 1) { // 右侧玩家
                x = baseX - col * cardWidth;
                y = baseY + row * cardHeight;
            } else { // 左侧玩家
                x = baseX + col * cardWidth;
                y = baseY + row * cardHeight;
            }
        } else {
            // 水平排列（上下玩家）
            const row = Math.floor(cardIndex / cardsPerRow);
            const col = cardIndex % cardsPerRow;

            if (playerIndex === 0) { // 下方玩家（人类）
                x = baseX + col * cardWidth;
                y = baseY - row * cardHeight;
            } else { // 上方玩家
                x = baseX + col * cardWidth;
                y = baseY + row * cardHeight;
            }
        }

        // 绘制高亮边框
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x - 2, y - 2, cardWidth + 4, cardHeight + 4);

        // 添加闪烁效果的文字
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 8px Microsoft YaHei';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('最新', x + cardWidth / 2, y - 5);
    }

    // 绘制癞子信息
    drawLaiziInfo(gameState) {
        const laiziInfo = gameState.laiziInfo;
        if (laiziInfo.laiziCard) {
            const x = 20;
            const y = 50; // 移到屏幕上方，避免与左侧玩家打牌区域重叠

            // 绘制标题背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(x - 5, y - 20, 80, 130);

            // 绘制翻开的牌
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Microsoft YaHei';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('翻牌:', x, y);

            const infoCardWidth = Math.max(30, this.getCardWidth() * 0.5);
            const infoCardHeight = Math.max(45, this.getCardHeight() * 0.5);

            this.drawCard(laiziInfo.flippedCard, x, y + 5, infoCardWidth, infoCardHeight);

            // 绘制癞子牌
            this.ctx.fillText('癞子:', x, y + infoCardHeight + 15);
            const laiziCard = laiziInfo.laiziCard.clone();
            laiziCard.isLaizi = true;
            this.drawCard(laiziCard, x, y + infoCardHeight + 20, infoCardWidth, infoCardHeight);

            // 如果红中是癞子，添加特殊标记
            if (laiziInfo.isHongZhongLaizi) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.font = '10px Microsoft YaHei';
                this.ctx.fillText('杠牌+癞子', x + 35, y + 90);
            }
        }
    }

    // 绘制游戏信息
    drawGameInfo(gameState) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Microsoft YaHei';
        this.ctx.textAlign = 'left';

        const infoX = this.canvas.width - 150;
        let infoY = 30;

        this.ctx.fillText(`剩余牌数: ${gameState.remainingCards}`, infoX, infoY);
        infoY += 25;

        this.ctx.fillText(`当前玩家: ${this.game.players[gameState.currentPlayer].name}`, infoX, infoY);
        infoY += 25;

        if (this.waitingForResponse) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillText('等待操作...', infoX, infoY);
        }

        this.ctx.textAlign = 'center';
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.gameController = new GameController();
});