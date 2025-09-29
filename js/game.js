// 武汉麻将游戏主类
class WuhanMahjongGame {
    constructor() {
        this.deck = new Deck();
        this.players = [];
        this.laiziManager = new LaiziManager(this.deck);

        // 游戏状态
        this.currentPlayerIndex = 0;
        this.gamePhase = 'waiting'; // waiting, dealing, playing, finished
        this.lastDiscardedCard = null;
        this.lastDiscardedPlayer = null;

        // 创建4个玩家
        this.initializePlayers();
    }

    // 初始化玩家
    initializePlayers() {
        this.players = [
            new Player(0, '玩家1', true),  // 人类玩家
            new Player(1, '电脑1', false),
            new Player(2, '电脑2', false),
            new Player(3, '电脑3', false)
        ];

        // 设置庄家（默认第一个玩家）
        this.players[0].isDealer = true;
        this.currentPlayerIndex = 0;
    }

    // 开始新游戏
    startNewGame() {
        console.log('开始新的武汉麻将游戏');

        // 重置游戏状态
        this.resetGame();

        // 洗牌
        this.deck.reset();

        // 发牌
        this.dealCards();

        // 翻牌确定癞子
        const laiziInfo = this.deck.determineLaizi();
        console.log(`癞子确定: ${laiziInfo.laiziCard.getDisplayName()}`);

        // 标记所有玩家手中的癞子
        this.markPlayersLaizi();

        // 进入游戏阶段
        this.gamePhase = 'playing';

        // 庄家先摸一张牌
        const firstCard = this.deck.dealCard();
        // 标记癞子
        if (this.deck.isLaizi(firstCard)) {
            firstCard.isLaizi = true;
        }
        this.players[this.currentPlayerIndex].drawCard(firstCard);

        console.log('游戏开始，轮到玩家出牌');
        return this.getGameState();
    }

    // 重置游戏
    resetGame() {
        this.players.forEach(player => player.reset());
        this.currentPlayerIndex = 0;
        this.gamePhase = 'waiting';
        this.lastDiscardedCard = null;
        this.lastDiscardedPlayer = null;
    }

    // 发牌
    dealCards() {
        console.log('开始发牌...');
        this.gamePhase = 'dealing';

        // 每个玩家发13张牌
        for (let i = 0; i < 13; i++) {
            for (let player of this.players) {
                const card = this.deck.dealCard();
                player.drawCard(card);
            }
        }

        console.log('发牌完成');
    }

    // 标记玩家手中的癞子
    markPlayersLaizi() {
        this.players.forEach(player => {
            player.handCards.forEach(card => {
                if (this.deck.isLaizi(card)) {
                    card.isLaizi = true;
                }
            });
        });
    }

    // 玩家出牌
    playerDiscard(playerIndex, cardIndex) {
        console.log(`=== 玩家出牌开始 ===`);
        console.log(`当前游戏状态: ${this.gamePhase}`);
        console.log(`当前玩家: ${this.currentPlayerIndex}`);
        console.log(`出牌玩家: ${playerIndex}`);

        if (this.gamePhase !== 'playing') {
            throw new Error('游戏未进行中');
        }

        if (playerIndex !== this.currentPlayerIndex) {
            throw new Error('不是当前玩家的回合');
        }

        const player = this.players[playerIndex];
        const discardedCard = player.discardCard(cardIndex);

        this.lastDiscardedCard = discardedCard;
        this.lastDiscardedPlayer = playerIndex;

        console.log(`${player.name} 打出了 ${discardedCard.getDisplayName()}`);

        // 检查其他玩家是否可以吃、碰、杠、胡
        const actions = this.checkPossibleActions(discardedCard, playerIndex);
        console.log(`检查到的可能操作数量: ${actions.length}`);

        if (actions.length === 0) {
            // 没有人要，下一个玩家摸牌
            console.log('没有人要牌，切换到下一个玩家');
            this.nextPlayerTurn();
            console.log(`=== 玩家出牌结束，当前玩家: ${this.currentPlayerIndex} ===`);
            return this.getGameState();
        } else {
            // 等待其他玩家响应
            console.log('有玩家可能要牌，等待响应');
            return {
                actions: actions,
                waitingForResponse: true
            };
        }
    }

    // 玩家摸牌
    playerDraw(playerIndex) {
        console.log(`=== ${this.players[playerIndex].name} 准备摸牌 ===`);
        console.log(`当前玩家索引: ${this.currentPlayerIndex}`);
        console.log(`摸牌玩家索引: ${playerIndex}`);

        if (playerIndex !== this.currentPlayerIndex) {
            console.error(`摸牌失败: 不是当前玩家的回合。当前:${this.currentPlayerIndex}, 请求:${playerIndex}`);
            throw new Error('不是当前玩家的回合');
        }

        if (this.deck.getRemainingCount() === 0) {
            console.log('牌堆已空，游戏结束');
            this.gamePhase = 'finished';
            return { gameOver: true, reason: '流局' };
        }

        const player = this.players[playerIndex];
        console.log(`${player.name} 摸牌前手牌数: ${player.handCards.length}`);

        const card = this.deck.dealCard();
        player.drawCard(card);

        // 标记癞子
        if (this.deck.isLaizi(card)) {
            card.isLaizi = true;
        }

        console.log(`${player.name} 摸了一张牌: ${card.getDisplayName()}`);
        console.log(`${player.name} 摸牌后手牌数: ${player.handCards.length}`);
        console.log(`=== 摸牌完成 ===`);
        return this.getGameState();
    }

    // 杠牌后从牌尾摸牌
    playerDrawFromTail(playerIndex) {
        if (this.deck.getRemainingCount() === 0) {
            this.gamePhase = 'finished';
            return { gameOver: true, reason: '流局' };
        }

        const player = this.players[playerIndex];
        const card = this.deck.drawFromTail();
        player.drawCard(card);

        // 标记癞子
        if (this.deck.isLaizi(card)) {
            card.isLaizi = true;
        }

        console.log(`${player.name} 杠牌后从牌尾摸了一张牌`);
        return this.getGameState();
    }

    // 检查可能的动作
    checkPossibleActions(discardedCard, discardingPlayerIndex) {
        const actions = [];

        for (let i = 0; i < this.players.length; i++) {
            if (i === discardingPlayerIndex) continue;

            const player = this.players[i];
            const playerActions = [];

            // 检查胡牌
            if (this.canPlayerWin(player, discardedCard)) {
                playerActions.push({ type: 'hu', priority: 4 });
            }

            // 检查杠牌
            if (player.canGang(discardedCard)) {
                // 红中杠牌特殊处理
                if (discardedCard.isHongZhong()) {
                    playerActions.push({
                        type: 'gang',
                        priority: 4, // 红中杠优先级更高
                        isHongZhong: true,
                        message: '红中杠牌，可翻倍'
                    });
                } else {
                    playerActions.push({ type: 'gang', priority: 3 });
                }
            }

            // 检查碰牌
            if (player.canPeng(discardedCard)) {
                playerActions.push({ type: 'peng', priority: 2 });
            }

            // 检查吃牌（只有下家可以吃）
            const nextPlayerIndex = (discardingPlayerIndex + 1) % 4;
            if (i === nextPlayerIndex) {
                const chiOptions = player.canChi(discardedCard, this.deck);
                if (chiOptions.length > 0) {
                    playerActions.push({ type: 'chi', priority: 1, options: chiOptions });
                }
            }

            if (playerActions.length > 0) {
                actions.push({
                    playerIndex: i,
                    actions: playerActions
                });
            }
        }

        // 按优先级排序
        actions.forEach(playerAction => {
            playerAction.actions.sort((a, b) => b.priority - a.priority);
        });

        return actions;
    }

    // 检查玩家是否可以胡牌
    canPlayerWin(player, newCard = null) {
        if (!player || !player.handCards || !Array.isArray(player.handCards)) {
            console.warn('canPlayerWin: invalid player or handCards', player);
            return false;
        }

        const testCards = [...player.handCards];
        if (newCard) {
            testCards.push(newCard);
        }

        console.log(`检查 ${player.name} 是否可以胡牌，测试牌数: ${testCards.length}`);
        return this.checkWinningHand(testCards, player);
    }

    // 检查胡牌
    checkWinningHand(cards, player) {
        if (!cards || !Array.isArray(cards)) {
            console.warn('checkWinningHand: cards is not a valid array', cards);
            return false;
        }

        if (!player) {
            console.warn('checkWinningHand: player is null or undefined', player);
            return false;
        }

        // 基本要求：14张牌（包括刚摸的/吃的牌）
        if (cards.length !== 14) {
            console.log(`胡牌检查失败：牌数不对，当前${cards.length}张，需要14张`);
            return false;
        }

        try {
            // 获取癞子使用信息
            const laiziUsage = this.laiziManager.getLaiziUsageSuggestion(player, cards);

            // 使用递归回溯算法检查胡牌
            return this.canFormWinningHand(cards, player, laiziUsage);
        } catch (error) {
            console.error('检查胡牌时出错:', error);
            return false;
        }
    }

    // 检查是否可以组成胡牌手牌
    canFormWinningHand(cards, player, laiziUsage) {
        const nonLaiziCards = this.laiziManager.getNonLaiziCards(cards);
        const availableLaizi = laiziUsage.usableLaizi;

        // 统计非癞子牌
        const cardCounts = this.countCards(nonLaiziCards);

        // 尝试组成胡牌牌型：4个面子 + 1个对子
        return this.tryFormWinningPattern(cardCounts, availableLaizi, 0, 0);
    }

    // 统计牌的数量
    countCards(cards) {
        const counts = {};
        cards.forEach(card => {
            const id = card.getId();
            counts[id] = (counts[id] || 0) + 1;
        });
        return counts;
    }

    // 尝试组成胜利牌型
    tryFormWinningPattern(cardCounts, availableLaizi, completedMelds, pairs) {
        // 胡牌条件：4个面子 + 1个对子
        if (completedMelds === 4 && pairs === 1) {
            return true;
        }

        // 如果已经有了对子，继续组成面子
        if (pairs === 1) {
            return this.tryFormMelds(cardCounts, availableLaizi, completedMelds);
        }

        // 先尝试组成对子
        for (let cardId in cardCounts) {
            if (cardCounts[cardId] >= 2) {
                // 使用现有牌组成对子
                cardCounts[cardId] -= 2;
                if (this.tryFormWinningPattern(cardCounts, availableLaizi, completedMelds, 1)) {
                    cardCounts[cardId] += 2;
                    return true;
                }
                cardCounts[cardId] += 2;
            } else if (cardCounts[cardId] === 1 && availableLaizi > 0) {
                // 使用癞子组成对子
                cardCounts[cardId] -= 1;
                if (this.tryFormWinningPattern(cardCounts, availableLaizi - 1, completedMelds, 1)) {
                    cardCounts[cardId] += 1;
                    return true;
                }
                cardCounts[cardId] += 1;
            }
        }

        // 如果没有现有牌可以组成对子，用癞子组成对子
        if (availableLaizi >= 2) {
            if (this.tryFormWinningPattern(cardCounts, availableLaizi - 2, completedMelds, 1)) {
                return true;
            }
        }

        return false;
    }

    // 尝试组成面子
    tryFormMelds(cardCounts, availableLaizi, completedMelds) {
        if (completedMelds === 4) {
            // 检查是否还有剩余牌
            const remainingCards = Object.values(cardCounts).reduce((sum, count) => sum + count, 0);
            return remainingCards === 0 && availableLaizi === 0;
        }

        // 尝试组成刻子
        for (let cardId in cardCounts) {
            if (cardCounts[cardId] >= 3) {
                // 三张相同牌组成刻子
                cardCounts[cardId] -= 3;
                if (this.tryFormMelds(cardCounts, availableLaizi, completedMelds + 1)) {
                    cardCounts[cardId] += 3;
                    return true;
                }
                cardCounts[cardId] += 3;
            } else if (cardCounts[cardId] === 2 && availableLaizi > 0) {
                // 两张牌 + 一张癞子组成刻子
                cardCounts[cardId] -= 2;
                if (this.tryFormMelds(cardCounts, availableLaizi - 1, completedMelds + 1)) {
                    cardCounts[cardId] += 2;
                    return true;
                }
                cardCounts[cardId] += 2;
            } else if (cardCounts[cardId] === 1 && availableLaizi >= 2) {
                // 一张牌 + 两张癞子组成刻子
                cardCounts[cardId] -= 1;
                if (this.tryFormMelds(cardCounts, availableLaizi - 2, completedMelds + 1)) {
                    cardCounts[cardId] += 1;
                    return true;
                }
                cardCounts[cardId] += 1;
            }
        }

        // 尝试组成顺子（仅限万条筒）
        if (this.tryFormSequences(cardCounts, availableLaizi, completedMelds)) {
            return true;
        }

        // 如果癞子足够，直接用癞子组成面子
        if (availableLaizi >= 3) {
            if (this.tryFormMelds(cardCounts, availableLaizi - 3, completedMelds + 1)) {
                return true;
            }
        }

        return false;
    }

    // 尝试组成顺子
    tryFormSequences(cardCounts, availableLaizi, completedMelds) {
        const suits = ['wan', 'tiao', 'tong'];

        for (let suit of suits) {
            for (let start = 1; start <= 7; start++) {
                const card1 = `${suit}_${start}`;
                const card2 = `${suit}_${start + 1}`;
                const card3 = `${suit}_${start + 2}`;

                const count1 = cardCounts[card1] || 0;
                const count2 = cardCounts[card2] || 0;
                const count3 = cardCounts[card3] || 0;

                const totalCards = count1 + count2 + count3;
                const neededLaizi = 3 - totalCards;

                if (neededLaizi >= 0 && neededLaizi <= availableLaizi) {
                    // 可以组成顺子
                    cardCounts[card1] = Math.max(0, count1 - 1);
                    cardCounts[card2] = Math.max(0, count2 - 1);
                    cardCounts[card3] = Math.max(0, count3 - 1);

                    if (this.tryFormMelds(cardCounts, availableLaizi - neededLaizi, completedMelds + 1)) {
                        cardCounts[card1] = count1;
                        cardCounts[card2] = count2;
                        cardCounts[card3] = count3;
                        return true;
                    }

                    cardCounts[card1] = count1;
                    cardCounts[card2] = count2;
                    cardCounts[card3] = count3;
                }
            }
        }

        return false;
    }

    // 下一个玩家的回合
    nextPlayerTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;

        console.log(`轮到玩家 ${this.currentPlayerIndex} (${this.players[this.currentPlayerIndex].name})`);

        // 如果是电脑玩家，自动执行操作
        if (!this.players[this.currentPlayerIndex].isHuman) {
            console.log('准备执行AI回合');
            this.executeAITurn();
        } else {
            console.log('等待人类玩家操作');
        }
    }

    // 执行AI回合
    executeAITurn() {
        const aiPlayer = this.players[this.currentPlayerIndex];
        const playerIndex = this.currentPlayerIndex;

        console.log(`AI玩家 ${aiPlayer.name} 开始回合`);

        // 简单的AI逻辑：摸牌然后随机打牌
        setTimeout(() => {
            try {
                console.log(`${aiPlayer.name} 开始AI回合执行`);

                // 检查当前是否还是这个AI的回合
                if (this.currentPlayerIndex !== playerIndex) {
                    console.warn(`AI回合被中断，当前玩家已变为: ${this.currentPlayerIndex}`);
                    return;
                }

                console.log(`${aiPlayer.name} 摸牌前手牌数: ${aiPlayer.handCards.length}`);

                // 摸牌
                const drawResult = this.playerDraw(playerIndex);
                if (drawResult && drawResult.gameOver) {
                    console.log('游戏结束，停止AI执行');
                    return;
                }

                console.log(`${aiPlayer.name} 摸牌后手牌数: ${aiPlayer.handCards.length}`);

                // 再次检查当前玩家（防止摸牌过程中回合发生变化）
                if (this.currentPlayerIndex !== playerIndex) {
                    console.warn(`摸牌后AI回合被中断，当前玩家: ${this.currentPlayerIndex}`);
                    return;
                }

                // 检查是否可以暗杠（暂时跳过，避免复杂性）
                // const hasAnGang = this.checkAndExecuteAnGang(playerIndex);

                // 获取当前手牌数量
                const currentHandSize = aiPlayer.handCards.length;
                console.log(`${aiPlayer.name} 准备出牌，当前手牌数: ${currentHandSize}`);

                if (currentHandSize > 0) {
                    // 随机选择一张牌打出
                    const randomIndex = Math.floor(Math.random() * currentHandSize);
                    const cardToDiscard = aiPlayer.handCards[randomIndex];
                    console.log(`${aiPlayer.name} 选择打出第${randomIndex}张牌: ${cardToDiscard.getDisplayName()}`);

                    // 再次检查当前玩家
                    if (this.currentPlayerIndex !== playerIndex) {
                        console.warn(`出牌前AI回合被中断，当前玩家: ${this.currentPlayerIndex}`);
                        return;
                    }

                    this.playerDiscard(playerIndex, randomIndex);
                    console.log(`${aiPlayer.name} 成功打出牌`);
                } else {
                    console.error(`${aiPlayer.name} 手牌为空，无法出牌`);
                    this.nextPlayerTurn();
                }
            } catch (error) {
                console.error(`AI玩家 ${aiPlayer.name} 执行回合时出错:`, error);
                console.error('错误堆栈:', error.stack);
                // 如果出错，强制进入下一个玩家回合
                try {
                    this.nextPlayerTurn();
                } catch (nextError) {
                    console.error('切换到下一个玩家也失败了:', nextError);
                }
            }
        }, 1500); // 增加延时，确保UI更新完成
    }

    // 检查并执行暗杠
    checkAndExecuteAnGang(playerIndex) {
        const player = this.players[playerIndex];

        // 检查每种牌是否可以暗杠
        const cardTypes = new Set();
        player.handCards.forEach(card => {
            const id = card.getId();
            if (!cardTypes.has(id)) {
                cardTypes.add(id);
                if (player.canAnGang(card)) {
                    // 执行暗杠
                    player.gang(card, true);
                    console.log(`${player.name} 暗杠了 ${card.getDisplayName()}`);

                    // 暗杠后从牌尾摸牌
                    this.playerDrawFromTail(playerIndex);
                    return true;
                }
            }
        });

        return false;
    }

    // 玩家暗杠
    playerAnGang(playerIndex, cardId) {
        if (playerIndex !== this.currentPlayerIndex) {
            throw new Error('不是当前玩家的回合');
        }

        const player = this.players[playerIndex];
        const targetCard = player.handCards.find(card => card.getId() === cardId);

        if (targetCard && player.canAnGang(targetCard)) {
            player.gang(targetCard, true);
            console.log(`${player.name} 暗杠了 ${targetCard.getDisplayName()}`);

            // 暗杠后从牌尾摸牌
            this.playerDrawFromTail(playerIndex);
            return this.getGameState();
        }

        throw new Error('无法执行暗杠');
    }

    // 获取游戏状态
    getGameState() {
        return {
            gamePhase: this.gamePhase,
            currentPlayer: this.currentPlayerIndex,
            laiziInfo: this.deck.getLaiziInfo(),
            players: this.players.map(player => ({
                ...player.getStatus(),
                handCards: player.isHuman ? player.handCards : [], // 只返回人类玩家的手牌
                selectedCardIndex: player.selectedCardIndex
            })),
            lastDiscarded: this.lastDiscardedCard ? {
                card: this.lastDiscardedCard,
                player: this.lastDiscardedPlayer
            } : null,
            remainingCards: this.deck.getRemainingCount()
        };
    }

    // 获取当前玩家
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // 玩家响应（吃、碰、杠、胡）
    playerResponse(playerIndex, action, params = {}) {
        const player = this.players[playerIndex];

        switch (action) {
            case 'chi':
                if (player.chi(this.lastDiscardedCard, params.card1Index, params.card2Index)) {
                    console.log(`${player.name} 吃了 ${this.lastDiscardedCard.getDisplayName()}`);
                    this.currentPlayerIndex = playerIndex;
                    return true;
                }
                break;

            case 'peng':
                if (player.peng(this.lastDiscardedCard)) {
                    console.log(`${player.name} 碰了 ${this.lastDiscardedCard.getDisplayName()}`);
                    this.currentPlayerIndex = playerIndex;
                    return true;
                }
                break;

            case 'gang':
                if (player.gang(this.lastDiscardedCard)) {
                    console.log(`${player.name} 杠了 ${this.lastDiscardedCard.getDisplayName()}`);
                    this.currentPlayerIndex = playerIndex;
                    // 杠牌后需要从牌尾摸一张牌
                    this.playerDrawFromTail(playerIndex);
                    return true;
                }
                break;

            case 'hu':
                if (this.canPlayerWin(player, this.lastDiscardedCard)) {
                    console.log(`${player.name} 胡牌了！`);
                    this.gamePhase = 'finished';
                    return { gameOver: true, winner: playerIndex };
                }
                break;

            case 'pass':
                // 玩家选择不响应，继续游戏
                this.nextPlayerTurn();
                return true;
        }

        return false;
    }
}