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
        this.ctx.font = '14px Microsoft YaHei';
        this.ctx.textAlign = 'center';
    }

    // 设置事件监听器
    setupEventListeners() {
        // 开始游戏按钮
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
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
            this.updateUI();
            this.drawGame();
        } catch (error) {
            console.error('开始游戏失败:', error);
            alert('开始游戏失败: ' + error.message);
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
                if (this.selectedCardIndex === cardIndex) {
                    // 双击打牌
                    this.discardCard(cardIndex);
                } else {
                    // 选择牌
                    this.selectedCardIndex = cardIndex;
                    humanPlayer.selectedCardIndex = cardIndex;
                    this.drawGame();
                }
            }
        }
    }

    // 获取点击的牌的索引
    getClickedCardIndex(x, y, cardCount) {
        const cardWidth = 40;
        const cardHeight = 60;
        const startX = (this.canvas.width - cardCount * cardWidth) / 2;
        const cardY = this.canvas.height - cardHeight - 20;

        if (y >= cardY && y <= cardY + cardHeight) {
            const cardIndex = Math.floor((x - startX) / cardWidth);
            if (cardIndex >= 0 && cardIndex < cardCount) {
                return cardIndex;
            }
        }

        return -1;
    }

    // 打牌
    discardCard(cardIndex) {
        try {
            const result = this.game.playerDiscard(0, cardIndex);
            this.selectedCardIndex = -1;

            if (result.waitingForResponse) {
                this.handleWaitingForResponse(result.actions);
            }

            this.updateUI();
            this.drawGame();
        } catch (error) {
            console.error('打牌失败:', error);
            alert('打牌失败: ' + error.message);
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
                this.game.nextPlayerTurn();
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
        if (!this.waitingForResponse) return;

        try {
            const result = this.game.playerResponse(0, actionType);
            this.waitingForResponse = false;
            this.updateUI();
            this.drawGame();

            if (result && result.gameOver) {
                this.handleGameOver(result);
            }
        } catch (error) {
            console.error('操作失败:', error);
            alert('操作失败: ' + error.message);
        }
    }

    // 处理游戏结束
    handleGameOver(result) {
        if (result.winner !== undefined) {
            const winner = this.game.players[result.winner];
            alert(`游戏结束！${winner.name} 胡牌了！`);
        } else {
            alert(`游戏结束！${result.reason}`);
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

        // 更新当前玩家
        document.getElementById('player-turn').textContent = gameState.currentPlayer + 1;

        // 更新按钮状态
        const isHumanTurn = gameState.currentPlayer === 0 && gameState.gamePhase === 'playing';
        const gameStarted = gameState.gamePhase !== 'waiting';

        document.getElementById('start-game').disabled = gameStarted;

        if (!this.waitingForResponse) {
            document.getElementById('chi').disabled = true;
            document.getElementById('peng').disabled = true;
            document.getElementById('gang').disabled = true;
            document.getElementById('hu').disabled = true;
        }
    }

    // 绘制游戏
    drawGame() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const gameState = this.game.getGameState();
        if (gameState.gamePhase === 'waiting') {
            this.drawWaitingScreen();
            return;
        }

        // 绘制牌桌
        this.drawTable();

        // 绘制玩家手牌（只绘制人类玩家的）
        this.drawPlayerHands(gameState);

        // 绘制打出的牌
        this.drawDiscardedCards(gameState);

        // 绘制癞子信息
        this.drawLaiziInfo(gameState);

        // 绘制游戏信息
        this.drawGameInfo(gameState);
    }

    // 绘制等待界面
    drawWaitingScreen() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '32px Microsoft YaHei';
        this.ctx.fillText('武汉麻将', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = '18px Microsoft YaHei';
        this.ctx.fillText('点击"开始游戏"开始', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    // 绘制牌桌
    drawTable() {
        // 绘制牌桌背景
        this.ctx.fillStyle = '#2d5a3d';
        this.ctx.fillRect(100, 100, this.canvas.width - 200, this.canvas.height - 200);

        // 绘制牌桌边框
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(100, 100, this.canvas.width - 200, this.canvas.height - 200);
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
        const cardWidth = 40;
        const cardHeight = 60;
        const cards = player.handCards;
        const startX = (this.canvas.width - cards.length * cardWidth) / 2;
        const y = this.canvas.height - cardHeight - 20;

        cards.forEach((card, index) => {
            const x = startX + index * cardWidth;
            const isSelected = index === player.selectedCardIndex;

            // 如果选中，向上偏移
            const cardY = isSelected ? y - 15 : y;

            this.drawCard(card, x, cardY, cardWidth, cardHeight, isSelected);
        });
    }

    // 绘制其他玩家的牌背
    drawOtherPlayerCards(player, playerIndex) {
        const cardWidth = 30;
        const cardHeight = 45;
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
        this.ctx.font = '12px Microsoft YaHei';
        this.ctx.fillText(card.getDisplayName(), x + width / 2, y + height / 2 + 4);

        // 如果是癞子，添加标记
        if (card.isLaizi) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '8px Microsoft YaHei';
            this.ctx.fillText('癞', x + width - 8, y + 10);
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
        this.ctx.font = '10px Microsoft YaHei';
        this.ctx.fillText('麻', x + width / 2, y + height / 2);
    }

    // 绘制打出的牌
    drawDiscardedCards(gameState) {
        if (gameState.lastDiscarded) {
            const card = gameState.lastDiscarded.card;
            const x = this.canvas.width / 2 - 20;
            const y = this.canvas.height / 2 - 30;

            this.drawCard(card, x, y, 40, 60);

            // 显示是谁打出的
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = '14px Microsoft YaHei';
            this.ctx.fillText(
                `${this.game.players[gameState.lastDiscarded.player].name}打出`,
                this.canvas.width / 2,
                y - 10
            );
        }
    }

    // 绘制癞子信息
    drawLaiziInfo(gameState) {
        const laiziInfo = gameState.laiziInfo;
        if (laiziInfo.laiziCard) {
            const x = 20;
            const y = this.canvas.height - 120;

            // 绘制翻开的牌
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Microsoft YaHei';
            this.ctx.fillText('翻牌:', x, y);

            this.drawCard(laiziInfo.flippedCard, x, y + 10, 35, 50);

            // 绘制癞子牌
            this.ctx.fillText('癞子:', x, y + 70);
            const laiziCard = laiziInfo.laiziCard.clone();
            laiziCard.isLaizi = true;
            this.drawCard(laiziCard, x, y + 80, 35, 50);
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