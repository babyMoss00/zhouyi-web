// ==================== 排盘算法 ====================

function trigramFromCode(code) {
    return TRIGRAMS[code] || ["?","?","?",0,"?"];
}

function trigramFromNumber(n) {
    const code = TRIGRAM_NUMBER_MAP[n] || "000";
    return trigramFromCode(code);
}

function linesToTrigram(lines) {
    const code = lines.join("");
    return trigramFromCode(code)[1];
}

function getHexagramInfo(upper, lower) {
    return HEXAGRAM_64[upper + "|" + lower] || ["未知", "", ""];
}

function getChangingHexagram(lines, changing) {
    const result = lines.slice();
    for (const i of changing) {
        result[i] = 1 - result[i];
    }
    return result;
}

function getHuHexagram(lines) {
    const lowerHu = lines.slice(1, 4);
    const upperHu = lines.slice(2, 5);
    return lowerHu.concat(upperHu);
}

function getNajia(guaName) {
    const palace = PALACE_MAP[guaName];
    if (!palace) return [];
    const palaceNajia = NAJIA_TABLE[palace];
    if (!palaceNajia) return [];
    if (YOUGUI_UPPER[guaName]) {
        const upperGua = YOUGUI_UPPER[guaName];
        const upperNajia = NAJIA_TABLE[upperGua];
        return palaceNajia.slice(0, 3).concat(upperNajia.slice(3, 6));
    }
    return palaceNajia;
}

function getLiuqinList(guaName) {
    const palace = PALACE_MAP[guaName];
    if (!palace) return [];
    const myWuxing = PALACE_WUXING[palace];
    const najia = getNajia(guaName);
    return najia.map(([ganzhi, wuxing]) => {
        return getLiuqin(myWuxing, wuxing);
    });
}

// 铜钱法起卦
// coinResults: 6个数字 [6,7,8,9,7,8]  6=老阴 7=少阳 8=少阴 9=老阳
function castByCoins(coinResults, castDate) {
    const lines = [];
    const changing = [];
    for (let i = 0; i < 6; i++) {
        const r = parseInt(coinResults[i]);
        if (r === 6) { lines.push(0); changing.push(i); }
        else if (r === 7) { lines.push(1); }
        else if (r === 8) { lines.push(0); }
        else if (r === 9) { lines.push(1); changing.push(i); }
        else { lines.push(0); }
    }
    return buildResult(lines, changing, "coins", castDate);
}

// 数字法起卦
// nums: [上卦数, 下卦数, 动爻数]
function castByNumbers(nums, castDate) {
    let upperNum = nums[0] % 8;
    let lowerNum = nums[1] % 8;
    let dongyao = nums[2] % 6;
    if (upperNum === 0) upperNum = 8;
    if (lowerNum === 0) lowerNum = 8;
    if (dongyao === 0) dongyao = 6;

    const upperTrigram = trigramFromNumber(upperNum)[1];
    const lowerTrigram = trigramFromNumber(lowerNum)[1];

    const upperCode = TRIGRAM_NAMES[upperTrigram];
    const lowerCode = TRIGRAM_NAMES[lowerTrigram];
    const lines = lowerCode.split("").map(Number).concat(upperCode.split("").map(Number));
    const changing = [dongyao - 1];

    return buildResult(lines, changing, "numbers", castDate);
}

// 时间法起卦（梅花易数风格）
function castByTime(dt) {
    if (!dt) dt = new Date();

    // 简化农历年地支：用年份后两位 % 12
    const yearBranch = ((dt.getFullYear() % 100) % 12) || 12;
    const month = dt.getMonth() + 1;
    const day = dt.getDate();
    const hour = (dt.getHours() % 12) || 12;

    let upperNum = (yearBranch + month + day) % 8;
    let lowerNum = (yearBranch + month + day + hour) % 8;
    let dongyao = (yearBranch + month + day + hour) % 6;

    if (upperNum === 0) upperNum = 8;
    if (lowerNum === 0) lowerNum = 8;
    if (dongyao === 0) dongyao = 6;

    return castByNumbers([upperNum, lowerNum, dongyao], dt);
}

function buildResult(lines, changing, method, castDate) {
    const lowerLines = lines.slice(0, 3);
    const upperLines = lines.slice(3, 6);
    const lowerTrigram = linesToTrigram(lowerLines);
    const upperTrigram = linesToTrigram(upperLines);

    const hexInfo = getHexagramInfo(upperTrigram, lowerTrigram);
    const guaName = hexInfo[0];

    const changedLines = getChangingHexagram(lines, changing);
    const changedLower = changedLines.slice(0, 3);
    const changedUpper = changedLines.slice(3, 6);
    const changedLowerTrigram = linesToTrigram(changedLower);
    const changedUpperTrigram = linesToTrigram(changedUpper);
    const changedHexInfo = getHexagramInfo(changedUpperTrigram, changedLowerTrigram);

    const huLines = getHuHexagram(lines);
    const huLower = huLines.slice(0, 3);
    const huUpper = huLines.slice(3, 6);
    const huLowerTrigram = linesToTrigram(huLower);
    const huUpperTrigram = linesToTrigram(huUpper);
    const huHexInfo = getHexagramInfo(huUpperTrigram, huLowerTrigram);

    const najia = getNajia(guaName);
    const liuqin = getLiuqinList(guaName);

    // 日干支 & 六神
    const dt = castDate || new Date();
    const dayGanzhi = getDayGanzhi(dt);
    const dayGan = dayGanzhi[0];
    const liushen = LIUSHEN_TABLE[dayGan] || ["?","?","?","?","?","?"];

    // 世应
    const shiying = SHIYING_TABLE[guaName] || [5, 2];

    return {
        method: method,
        lines: lines,
        changing: changing,
        lowerTrigram: lowerTrigram,
        upperTrigram: upperTrigram,
        hexagram: {
            name: guaName,
            text: hexInfo[1],
            image: hexInfo[2],
            upper: upperTrigram,
            lower: lowerTrigram,
        },
        changedHexagram: {
            name: changedHexInfo[0],
            text: changedHexInfo[1],
            image: changedHexInfo[2],
            upper: changedUpperTrigram,
            lower: changedLowerTrigram,
        },
        huHexagram: {
            name: huHexInfo[0],
            text: huHexInfo[1],
            image: huHexInfo[2],
            upper: huUpperTrigram,
            lower: huLowerTrigram,
        },
        najia: najia,
        liuqin: liuqin,
        liushen: liushen,
        shiying: shiying,
        dayGanzhi: dayGanzhi,
    };
}

// 格式化爻象显示
function formatYao(yang, changing) {
    if (yang) {
        return changing ? { line: "━━━", mark: "○", isYang: true, isChanging: true } 
                        : { line: "━━━", mark: "", isYang: true, isChanging: false };
    } else {
        return changing ? { line: "━ ━", mark: "×", isYang: false, isChanging: true }
                        : { line: "━ ━", mark: "", isYang: false, isChanging: false };
    }
}

// 获取六爻完整信息（从上到下：上爻到初爻）
function getYaoDetails(result) {
    const positions = ["上爻", "五爻", "四爻", "三爻", "二爻", "初爻"];
    const details = [];
    for (let i = 5; i >= 0; i--) {
        const isYang = result.lines[i] === 1;
        const isChanging = result.changing.includes(i);
        const yao = formatYao(isYang, isChanging);
        const najia = result.najia[i] || ["", ""];
        const liuqin = result.liuqin[i] || "";
        const liushen = result.liushen ? result.liushen[5 - i] : "";
        details.push({
            position: positions[5 - i],
            index: i,
            ...yao,
            ganzhi: najia[0],
            wuxing: najia[1],
            liuqin: liuqin,
            liushen: liushen,
        });
    }
    return details;
}
