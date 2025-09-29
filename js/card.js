// 武汉麻将牌型定义
class Card {
    constructor(suit, value) {
        this.suit = suit; // 'wan'(万), 'tiao'(条), 'tong'(筒), 'zi'(字牌)
        this.value = value; // 1-9 for 万条筒, 'dong'等 for 字牌
        this.isLaizi = false; // 是否是癞子
    }

    // 获取牌的显示名称
    getDisplayName() {
        if (this.suit === 'zi') {
            const ziMap = {
                'dong': '东',
                'nan': '南',
                'xi': '西',
                'bei': '北',
                'zhong': '中',
                'fa': '发',
                'bai': '白'
            };
            return ziMap[this.value];
        } else {
            const suitMap = {
                'wan': '万',
                'tiao': '条',
                'tong': '筒'
            };
            return this.value + suitMap[this.suit];
        }
    }

    // 获取牌的唯一标识
    getId() {
        return `${this.suit}_${this.value}`;
    }

    // 判断是否是红中
    isHongZhong() {
        return this.suit === 'zi' && this.value === 'zhong';
    }

    // 判断两张牌是否相同
    equals(other) {
        return this.suit === other.suit && this.value === other.value;
    }

    // 复制牌
    clone() {
        const newCard = new Card(this.suit, this.value);
        newCard.isLaizi = this.isLaizi;
        return newCard;
    }

    // 获取下一张牌（用于确定癞子）
    getNextCard() {
        if (this.suit === 'zi') {
            // 字牌按东南西北中发白顺序
            const ziOrder = ['dong', 'nan', 'xi', 'bei', 'zhong', 'fa', 'bai'];
            const currentIndex = ziOrder.indexOf(this.value);
            const nextIndex = (currentIndex + 1) % ziOrder.length;
            return new Card('zi', ziOrder[nextIndex]);
        } else {
            // 万条筒按1-9循环
            const nextValue = this.value === 9 ? 1 : this.value + 1;
            return new Card(this.suit, nextValue);
        }
    }

    // 静态方法：创建一副完整的武汉麻将牌
    static createFullDeck() {
        const cards = [];

        // 万条筒各1-9，每张4个
        const suits = ['wan', 'tiao', 'tong'];
        for (let suit of suits) {
            for (let value = 1; value <= 9; value++) {
                for (let i = 0; i < 4; i++) {
                    cards.push(new Card(suit, value));
                }
            }
        }

        // 字牌：东南西北中发白，每张4个
        const ziCards = ['dong', 'nan', 'xi', 'bei', 'zhong', 'fa', 'bai'];
        for (let zi of ziCards) {
            for (let i = 0; i < 4; i++) {
                cards.push(new Card('zi', zi));
            }
        }

        return cards;
    }
}