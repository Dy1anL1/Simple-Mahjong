// 现代化的麻将牌渲染器 - 借鉴Lovable设计
class TileRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    drawTile(card, options) {
        const {
            x, y, width, height,
            isSelected = false,
            isLaizi = false,
            isRecent = false,
            isBack = false
        } = options;

        this.ctx.save();

        // 绘制阴影
        if (!isBack) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
        }

        // 绘制牌背景
        if (isBack) {
            this.drawCardBack(x, y, width, height);
        } else {
            this.drawCardFront(card, x, y, width, height, isSelected, isLaizi, isRecent);
        }

        this.ctx.restore();
    }

    drawCardFront(card, x, y, width, height, isSelected, isLaizi, isRecent) {
        // 背景渐变
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f0f0f0');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);

        // 边框
        this.ctx.strokeStyle = isSelected ? '#60A5FA' :
                             isLaizi ? '#DC2626' :
                             isRecent ? '#F59E0B' : '#1F2937';
        this.ctx.lineWidth = isSelected ? 3 : isLaizi ? 2 : 1;
        this.ctx.strokeRect(x, y, width, height);

        // 牌面内容
        this.drawCardContent(card, x, y, width, height, isLaizi);

        // 选中高亮
        if (isSelected) {
            this.ctx.fillStyle = 'rgba(96, 165, 250, 0.2)';
            this.ctx.fillRect(x, y, width, height);
        }

        // 最新打出标识
        if (isRecent) {
            this.ctx.fillStyle = '#F59E0B';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.fillText('NEW', x + 2, y + 10);
        }

        // 癞子框
        if (isLaizi) {
            this.ctx.strokeStyle = '#DC2626';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
        }
    }

    drawCardContent(card, x, y, width, height, isLaizi) {
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // 设置颜色
        this.ctx.fillStyle = isLaizi ? '#DC2626' : '#1F2937';

        if (card.suit === 'zi') {
            // 字牌
            this.ctx.font = `bold ${Math.min(width * 0.5, height * 0.4)}px "Microsoft YaHei", Arial`;
            this.ctx.fillText(card.getDisplayName(), centerX, centerY);
        } else {
            // 数字牌 - 数字
            this.ctx.font = `bold ${Math.min(width * 0.4, height * 0.3)}px Arial`;
            this.ctx.fillText(card.value.toString(), centerX, centerY - height * 0.15);

            // 数字牌 - 花色符号
            this.ctx.font = `${Math.min(width * 0.3, height * 0.25)}px "Microsoft YaHei", Arial`;
            this.ctx.fillText(this.getSuitSymbol(card.suit), centerX, centerY + height * 0.15);
        }
    }

    drawCardBack(x, y, width, height) {
        // 渐变背景
        const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, '#2D5A3D');
        gradient.addColorStop(1, '#1F4429');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);

        // 边框
        this.ctx.strokeStyle = '#0F2915';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // 装饰图案
        this.ctx.fillStyle = '#059669';
        this.ctx.fillRect(x + 3, y + 3, width - 6, height - 6);

        // 格子图案
        this.ctx.strokeStyle = '#047857';
        this.ctx.lineWidth = 0.5;
        const rows = 4;
        const cols = 3;
        const patternWidth = (width - 6) / cols;
        const patternHeight = (height - 6) / rows;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const patternX = x + 3 + i * patternWidth;
                const patternY = y + 3 + j * patternHeight;
                this.ctx.strokeRect(patternX, patternY, patternWidth, patternHeight);
            }
        }

        // 中央"麻"字
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.min(width * 0.3, height * 0.25)}px "Microsoft YaHei", Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('麻', x + width / 2, y + height / 2);
    }

    getSuitSymbol(suit) {
        const symbols = {
            'wan': '万',
            'tiao': '条',
            'tong': '筒'
        };
        return symbols[suit] || '';
    }

    // 绘制旋转的牌（用于不同玩家位置）
    drawRotatedTile(card, options, rotation) {
        const { x, y, width, height } = options;

        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.rotate(rotation);

        this.drawTile(card, {
            ...options,
            x: -width / 2,
            y: -height / 2
        });

        this.ctx.restore();
    }
}