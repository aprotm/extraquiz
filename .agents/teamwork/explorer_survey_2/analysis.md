# Comprehensive Technical Analysis: Dashboard, AI Command Hub & Analytics Visualizations (Requirement R2)

**Author:** Explorer 2 (Dashboard & AI Components Explorer)  
**Date:** 2026-09-24  
**Target Files:**  
- `js/components/lexilearndashboard.js` (Primary Neuro-Cognitive Lab Dashboard)  
- `js/components/dashboard.js` (Classic/Companion Dashboard)  
- `js/app.js` (Shell, Router, Layout Wrapper)  
- `js/memoryengine.js` (HLR Retention Decay Engine)  
- `js/ranks.js`, `js/badges.js`, `js/store.js`  
- `css/style.css` (Design System & Theming Tokens)

---

## 1. Architectural Overview & Component Ecosystem

### 1.1 Component Roles & Route Mapping
The LexiLearn application features two interconnected dashboard interfaces within its Vue 3 SPA architecture:
1. **`LexiLearnDashboard` (`js/components/lexilearndashboard.js`, 1261 lines, 94.5 KB)**:
   - Route: `'lexilearn-dashboard'`.
   - Title: *Neuro-Cognitive Lab (Trung Tâm Thí Nghiệm Trí Nhớ & Nhận Thức)*.
   - Role: Advanced analytics command center housing the 5 core telemetry widgets: Hero Command Hub, HLR Retention Decay v3.2 widget, 5-axis Cognitive Radar chart, 7-day study pace chart, and 365-day Heatmap matrix.
   - Shell treatment in `js/app.js`: When `store.currentRoute === 'lexilearn-dashboard'`, `app.js` hides its global `<aside>` sidebar and renders `LexiLearnDashboard` inside an unpadded container (`p-0 sm:p-0 lg:p-0`), because `LexiLearnDashboard` renders its own fullscreen viewport (`fixed inset-0 z-[100]`), topbar, and dedicated internal sidebar.
2. **`Dashboard` (`js/components/dashboard.js`, 612 lines, 44.1 KB)**:
   - Route: `'dashboard'`.
   - Title: *ExtraQuiz Classic v1.0*.
   - Role: Standard deck management dashboard, Daily Spark motivational quote widget, Arcade Hub quick launch (Boss Battle, Cyber Cipher, AI Arena, Matching Game), and basic 7-day bar chart.
   - Cross-navigation: The classic dashboard features a "Lexi Pro" button (`@click="store.navigate('lexilearn-dashboard')"`) with a gold crown icon, while `LexiLearnDashboard` has a quick back button "ExtraQuiz Classic v1.0" (`@click="store.navigate('dashboard')"`).

---

## 2. In-Depth Inspection of the 5 Core Analytical Widgets

### 2.1 Hero Command Hub
- **Source Location:** `js/components/lexilearndashboard.js`, Lines 692–759.
- **Companion Hub:** Streak Telemetry Hub, Lines 761–798.
- **DOM Hierarchy:**
  ```html
  <div class="lg:col-span-2 bg-gradient-to-br from-[#0D1326] via-[#0A0F1E] to-[#070A14] border border-[#18223D] rounded-3xl p-7 relative overflow-hidden flex flex-col justify-between shadow-xl" style="min-height: 270px;">
    <!-- Ambient Radial Glow: dynamically uses currentTheme.hex -->
    <div class="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-[100px] opacity-25 pointer-events-none transition-all duration-700" :style="{ backgroundColor: currentTheme.hex }"></div>
    
    <!-- Header Block: Avatar + Cognitive Status Badges + Greeting -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
      <div class="flex items-center gap-5">
        <!-- Avatar with Glowing Neon Border -->
        <div class="w-18 h-18 rounded-2xl bg-[#111933] border-2 border-indigo-500/30 ...">
          <img :src="store.userProfile?.avatar || dicebearFallback" />
        </div>
        <div>
          <!-- Brainwave State Pill & CPI Indicator -->
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <i class="fa-solid fa-wave-square text-[9px] animate-pulse"></i> {{ cognitiveRadar.brainwaveState }}
            </span>
            <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              CPI: {{ cognitiveRadar.cpi }}/100
            </span>
          </div>
          <!-- User Greeting (CURRENTLY CONTAINS EMOJI 👋) -->
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Chào buổi tối, {{ firstName }} <span class="animate-wave inline-block origin-bottom-right">👋</span>
          </h1>
          <p class="text-xs sm:text-sm text-gray-400 leading-relaxed mt-1">Hệ thống HLR đã sẵn sàng...</p>
        </div>
      </div>
      <!-- Action CTAs -->
      <div class="flex flex-row sm:flex-col gap-2.5 w-full sm:w-auto shrink-0">
        <button @click="startReview" class="... font-extrabold py-3 px-5 rounded-xl text-xs uppercase" :class="currentTheme.btn">
          <i class="fa-solid fa-bolt text-xs"></i> Ôn Tập Cấp Tốc
        </button>
        <button @click="store.navigate('dashboard')" class="... bg-[#111933] ... text-xs">
          <i class="fa-solid fa-gamepad text-indigo-400 text-xs"></i> Võ Đài Arcade
        </button>
      </div>
    </div>
    
    <!-- 3-Metric Bottom Bar: LexiCredit, Streak, Today Words -->
    <div class="grid grid-cols-3 gap-3 relative z-10 mt-6 pt-4 border-t border-[#18223D]/80">
      <!-- Star, Fire, Chart icons with live telemetry counts -->
    </div>
  </div>
  ```
- **Data Flow:**
  - `store.userProfile` provides `avatar`, `displayName`, `totalLexiCredit`.
  - `cognitiveRadar` computed provides `brainwaveState` and `cpi`.
  - `stats.value` provides `streak` and `todayWords`.
  - `currentTheme` provides reactive gradient classes and glow colors.

---

### 2.2 HLR Retention Decay v3.2 Widget
- **Source Location:** `js/components/lexilearndashboard.js`, Lines 800–941.
- **Computed Engine:** `aiCoachStats` (Lines 224–315).
- **Underlying Math & Half-Life Regression Model:**
  - Uses `calculateRetentionProb(halfLifeMinutes, deltaMinutes)` from `js/memoryengine.js`:
    $$R(t) = 2^{-\Delta t / h}$$
  - For each card $c \in \text{userCards}$:
    - Calculates $\Delta t = (\text{now} - \text{lastReview}) / 60000$ (minutes elapsed).
    - Half-life $h = c.\text{recognition\_half\_life} \parallel 1440$ (default 24h).
    - If $\Delta t < 1440$ and never reviewed before, $R(t) = 1.0$.
    - Card status partitioning:
      - Active: $R(t) \ge 0.80$ or card.status === 'active'
      - Reinforcing: $0.50 \le R(t) < 0.80$
      - Passive: $R(t) < 0.50$
      - Needs Review: $R(t) < 0.85$ (`reviewWords++`)
  - Aggregate metrics:
    - `avgRetention`: $\text{round}\left(\frac{\sum R(t)}{N} \times 100\right)$
    - `daysAbsent`: $\max(\Delta t_{\text{days}})$ across deck
    - `isLongAbsence`: $(\text{daysAbsent} \ge 3 \land \text{avgRetention} < 65) \lor (\text{avgRetention} < 50 \land \text{reviewWords} > 0)$
    - `stabilityScore`: $\max\left(15, \text{round}(0.7 \cdot \text{avgRetention} + 0.3 \cdot (100 - \min(100, \text{daysAbsent} \cdot 5)))\right)$
    - `curveEndY`: Map retention to SVG Y-coordinate between $Y=12$ (100% retention) and $Y=105$ (20% retention):
      $$\text{curveEndY} = \min(105, \max(12, \text{round}(8 + (100 - \text{avgRetention}) \times 0.94)))$$
- **DOM & SVG Architecture:**
  - Left column: Dynamic diagnosis header, narrative description, and 3 telemetry metric cards (Tỷ Lệ Nhớ, Thời Gian Phục Hồi, Độ Bền HLR).
  - Right column: Custom SVG Ebbinghaus Curve:
    ```html
    <svg viewBox="0 0 300 120" class="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="largeCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#818CF8" />
          <stop offset="50%" stop-color="#22D3EE" />
          <stop offset="100%" :stop-color="aiCoachStats.avgRetention < 50 ? '#F43F5E' : '#EAB308'" />
        </linearGradient>
      </defs>
      <!-- Horizontal Reference Gridlines: 100% (Y=8), 85% dashed (Y=52), 20% (Y=102) -->
      <line x1="30" y1="8" x2="300" y2="8" stroke="#16203D" stroke-width="1" />
      <line x1="30" y1="52" x2="300" y2="52" stroke="#16203D" stroke-dasharray="4,4" stroke-width="1" />
      <line x1="30" y1="102" x2="300" y2="102" stroke="#16203D" stroke-width="1" />
      <!-- Quadratic Bezier Curve -->
      <path :d="'M 30 8 Q 110 25, 200 ' + Math.min(95, aiCoachStats.curveEndY - 10) + ' T 270 ' + aiCoachStats.curveEndY" 
            fill="none" stroke="url(#largeCurveGrad)" stroke-width="4" stroke-linecap="round" />
      <!-- Pulsing Data Endpoint Dot -->
      <circle cx="270" :cy="aiCoachStats.curveEndY" r="6" :fill="aiCoachStats.avgRetention < 50 ? '#F43F5E' : '#EAB308'" class="animate-ping opacity-75" />
      <circle cx="270" :cy="aiCoachStats.curveEndY" r="4" :fill="aiCoachStats.avgRetention < 50 ? '#F43F5E' : '#EAB308'" stroke="#070A14" stroke-width="2" />
      <!-- Floating Badge Tooltip -->
      <g :transform="'translate(205, ' + Math.max(8, aiCoachStats.curveEndY - 26) + ')'">
        <rect width="66" height="20" rx="6" ... />
        <text x="33" y="14" ...>Pr: {{ aiCoachStats.avgRetention }}%</text>
      </g>
    </svg>
    ```

---

### 2.3 5-Axis Cognitive Radar Chart
- **Source Location:** `js/components/lexilearndashboard.js`, Lines 986–1030.
- **Computed Engine:** `cognitiveRadar` (Lines 372–417).
- **Geometric Model:**
  - 5 Axes spaced at $72^\circ$ intervals centered at $(c_x, c_y) = (100, 100)$ with maximum radius $R_{\max} = 68$:
    1. **Consistency (Kiên trì):** Angle $-90^\circ$ (Top vertex: $100, 32$)
    2. **Focus (Tập trung):** Angle $-18^\circ$ (Top-right vertex: $165, 79$)
    3. **Persistence (Bền bỉ):** Angle $54^\circ$ (Bottom-right vertex: $140, 155$)
    4. **Metacognition (Nhận thức):** Angle $126^\circ$ (Bottom-left vertex: $60, 155$)
    5. **Exploration (Khám phá):** Angle $198^\circ$ (Top-left vertex: $35, 79$)
  - Dynamic live vertex coordinate formula:
    $$x_i = \text{round}\left(100 + \frac{v_i}{100} \cdot 68 \cdot \cos\left(\frac{\theta_i \cdot \pi}{180}\right)\right)$$
    $$y_i = \text{round}\left(100 + \frac{v_i}{100} \cdot 68 \cdot \sin\left(\frac{\theta_i \cdot \pi}{180}\right)\right)$$
- **DOM & SVG Architecture:**
  ```html
  <svg viewBox="0 0 200 200" class="w-36 h-36 overflow-visible">
    <!-- Outer Static Web Grid -->
    <polygon points="100,32 165,79 140,155 60,155 35,79" fill="none" stroke="#18223D" stroke-width="1" />
    <!-- Inner Static Dashed Web Grid (50%) -->
    <polygon points="100,55 143,86 127,137 73,137 57,86" fill="none" stroke="#141C30" stroke-width="1" stroke-dasharray="2,2" />
    <!-- 5 Radial Spoke Lines -->
    <line x1="100" y1="100" x2="100" y2="32" stroke="#18223D" stroke-width="1" />
    <!-- ... 4 other lines ... -->
    <!-- Reactive Live Polygon -->
    <polygon :points="cognitiveRadar.polygonPoints" 
             fill="rgba(168,85,247,0.25)" stroke="#A855F7" stroke-width="2" stroke-linejoin="round" 
             class="filter drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-700" />
    <circle cx="100" cy="100" r="3" fill="#A855F7" />
  </svg>
  ```
- **Footer:** 5-column breakdown with dimension scores (Kiên, Tập, Bền, Thức, Phá).

---

### 2.4 7-Day Study Pace Chart (Velocity Chart)
- **Source Location:** `js/components/lexilearndashboard.js`, Lines 946–984.
- **Computed Engine:** `velocity7Days` (Lines 318–370).
- **Data Flow & Logic:**
  - Slices last 7 days (`i = 6 down to 0`) relative to today.
  - Aggregates study activity from `stats.value.history` mapped by ISO date (`YYYY-MM-DD`).
  - Normalizes heights against `maxWords = Math.max(15, ...words)`:
    $$\text{heightPercent} = \min(100, \max(8, \text{round}((\text{words} / \text{maxWords}) \times 100)))$$
- **DOM Generation (Pure HTML/CSS Flexbox):**
  ```html
  <div class="h-36 flex items-end justify-between gap-2 pt-4 px-1">
    <div v-for="(day, idx) in velocity7Days.days" :key="idx" 
         class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer relative">
      <!-- Hover Tooltip -->
      <div class="absolute -top-7 bg-[#141C30] text-white font-mono text-[9px] px-2 py-0.5 rounded shadow-lg border border-[#202D4E] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
        {{ day.words }} từ ({{ day.date }})
      </div>
      <!-- Vertical Bar -->
      <div class="w-full rounded-t-lg transition-all duration-500 relative overflow-hidden" 
           :style="{ height: day.heightPercent + '%' }"
           :class="day.isToday ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : (day.words > 0 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400/80 group-hover:brightness-125' : 'bg-[#141C30]')">
      </div>
      <!-- Day of Week Label -->
      <span class="text-[10px] font-bold" :class="day.isToday ? 'text-cyan-400' : 'text-gray-500'">{{ day.label }}</span>
    </div>
  </div>
  ```

---

### 2.5 365-Day Neural Activity Matrix (Heatmap)
- **Source Location:** `js/components/lexilearndashboard.js`, Lines 1163–1212.
- **Computed Engine:** `heatmapWeeks` (Lines 137–209) & `dynamicMonths` (Lines 212–221).
- **Data Flow & Logic:**
  - Builds calendar array of exactly 365 consecutive days ending today.
  - Groups into 52–53 week columns starting on Monday:
    - First week padded with `null` so Monday = 0 (`(days[0].getDay() + 6) % 7`).
    - Last week padded with `null` to complete 7 cells.
  - Maps word count thresholds to intensity levels 0–4:
    - Level 0 (0 words): `bg-[#0E1528] border-[#18223D]`
    - Level 1 (1–10 words): `bg-[#064E3B] border-[#064E3B]`
    - Level 2 (11–20 words): `bg-[#047857] border-[#047857]`
    - Level 3 (21–50 words): `bg-[#10B981] border-[#10B981]`
    - Level 4 (>50 words): `bg-[#34D399] border-[#34D399]`
- **DOM Generation:**
  - Horizontal scroll container with custom scrollbar: `<div class="overflow-x-auto custom-scrollbar pb-2 pt-4">`.
  - Inner container with minimum width: `<div class="min-w-[700px]">`.
  - Header month row: 12 dynamically computed month abbreviations (`dynamicMonths`).
  - Grid body: Day of week labels (`Mon`, ``, `Wed`, ``, `Fri`, ``, `Sun`) paired with 52–53 vertical column flex containers (`flex flex-col gap-1.5`).
  - Cells: `w-3 h-3 rounded-sm relative` (12x12px), `group hover:scale-125 hover:z-50 cursor-pointer`.
  - Interactive tooltip: `<div class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-[#090D18] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl border border-[#1E294A] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">{{ day.words }} từ học ngày {{ day.date }}</div>`.

---

## 3. Emoji Audit & Vector Icon Replacement Mapping

Requirement R1/R2 and Acceptance Criteria explicitly mandate:
> *"100% Vector icons đồng bộ, không sử dụng emoji cho các nút bấm hành động hoặc menu điều hướng."*

Below is the exhaustive inventory of all emojis identified across `lexilearndashboard.js` and `dashboard.js`:

| # | File | Line # | Current Emoji/Image | Context | Recommended Vector Replacement |
|---|------|--------|---------------------|---------|--------------------------------|
| 1 | `lexilearndashboard.js` | 715 | `👋` (Unicode `\uD83D\uDC4B`) | Greeting in Hero Command Hub: `Chào buổi tối, {{ firstName }} 👋` | `<i class="fa-solid fa-sparkles text-amber-400"></i>` or `<i class="fa-solid fa-hand-wave text-amber-400"></i>` |
| 2 | `lexilearndashboard.js` | 593 | `🔥` (Unicode `\uD83D\uDD25`) | Lab Mini Telemetry Widget: `🔥 {{ stats?.streak }} ngày` | `<i class="fa-solid fa-fire text-amber-400"></i>` |
| 3 | `lexilearndashboard.js` | 85, 1243 | `🏆` (Unicode `\uD83C\uDFC6`) | Fallback badge icon in `getBadgeIcon()` and Trophy Vault | `<i class="fa-solid fa-trophy text-amber-400"></i>` |
| 4 | `dashboard.js` | 202 | Fluent 3D Emoji `waving_hand_3d_default.png` | Greeting heading in Classic Dashboard | `<i class="fa-solid fa-sparkles text-amber-500"></i>` |
| 5 | `dashboard.js` | 244 | Fluent 3D Emoji `sparkles_3d.png` | Daily Spark motivational quote icon | `<i class="fa-solid fa-quote-left text-amber-400"></i>` or `<i class="fa-solid fa-lightbulb text-amber-400"></i>` |
| 6 | `dashboard.js` | 294 | `🐉` (Dragon emoji) | Arcade Hub: "Đấu Trùm" button | `<i class="fa-solid fa-dragon text-2xl text-rose-500 mb-1.5"></i>` |
| 7 | `dashboard.js` | 304 | `👾` (Alien monster emoji) | Arcade Hub: "Giải Mã" button | `<i class="fa-solid fa-terminal text-2xl text-cyan-400 mb-1.5"></i>` |
| 8 | `dashboard.js` | 314 | `⚔️` (Crossed swords emoji) | Arcade Hub: "Đấu Trí AI" button | `<i class="fa-solid fa-crosshairs text-2xl text-purple-400 mb-1.5"></i>` |
| 9 | `dashboard.js` | 324 | `🧩` (Puzzle piece emoji) | Arcade Hub: "Nối Cặp Từ" button | `<i class="fa-solid fa-shapes text-2xl text-amber-400 mb-1.5"></i>` |
| 10| `dashboard.js` | 577 | `🏆` (Trophy emoji) | Rank Guide Modal Header: `Bảng Phong Thần` | `<i class="fa-solid fa-trophy text-amber-500"></i>` |

---

## 4. Responsive Design, Viewport Constraints & Touch Targets

### 4.1 Severe Mobile Responsiveness Defect (< 1024px, down to 375px)
- **Current Observation (`lexilearndashboard.js`, Line 484):**
  ```html
  <div class="w-64 bg-[#090D18] border-r border-[#141C30] flex flex-col z-20 flex-shrink-0 select-none relative">
  ```
  The sidebar is rendered with fixed width `w-64` (256px) **unconditionally on all viewports**.
- **Impact on 375px Mobile Screen:**
  - Viewport width = 375px.
  - Sidebar width = 256px.
  - Remaining viewport for dashboard content = $375 - 256 = \mathbf{119px}$!
  - This causes severe horizontal overflow, squashed text, distorted SVG charts, and unreadable metrics.
- **Architectural Solution:**
  1. Hide the fixed sidebar on mobile and tablet: `class="hidden lg:flex flex-col w-64 bg-[#090D18] ..."`
  2. Implement a responsive mobile navigation drawer with a hamburger trigger (`fa-solid fa-bars`) in the topbar, or integrate with `app.js`'s bottom navigation bar.
  3. Change the main content padding from `p-6 lg:p-8` to `p-3.5 sm:p-5 lg:p-8` so 375px viewports have 347px of usable canvas width.

### 4.2 Interactive Touch Target Violations (< 44x44px)
The WCAG 2.1 Success Criterion 2.5.5 and project acceptance criteria require:
> *"Kích thước vùng bấm (touch target) trên di động đạt tối thiểu 44x44px."*

Audit of interactive controls:
1. **Cyber Aura Switcher Button** (Line 654):
   - Current: `px-3 py-1.5 rounded-xl text-xs` (Height: ~32px). **VIOLATION.**
   - Recommendation: `min-h-[44px] min-w-[44px] px-3.5 py-2.5`.
2. **Sidebar Navigation Buttons** (Lines 513, 526, 537, 545, etc.):
   - Current: `px-3.5 py-2.5 rounded-xl text-sm` (Height: ~40px). **VIOLATION.**
   - Recommendation: `min-h-[44px] py-3 px-3.5`.
3. **Hero Quick Action Buttons** (Line 721, 724):
   - Current: `py-3 px-5 text-xs` (Height: ~42px). **BORDERLINE.**
   - Recommendation: Add explicit `min-h-[44px] flex items-center justify-center`.
4. **Heatmap Daily Cells** (Line 1194):
   - Current: `w-3 h-3` (12x12px). On touch screens, 12px is too small for precision finger tapping.
   - Recommendation: Add a pseudo-element tap zone `before:absolute before:-inset-1` or an interactive "Inspect Day" card/bottom sheet on mobile tap.

---

## 5. Visual Theme & WCAG AA Contrast Evaluation

### 5.1 Glassmorphism & Cyber-Dark Aesthetics
The current implementation utilizes dark opaque solid background colors (`#070A13`, `#0D1326`, `#0A0F1E`). To meet the **Modern Cyber-Dark & Glassmorphism (Neuroscience & AI Lab theme)** standard:
- **Card Surfaces:**
  - Transition from opaque dark gradients to frosted glass:
    `bg-[#0A1020]/70 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.08)]`
- **Gradients & Accents:**
  - Leverage translucent neon accent halos (Deep Indigo `#6366F1`, Cyber Cyan `#06B6D4`, Bio Emerald `#10B981`, Laser Rose `#F43F5E`).
- **Dynamic Theming System:**
  - Preserve `themePresets` and `cycleTheme()`, but bind variables to CSS custom properties (`--neon-accent`, `--neon-glow`) to allow smooth global transition without hardcoded style attribute overrides.

### 5.2 WCAG AA Contrast Analysis (4.5:1 Requirement)
- **Defects Identified:**
  - Multiple labels in `lexilearndashboard.js` use `text-gray-500` (#6B7280) on dark surfaces (#0C1224, #080C1A, #070A13).
  - Measured contrast of #6B7280 against #0C1224: **3.4:1** (Fails 4.5:1 WCAG AA threshold for normal text).
  - Specific failing text:
    - Line 599: `text-[8px] font-bold text-gray-500 uppercase` ("Tổng từ")
    - Line 604: `text-[8px] font-bold text-gray-500 uppercase` ("Độ bền HLR")
    - Line 737, 746, 755: `text-[9px] text-gray-500 uppercase`
    - Line 779, 783: `text-[10px] text-gray-500 font-bold uppercase`
    - Line 841, 856, 864: `text-[9px] font-black text-gray-500 uppercase`
    - Line 958: `text-[9px] text-gray-500 uppercase`
    - Line 1024–1028: `text-[9px] text-gray-500 font-bold` (Radar dimension labels)
    - Line 1152, 1156: `text-[9px] uppercase text-gray-500 font-bold`
    - Line 1184, 1189: `text-[10px] text-gray-500 font-bold` (Heatmap months and days)
- **Remediation:**
  - Replace all `text-gray-500` on dark surfaces with `text-slate-400` (#94A3B8, contrast 5.7:1, PASSES AA) or `text-gray-300` (#CBD5E1, contrast 8.5:1, PASSES AAA).

---

## 6. Concrete Refactoring Recommendations for Implementation Team

1. **Responsive Viewport Architecture:**
   - Add `hidden lg:flex` to the internal sidebar in `lexilearndashboard.js`.
   - Add a mobile header bar with hamburger menu toggle for mobile devices.
   - Adjust page padding from `p-6 lg:p-8` to `p-3.5 sm:p-5 lg:p-8`.
2. **True Glassmorphism Utility Integration:**
   - Refactor card containers to use `bg-[#0B1226]/65 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]`.
   - Enhance the Ebbinghaus curve with an area gradient fill underneath the line.
   - Add concentric rings and vertex glow dots to the Cognitive Radar Pentagon.
3. **100% Vector Icon Replacement:**
   - Remove waving hand `👋` from line 715; replace with `<i class="fa-solid fa-sparkles text-amber-400"></i>`.
   - Remove fire `🔥` from line 593; replace with `<i class="fa-solid fa-fire text-amber-400"></i>`.
   - Ensure all badge fallbacks use `<i class="fa-solid fa-trophy"></i>`.
4. **Touch Target Standardization:**
   - Ensure every button, chip, and link has `min-height: 44px` and `min-width: 44px`.
5. **WCAG AA Contrast Fixes:**
   - Global search and replace of `text-gray-500` with `text-slate-400` on all dark-mode cards in `lexilearndashboard.js`.
