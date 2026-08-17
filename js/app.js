// ==================== App Logic ====================

let currentResult = null;
let currentArea = 'general';

// ==================== 可分享链接（URL Hash） ====================

function encodeResult(result, area) {
    if (!result) return '';
    const linesStr = result.lines.join('');
    const changingStr = result.changing.length ? result.changing.map(i => i + 1).join('') : '0';
    return `m=${result.method}&l=${linesStr}&c=${changingStr}&a=${area || 'general'}`;
}

function decodeResult(hash) {
    if (!hash || hash.length < 2) return null;
    hash = hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const method = params.get('m') || 'coins';
    const linesStr = params.get('l') || '';
    const changingStr = params.get('c') || '0';
    const area = params.get('a') || 'general';

    if (!/^[01]{6}$/.test(linesStr)) return null;
    const lines = linesStr.split('').map(Number);

    let changing = [];
    if (changingStr !== '0') {
        changing = changingStr.split('').map(s => parseInt(s) - 1).filter(i => i >= 0 && i <= 5);
    }

    return { method, lines, changing, area };
}

function updateUrlHash() {
    if (!currentResult) return;
    const hash = encodeResult(currentResult, currentArea);
    if (hash) {
        history.replaceState(null, '', '#' + hash);
    }
}

function tryLoadFromHash() {
    const hash = window.location.hash;
    const data = decodeResult(hash);
    if (!data) return false;

    currentArea = data.area;
    setArea(data.area);
    currentResult = buildResult(data.lines, data.changing, data.method, new Date());
    renderResult();
    showPage('result');
    return true;
}

function getShareUrl() {
    const base = 'https://zhouyi-yi.surge.sh/';
    if (!currentResult) return base;
    return base + '#' + encodeResult(currentResult, currentArea);
}

function copyShareLink() {
    const url = getShareUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            alert('分享链接已复制，可直接发给朋友');
        }).catch(err => {
            console.error('复制失败:', err);
            fallbackCopyText(url);
        });
    } else {
        fallbackCopyText(url);
    }
}

function setArea(area) {
    currentArea = area;
    const chips = document.querySelectorAll('.area-chip');
    chips.forEach(chip => {
        if (chip.dataset.area === area) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
}

function showPage(pageId) {
    const pages = ['home', 'coins', 'numbers', 'result'];
    for (const p of pages) {
        const el = document.getElementById('page-' + p);
        if (p === pageId) {
            el.classList.remove('hidden');
            el.classList.add('fade-in');
        } else {
            el.classList.add('hidden');
            el.classList.remove('fade-in');
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 铜钱法起卦
function doCoinCast() {
    const inputs = [];
    for (let i = 0; i < 6; i++) {
        const val = document.getElementById('coin-' + i).value.trim();
        const num = parseInt(val);
        if (isNaN(num) || num < 6 || num > 9) {
            alert('请输入有效的摇卦结果（第 ' + (i + 1) + ' 次），范围 6-9');
            document.getElementById('coin-' + i).focus();
            return;
        }
        inputs.push(num);
    }
    showCastLoader('正在根据铜钱结果排盘…');
    setTimeout(() => {
        currentResult = castByCoins(inputs, new Date());
        renderResult();
        hideCastLoader();
        showPage('result');
    }, 400);
}

// 数字法起卦
function doNumberCast() {
    const upper = parseInt(document.getElementById('num-upper').value);
    const lower = parseInt(document.getElementById('num-lower').value);
    const dong = parseInt(document.getElementById('num-dong').value);

    if (isNaN(upper) || upper < 1) {
        alert('请输入有效的上卦数（≥1）');
        document.getElementById('num-upper').focus();
        return;
    }
    if (isNaN(lower) || lower < 1) {
        alert('请输入有效的下卦数（≥1）');
        document.getElementById('num-lower').focus();
        return;
    }
    if (isNaN(dong) || dong < 1) {
        alert('请输入有效的动爻数（≥1）');
        document.getElementById('num-dong').focus();
        return;
    }

    showCastLoader('正在根据数字起卦…');
    setTimeout(() => {
        currentResult = castByNumbers([upper, lower, dong], new Date());
        renderResult();
        hideCastLoader();
        showPage('result');
    }, 400);
}

// 时间法起卦
function doTimeCast() {
    const now = new Date();
    showCastLoader('正在根据当前时间起卦…');
    setTimeout(() => {
        currentResult = castByTime(now);
        renderResult();
        hideCastLoader();
        showPage('result');
    }, 500);
}

// 渲染结果
function renderResult() {
    if (!currentResult) return;
    const r = currentResult;

    // 本卦
    const hex = r.hexagram;
    const upperSymbol = TRIGRAMS[TRIGRAM_NAMES[hex.upper]][0];
    const lowerSymbol = TRIGRAMS[TRIGRAM_NAMES[hex.lower]][0];
    document.getElementById('result-symbol').textContent = upperSymbol + lowerSymbol;
    document.getElementById('result-name').textContent = hex.name;
    document.getElementById('result-sub').textContent = hex.upper + '上' + hex.lower + '下 · ' + hex.name + '为' + hex.lower;
    document.getElementById('result-text').textContent = hex.text;
    document.getElementById('result-image').textContent = hex.image;

    // 白话解卦 + 开运彩蛋
    renderInterpretation(r);

    // 六爻图 + 纳甲 + 六神 + 世应
    renderYaoLines(r);

    // 动爻信息
    const changingCard = document.getElementById('changing-card');
    if (r.changing.length > 0) {
        changingCard.style.display = 'block';
        const yaoNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
        const changingTexts = r.changing.map(i => {
            const isYang = r.lines[i] === 1;
            return yaoNames[i] + '（' + (isYang ? '老阳 ○ 变阴' : '老阴 × 变阳') + '）';
        });
        document.getElementById('changing-info').innerHTML =
            '<p style="font-size:1rem;color:var(--text-primary);font-weight:500;">' +
            changingTexts.join('、') + '</p>';
    } else {
        changingCard.style.display = 'none';
    }

    // 之卦
    const ch = r.changedHexagram;
    document.getElementById('changed-name').textContent = ch.name;
    document.getElementById('changed-text').textContent = ch.text;
    document.getElementById('changed-image').textContent = ch.image;
    document.getElementById('changed-mini').innerHTML = renderMiniHexagram(r.changedHexagram);

    // 互卦
    const hu = r.huHexagram;
    document.getElementById('hu-name').textContent = hu.name;
    document.getElementById('hu-text').textContent = hu.text;
    document.getElementById('hu-image').textContent = hu.image;
    document.getElementById('hu-mini').innerHTML = renderMiniHexagram(r.huHexagram);

    // 起卦信息
    const methodLabels = { coins: '铜钱法', numbers: '数字法', time: '时间法（梅花易数）' };
    document.getElementById('method-label').textContent = methodLabels[r.method] || r.method;
    document.getElementById('cast-time').textContent = new Date().toLocaleString('zh-CN');
    document.getElementById('day-ganzhi').textContent = r.dayGanzhi || '-';

    // 更新可分享链接
    updateUrlHash();
}

// 渲染白话解卦与开运彩蛋
function renderInterpretation(result) {
    const hexName = result.hexagram.name;
    const guide = getHexagramGuide(hexName);

    // 白话解卦
    const toneTag = document.getElementById('tone-tag');
    toneTag.textContent = guide.tone;
    toneTag.style.backgroundColor = getToneColor(guide.tone);
    toneTag.style.color = getToneTextColor(guide.tone);
    document.getElementById('interpretation-summary').textContent = guide.summary;
    document.getElementById('core-advice').textContent = guide.coreAdvice;

    const keywordContainer = document.getElementById('keyword-tags');
    keywordContainer.innerHTML = guide.keywords
        .map(kw => `<span class="keyword-tag">${kw}</span>`)
        .join('');

    // 所问之事
    const area = currentArea || 'general';
    document.getElementById('area-label').textContent = AREA_LABELS[area] || '综合';
    document.getElementById('area-advice-text').textContent = getAreaAdvice(guide, area);

    // 今日开运
    const lucky = getLuckyTips(guide);
    document.getElementById('lucky-color').textContent = lucky.color;
    document.getElementById('lucky-number').textContent = lucky.number;
    document.getElementById('lucky-direction').textContent = lucky.direction;
    document.getElementById('lucky-do').textContent = lucky.do;
    document.getElementById('lucky-dont').textContent = lucky.dont;
    document.getElementById('lucky-motto').textContent = getMotto(guide);

    // 预渲染分享卡片
    renderShareCard(result, guide, lucky);
}

// 渲染分享卡片内容
function renderShareCard(result, guide, lucky) {
    if (!result) return;
    const hex = result.hexagram;
    const upperSymbol = TRIGRAMS[TRIGRAM_NAMES[hex.upper]][0];
    const lowerSymbol = TRIGRAMS[TRIGRAM_NAMES[hex.lower]][0];

    document.getElementById('share-symbol').textContent = upperSymbol + lowerSymbol;
    document.getElementById('share-name').textContent = hex.name;
    document.getElementById('share-sub').textContent = hex.upper + '上' + hex.lower + '下 · ' + hex.name + '为' + hex.lower;
    document.getElementById('share-summary').textContent = guide.summary;

    const keywordContainer = document.getElementById('share-keywords');
    keywordContainer.innerHTML = guide.keywords
        .map(kw => `<span class="share-keyword">${kw}</span>`)
        .join('');

    document.getElementById('share-color').textContent = lucky.color;
    document.getElementById('share-number').textContent = lucky.number;
    document.getElementById('share-direction').textContent = lucky.direction;
    document.getElementById('share-do').textContent = lucky.do;
    document.getElementById('share-dont').textContent = lucky.dont;

    // 生成二维码（先清空再生成）
    const qrContainer = document.getElementById('share-qrcode');
    qrContainer.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: getShareUrl(),
            width: 112,
            height: 112,
            colorDark: '#0071e3',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    }
}

// 切换分享卡片尺寸
function setShareSize(size) {
    const card = document.getElementById('share-card');
    if (card) card.dataset.size = size;

    const chips = document.querySelectorAll('.size-chip');
    chips.forEach(chip => {
        if (chip.dataset.size === size) chip.classList.add('active');
        else chip.classList.remove('active');
    });
}

// 打开分享弹窗
function openShareModal() {
    if (!currentResult) {
        alert('请先起卦后再分享');
        return;
    }
    const modal = document.getElementById('share-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 关闭分享弹窗
function closeShareModal() {
    const modal = document.getElementById('share-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function closeShareModalOnBackdrop(event) {
    if (event.target.id === 'share-modal') {
        closeShareModal();
    }
}

// 生成分享图片并下载
function generateShareImage() {
    const card = document.getElementById('share-card');
    if (!card) return;

    const btn = event.target.closest('button');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '生成中...';
    }

    // 临时显示卡片以确保 html2canvas 能正确渲染
    const wasHidden = card.classList.contains('share-card-hidden');
    card.classList.remove('share-card-hidden');

    html2canvas(card, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: card.offsetWidth,
        height: card.offsetHeight
    }).then(canvas => {
        // 恢复隐藏状态
        if (wasHidden) {
            card.classList.add('share-card-hidden');
        }

        const link = document.createElement('a');
        const hexName = currentResult ? currentResult.hexagram.name : '卦象';
        const sizeSuffix = document.getElementById('share-card')?.dataset.size || 'xiaohongshu';
        const sizeLabel = { xiaohongshu: '小红书', square: '方形' }[sizeSuffix];
        link.download = `易占_${hexName}_${sizeLabel}_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                保存分享卡片
            `;
        }
    }).catch(err => {
        console.error('生成图片失败:', err);
        alert('生成图片失败，请重试');
        if (wasHidden) {
            card.classList.add('share-card-hidden');
        }
        if (btn) {
            btn.disabled = false;
            btn.textContent = '保存分享卡片';
        }
    });
}

// 复制分享文案
function copyShareText() {
    if (!currentResult) {
        alert('请先起卦后再分享');
        return;
    }

    const hex = currentResult.hexagram;
    const guide = getHexagramGuide(hex.name);
    const lucky = getLuckyTips(guide);
    const area = currentArea || 'general';
    const areaLabel = AREA_LABELS[area] || '综合';
    const areaAdvice = getAreaAdvice(guide, area);

    const text = `【易占 · ${hex.name}卦】
${hex.upper}上${hex.lower}下 · ${hex.name}为${hex.lower}

${guide.summary}

💡 ${areaLabel}运势：${areaAdvice}

🎨 幸运色：${lucky.color}
🔢 幸运数字：${lucky.number}
🧭 幸运方位：${lucky.direction}
✅ 宜：${lucky.do}
❌ 忌：${lucky.dont}

📿 ${getMotto(guide)}

来自：zhouyi-yi.surge.sh`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert('分享文案已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败:', err);
            fallbackCopyText(text);
        });
    } else {
        fallbackCopyText(text);
    }
}

function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('分享文案已复制到剪贴板');
    } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
    }
    document.body.removeChild(textarea);
}

// 渲染六爻图
function renderYaoLines(result) {
    const container = document.getElementById('yao-container');
    const details = getYaoDetails(result);
    let html = '';
    for (const d of details) {
        const changingClass = d.isChanging ? 'yao-changing' : '';
        const lineClass = d.isYang ? 'yang' : 'yin';
        const markHtml = d.mark ? `<span class="yao-mark ${d.mark === '○' ? 'o' : 'x'}">${d.mark}</span>` : '';
        const najiaHtml = d.ganzhi ? `<span class="yao-najia">${d.ganzhi}${d.wuxing} ${d.liuqin}</span>` : '';
        const liushenHtml = d.liushen ? `<span class="yao-liushen">${d.liushen}</span>` : '';
        // 世应标记
        let positionLabel = d.position;
        if (result.shiying) {
            if (d.index === result.shiying[0]) positionLabel += ' <span class="shiying-tag shi">世</span>';
            else if (d.index === result.shiying[1]) positionLabel += ' <span class="shiying-tag ying">应</span>';
        }
        html += `
            <div class="yao-row ${changingClass}">
                <span class="yao-label">${positionLabel}</span>
                <div class="yao-line-wrap">
                    <div class="yao-line ${lineClass}"></div>
                    ${markHtml}
                </div>
                ${najiaHtml}
                ${liushenHtml}
            </div>
        `;
    }
    container.innerHTML = html;
}

// 渲染迷你卦象（用于之卦/互卦小卡片）
function renderMiniHexagram(hexInfo) {
    const upperCode = TRIGRAM_NAMES[hexInfo.upper];
    const lowerCode = TRIGRAM_NAMES[hexInfo.lower];
    const lines = lowerCode.split('').map(Number).concat(upperCode.split('').map(Number));
    let html = '<div class="hex-mini-lines">';
    for (let i = 5; i >= 0; i--) {
        const isYang = lines[i] === 1;
        html += `<div class="mini-line ${isYang ? '' : 'yin'}"></div>`;
    }
    html += '</div>';
    html += `<span style="font-size:0.875rem;color:var(--text-secondary);">${hexInfo.name}</span>`;
    return html;
}

// ==================== 在线摇铜钱 ====================

let shakeCount = 0;
let shakeResults = [];
let shakeTimer = null;

function startCoinShake() {
    shakeCount = 0;
    shakeResults = [];
    const btn = document.getElementById('shake-btn');
    btn.disabled = true;
    btn.textContent = '摇卦中...';
    btn.classList.add('shaking');

    // 清空已有输入
    for (let i = 0; i < 6; i++) {
        document.getElementById('coin-' + i).value = '';
    }

    doOneShake();
}

function doOneShake() {
    if (shakeCount >= 6) {
        finishShake();
        return;
    }
    shakeCount++;

    // 模拟摇卦动画：先显示"?"，1秒后出结果
    const input = document.getElementById('coin-' + (shakeCount - 1));
    input.value = '?';
    input.classList.add('shake-animate');

    // 模拟三枚铜钱：每个铜钱正面(字)=0 反面(背)=1
    // 3背(111)=老阳=9, 2背1字(110,101,011)=少阳=7, 1背2字(100,010,001)=少阴=8, 3字(000)=老阴=6
    setTimeout(() => {
        const c1 = Math.random() < 0.5 ? 1 : 0;
        const c2 = Math.random() < 0.5 ? 1 : 0;
        const c3 = Math.random() < 0.5 ? 1 : 0;
        const sum = c1 + c2 + c3;
        let result;
        if (sum === 3) result = 9;      // 三背 = 老阳
        else if (sum === 2) result = 7; // 两背一字 = 少阳
        else if (sum === 1) result = 8; // 一背两字 = 少阴
        else result = 6;                // 三字 = 老阴

        shakeResults.push(result);
        input.value = result;
        input.classList.remove('shake-animate');

        // 继续下一次
        doOneShake();
    }, 600);
}

function finishShake() {
    const btn = document.getElementById('shake-btn');
    btn.disabled = false;
    btn.textContent = '在线摇卦';
    btn.classList.remove('shaking');

    // 自动起卦，加入排盘动画
    showCastLoader('六次摇卦完成，正在排盘…');
    setTimeout(() => {
        currentResult = castByCoins(shakeResults, new Date());
        renderResult();
        hideCastLoader();
        showPage('result');
    }, 700);
}

// 键盘回车支持
document.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < 6; i++) {
        document.getElementById('coin-' + i)?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const next = document.getElementById('coin-' + (i + 1));
                if (next) next.focus();
                else doCoinCast();
            }
        });
    }
    ['num-upper', 'num-lower', 'num-dong'].forEach((id, idx, arr) => {
        document.getElementById(id)?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (idx < arr.length - 1) {
                    document.getElementById(arr[idx + 1]).focus();
                } else {
                    doNumberCast();
                }
            }
        });
    });

    // 初始化背景悬浮粒子
    initParticles();

    // 如果 URL 带有卦象 hash，自动渲染结果页
    if (window.location.hash && window.location.hash.length > 1) {
        tryLoadFromHash();
    }
});

// ==================== 视觉特效：背景粒子 ====================

function initParticles() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    const count = 16;
    for (let i = 0; i < count; i++) {
        createParticle(i);
    }
}

function createParticle(index) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 3;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (Math.random() * 12 + 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.opacity = Math.random() * 0.4 + 0.2;

    const colors = [
        'rgba(94, 92, 230, 0.12)',
        'rgba(0, 113, 227, 0.1)',
        'rgba(255, 159, 10, 0.08)',
        'rgba(255, 55, 95, 0.08)'
    ];
    p.style.background = colors[Math.floor(Math.random() * colors.length)];

    document.body.appendChild(p);

    // 动画结束后重新随机位置，避免扎堆
    p.addEventListener('animationiteration', () => {
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDuration = (Math.random() * 12 + 10) + 's';
    });
}

// ==================== 起卦 Loading 遮罩 ====================

function showCastLoader(text) {
    let loader = document.getElementById('cast-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'cast-loader';
        loader.innerHTML = '<div class="yin-yang-loader"></div><p class="cast-loader-text"></p>';
        loader.style.cssText = 'position:fixed;inset:0;z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(245,245,247,0.85);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity 0.3s;pointer-events:none;';
        const textEl = loader.querySelector('.cast-loader-text');
        textEl.style.cssText = 'font-size:0.9375rem;color:var(--text-secondary);font-weight:500;';
        document.body.appendChild(loader);
    }
    loader.querySelector('.cast-loader-text').textContent = text || '正在排盘…';
    loader.style.pointerEvents = 'auto';
    // force reflow
    void loader.offsetWidth;
    loader.style.opacity = '1';
}

function hideCastLoader() {
    const loader = document.getElementById('cast-loader');
    if (!loader) return;
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 300);
}
