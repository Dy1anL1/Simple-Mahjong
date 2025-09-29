// 癞子管理类 - 处理癞子的复杂使用规则
class LaiziManager {
    constructor(deck) {
        this.deck = deck;
    }

    // 检查玩家是否可以使用多张癞子
    canUseMultipleLaizi(player) {
        // 如果玩家没有吃过或碰过牌，可以使用任意数量的癞子
        return !player.hasChiOrPeng();
    }

    // 计算玩家可用的癞子数量
    getUsableLaiziCount(player, handCards) {
        if (!handCards || !Array.isArray(handCards)) {
            console.warn('getUsableLaiziCount: handCards is not a valid array', handCards);
            return 0;
        }

        const laiziCards = handCards.filter(card => this.deck.isLaizi(card));

        if (this.canUseMultipleLaizi(player)) {
            // 未吃碰过，所有癞子都可以使用
            return laiziCards.length;
        } else {
            // 已吃碰过，最多只能用一张癞子
            return Math.min(1, laiziCards.length);
        }
    }

    // 获取玩家手中的癞子牌
    getLaiziCards(handCards) {
        if (!handCards || !Array.isArray(handCards)) {
            console.warn('getLaiziCards: handCards is not a valid array', handCards);
            return [];
        }
        return handCards.filter(card => this.deck.isLaizi(card));
    }

    // 获取玩家手中的非癞子牌
    getNonLaiziCards(handCards) {
        if (!handCards || !Array.isArray(handCards)) {
            console.warn('getNonLaiziCards: handCards is not a valid array', handCards);
            return [];
        }
        return handCards.filter(card => !this.deck.isLaizi(card));
    }

    // 检查多余的癞子是否需要杠出来
    getExcessLaizi(player, handCards) {
        const laiziCards = this.getLaiziCards(handCards);
        const usableCount = this.getUsableLaiziCount(player, handCards);

        if (laiziCards.length <= usableCount) {
            return []; // 没有多余的癞子
        }

        // 计算多余的癞子
        const excessLaizi = [];
        const laiziAsNormal = []; // 当作普通牌使用的癞子

        // 检查癞子是否可以作为普通牌使用
        for (let i = usableCount; i < laiziCards.length; i++) {
            const laiziCard = laiziCards[i];

            // 检查这张癞子牌作为普通牌是否有用
            if (this.canLaiziBeUsedAsNormal(laiziCard, handCards, player)) {
                laiziAsNormal.push(laiziCard);
            } else {
                excessLaizi.push(laiziCard);
            }
        }

        return {
            excessLaizi: excessLaizi,      // 必须杠出来的癞子
            laiziAsNormal: laiziAsNormal   // 可以作为普通牌的癞子
        };
    }

    // 检查癞子是否可以作为普通牌使用
    canLaiziBeUsedAsNormal(laiziCard, handCards, player) {
        // 统计同样牌型的数量（包括癞子本身）
        const sameCards = handCards.filter(card =>
            card.equals(laiziCard) || this.deck.isLaizi(card)
        );

        // 如果有足够的同样牌型可以组成顺子或刻子，则可以作为普通牌
        return this.canFormMeldWithCard(laiziCard, handCards, player);
    }

    // 检查是否可以用指定牌型组成牌组
    canFormMeldWithCard(targetCard, handCards, player) {
        // 简化逻辑：检查是否有足够的相同牌或相邻牌
        const sameTypeCards = handCards.filter(card =>
            card.equals(targetCard) || this.deck.isLaizi(card)
        );

        // 如果有3张或以上相同的，可以组成刻子
        if (sameTypeCards.length >= 3) {
            return true;
        }

        // 检查是否可以组成顺子（仅限万条筒）
        if (targetCard.suit !== 'zi') {
            return this.canFormSequence(targetCard, handCards);
        }

        return false;
    }

    // 检查是否可以组成顺子
    canFormSequence(card, handCards) {
        if (card.suit === 'zi') return false;

        const suit = card.suit;
        const value = card.value;

        // 检查前后两张牌
        for (let offset = -2; offset <= 0; offset++) {
            const val1 = value + offset;
            const val2 = value + offset + 1;
            const val3 = value + offset + 2;

            if (val1 >= 1 && val3 <= 9) {
                const count1 = this.countCardInHand(suit, val1, handCards);
                const count2 = this.countCardInHand(suit, val2, handCards);
                const count3 = this.countCardInHand(suit, val3, handCards);

                if (count1 > 0 && count2 > 0 && count3 > 0) {
                    return true;
                }
            }
        }

        return false;
    }

    // 统计手牌中指定牌的数量
    countCardInHand(suit, value, handCards) {
        return handCards.filter(card => {
            return card.suit === suit && card.value === value;
        }).length;
    }

    // 处理红中既是杠牌也是癞子的特殊情况
    handleHongZhongSpecialCase(player, handCards) {
        const hongZhongCards = handCards.filter(card => card.isHongZhong());
        const isHongZhongLaizi = this.deck.isHongZhongLaizi();

        if (hongZhongCards.length === 0) {
            return null;
        }

        let specialCase = {
            isSpecial: true,
            hongZhongCount: hongZhongCards.length,
            canGang: false,
            canUseLaizi: false,
            mustGang: false,
            recommendations: []
        };

        // 红中是癞子的情况
        if (isHongZhongLaizi) {
            specialCase.canUseLaizi = true;
            specialCase.message = '红中既是杠牌也是癞子';

            // 如果玩家已经吃碰过，红中的使用受到限制
            if (player.hasChiOrPeng()) {
                if (hongZhongCards.length > 1) {
                    // 多余的红中必须杠出来
                    specialCase.mustGang = true;
                    specialCase.excessCount = hongZhongCards.length - 1;
                    specialCase.recommendations.push(`有${specialCase.excessCount}张多余红中，建议杠出来翻倍`);
                }

                if (hongZhongCards.length >= 4) {
                    specialCase.canGang = true;
                    specialCase.recommendations.push('可以杠红中翻倍');
                }
            } else {
                // 未吃碰过，可以自由使用红中作为癞子
                specialCase.recommendations.push('可以使用所有红中作为癞子');

                if (hongZhongCards.length >= 4) {
                    specialCase.canGang = true;
                    specialCase.recommendations.push('也可以选择杠红中翻倍');
                }
            }
        } else {
            // 红中不是癞子，但仍然是杠牌
            specialCase.message = '红中为杠牌';
            if (hongZhongCards.length >= 4) {
                specialCase.canGang = true;
                specialCase.recommendations.push('建议杠红中翻倍');
            }
        }

        return specialCase;
    }

    // 获取癞子使用建议
    getLaiziUsageSuggestion(player, handCards) {
        const laiziCards = this.getLaiziCards(handCards);
        const usableCount = this.getUsableLaiziCount(player, handCards);
        const excess = this.getExcessLaizi(player, handCards);
        const hongZhongSpecial = this.handleHongZhongSpecialCase(player, handCards);

        return {
            totalLaizi: laiziCards.length,
            usableLaizi: usableCount,
            excessLaizi: excess.excessLaizi.length,
            laiziAsNormal: excess.laiziAsNormal.length,
            hongZhongSpecial: hongZhongSpecial,
            canUseMultiple: this.canUseMultipleLaizi(player),
            suggestions: this.generateSuggestions(player, handCards, laiziCards, excess)
        };
    }

    // 生成使用建议
    generateSuggestions(player, handCards, laiziCards, excess) {
        const suggestions = [];

        if (laiziCards.length === 0) {
            suggestions.push('没有癞子');
            return suggestions;
        }

        if (this.canUseMultipleLaizi(player)) {
            suggestions.push(`可以使用所有${laiziCards.length}张癞子`);
        } else {
            suggestions.push('最多只能使用1张癞子（已吃碰过）');
        }

        if (excess.excessLaizi.length > 0) {
            suggestions.push(`有${excess.excessLaizi.length}张多余癞子需要杠出来翻倍`);
        }

        if (excess.laiziAsNormal.length > 0) {
            suggestions.push(`有${excess.laiziAsNormal.length}张癞子可以作为普通牌使用`);
        }

        return suggestions;
    }
}