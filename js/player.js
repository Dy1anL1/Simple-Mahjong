// 玩家类
class Player {
    constructor(id, name, isHuman = false) {
        this.id = id;
        this.name = name;
        this.isHuman = isHuman;

        // 手牌
        this.handCards = [];
        this.meldedCards = []; // 已经吃、碰、杠的牌组
        this.discardedCards = []; // 打出的牌

        // 状态
        this.hasChiOrPengStatus = false; // 是否吃过或碰过牌
        this.isDealer = false; // 是否是庄家
        this.canWin = false; // 是否可以胡牌

        // 选中的牌（用于UI）
        this.selectedCardIndex = -1;
    }

    // 重置玩家状态
    reset() {
        this.handCards = [];
        this.meldedCards = [];
        this.discardedCards = [];
        this.hasChiOrPengStatus = false;
        this.canWin = false;
        this.selectedCardIndex = -1;
    }

    // 发牌给玩家
    dealCards(cards) {
        this.handCards = this.handCards.concat(cards);
        this.sortHand();
    }

    // 摸牌
    drawCard(card) {
        this.handCards.push(card);
        this.sortHand();
    }

    // 出牌
    discardCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.handCards.length) {
            throw new Error('无效的牌索引');
        }

        const discardedCard = this.handCards.splice(cardIndex, 1)[0];
        this.discardedCards.push(discardedCard);
        this.selectedCardIndex = -1;
        return discardedCard;
    }

    // 吃牌
    chi(targetCard, card1Index, card2Index) {
        if (this.handCards.length < 2) return false;

        const card1 = this.handCards[card1Index];
        const card2 = this.handCards[card2Index];

        // 检查是否可以组成顺子
        if (this.canFormSequence([targetCard, card1, card2])) {
            // 移除手牌
            const cardsToRemove = [card1Index, card2Index].sort((a, b) => b - a);
            cardsToRemove.forEach(index => this.handCards.splice(index, 1));

            // 添加到已吃碰牌组
            this.meldedCards.push({
                type: 'chi',
                cards: [targetCard, card1, card2].sort(this.compareCards)
            });

            this.hasChiOrPengStatus = true;
            this.sortHand();
            return true;
        }

        return false;
    }

    // 碰牌
    peng(targetCard) {
        // 查找手中相同的牌
        const sameCards = [];
        for (let i = 0; i < this.handCards.length; i++) {
            if (this.handCards[i].equals(targetCard)) {
                sameCards.push(i);
            }
        }

        if (sameCards.length >= 2) {
            // 移除手牌（从后往前删除，避免索引问题）
            sameCards.slice(0, 2).reverse().forEach(index => {
                this.handCards.splice(index, 1);
            });

            // 添加到已吃碰牌组
            this.meldedCards.push({
                type: 'peng',
                cards: [targetCard, targetCard.clone(), targetCard.clone()]
            });

            this.hasChiOrPengStatus = true;
            this.sortHand();
            return true;
        }

        return false;
    }

    // 杠牌
    gang(targetCard, isAnGang = false) {
        let sameCards = [];

        // 查找手中相同的牌
        for (let i = 0; i < this.handCards.length; i++) {
            if (this.handCards[i].equals(targetCard)) {
                sameCards.push(i);
            }
        }

        let requiredCount = isAnGang ? 4 : 3; // 暗杠需要4张，明杠需要3张

        if (sameCards.length >= requiredCount) {
            // 移除手牌
            sameCards.slice(0, requiredCount).reverse().forEach(index => {
                this.handCards.splice(index, 1);
            });

            // 添加到已吃碰牌组
            this.meldedCards.push({
                type: isAnGang ? 'angang' : 'gang',
                cards: new Array(4).fill(null).map(() => targetCard.clone())
            });

            if (!isAnGang) {
                this.hasChiOrPengStatus = true;
            }

            this.sortHand();
            return true;
        }

        return false;
    }

    // 检查是否吃过或碰过牌
    hasChiOrPeng() {
        return this.hasChiOrPengStatus;
    }

    // 检查是否可以组成顺子
    canFormSequence(cards) {
        if (cards.length !== 3) return false;
        if (cards[0].suit === 'zi') return false; // 字牌不能组顺子

        const sortedCards = cards.slice().sort(this.compareCards);
        const suit = sortedCards[0].suit;

        // 检查花色是否相同
        if (!sortedCards.every(card => card.suit === suit)) return false;

        // 检查是否连续
        return sortedCards[1].value === sortedCards[0].value + 1 &&
               sortedCards[2].value === sortedCards[1].value + 1;
    }

    // 排序手牌
    sortHand() {
        this.handCards.sort(this.compareCards);
    }

    // 牌的比较函数
    compareCards(a, b) {
        // 先按花色排序
        const suitOrder = { 'wan': 1, 'tiao': 2, 'tong': 3, 'zi': 4 };
        if (suitOrder[a.suit] !== suitOrder[b.suit]) {
            return suitOrder[a.suit] - suitOrder[b.suit];
        }

        // 字牌特殊排序
        if (a.suit === 'zi') {
            const ziOrder = { 'dong': 1, 'nan': 2, 'xi': 3, 'bei': 4, 'zhong': 5, 'fa': 6, 'bai': 7 };
            return ziOrder[a.value] - ziOrder[b.value];
        }

        // 数字牌按数值排序
        return a.value - b.value;
    }

    // 获取手牌数量
    getHandSize() {
        return this.handCards.length;
    }

    // 获取所有可以打出的牌
    getPlayableCards() {
        return this.handCards.map((card, index) => ({ card, index }));
    }

    // 选择/取消选择牌
    selectCard(index) {
        if (this.selectedCardIndex === index) {
            this.selectedCardIndex = -1; // 取消选择
        } else {
            this.selectedCardIndex = index; // 选择
        }
    }

    // 获取玩家状态信息
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            handSize: this.handCards.length,
            meldedCount: this.meldedCards.length,
            discardedCount: this.discardedCards.length,
            hasChiOrPeng: this.hasChiOrPengStatus,
            isDealer: this.isDealer,
            canWin: this.canWin
        };
    }

    // 检查是否可以吃牌
    canChi(targetCard, deck) {
        if (targetCard.suit === 'zi') return false; // 字牌不能吃

        const possibleChis = [];
        const suit = targetCard.suit;
        const value = targetCard.value;

        // 检查三种可能的顺子组合
        const combinations = [
            [value - 2, value - 1], // 目标牌做最大
            [value - 1, value + 1], // 目标牌做中间
            [value + 1, value + 2]  // 目标牌做最小
        ];

        for (let [val1, val2] of combinations) {
            if (val1 >= 1 && val2 <= 9) {
                const card1 = this.handCards.find(card => card.suit === suit && card.value === val1);
                const card2 = this.handCards.find(card => card.suit === suit && card.value === val2);

                if (card1 && card2) {
                    possibleChis.push({
                        cards: [card1, card2],
                        indices: [
                            this.handCards.indexOf(card1),
                            this.handCards.indexOf(card2)
                        ]
                    });
                }
            }
        }

        return possibleChis;
    }

    // 检查是否可以碰牌
    canPeng(targetCard) {
        const sameCards = this.handCards.filter(card => card.equals(targetCard));
        return sameCards.length >= 2;
    }

    // 检查是否可以杠牌
    canGang(targetCard) {
        const sameCards = this.handCards.filter(card => card.equals(targetCard));

        // 红中杠牌特殊处理：红中可以直接杠（只需要3张）
        if (targetCard.isHongZhong()) {
            return sameCards.length >= 3;
        }

        return sameCards.length >= 3;
    }

    // 检查是否可以暗杠
    canAnGang(targetCard) {
        const sameCards = this.handCards.filter(card => card.equals(targetCard));

        // 红中暗杠特殊处理
        if (targetCard.isHongZhong()) {
            return sameCards.length >= 4;
        }

        return sameCards.length >= 4;
    }

    // 检查红中杠牌的特殊情况
    checkHongZhongGangOptions() {
        const hongZhongCards = this.handCards.filter(card => card.isHongZhong());

        if (hongZhongCards.length === 0) {
            return null;
        }

        return {
            count: hongZhongCards.length,
            canGang: hongZhongCards.length >= 4, // 红中杠需要4张
            canMingGang: hongZhongCards.length >= 3, // 明杠需要3张
            isSpecial: true,
            message: '红中为杠牌，可翻倍'
        };
    }
}