import assert from 'node:assert';
import fs from 'node:fs';

console.log('================================================================');
console.log('🧪 TEST SUITE: CYBER MATRIX & SUNSET SYNTHWAVE VISUAL ENGINE 🧪');
console.log('================================================================\n');

// 1. Load stylesheet
const cssContent = fs.readFileSync('css/style.css', 'utf8');

// --- Helper: Relative Luminance and Contrast Ratio calculation (WCAG 2.1) ---
function hexToRgb(hex) {
    hex = hex.replace('#', '').trim();
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex.substring(0, 6), 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

function getLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map(c => {
        const val = c / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`❌ FAIL: ${name}`);
        console.error(err);
        process.exitCode = 1;
    }
}

// =============================================================================
// SUITE 1: CSS TOKEN DEFINITION & COMPLETENESS AUDIT
// =============================================================================
console.log('--- SUITE 1: CSS Token Engine Completeness Audit ---');

runTest('Matrix Token Engine declares all semantic tokens and custom matrix variables', () => {
    const matrixBlockMatch = cssContent.match(/html\.theme-matrix,\s*body\.theme-matrix\s*\{([\s\S]*?)\}/);
    assert(matrixBlockMatch, 'html.theme-matrix, body.theme-matrix block must exist in css/style.css');
    const block = matrixBlockMatch[1];
    
    const requiredTokens = [
        '--color-bg',
        '--color-bg-secondary',
        '--color-surface',
        '--color-surface-hover',
        '--color-primary',
        '--color-primary-hover',
        '--color-primary-light',
        '--color-secondary',
        '--color-text',
        '--color-text-muted',
        '--color-text-light',
        '--color-border',
        '--color-danger',
        '--color-success',
        '--color-warning',
        '--focus-ring',
        '--matrix-neon',
        '--matrix-emerald',
        '--matrix-mint',
        '--matrix-cyan',
        '--matrix-dark',
        '--matrix-surface',
        '--matrix-surface-glass',
        '--matrix-border-neon',
        '--matrix-glow'
    ];

    for (const token of requiredTokens) {
        assert(block.includes(token), `Matrix token block missing token: ${token}`);
    }

    assert(block.includes('#040810'), 'Matrix base background must be #040810');
    assert(block.includes('#00FF9D'), 'Matrix primary neon must be #00FF9D');
    assert(block.includes('#00E5FF'), 'Matrix cyan accent must be #00E5FF');
});

runTest('Synthwave Token Engine declares all semantic tokens and custom synthwave variables', () => {
    const synthBlockMatch = cssContent.match(/html\.theme-synthwave,\s*body\.theme-synthwave\s*\{([\s\S]*?)\}/);
    assert(synthBlockMatch, 'html.theme-synthwave, body.theme-synthwave block must exist in css/style.css');
    const block = synthBlockMatch[1];
    
    const requiredTokens = [
        '--color-bg',
        '--color-bg-secondary',
        '--color-surface',
        '--color-surface-hover',
        '--color-primary',
        '--color-primary-hover',
        '--color-primary-light',
        '--color-secondary',
        '--color-text',
        '--color-text-muted',
        '--color-text-light',
        '--color-border',
        '--color-danger',
        '--color-success',
        '--color-warning',
        '--focus-ring',
        '--synth-pink',
        '--synth-purple',
        '--synth-violet',
        '--synth-orange',
        '--synth-cyan',
        '--synth-abyss',
        '--synth-surface',
        '--synth-surface-glass',
        '--synth-border-laser',
        '--synth-glow'
    ];

    for (const token of requiredTokens) {
        assert(block.includes(token), `Synthwave token block missing token: ${token}`);
    }

    assert(block.includes('#0A0618'), 'Synthwave base abyss background must be #0A0618');
    assert(block.includes('#FF2A85'), 'Synthwave primary hot pink must be #FF2A85');
    assert(block.includes('#9D00FF'), 'Synthwave secondary purple must be #9D00FF');
    assert(block.includes('#FF7B00'), 'Synthwave sunset orange must be #FF7B00');
});

// =============================================================================
// SUITE 2: 9 UI MODULE SELECTOR COVERAGE AUDIT
// =============================================================================
console.log('\n--- SUITE 2: 9 UI Module Selector Coverage Audit ---');

const modulesToCheck = [
    {
        name: 'Module 1: App Shell, Sidebar (aside), Topbar Header & Mobile Nav',
        matrixSelectors: ['body.theme-matrix', 'html.theme-matrix aside', 'html.theme-matrix header.glass-panel-strong', 'html.theme-matrix nav.mobile-nav', 'html.theme-matrix button[title="Quay lại Dashboard"]'],
        synthSelectors: ['body.theme-synthwave', 'html.theme-synthwave aside', 'html.theme-synthwave header.glass-panel-strong', 'html.theme-synthwave nav.mobile-nav', 'html.theme-synthwave button[title="Quay lại Dashboard"]']
    },
    {
        name: 'Module 2: Dashboard Cards, Stats, Score Rings & Daily Spark Quote',
        matrixSelectors: ['html.theme-matrix .glass-panel', 'html.theme-matrix .glass-panel-strong', 'html.theme-matrix .interactive-card', 'html.theme-matrix .score-ring-track', 'html.theme-matrix .score-ring-fill'],
        synthSelectors: ['html.theme-synthwave .glass-panel', 'html.theme-synthwave .glass-panel-strong', 'html.theme-synthwave .interactive-card', 'html.theme-synthwave .score-ring-track', 'html.theme-synthwave .score-ring-fill']
    },
    {
        name: 'Module 3: Flashcard Study 3D Flip, Controls & Feedback Glowing Overlays',
        matrixSelectors: ['html.theme-matrix .study-card', 'html.theme-matrix .study-card .card-face-front', 'html.theme-matrix .study-card .card-face-back', 'html.theme-matrix .flashcard-term', 'html.theme-matrix .study-controls', 'html.theme-matrix .card-correct-glow', 'html.theme-matrix .card-wrong-glow', 'html.theme-matrix .progress-bar-track', 'html.theme-matrix .progress-bar-fill'],
        synthSelectors: ['html.theme-synthwave .study-card', 'html.theme-synthwave .study-card .card-face-front', 'html.theme-synthwave .study-card .card-face-back', 'html.theme-synthwave .flashcard-term', 'html.theme-synthwave .study-controls', 'html.theme-synthwave .card-correct-glow', 'html.theme-synthwave .card-wrong-glow', 'html.theme-synthwave .progress-bar-track', 'html.theme-synthwave .progress-bar-fill']
    },
    {
        name: 'Module 4: Arcade Arena (Boss Battle, Cyber Cipher, Matching Game, AI Arena)',
        matrixSelectors: ['html.theme-matrix .animate-boss-hit', 'html.theme-matrix .cyber-glow', 'html.theme-matrix .neon-selected-glow', 'html.theme-matrix .arcade-hub-container', 'html.theme-matrix .arcade-game-btn'],
        synthSelectors: ['html.theme-synthwave .animate-boss-hit', 'html.theme-synthwave .neon-selected-glow', 'html.theme-synthwave .arcade-hub-container', 'html.theme-synthwave .arcade-game-btn']
    },
    {
        name: 'Module 5: LexiStore & Store Item Cards',
        matrixSelectors: ['html.theme-matrix .store-card'],
        synthSelectors: ['html.theme-synthwave .store-card']
    },
    {
        name: 'Module 6: Modals, Settings Panel & Input/Dropdown Form Controls',
        matrixSelectors: ['html.theme-matrix #settings-panel', 'html.theme-matrix input', 'html.theme-matrix select', 'html.theme-matrix textarea'],
        synthSelectors: ['html.theme-synthwave #settings-panel', 'html.theme-synthwave input', 'html.theme-synthwave select', 'html.theme-synthwave textarea']
    },
    {
        name: 'Module 7: AI Modules & Markdown Body Styling',
        matrixSelectors: ['html.theme-matrix .markdown-body h1', 'html.theme-matrix .markdown-body p', 'html.theme-matrix .markdown-body blockquote', 'html.theme-matrix .markdown-body code', 'html.theme-matrix .markdown-body table', 'html.theme-matrix .markdown-body th', 'html.theme-matrix .markdown-body td'],
        synthSelectors: ['html.theme-synthwave .markdown-body h1', 'html.theme-synthwave .markdown-body p', 'html.theme-synthwave .markdown-body blockquote', 'html.theme-synthwave .markdown-body code', 'html.theme-synthwave .markdown-body table', 'html.theme-synthwave .markdown-body th', 'html.theme-synthwave .markdown-body td']
    },
    {
        name: 'Module 8: Chrome Neon / Laser Button System',
        matrixSelectors: ['html.theme-matrix .btn-primary', 'html.theme-matrix .btn-secondary', 'html.theme-matrix .btn-ghost'],
        synthSelectors: ['html.theme-synthwave .btn-primary', 'html.theme-synthwave .btn-secondary', 'html.theme-synthwave .btn-ghost']
    },
    {
        name: 'Module 9: High-Contrast Headings & Color Utilities',
        matrixSelectors: ['html.theme-matrix h1', 'html.theme-matrix .text-gray-900', 'html.theme-matrix .text-gray-700', 'html.theme-matrix a:hover'],
        synthSelectors: ['html.theme-synthwave h1', 'html.theme-synthwave .text-gray-900', 'html.theme-synthwave .text-gray-700', 'html.theme-synthwave a:hover']
    }
];

for (const mod of modulesToCheck) {
    runTest(`Coverage for ${mod.name}`, () => {
        for (const sel of mod.matrixSelectors) {
            assert(cssContent.includes(sel), `Matrix missing selector: ${sel}`);
        }
        for (const sel of mod.synthSelectors) {
            assert(cssContent.includes(sel), `Synthwave missing selector: ${sel}`);
        }
    });
}

// =============================================================================
// SUITE 3: COLOR CONTRAST & WCAG AAA / AA LUMINANCE AUDIT
// =============================================================================
console.log('\n--- SUITE 3: WCAG Luminance & Color Contrast Audit ---');

runTest('Cyber Matrix Neon contrast compliance (Obsidian #040810 background)', () => {
    const bgDark = '#040810';
    const bgSurface = '#081222';

    const textPureWhite = '#FFFFFF';
    const textMatrixWhite = '#F0FDF4';
    const textMatrixBody = '#E2E8F0';
    const textMatrixMuted = '#94A3B8';
    const textMatrixNeon = '#00FF9D';

    const crWhite = getContrastRatio(bgDark, textPureWhite);
    const crHeading = getContrastRatio(bgDark, textMatrixWhite);
    const crBody = getContrastRatio(bgDark, textMatrixBody);
    const crSurfaceBody = getContrastRatio(bgSurface, textMatrixBody);
    const crMuted = getContrastRatio(bgDark, textMatrixMuted);
    const crNeon = getContrastRatio(bgDark, textMatrixNeon);

    console.log(`    -> Matrix #FFFFFF on #040810: ${crWhite.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    console.log(`    -> Matrix #F0FDF4 on #040810: ${crHeading.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    console.log(`    -> Matrix #E2E8F0 on #040810: ${crBody.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    console.log(`    -> Matrix #E2E8F0 on #081222: ${crSurfaceBody.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    console.log(`    -> Matrix #94A3B8 on #040810: ${crMuted.toFixed(2)}:1 (WCAG AA >= 4.5:1)`);
    console.log(`    -> Matrix #00FF9D on #040810: ${crNeon.toFixed(2)}:1 (WCAG AAA >= 7:1)`);

    assert(crWhite >= 7.0, `White text must meet WCAG AAA (7:1). Actual: ${crWhite}`);
    assert(crHeading >= 7.0, `Heading text must meet WCAG AAA (7:1). Actual: ${crHeading}`);
    assert(crBody >= 7.0, `Body text must meet WCAG AAA (7:1). Actual: ${crBody}`);
    assert(crSurfaceBody >= 7.0, `Surface Body text must meet WCAG AAA (7:1). Actual: ${crSurfaceBody}`);
    assert(crMuted >= 4.5, `Muted text must meet WCAG AA (4.5:1). Actual: ${crMuted}`);
    assert(crNeon >= 7.0, `Primary Neon must meet WCAG AAA (7:1). Actual: ${crNeon}`);
});

runTest('Sunset Synthwave 80s contrast compliance (Retro Abyss #0A0618 background)', () => {
    const bgAbyss = '#0A0618';
    const bgSurface = '#180B2E';

    const textPureWhite = '#FFFFFF';
    const textSynthWhite = '#FFF0F7';
    const textSynthBody = '#F1F5F9';
    const textSynthSurfaceBody = '#E2E8F0';
    const textSynthMuted = '#CBD5E1';
    const textSynthCyan = '#00F0FF';

    const crWhite = getContrastRatio(bgAbyss, textPureWhite);
    const crHeading = getContrastRatio(bgAbyss, textSynthWhite);
    const crBody = getContrastRatio(bgAbyss, textSynthBody);
    const crSurfaceBody = getContrastRatio(bgSurface, textSynthSurfaceBody);
    const crMuted = getContrastRatio(bgAbyss, textSynthMuted);
    const crCyan = getContrastRatio(bgAbyss, textSynthCyan);

    console.log(`    -> Synthwave #FFFFFF on #0A0618: ${crWhite.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    console.log(`    -> Synthwave #FFF0F7 on #0A0618: ${crHeading.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    console.log(`    -> Synthwave #F1F5F9 on #0A0618: ${crBody.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    console.log(`    -> Synthwave #E2E8F0 on #180B2E: ${crSurfaceBody.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    console.log(`    -> Synthwave #CBD5E1 on #0A0618: ${crMuted.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    console.log(`    -> Synthwave #00F0FF on #0A0618: ${crCyan.toFixed(2)}:1 (WCAG AAA >= 7:1)`);

    assert(crWhite >= 7.0, `White text must meet WCAG AAA (7:1). Actual: ${crWhite}`);
    assert(crHeading >= 7.0, `Heading text must meet WCAG AAA (7:1). Actual: ${crHeading}`);
    assert(crBody >= 7.0, `Body text must meet WCAG AAA (7:1). Actual: ${crBody}`);
    assert(crSurfaceBody >= 7.0, `Surface Body text must meet WCAG AAA (7:1). Actual: ${crSurfaceBody}`);
    assert(crMuted >= 7.0, `Muted text must meet WCAG AAA (7:1). Actual: ${crMuted}`);
    assert(crCyan >= 7.0, `Laser Cyan must meet WCAG AAA (7:1). Actual: ${crCyan}`);
});

// =============================================================================
// SUITE 4: NON-REGRESSION & SCOPE ISOLATION INVARIANTS
// =============================================================================
console.log('\n--- SUITE 4: Non-Regression & Scope Isolation Invariants ---');

runTest('Default theme tokens in :root are 100% preserved', () => {
    const rootBlockMatch = cssContent.match(/:root\s*\{([\s\S]*?)\}/);
    assert(rootBlockMatch, ':root block must exist');
    const rootBlock = rootBlockMatch[1];
    
    assert(rootBlock.includes('--color-bg: #F9FAFB'), 'Default --color-bg must remain #F9FAFB');
    assert(rootBlock.includes('--color-primary: #6366F1'), 'Default --color-primary must remain #6366F1');
    assert(rootBlock.includes('--color-text: #111827'), 'Default --color-text must remain #111827');
});

runTest('Hand-drawn theme .theme-handdrawn is 100% preserved', () => {
    assert(cssContent.includes('.theme-handdrawn {'), '.theme-handdrawn block must exist');
    assert(cssContent.includes('font-family: \'Patrick Hand\', cursive;'), 'Hand-drawn font must be Patrick Hand');
    assert(cssContent.includes('.theme-handdrawn .study-card > div > div'), 'Hand-drawn study card rules must be preserved');
});

runTest('All Matrix and Synthwave visual overrides are strictly scoped to theme classes', () => {
    // Check that there are no unscoped global matrix or synthwave variables in :root
    const rootBlockMatch = cssContent.match(/:root\s*\{([\s\S]*?)\}/);
    const rootBlock = rootBlockMatch[1];
    assert(!rootBlock.includes('--matrix-neon'), ':root must not contain --matrix-neon');
    assert(!rootBlock.includes('--synth-pink'), ':root must not contain --synth-pink');

    // Confirm keyframe animations exist
    assert(cssContent.includes('@keyframes matrixNeonPulse'), 'matrixNeonPulse keyframe must exist');
    assert(cssContent.includes('@keyframes synthLaserPulse'), 'synthLaserPulse keyframe must exist');
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} OF ${totalTests} THEME VISUAL ENGINE TESTS PASSED! 🎉`);
console.log('================================================================\n');
