// 牌堆管理类
class Deck {
    constructor() {
        this.cards = [];
        this.laiziCard = null; // 癞子牌型
        this.flippedCard = null; // 翻开的牌
        this.reset();
    }

    // 重置牌堆
    reset() {
        this.cards = Card.createFullDeck();
        this.laiziCard = null;
        this.flippedCard = null;
        this.shuffle();
    }

    // 洗牌
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    // 发牌（从牌堆顶部摸牌）
    dealCard() {
        if (this.cards.length === 0) {
            throw new Error('牌堆已空');
        }
        return this.cards.pop();
    }

    // 从牌尾摸牌（用于杠牌后补牌）
    drawFromTail() {
        if (this.cards.length === 0) {
            throw new Error('牌堆已空');
        }
        return this.cards.shift(); // 从数组开头取牌（牌尾）
    }

    // 翻牌确定癞子（在所有玩家拿完牌后调用）
    determineLaizi() {
        if (this.cards.length === 0) {
            throw new Error('无牌可翻，无法确定癞子');
        }

        // 翻开牌堆的第一张牌
        this.flippedCard = this.dealCard();

        // 确定癞子
        this.laiziCard = this.flippedCard.getNextCard();

        // 标记所有同类型的牌为癞子
        this.markLaiziCards();

        console.log(`翻开的牌: ${this.flippedCard.getDisplayName()}`);
        console.log(`癞子: ${this.laiziCard.getDisplayName()}`);

        return {
            flippedCard: this.flippedCard,
            laiziCard: this.laiziCard
        };
    }

    // 标记癞子牌
    markLaiziCards() {
        // 遍历所有牌，标记癞子
        this.cards.forEach(card => {
            if (card.equals(this.laiziCard)) {
                card.isLaizi = true;
            }
        });
    }

    // 检查一张牌是否是癞子
    isLaizi(card) {
        if (!this.laiziCard) return false;
        return card.equals(this.laiziCard);
    }

    // 检查是否是红中杠牌（红中既是杠牌也可能是癞子）
    isHongZhongGang(card) {
        return card.isHongZhong();
    }

    // 检查红中是否既是杠牌也是癞子
    isHongZhongLaizi() {
        if (!this.laiziCard) return false;
        return this.laiziCard.isHongZhong();
    }

    // 获取剩余牌数
    getRemainingCount() {
        return this.cards.length;
    }

    // 获取癞子信息
    getLaiziInfo() {
        return {
            flippedCard: this.flippedCard,
            laiziCard: this.laiziCard,
            isHongZhongLaizi: this.isHongZhongLaizi()
        };
    }
}