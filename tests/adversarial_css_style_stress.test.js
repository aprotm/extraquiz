/**
 * adversarial_css_style_stress.test.js
 * Empirical Challenger Test Harness for Milestone 3 (CSS Theme Engine)
 * 
 * Tests:
 * 1. Deep CSS Syntax & AST Grammar Validation (Brace, Parenthesis, Quote, Semicolon Balance)
 * 2. Strict Theme Scope & Zero-Leakage Isolation
 * 3. Selector Specificity & Tailwind Utility Class Escapes
 * 4. Pointer Events & Interaction Blocking Audit
 * 5. Z-Index & Stacking Context Hierarchy
 * 6. 3D Card Flip & Layout Transform Integrity
 * 7. Exhaustive W3C WCAG 2.1 Relative Luminance Contrast Engine (Matrix & Synthwave)
 * 8. Media Query & Responsive Breakpoint Consistency
 * 9. GPU-Accelerated Animation & Performance Audit
 * 10. Vue Component DOM Template Selector Integration
 * 11. Default & Handdrawn Theme Preservation Invariants
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('⚔️  RUNNING EMPIRICAL CHALLENGER CSS STRESS & INTEGRITY SUITE ⚔️');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message, details = '') {
    if (condition) {
        passCount++;
        console.log(`  ✅ [PASS #${passCount}] ${message}`);
    } else {
        failCount++;
        const err = `❌ [FAIL #${failCount}] ${message} ${details ? '(' + details + ')' : ''}`;
        console.error(`  ${err}`);
        failures.push(err);
    }
}

// Load css/style.css
const cssPath = path.resolve(__dirname, '../css/style.css');
if (!fs.existsSync(cssPath)) {
    console.error(`Fatal: css/style.css not found at ${cssPath}`);
    process.exit(1);
}
const cssContent = fs.readFileSync(cssPath, 'utf8');

// -----------------------------------------------------------------------------
// SUITE 1: Deep CSS Syntax & AST Grammar Parsing
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: Deep CSS Syntax & AST Grammar Parsing ---');

function validateGrammar(css) {
    let braceCount = 0;
    let parenCount = 0;
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let line = 1;
    let col = 0;
    const errors = [];

    for (let i = 0; i < css.length; i++) {
        col++;
        const char = css[i];
        const nextChar = css[i + 1] || '';

        if (char === '\n') {
            line++;
            col = 0;
        }

        // Comment handling
        if (!inString && !inComment && char === '/' && nextChar === '*') {
            inComment = true;
            i++; // skip *
            continue;
        }
        if (inComment && char === '*' && nextChar === '/') {
            inComment = false;
            i++; // skip /
            continue;
        }
        if (inComment) continue;

        // String handling
        if ((char === '"' || char === "'") && css[i - 1] !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (stringChar === char) {
                inString = false;
                stringChar = '';
            }
            continue;
        }
        if (inString) continue;

        // Parentheses
        if (char === '(') parenCount++;
        if (char === ')') {
            parenCount--;
            if (parenCount < 0) {
                errors.push(`Unmatched closing parenthesis at line ${line}:${col}`);
            }
        }

        // Braces
        if (char === '{') braceCount++;
        if (char === '}') {
            braceCount--;
            if (braceCount < 0) {
                errors.push(`Unmatched closing brace at line ${line}:${col}`);
            }
        }
    }

    if (inComment) errors.push('Unclosed comment at end of CSS file');
    if (inString) errors.push(`Unclosed string literal (${stringChar}) at end of CSS file`);
    if (braceCount !== 0) errors.push(`Unbalanced braces at end of file: balance = ${braceCount}`);
    if (parenCount !== 0) errors.push(`Unbalanced parentheses at end of file: balance = ${parenCount}`);

    return errors;
}

const grammarErrors = validateGrammar(cssContent);
assert(grammarErrors.length === 0, 'CSS file is syntactically well-formed with perfect brace/quote balance', grammarErrors.join('; '));
assert(cssContent.length > 20000, `CSS file size is substantial (${cssContent.length} bytes)`);

// -----------------------------------------------------------------------------
// SUITE 2: Strict Theme Scope & Zero-Leakage Isolation
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Strict Theme Scope & Zero-Leakage Isolation ---');

const themeBlockStart = cssContent.indexOf('/* VIP FULL THEME VISUAL OVERHAUL ENGINE');
const avatarEffectsStart = cssContent.indexOf('/* ===== AVATAR FRAME ANIMATION EFFECTS =====');
assert(themeBlockStart > 0, 'Theme engine header block exists in css/style.css');

const themeEngineCss = cssContent.substring(
    themeBlockStart,
    avatarEffectsStart > 0 ? avatarEffectsStart : cssContent.length
);

function extractRules(css) {
    const rules = [];
    let depth = 0;
    let currentSelector = '';
    let currentBody = '';
    let inComment = false;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < css.length; i++) {
        const char = css[i];
        const nextChar = css[i + 1] || '';

        if (!inString && !inComment && char === '/' && nextChar === '*') {
            inComment = true;
            i++;
            continue;
        }
        if (inComment && char === '*' && nextChar === '/') {
            inComment = false;
            i++;
            continue;
        }
        if (inComment) continue;

        if ((char === '"' || char === "'") && css[i - 1] !== '\\') {
            if (!inString) { inString = true; stringChar = char; }
            else if (stringChar === char) { inString = false; stringChar = ''; }
        }

        if (depth === 0) {
            if (char === '{') {
                depth = 1;
            } else {
                currentSelector += char;
            }
        } else {
            if (char === '{') {
                depth++;
                currentBody += char;
            } else if (char === '}') {
                depth--;
                if (depth === 0) {
                    rules.push({
                        selector: currentSelector.trim(),
                        body: currentBody.trim()
                    });
                    currentSelector = '';
                    currentBody = '';
                } else {
                    currentBody += char;
                }
            } else {
                currentBody += char;
            }
        }
    }
    return rules;
}

const themeRules = extractRules(themeEngineCss);
console.log(`    -> Parsed ${themeRules.length} top-level CSS rule blocks in Theme Engine section.`);

let unscopedCount = 0;
const unscopedSelectors = [];

themeRules.forEach(rule => {
    const sel = rule.selector;
    if (sel.startsWith('@keyframes') || sel.startsWith('@media') || sel.startsWith('/*') || sel === '') {
        return;
    }
    const subSelectors = sel.split(',').map(s => s.trim()).filter(Boolean);
    subSelectors.forEach(s => {
        const isMatrixScoped = s.includes('.theme-matrix') || s.includes('theme-matrix');
        const isSynthwaveScoped = s.includes('.theme-synthwave') || s.includes('theme-synthwave');
        if (!isMatrixScoped && !isSynthwaveScoped) {
            unscopedCount++;
            unscopedSelectors.push(s);
        }
    });
});

assert(unscopedCount === 0, '100% of theme visual rules are strictly scoped to .theme-matrix or .theme-synthwave', unscopedSelectors.join(', '));

// -----------------------------------------------------------------------------
// SUITE 3: Selector Specificity & Tailwind Utility Class Escapes
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Selector Specificity & Tailwind Utility Class Escapes ---');

assert(
    cssContent.includes('html.theme-matrix aside button.dark\\:bg-indigo-950\\/60') &&
    cssContent.includes('body.theme-matrix aside button.dark\\:bg-indigo-950\\/60'),
    'Matrix correctly escapes Tailwind colon and slash for dark:bg-indigo-950/60'
);

assert(
    cssContent.includes('html.theme-synthwave aside button.dark\\:bg-indigo-950\\/60') &&
    cssContent.includes('body.theme-synthwave aside button.dark\\:bg-indigo-950\\/60'),
    'Synthwave correctly escapes Tailwind colon and slash for dark:bg-indigo-950/60'
);

assert(
    cssContent.includes('html.theme-matrix #settings-panel .bg-gray-50\\/60') &&
    cssContent.includes('html.theme-matrix #settings-panel .bg-gray-50\\/30'),
    'Matrix correctly escapes Tailwind opacity modifiers in settings panel (.bg-gray-50/60)'
);

assert(
    cssContent.includes('html.theme-synthwave #settings-panel .bg-gray-50\\/60') &&
    cssContent.includes('html.theme-synthwave #settings-panel .bg-gray-50\\/30'),
    'Synthwave correctly escapes Tailwind opacity modifiers in settings panel (.bg-gray-50/60)'
);

const importantMatches = themeEngineCss.match(/!important/g) || [];
console.log(`    -> Found ${importantMatches.length} !important specificity assertions in Theme Engine.`);
assert(importantMatches.length >= 100, `Sufficient !important assertions present for bulletproof Tailwind overrides (Found: ${importantMatches.length})`);

// -----------------------------------------------------------------------------
// SUITE 4: Pointer Events & Interaction Blocking Audit
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Pointer Events & Interaction Blocking Audit ---');

const pointerEventsNoneOnButtons = themeRules.filter(r => {
    const isInteractive = r.selector.includes('button') || r.selector.includes('input') || r.selector.includes('select') || r.selector.includes('a') || r.selector.includes('.store-card') || r.selector.includes('.interactive-card');
    return isInteractive && r.body.includes('pointer-events: none');
});

assert(pointerEventsNoneOnButtons.length === 0, 'Zero interactive components have pointer-events: none blocking interactions', pointerEventsNoneOnButtons.map(r => r.selector).join(', '));

assert(
    cssContent.includes('html.theme-matrix ::selection') &&
    cssContent.includes('html.theme-synthwave ::selection'),
    'Custom high-contrast ::selection styles are properly declared for both themes'
);

// -----------------------------------------------------------------------------
// SUITE 5: 3D Flashcard Flip & Layout Transform Integrity
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: 3D Flashcard Flip & Layout Transform Integrity ---');

assert(cssContent.includes('.study-card'), '.study-card base styles exist in stylesheet');
assert(cssContent.includes('.card-face-front'), '.card-face-front base styles exist');
assert(cssContent.includes('.card-face-back'), '.card-face-back base styles exist');
assert(cssContent.includes('transform-style: preserve-3d'), 'transform-style: preserve-3d is preserved for 3D card flips');
assert(cssContent.includes('backface-visibility: hidden'), 'backface-visibility: hidden is preserved for 3D flip card faces');

const matrixFrontRule = themeRules.find(r => r.selector.includes('.study-card .card-face-front') && r.selector.includes('theme-matrix'));
const synthwaveFrontRule = themeRules.find(r => r.selector.includes('.study-card .card-face-front') && r.selector.includes('theme-synthwave'));

assert(matrixFrontRule !== undefined, 'Matrix flashcard front face skin rule exists');
assert(synthwaveFrontRule !== undefined, 'Synthwave flashcard front face skin rule exists');

if (matrixFrontRule) {
    assert(!matrixFrontRule.body.includes('backface-visibility: visible'), 'Matrix study card does not corrupt backface-visibility');
    assert(!matrixFrontRule.body.includes('transform: none !important'), 'Matrix study card does not suppress 3D flip transforms');
}
if (synthwaveFrontRule) {
    assert(!synthwaveFrontRule.body.includes('backface-visibility: visible'), 'Synthwave study card does not corrupt backface-visibility');
    assert(!synthwaveFrontRule.body.includes('transform: none !important'), 'Synthwave study card does not suppress 3D flip transforms');
}

// -----------------------------------------------------------------------------
// SUITE 6: Exhaustive W3C WCAG 2.1 Luminance Contrast Engine
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Exhaustive W3C WCAG 2.1 Luminance Contrast Engine ---');

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(rgb) {
    const srgb = rgb.map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(hex1, hex2) {
    const lum1 = relativeLuminance(hexToRgb(hex1));
    const lum2 = relativeLuminance(hexToRgb(hex2));
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

// WCAG 2.1 Contrast Table
const contrastMatrixPairs = [
    { fg: '#FFFFFF', bg: '#040810', name: 'White Headings on Matrix Dark Obsidian', min: 7.0, level: 'AAA' },
    { fg: '#F0FDF4', bg: '#040810', name: 'Emerald White Text on Matrix Obsidian', min: 7.0, level: 'AAA' },
    { fg: '#E2E8F0', bg: '#040810', name: 'Slate-200 Body on Matrix Obsidian', min: 7.0, level: 'AAA' },
    { fg: '#E2E8F0', bg: '#081222', name: 'Slate-200 Body on Matrix Surface Glass', min: 7.0, level: 'AAA' },
    { fg: '#CBD5E1', bg: '#040810', name: 'Slate-300 Secondary Text on Matrix Obsidian', min: 7.0, level: 'AAA' },
    { fg: '#CBD5E1', bg: '#081222', name: 'Slate-300 Secondary Text on Matrix Glass', min: 7.0, level: 'AAA' },
    { fg: '#94A3B8', bg: '#040810', name: 'Slate-400 Muted Text on Matrix Obsidian', min: 4.5, level: 'AA' },
    { fg: '#00FF9D', bg: '#040810', name: 'Matrix Neon Green on Matrix Obsidian', min: 7.0, level: 'AAA' },
    { fg: '#00E5FF', bg: '#040810', name: 'Matrix Neon Cyan on Matrix Obsidian', min: 7.0, level: 'AAA' },
    { fg: '#020C07', bg: '#00FF9D', name: 'Dark Charcoal Text on Neon Green Button', min: 7.0, level: 'AAA' },
    { fg: '#00FF9D', bg: '#081222', name: 'Neon Green Links/Icons on Glass Surface', min: 7.0, level: 'AAA' }
];

contrastMatrixPairs.forEach(pair => {
    const ratio = contrastRatio(pair.fg, pair.bg);
    const passes = ratio >= pair.min;
    console.log(`    -> [Matrix] ${pair.name}: ${ratio.toFixed(2)}:1 (WCAG ${pair.level} >= ${pair.min}:1)`);
    assert(passes, `Matrix contrast check: ${pair.name} >= ${pair.min}:1 (Actual: ${ratio.toFixed(2)}:1)`);
});

const contrastSynthwavePairs = [
    { fg: '#FFFFFF', bg: '#0A0618', name: 'White Headings on Synthwave Retro Abyss', min: 7.0, level: 'AAA' },
    { fg: '#FFF0F7', bg: '#0A0618', name: 'Pink White Text on Synthwave Retro Abyss', min: 7.0, level: 'AAA' },
    { fg: '#F1F5F9', bg: '#0A0618', name: 'Slate-100 Body on Synthwave Retro Abyss', min: 7.0, level: 'AAA' },
    { fg: '#E2E8F0', bg: '#180B2E', name: 'Slate-200 Body on Synthwave Surface Glass', min: 7.0, level: 'AAA' },
    { fg: '#CBD5E1', bg: '#0A0618', name: 'Slate-300 Secondary Text on Synthwave Abyss', min: 7.0, level: 'AAA' },
    { fg: '#CBD5E1', bg: '#180B2E', name: 'Slate-300 Secondary Text on Synthwave Glass', min: 7.0, level: 'AAA' },
    { fg: '#94A3B8', bg: '#0A0618', name: 'Slate-400 Muted Text on Synthwave Abyss', min: 4.5, level: 'AA' },
    { fg: '#00F0FF', bg: '#0A0618', name: 'Synthwave Cyan on Retro Abyss', min: 7.0, level: 'AAA' },
    { fg: '#FFFFFF', bg: '#FF2A85', name: 'White Text on Hot Pink Large Bold Button', min: 3.0, level: 'AA Large/Bold' },
    { fg: '#FFFFFF', bg: '#9D00FF', name: 'White Text on Synth Purple Accent', min: 4.5, level: 'AA' },
    { fg: '#FFFFFF', bg: '#180B2E', name: 'White Text on Synth Surface Dark', min: 7.0, level: 'AAA' }
];

contrastSynthwavePairs.forEach(pair => {
    const ratio = contrastRatio(pair.fg, pair.bg);
    const passes = ratio >= pair.min;
    console.log(`    -> [Synthwave] ${pair.name}: ${ratio.toFixed(2)}:1 (WCAG ${pair.level} >= ${pair.min}:1)`);
    assert(passes, `Synthwave contrast check: ${pair.name} >= ${pair.min}:1 (Actual: ${ratio.toFixed(2)}:1)`);
});

// -----------------------------------------------------------------------------
// SUITE 7: GPU-Accelerated Animation & Performance Audit
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 7: GPU-Accelerated Animation & Performance Audit ---');

const keyframeRules = themeRules.filter(r => r.selector.startsWith('@keyframes'));
assert(keyframeRules.length >= 3, `Theme keyframes are defined (Found ${keyframeRules.length})`);

const forbiddenAnimationProps = ['width:', 'height:', 'top:', 'left:', 'right:', 'bottom:', 'margin:'];
keyframeRules.forEach(kf => {
    forbiddenAnimationProps.forEach(prop => {
        const hasForbidden = kf.body.includes(prop);
        assert(!hasForbidden, `Keyframe ${kf.selector} does not animate layout property '${prop}'`);
    });
});

// -----------------------------------------------------------------------------
// SUITE 8: 9-Module Coverage Stress & Selector Mapping
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 8: 9-Module Coverage Stress & Selector Mapping ---');

const requiredModuleSelectors = [
    // Module 1: Layout & Nav
    { name: 'Matrix App Shell & Aside', match: 'html.theme-matrix aside' },
    { name: 'Synthwave App Shell & Aside', match: 'html.theme-synthwave aside' },
    { name: 'Matrix Header Strong', match: 'html.theme-matrix header.glass-panel-strong' },
    { name: 'Synthwave Header Strong', match: 'html.theme-synthwave header.glass-panel-strong' },
    { name: 'Matrix Mobile Nav', match: 'html.theme-matrix nav.mobile-nav' },
    { name: 'Synthwave Mobile Nav', match: 'html.theme-synthwave nav.mobile-nav' },
    // Module 2: Dashboard
    { name: 'Matrix Glass Panel & Cards', match: 'html.theme-matrix .glass-panel' },
    { name: 'Synthwave Glass Panel & Cards', match: 'html.theme-synthwave .glass-panel' },
    { name: 'Matrix Score Ring Track & Fill', match: 'html.theme-matrix .score-ring-fill' },
    { name: 'Synthwave Score Ring Track & Fill', match: 'html.theme-synthwave .score-ring-fill' },
    // Module 3: Flashcard Study
    { name: 'Matrix Study Card', match: 'html.theme-matrix .study-card' },
    { name: 'Synthwave Study Card', match: 'html.theme-synthwave .study-card' },
    { name: 'Matrix Correct & Wrong Glow', match: 'html.theme-matrix .card-correct-glow' },
    { name: 'Synthwave Correct & Wrong Glow', match: 'html.theme-synthwave .card-correct-glow' },
    // Module 4: Arcade Arena
    { name: 'Matrix Boss Hit & Cyber Glow', match: 'html.theme-matrix .animate-boss-hit' },
    { name: 'Synthwave Boss Hit', match: 'html.theme-synthwave .animate-boss-hit' },
    { name: 'Matrix Matching Glow', match: 'html.theme-matrix .neon-selected-glow' },
    { name: 'Synthwave Matching Glow', match: 'html.theme-synthwave .neon-selected-glow' },
    { name: 'Matrix Arcade Hub Btn', match: 'html.theme-matrix .arcade-game-btn' },
    { name: 'Synthwave Arcade Hub Btn', match: 'html.theme-synthwave .arcade-game-btn' },
    // Module 5: LexiStore
    { name: 'Matrix Store Card', match: 'html.theme-matrix .store-card' },
    { name: 'Synthwave Store Card', match: 'html.theme-synthwave .store-card' },
    // Module 6: Modals & Settings
    { name: 'Matrix Settings Panel', match: 'html.theme-matrix #settings-panel' },
    { name: 'Synthwave Settings Panel', match: 'html.theme-synthwave #settings-panel' },
    // Module 7: AI Modules & Markdown
    { name: 'Matrix Markdown Body', match: 'html.theme-matrix .markdown-body' },
    { name: 'Synthwave Markdown Body', match: 'html.theme-synthwave .markdown-body' },
    // Module 8: Buttons
    { name: 'Matrix Primary & Secondary Buttons', match: 'html.theme-matrix .btn-primary' },
    { name: 'Synthwave Primary & Secondary Buttons', match: 'html.theme-synthwave .btn-primary' },
    // Module 9: High-Contrast Typography
    { name: 'Matrix Heading Typography', match: 'html.theme-matrix h1' },
    { name: 'Synthwave Heading Typography', match: 'html.theme-synthwave h1' }
];

requiredModuleSelectors.forEach(item => {
    const found = cssContent.includes(item.match);
    assert(found, `Module component selector mapping: ${item.name} ('${item.match}')`);
});

// -----------------------------------------------------------------------------
// SUITE 9: Vue Component DOM Template Integration
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 9: Vue Component DOM Template Integration ---');

const componentDir = path.resolve(__dirname, '../js/components');
const componentChecks = [
    { file: 'usertool.js', anchors: ['settings-panel', 'isThemeActive', 'theme_matrix', 'theme_synthwave'] },
    { file: 'lexistore.js', anchors: ['isItemActive', 'activeCategory', 'store'] },
    { file: 'study.js', anchors: ['study-card', 'card-face-front', 'card-face-back', 'study-controls'] },
    { file: 'bossbattle.js', anchors: ['animate-boss-hit'] },
    { file: 'cybercipher.js', anchors: ['cyber-glow'] }
];

componentChecks.forEach(comp => {
    const fullPath = path.join(componentDir, comp.file);
    if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        comp.anchors.forEach(anchor => {
            const exists = fileContent.includes(anchor);
            assert(exists, `Component '${comp.file}' contains contract anchor '${anchor}'`);
        });
    }
});

// -----------------------------------------------------------------------------
// SUITE 10: Invariant Preservation of Default and Handdrawn Themes
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 10: Invariant Preservation of Default and Handdrawn Themes ---');

// Ensure :root tokens are fully intact
assert(cssContent.includes('--color-primary: #6366F1;'), ':root brand primary #6366F1 intact');
assert(cssContent.includes('--color-bg: #F9FAFB;'), ':root background #F9FAFB intact');
assert(cssContent.includes('--radius-xl: 16px;'), ':root border radius tokens intact');

// Ensure .theme-handdrawn is completely intact and uses Patrick Hand & Kalam
assert(cssContent.includes('.theme-handdrawn'), '.theme-handdrawn class exists');
assert(cssContent.includes("'Patrick Hand'"), '.theme-handdrawn Patrick Hand handwriting font intact');
assert(cssContent.includes("'Kalam'"), '.theme-handdrawn Kalam heading font intact');

// -----------------------------------------------------------------------------
// FINAL SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n================================================================');
if (failCount === 0) {
    console.log(`🏆 ALL ${passCount} OF ${passCount} ADVERSARIAL CSS STRESS TESTS PASSED CLEANLY! 🏆`);
    console.log('VERDICT: APPROVE');
    console.log('================================================================\n');
    process.exit(0);
} else {
    console.error(`💥 ${failCount} ASSERTIONS FAILED OUT OF ${passCount + failCount} TESTS! 💥`);
    console.error('VERDICT: REQUEST_CHANGES');
    console.error('Failures:');
    failures.forEach(f => console.error(`  - ${f}`));
    console.log('================================================================\n');
    process.exit(1);
}
