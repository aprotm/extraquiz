import fs from 'node:fs';

const css = fs.readFileSync('css/style.css', 'utf8');

function hexToRgb(hex) {
    hex = hex.replace('#', '').trim();
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex.substring(0, 6), 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function getLum(hex) {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map(c => {
        const val = c / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getCR(hex1, hex2) {
    const l1 = getLum(hex1), l2 = getLum(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Find all occurrences of color properties in theme-matrix and theme-synthwave
const matrixSection = css.substring(css.indexOf('/* 1. CYBER MATRIX NEON THEME ENGINE'), css.indexOf('/* 2. SUNSET SYNTHWAVE 80s THEME ENGINE'));
const synthSection = css.substring(css.indexOf('/* 2. SUNSET SYNTHWAVE 80s THEME ENGINE'), css.indexOf('/* ===== AVATAR FRAME ANIMATION EFFECTS'));

console.log('Matrix Section length:', matrixSection.length);
console.log('Synthwave Section length:', synthSection.length);

function extractRules(section) {
    const rules = [];
    const regex = /([^{]+)\{([^}]+)\}/g;
    let match;
    while ((match = regex.exec(section)) !== null) {
        const selector = match[1].trim();
        const body = match[2].trim();
        rules.push({ selector, body });
    }
    return rules;
}

const matrixRules = extractRules(matrixSection);
const synthRules = extractRules(synthSection);

console.log(`Extracted ${matrixRules.length} rules from Matrix, ${synthRules.length} rules from Synthwave.`);

// Analyze color declarations
function analyzeRules(rules, themeName, defaultBg) {
    console.log(`\n=== Analyzing ${themeName} Rules ===`);
    for (const rule of rules) {
        const lines = rule.body.split(';').map(l => l.trim()).filter(Boolean);
        let color = null;
        let bg = null;
        for (const line of lines) {
            if (/^color\s*:/i.test(line)) {
                color = line.replace(/^color\s*:/i, '').replace('!important', '').trim();
            }
            if (/^background(-color)?\s*:/i.test(line)) {
                bg = line.replace(/^background(-color)?\s*:/i, '').replace('!important', '').trim();
            }
        }
        if (color) {
            console.log(`Selector: ${rule.selector}`);
            console.log(`  color: ${color}, local bg: ${bg || '(inherits/canvas: ' + defaultBg + ')'}`);
            if (color.startsWith('#')) {
                const effectiveBg = (bg && bg.startsWith('#')) ? bg : defaultBg;
                const cr = getCR(color, effectiveBg);
                console.log(`  Contrast against ${effectiveBg}: ${cr.toFixed(2)}:1 ${cr >= 7 ? '(AAA)' : cr >= 4.5 ? '(AA)' : '(FAIL)'}`);
            }
        }
    }
}

analyzeRules(matrixRules, 'Matrix', '#040810');
analyzeRules(synthRules, 'Synthwave', '#0A0618');
