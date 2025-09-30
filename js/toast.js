// 简化版Toast通知系统 - 借鉴Shadcn设计
class Toast {
    constructor() {
        this.container = null;
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, options = {}) {
        const {
            type = 'info',
            duration = 3000,
            title = ''
        } = options;

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: var(--mahjong-player-bg, #2a3f2a);
            color: hsl(45, 15%, 95%);
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow-tile, 0 4px 12px rgba(0,0,0,0.3));
            border: 1px solid var(--mahjong-wood, #8B4513);
            max-width: 320px;
            min-width: 280px;
            pointer-events: auto;
            animation: slideInRight 0.3s ease-out;
            transition: all 0.3s ease;
        `;

        // 根据类型设置不同颜色
        const typeColors = {
            'success': 'hsl(120, 60%, 50%)',
            'error': 'hsl(0, 65%, 48%)',
            'warning': 'hsl(45, 100%, 55%)',
            'info': 'hsl(210, 100%, 70%)'
        };

        if (typeColors[type]) {
            toast.style.borderLeftColor = typeColors[type];
            toast.style.borderLeftWidth = '4px';
        }

        // 构建内容
        let content = '';
        if (title) {
            content += `<div style="font-weight: bold; margin-bottom: 4px; color: ${typeColors[type] || 'inherit'}">${title}</div>`;
        }
        content += `<div style="font-size: 14px; opacity: 0.9">${message}</div>`;

        toast.innerHTML = content;

        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 12px;
            background: none;
            border: none;
            color: inherit;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';
        closeBtn.onclick = () => this.remove(toast);

        toast.appendChild(closeBtn);
        this.container.appendChild(toast);

        // 自动消失
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    remove(toast) {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    success(message, title = '成功') {
        return this.show(message, { type: 'success', title });
    }

    error(message, title = '错误') {
        return this.show(message, { type: 'error', title });
    }

    warning(message, title = '警告') {
        return this.show(message, { type: 'warning', title });
    }

    info(message, title = '') {
        return this.show(message, { type: 'info', title });
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 创建全局实例
window.toast = new Toast();