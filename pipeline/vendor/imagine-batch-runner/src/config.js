import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Auto-detect Chrome user data directory based on platform
 */
function getChromeUserDataDir() {
  // First, check if user set it via environment variable
  if (process.env.CHROME_USER_DATA_DIR) {
    return process.env.CHROME_USER_DATA_DIR;
  }

  // Auto-detect based on platform
  const platform = os.platform();
  const homeDir = os.homedir();

  let chromeDataDir;

  if (platform === 'darwin') {
    // macOS
    chromeDataDir = path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome');
  } else if (platform === 'win32') {
    // Windows
    chromeDataDir = path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  } else if (platform === 'linux') {
    // Linux
    chromeDataDir = path.join(homeDir, '.config', 'google-chrome');
  } else {
    return ''; // Unsupported platform
  }

  // Verify directory exists
  try {
    fs.accessSync(chromeDataDir);
    return chromeDataDir;
  } catch {
    return ''; // Chrome not installed or path doesn't exist
  }
}

export const config = {
  // Paths
  PROJECT_ROOT: path.resolve(__dirname, '..'),
  PROFILES_DIR: path.resolve(__dirname, '..', 'profiles'),
  RUNS_DIR: path.resolve(__dirname, '..', 'logs'),
  AUTORUN_LOGS_DIR: path.resolve(__dirname, '..', 'logs', 'autorun'),
  SINGLE_RUN_LOGS_DIR: path.resolve(__dirname, '..', 'logs', 'runs'),
  CACHE_DIR: path.resolve(__dirname, '..', 'cache'),

  // Timeouts (milliseconds)
  // 本机走代理访问 Grok，生成明显慢于直连；实测 180s 会在视频其实已经出来之后误判超时
  // （日志报 "Generation timeout after 181s"，但页面上视频已经生成完毕）。
  // 放宽到 10 分钟，宁可多等也不要把已经成功的片子丢在服务器上。
  VIDEO_GENERATION_TIMEOUT: 600000, // 600 seconds
  PAGE_LOAD_TIMEOUT: 30000,
  ELEMENT_WAIT_TIMEOUT: parseInt(process.env.ELEMENT_WAIT_TIMEOUT, 10) || 30000, // 30 seconds (configurable via env var)
  UI_ACTION_DELAY: 1000, // 1 second delay after UI actions (menu open/close, button clicks)

  // Brief settle period after _enterPrompt before clicking the Make Video button.
  // TipTap/ProseMirror is a rich-text editor that can re-render or run async
  // commit handlers after fill(); clicking generate in the same tick has caused
  // races where the submission captures a stale (empty/old) prompt. 400ms is
  // generous enough to cover the editor's onUpdate cycle without noticeably
  // slowing the loop.
  POST_PROMPT_SETTLE_DELAY: 400,

  // Content moderation retry configuration
  MODERATION_RETRY_MAX: 100, // Max retries for content moderation errors
  MODERATION_RETRY_COOLDOWN: 1000, // 1 second cooldown between moderation retries

  // Window after a mid-generation URL change to wait for fresh progress to appear
  // on the new URL. If no progress is detected within this window, we treat the
  // navigation as a moderation redirect (Grok occasionally bounces moderated
  // generations to an unrelated existing /post/<UUID> rather than showing a
  // moderation toast). 15s is generous enough that legit extends — where Grok
  // navigates to the new post URL and progress shows within 1–3s — never trip it.
  MODERATION_REDIRECT_TIMEOUT_MS: 15000,

  // Allowlist of paths copied from the account source profile into each
  // worker's ephemeral profile dir at launch. The full source profile is
  // ~220 MB, but only ~1 MB of it is actually load-bearing for Cloudflare
  // bypass and Grok auth — cookies (cf_clearance, __cf_bm, grok session),
  // per-origin Local Storage / IndexedDB, and a few prefs / credential
  // stores. The rest (HTTP cache, V8 code cache, GPU/shader caches, history,
  // sessions, sync data, etc.) is bookkeeping Cloudflare cannot see and
  // Chrome rebuilds on its own; copying it just burns disk I/O and turns
  // every orphaned worker dir into a multi-MB cleanup problem.
  //
  // Missing paths are skipped silently — a fresh account profile may not
  // have all of them yet, and that's fine: Playwright/Chrome will create
  // whatever's needed on first launch. Auth state failures still surface
  // via the existing `_isAuthenticated()` check in worker.initialize().
  //
  // If Cloudflare bypass ever starts failing after a Chrome update or CF
  // policy change, the first suspects are new storage locations Chrome
  // moved auth-adjacent state into — add them here.
  LEAN_PROFILE_INCLUDES: [
    // Cookies — cf_clearance, __cf_bm, grok session, etc.
    'Default/Cookies',
    'Default/Cookies-journal',
    // Per-origin storage — grok.com state, possibly CF Turnstile tokens
    'Default/Local Storage',
    'Default/Session Storage',
    'Default/IndexedDB',
    // Prefs + credential stores (fingerprint-adjacent flags, autofill, etc.)
    'Default/Preferences',
    'Default/Secure Preferences',
    'Default/Web Data',
    'Default/Web Data-journal',
    'Default/Login Data',
    'Default/Login Data-journal',
    // Network state — TLS resumption tickets, HSTS, Trust Tokens
    'Default/Network',
    'Default/Trust Tokens',
    'Default/Trust Tokens-journal',
    // Service worker registrations (if grok.com registers one)
    'Default/Service Worker/Database',
    // Browser-level state — Chrome reads these at startup
    'Local State',
    'First Run',
  ],

  // Generation settings
  DEFAULT_BATCH_SIZE: 10,

  // Parallel execution
  DEFAULT_PARALLELISM: 10,

  // Auto-run settings
  DEFAULT_AUTORUN_INTERVAL: 4 * 60 * 60 * 1000, // 2 hours in milliseconds
  DEFAULT_AUTORUN_CONFIG_DIR: './autorun-configs',
  AUTORUN_MIN_INTERVAL: 30 * 60 * 1000, // 30 minutes minimum

  // Auto-extend settings
  DEFAULT_AUTOEXTEND: 0, // 0 = disabled, 1-N = extend N times per video
  MAX_VIDEO_DURATION: 30, // seconds — Grok's maximum video length

  // Download/delete/upscale settings
  DEFAULT_DOWNLOAD_ENABLED: true,
  DEFAULT_UPSCALE_ENABLED: true,
  DEFAULT_DELETE_ENABLED: false,
  DEFAULT_DOWNLOAD_MAX_DURATION_ONLY: false, // Only download/process videos that reached MAX_VIDEO_DURATION
  DEFAULT_DOWNLOAD_AND_DELETE_REMAINING: false, // Cleanup remaining videos at end of run
  DOWNLOAD_DIR: path.resolve(__dirname, '..', 'downloads'),
  DOWNLOAD_TIMEOUT: 60000, // 60 seconds
  DOWNLOAD_RETRY_MAX: 3,
  DOWNLOAD_RETRY_DELAY: 2000, // 2 seconds between retries
  POST_GENERATION_DELAY: 1000, // 1s delay after generation before download
  POST_DOWNLOAD_DELAY: 1000, // 1s delay after download before delete/upscale

  // Upscale settings
  UPSCALE_TIMEOUT: 30000, // 30 seconds max wait for upscale
  UPSCALE_POST_COMPLETION_DELAY: 3000, // 3 seconds after HD badge appears
  UPSCALE_RETRY_MAX: 3,
  UPSCALE_RETRY_DELAY: 2000, // 2 seconds between retries

  // Browser settings
  HEADED_MODE: true, // Default to headed for debugging
  // 本机实测：1280x720 时 Grok 的生成按钮会被挤到可视区下方（Playwright 的 isVisible()
  // 只看 CSS 可见性，元素在视口外仍算"可见"，于是它点了个看不见的按钮 → 实际没提交）。
  // 加高到 960 让生成按钮落在视口内。
  VIEWPORT: { width: 1280, height: 960 },

  // Chrome profile settings (auto-detected or from environment variables)
  // Copying your real Chrome profile helps avoid bot detection
  CHROME_USER_DATA_DIR: getChromeUserDataDir(),
  CHROME_PROFILE_NAME: process.env.CHROME_PROFILE_NAME || 'Default',
};

// UI Selectors (centralized for easy updates)
export const selectors = {
  // Video generation buttons (new UI: button[aria-label="Make video"] wrapping a filled arrow div)
  // 注意：Grok 界面会跟随账号语言。中文界面下生成按钮的 aria-label 是「生成视频」，
  // 英文选择器一条都匹配不上，会掉进兜底扫描并误点到「Remove image」，必须带中文。
  MAKE_VIDEO_BUTTON: 'button[aria-label*="make video" i], button[aria-label*="generate video" i], button[aria-label*="create video" i], button[aria-label*="生成视频"], button[aria-label*="创作视频"], button:has-text("Make video"), button:has-text("make video"), button:has-text("Create video"), button:has-text("create video"), button:has-text("生成视频"), button[title*="make video" i], button[title*="generate video" i], button[title*="create video" i]',
  REDO_BUTTON: 'button:has-text("Redo"), button:has-text("redo"), button[aria-label*="redo" i], button[aria-label*="重新生成"], button[title*="redo" i]',

  // Prompt input (new UI uses TipTap/ProseMirror contenteditable div; old UI uses textarea/input)
  PROMPT_INPUT: '[contenteditable="true"].tiptap, [contenteditable="true"].ProseMirror, textarea[placeholder*="prompt"], input[placeholder*="prompt"], [contenteditable="true"], textarea, input[type="text"]',

  // Video generation states
  VIDEO_CONTAINER: 'video, [role="video"]',

  // Error detection（中文界面同样要匹配）
  CONTENT_MODERATED_MESSAGE: 'text=/try a different idea|content moderated|moderated|blocked|换个想法|内容审核|已被拦截|违规/i',
  NETWORK_ERROR_MESSAGE: 'text=/network error|connection lost|failed to load|网络错误|连接中断|加载失败/i',
  GENERATION_ERROR_MESSAGE: 'text=/generation failed|error generating|something went wrong|生成失败|出错了/i',

  // Rate limit indicators (must have Upgrade button to be a true rate limit)
  RATE_LIMIT_TOAST: 'button:has-text("Upgrade"), button:has-text("升级"), button:has-text("开通会员")',

  // Resolution downgrade toast (informational, generation continues at lower resolution)
  RESOLUTION_DOWNGRADE_TOAST: 'text=/\\d+p.*rate limit.*switched.*\\d+p/i',

  // Success indicators
  VIDEO_DOWNLOAD_BUTTON: 'button:has-text("Download"), button:has-text("Save"), button:has-text("下载"), button:has-text("保存"), a[download]',

  // Authentication
  LOGIN_BUTTON: 'button:has-text("Log in"), button:has-text("Sign in"), button:has-text("登录"), button:has-text("注册")',

  // Options and quality
  OPTIONS_BUTTON: 'button:has-text("Options"), button:has-text("选项")',
  HD_BUTTON: 'button:has-text("HD"), button:has-text("高清")',

  // Download button (aria-label="Download" / 中文「下载」)
  DOWNLOAD_BUTTON: 'button[aria-label*="download" i], button[aria-label*="Download"], button[aria-label*="下载"], button[aria-label*="保存"]',

  // Delete flow - "More options" button (aria-label="More options" / 中文「更多选项」)
  VIDEO_MENU_BUTTON: 'button[aria-label*="more options" i], button[aria-label*="More options"], button[aria-label*="更多选项"], button[aria-label*="更多"]',

  // Delete menu item (role="menuitem" containing "Delete" / 中文「删除」)
  DELETE_MENU_ITEM: '[role="menuitem"]:has-text("Delete"), [role="menuitem"]:has-text("delete"), [role="menuitem"]:has-text("删除")',

  // Delete confirmation modal
  DELETE_CONFIRM_BUTTON: '[role="dialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Delete"), button:has-text("Confirm"), [role="dialog"] button:has-text("删除"), [role="alertdialog"] button:has-text("删除"), button:has-text("确认")',
  DELETE_MODAL: '[role="dialog"], [role="alertdialog"]',

  // Upscale flow（中文「放大」/「提升画质」）
  UPSCALE_MENU_ITEM: '[role="menuitem"]:has-text("Upscale"), [role="menuitem"]:has-text("upscale"), [role="menuitem"]:has-text("放大"), [role="menuitem"]:has-text("提升画质"), [role="menuitem"]:has-text("高清")',
  UPSCALING_INDICATOR: 'text=/upscaling|画质提升中|放大中/i',
  HD_BADGE: 'text=/^HD$/i',

  // Direct "Video" mode toggle button (current Grok UI, April 2026)
  VIDEO_MODE_BUTTON: 'button[aria-label="Video"], button[aria-label="video"], button[aria-label="视频"]',

  // Settings button (gear icon next to prompt, opens mode selection menu — legacy UI)
  SETTINGS_BUTTON: 'button[aria-label="Settings"], button[aria-label="settings"], button[aria-label="设置"]',

  // "Make Video" mode menu item (inside Settings menu, switches from image to video mode — legacy UI)
  MAKE_VIDEO_MODE_ITEM: '[role="menuitem"]:has-text("Make Video"), [role="menuitem"]:has-text("Make video"), [role="menuitem"]:has-text("生成视频")',

  // Extend menu item (inside "..." more options menu).
  // Current Grok UI (May 2026) labels it just "Extend"; legacy UI used "Extend video"。
  // 中文界面下是「扩展」/「扩展视频」。:text-is 精确匹配，避免误抓「Extend from frame」。
  EXTEND_MENU_ITEM: '[role="menuitem"]:text-is("Extend"), [role="menuitem"]:text-is("extend"), [role="menuitem"]:has-text("Extend video"), [role="menuitem"]:text-is("扩展"), [role="menuitem"]:has-text("扩展视频")',

  // "Extend from frame" button (appears on hover over video progress bar)
  EXTEND_FROM_FRAME_BUTTON: 'button:has-text("extend from frame"), button:has-text("Extend from frame"), button:has-text("Extend from Frame"), button:has-text("从帧扩展"), button:has-text("从该帧扩展")',

  // Announcement banner dismiss button (X button inside z-[9999] banner)
  ANNOUNCEMENT_BANNER_DISMISS: 'div.absolute[class*="z-[9999]"] button:has(svg.lucide-x)',

  // Thumbnail navigation for cleanup (uses semantic alt text, excludes Favorites button)
  // 注意：alt 文案会跟随界面语言，中文下可能不是 "Thumbnail"，因此补一条通用分支。
  THUMBNAIL_BUTTON: 'button:has(img[alt^="Thumbnail"]):not([aria-label="Favorites"]), button:has(img[alt^="缩略图"]):not([aria-label="Favorites"])',
};

export default config;
