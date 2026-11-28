import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Globe,
  IdCard,
  RefreshCw,
  Server,
  Settings,
  Ticket,
  Trophy,
  Users,
} from 'lucide-react';
import DayNightSlider from './components/DayNightSlider.jsx';
import { TicketEmblem } from './components/Emblems.jsx';
import LeaderboardTab from './components/LeaderboardTab.jsx';
import ProbeTab from './components/ProbeTab.jsx';
import SettingsDrawer from './components/SettingsDrawer.jsx';
import SitesTab from './components/SitesTab.jsx';
import TicketTab from './components/TicketTab.jsx';
import VisitorsTab from './components/VisitorsTab.jsx';
import WhatsNewModal, { SEEN_VERSION_STORAGE_KEY } from './components/WhatsNewModal.jsx';
import { apiRequest, getDevRole, setDevRole } from './lib/api.js';
import {
  getLaunchTarget,
  getTelegramColorScheme,
  getTelegramUserId,
  haptic,
  initTelegramWebApp,
  onColorSchemeChange,
  syncTelegramChrome,
} from './lib/telegram.js';
import {
  applyDaylightThemeToDocument,
  normalizeDaylightPos,
  normalizeDockStyle,
  normalizeThemePreset,
} from './lib/themes.js';

const BOOT_CACHE_PREFIX = 'rose_panel_boot_v1:';
const THEME_MODE_STORAGE_KEY = 'rose_panel_theme_mode';
const DEFAULT_NAV_ORDER = ['profile', 'sites', 'probe', 'visitors', 'leaderboard'];

function sortNavItemsByOrder(items, rawOrder) {
  const order = Array.isArray(rawOrder) && rawOrder.length > 0 ? rawOrder : DEFAULT_NAV_ORDER;
  const rank = (id) => {
    const idx = order.indexOf(id);
    if (idx >= 0) return idx;
    const defIdx = DEFAULT_NAV_ORDER.indexOf(id);
    return order.length + (defIdx >= 0 ? defIdx : DEFAULT_NAV_ORDER.length);
  };
  return [...items].sort((a, b) => rank(a.id) - rank(b.id));
}

function readDaylightPref() {
  try {
    const saved = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (!saved || saved === 'auto') return { auto: true, pos: null };
    if (saved === 'dark') return { auto: false, pos: 0 };
    if (saved === 'light') return { auto: false, pos: 1 };
    if (saved.startsWith('pos:')) {
      const n = Number(saved.slice(4));
      if (Number.isFinite(n)) return { auto: false, pos: normalizeDaylightPos(n) };
    }
    const num = Number(saved);
    if (Number.isFinite(num)) return { auto: false, pos: normalizeDaylightPos(num) };
  } catch {
    // Storage may be unavailable in some WebViews
  }
  return { auto: true, pos: null };
}
const BOOT_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function readSplashMeta() {
  if (typeof window !== 'undefined' && window.__ROSE_SPLASH__) {
    return window.__ROSE_SPLASH__;
  }
  return {
    displayName: 'RosePanel',
    style: 'emblem',
    text: '正在打开个人面板…',
    emoji: '🌹',
    emblem: { type: 'builtin', variant: 'owner' },
  };
}

function getBootCacheKey() {
  const uid = getTelegramUserId();
  return `${BOOT_CACHE_PREFIX}${uid || `dev_${getDevRole()}`}`;
}

function loadCachedBootstrap() {
  try {
    const raw = localStorage.getItem(getBootCacheKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data?.ok || Date.now() - Number(parsed.savedAt || 0) > BOOT_CACHE_MAX_AGE_MS) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function saveCachedBootstrap(data) {
  try {
    if (!data?.ok) return;
    localStorage.setItem(getBootCacheKey(), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

function SplashScreen({ splash }) {
  const style = splash?.style || 'emblem';
  const text = splash?.text || '正在打开个人面板…';
  const displayName = splash?.displayName || 'RosePanel';

  if (style === 'skeleton') {
    return (
      <div className="app-shell">
        <div className="top-bar" style={{ marginBottom: 14 }}>
          <div className="skeleton-pill" style={{ width: 120, height: 22 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton-circle" style={{ width: 34, height: 34 }} />
          </div>
        </div>
        <div className="card skeleton-card" style={{ height: 196, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="skeleton-circle" style={{ width: 46, height: 46 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-line" style={{ width: '52%', height: 16 }} />
              <div className="skeleton-line" style={{ width: '34%', height: 11, marginTop: 8 }} />
            </div>
          </div>
          <div className="skeleton-pill" style={{ width: 92, height: 22, marginTop: 16 }} />
          <div className="skeleton-line" style={{ width: '88%', height: 12, marginTop: 14 }} />
          <div className="skeleton-line" style={{ width: '64%', height: 12, marginTop: 8 }} />
        </div>
        <div className="card skeleton-card" style={{ padding: 16 }}>
          <div className="skeleton-line" style={{ width: '32%', height: 13, marginBottom: 14 }} />
          <div className="skeleton-line" style={{ width: '78%', height: 14, marginBottom: 12 }} />
          <div className="skeleton-line" style={{ width: '68%', height: 14 }} />
        </div>
        <div className="splash-caption" style={{ textAlign: 'center', marginTop: 8 }}>
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell splash-shell">
      <div className="splash-stage">
        <div className="splash-halo">
          <div className="splash-core">
            {style === 'emoji' ? (
              <span className="splash-emoji" aria-hidden="true">
                {splash?.emoji || '🌹'}
              </span>
            ) : (
              <TicketEmblem emblem={splash?.emblem} size={62} />
            )}
          </div>
        </div>

        <div className="splash-brand">{displayName}</div>
        <div className="splash-caption">{text}</div>

        <div className="splash-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [daylightPref, setDaylightPref] = useState(readDaylightPref);
  const [systemTheme, setSystemTheme] = useState(() => getTelegramColorScheme());
  const daylightPos = daylightPref.auto
    ? (systemTheme === 'dark' ? 0 : 1)
    : normalizeDaylightPos(daylightPref.pos, 0.5);
  const chromeThrottleRef = useRef(0);
  const liveDaylightRef = useRef(daylightPos);
  const animatingDaylightRef = useRef(false);
  const [bootstrap, setBootstrap] = useState(() => loadCachedBootstrap());
  const [bootstrapFresh, setBootstrapFresh] = useState(false);
  const [loading, setLoading] = useState(() => !loadCachedBootstrap());
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    const target = getLaunchTarget();
    return ['profile', 'sites', 'probe', 'visitors', 'leaderboard'].includes(target.tab) ? target.tab : '';
  });
  const [deepVisitorId, setDeepVisitorId] = useState('');
  const [visitorFilterPreset, setVisitorFilterPreset] = useState('');
  const [settingsSection, setSettingsSection] = useState(null);
  const [appearancePreview, setAppearancePreview] = useState(null);
  const launchHandledRef = useRef(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [previewRole, setPreviewRole] = useState(() => getDevRole());
  const [whatsNewState, setWhatsNewState] = useState({
    open: false,
    mode: 'auto',
    previousVersion: '',
  });
  const splashMeta = readSplashMeta();
  // Before the live `/api/bootstrap` response arrives, trust server-injected `splashMeta` over stale
  // localStorage boot cache so returning visitors never flash an old theme after an owner updates it.
  const activeUiSource = bootstrapFresh
    ? bootstrap?.config?.ui
    : {
        themePreset: splashMeta?.themePreset ?? bootstrap?.config?.ui?.themePreset,
        dockStyle: splashMeta?.dockStyle ?? bootstrap?.config?.ui?.dockStyle,
      };
  const activeThemePreset = normalizeThemePreset(
    appearancePreview?.themePreset ?? activeUiSource?.themePreset
  );
  const activeDockStyle = normalizeDockStyle(
    appearancePreview?.dockStyle ?? activeUiSource?.dockStyle
  );

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? '' : curr));
    }, 2600);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', activeThemePreset);
    document.documentElement.setAttribute('data-dock', activeDockStyle);
    const posToApply = animatingDaylightRef.current ? liveDaylightRef.current : daylightPos;
    liveDaylightRef.current = posToApply;
    applyDaylightThemeToDocument(posToApply, activeThemePreset);
    syncTelegramChrome(posToApply, activeThemePreset);
  }, [daylightPos, activeThemePreset, activeDockStyle]);

  useEffect(() => onColorSchemeChange(setSystemTheme), []);

  // 60fps real-time daylight scrubbing directly onto CSS vars (zero React tree re-render!)
  const scrubDaylight = useCallback(
    (livePos) => {
      liveDaylightRef.current = livePos;
      applyDaylightThemeToDocument(livePos, activeThemePreset);
      const now = performance.now();
      if (now - chromeThrottleRef.current >= 80) {
        chromeThrottleRef.current = now;
        syncTelegramChrome(livePos, activeThemePreset);
      }
      if (animatingDaylightRef.current && Math.abs(livePos - daylightPos) < 0.002) {
        animatingDaylightRef.current = false;
        syncTelegramChrome(livePos, activeThemePreset);
      }
    },
    [activeThemePreset, daylightPos],
  );

  // Persist settled stepless daylight position (0..1); when the slider spring is actively sweeping,
  // avoid jumping colors ahead of the bubble so the full-page daylight sweeps in physical lockstep.
  const commitDaylight = useCallback(
    (nextPos, meta = {}) => {
      const clean = normalizeDaylightPos(nextPos, 0.5);
      try {
        localStorage.setItem(THEME_MODE_STORAGE_KEY, `pos:${clean}`);
      } catch {
        // Ignore storage failures
      }
      const isSpringSweeping = Boolean(meta?.animating);
      animatingDaylightRef.current = isSpringSweeping;
      setDaylightPref({ auto: false, pos: clean });
      if (!isSpringSweeping) {
        liveDaylightRef.current = clean;
        applyDaylightThemeToDocument(clean, activeThemePreset);
        syncTelegramChrome(clean, activeThemePreset);
      }
    },
    [activeThemePreset],
  );

  // Double-tap on slider restores automatic Telegram system dark/light following
  const resetDaylightAuto = useCallback(() => {
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, 'auto');
    } catch {
      // Ignore storage failures
    }
    animatingDaylightRef.current = false;
    setDaylightPref({ auto: true, pos: null });
    showToast('已恢复跟随 Telegram 深浅模式');
  }, [showToast]);

  const loadBootstrap = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const res = await apiRequest('/api/bootstrap');
      setBootstrap(res);
      setBootstrapFresh(true);
      saveCachedBootstrap(res);

      // Handle Telegram start_param / query deep links (e.g. visitor_123456 or settings=modes) once on launch
      const target = getLaunchTarget();
      if (!launchHandledRef.current) {
        launchHandledRef.current = true;
        if (target.settings && res.isAdmin) {
          setSettingsSection(target.settings);
        }
        if (target.tab === 'visitors' && res.isAdmin) {
          setActiveTab('visitors');
          if (target.visitorId) setDeepVisitorId(target.visitorId);
        } else if (['profile', 'sites', 'probe', 'leaderboard'].includes(target.tab)) {
          setActiveTab(target.tab);
        }
      }

      if (
        res.isAdmin &&
        res.appVersion &&
        !res.isPreview &&
        !(typeof navigator !== 'undefined' && navigator.webdriver) &&
        !target.settings &&
        !target.visitorId
      ) {
        try {
          const seenVer = localStorage.getItem(SEEN_VERSION_STORAGE_KEY) || '';
          if (seenVer !== String(res.appVersion)) {
            setWhatsNewState({ open: true, mode: 'auto', previousVersion: seenVer });
          }
        } catch {
          // Ignore storage errors
        }
      }
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initTelegramWebApp(
      normalizeThemePreset(readSplashMeta()?.themePreset ?? loadCachedBootstrap()?.config?.ui?.themePreset)
    );
    const hasWarmCache = Boolean(loadCachedBootstrap());
    loadBootstrap({ silent: hasWarmCache });
  }, [loadBootstrap]);

  const handleCheckin = async () => {
    try {
      setCheckinLoading(true);
      const res = await apiRequest('/api/checkin', { method: 'POST' });
      setBootstrap((prev) => (prev ? { ...prev, checkin: res.ticket } : prev));
      if (res.alreadyCheckedIn) {
        showToast('今日已经签过啦 🌸');
      } else {
        haptic('success');
        const badgeMsg =
          res.newlyUnlocked?.length > 0
            ? ` · 解锁徽章「${res.newlyUnlocked.map((b) => b.name).join('、')}」`
            : '';
        showToast(
          `🎉 签到成功 +${res.gained} ${bootstrap?.config?.community?.currencyName || '积分'}${badgeMsg}`
        );
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleSwitchPreviewRole = () => {
    const next = previewRole === 'admin' ? 'guest' : 'admin';
    setDevRole(next);
    setPreviewRole(next);
    setActiveTab('');
    loadBootstrap();
  };

  if (loading && !bootstrap) {
    return <SplashScreen splash={splashMeta} />;
  }

  if (error && !bootstrap) {
    return (
      <div className="app-shell">
        <div className="card empty-state">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🥀</div>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>无法连接到面板服务</div>
          <div style={{ marginTop: 6 }}>{error}</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={loadBootstrap}>
            重试
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = Boolean(bootstrap?.isAdmin);
  const enableCheckin = Boolean(bootstrap?.config?.community?.enableCheckin);
  const showSitesTab = isAdmin || (bootstrap?.config?.sites || []).length > 0;
  const showProbeTab = isAdmin || Boolean(bootstrap?.config?.probe?.configured);

  const navItems = [
    {
      id: 'profile',
      label: enableCheckin ? '票根' : '名片',
      icon: enableCheckin ? Ticket : IdCard,
    },
  ];

  if (showSitesTab) {
    navItems.push({ id: 'sites', label: '小站', icon: Globe });
  }

  if (showProbeTab) {
    navItems.push({ id: 'probe', label: '探针', icon: Server });
  }

  const pendingReviewCount = Number(
    bootstrap?.pendingReviewCount ?? bootstrap?.visitorSummary?.pendingReview ?? 0
  );
  const awaitingReplyCount = Number(
    bootstrap?.awaitingReplyCount ?? bootstrap?.visitorSummary?.awaitingReply ?? 0
  );
  const visitorAttentionCount = Number(
    bootstrap?.visitorSummary?.needsAttention ?? Math.max(pendingReviewCount, awaitingReplyCount)
  );

  if (isAdmin) {
    navItems.push({
      id: 'visitors',
      label: '访客',
      icon: Users,
      badge: visitorAttentionCount,
      badgeAlert: pendingReviewCount > 0,
    });
  } else if (enableCheckin) {
    navItems.push({ id: 'leaderboard', label: '榜单', icon: Trophy });
  }

  const orderedNavItems = sortNavItemsByOrder(navItems, bootstrap?.config?.ui?.navOrder);
  const defaultTab = orderedNavItems[0]?.id || 'profile';
  const effectiveTab =
    activeTab && orderedNavItems.some((item) => item.id === activeTab) ? activeTab : defaultTab;
  const switchTab = (nextTab) => {
    if (nextTab !== effectiveTab) {
      window.scrollTo?.(0, 0);
    }
    setActiveTab(nextTab);
  };

  return (
    <div className="app-shell">
      {toast && <div className="toast">{toast}</div>}

      {bootstrap?.isPreview && (
        <div className="preview-banner">
          <span>🧪 本地预览模式（当前视角：{isAdmin ? '站长' : '访客'}）</span>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text)', padding: '4px 10px' }}
            onClick={handleSwitchPreviewRole}
          >
            切换视角
          </button>
        </div>
      )}

      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-brand">
          <span className="top-brand-dot" />
          <span className="top-title">{bootstrap?.config?.profile?.displayName || 'RosePanel'}</span>
        </div>

        <div className="top-actions">
          <DayNightSlider
            value={daylightPos}
            isAuto={daylightPref.auto}
            onScrub={scrubDaylight}
            onChange={commitDaylight}
            onResetAuto={resetDaylightAuto}
          />
          {isAdmin && (
            <button
              className="icon-btn accent"
              title="面板可视化设置"
              onClick={() => {
                haptic('light');
                setSettingsSection('profile');
              }}
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main View */}
      <main>
        {effectiveTab === 'profile' && (
          <TicketTab
            data={bootstrap}
            onNavigate={(tab, opts = {}) => {
              haptic('light');
              if (tab === 'visitors' && opts?.filter) {
                setVisitorFilterPreset(opts.filter);
              }
              switchTab(tab);
            }}
            onStatusUpdated={(updatedRes) =>
              setBootstrap((prev) =>
                prev
                  ? {
                      ...prev,
                      config: updatedRes.config,
                      adminConfig: updatedRes.adminConfig,
                    }
                  : prev
              )
            }
            onCheckin={handleCheckin}
            checkinLoading={checkinLoading}
            onToast={showToast}
          />
        )}

        {effectiveTab === 'sites' && (
          <SitesTab
            sites={bootstrap?.config?.sites || []}
            isAdmin={isAdmin}
            onOpenSettings={(sec) => setSettingsSection(sec)}
            onSitesUpdated={(updatedRes) =>
              setBootstrap((prev) =>
                prev
                  ? {
                      ...prev,
                      config: updatedRes.config,
                      adminConfig: updatedRes.adminConfig,
                    }
                  : prev
              )
            }
            onToast={showToast}
          />
        )}

        {effectiveTab === 'probe' && (
          <ProbeTab
            probeConfig={bootstrap?.config?.probe}
            isAdmin={isAdmin}
            onOpenSettings={(sec) => setSettingsSection(sec)}
            onToast={showToast}
          />
        )}

        {effectiveTab === 'visitors' && isAdmin && (
          <VisitorsTab
            d1Bound={Boolean(bootstrap?.adminConfig?.d1Bound)}
            initialVisitorId={deepVisitorId}
            initialFilter={visitorFilterPreset}
            initialVisitStats={bootstrap?.visitStats || null}
            initialBlockedSpamCount={bootstrap?.blockedSpamCount || 0}
            initialBlockedToday={bootstrap?.blockedToday || 0}
            onOpenSettings={(sec) => setSettingsSection(sec)}
            onClearInitial={() => setDeepVisitorId('')}
            onClearInitialFilter={() => setVisitorFilterPreset('')}
            onStatsSync={(patch) => {
              setBootstrap((prev) =>
                prev
                  ? {
                      ...prev,
                      ...(patch.visitorSummary ? { visitorSummary: patch.visitorSummary } : {}),
                      ...(typeof patch.pendingReviewCount === 'number'
                        ? { pendingReviewCount: patch.pendingReviewCount }
                        : {}),
                      ...(typeof patch.awaitingReplyCount === 'number'
                        ? { awaitingReplyCount: patch.awaitingReplyCount }
                        : {}),
                      ...(typeof patch.blockedSpamCount === 'number'
                        ? { blockedSpamCount: patch.blockedSpamCount }
                        : {}),
                      ...(typeof patch.blockedToday === 'number'
                        ? { blockedToday: patch.blockedToday }
                        : {}),
                    }
                  : prev
              );
            }}
            onToast={showToast}
          />
        )}

        {effectiveTab === 'leaderboard' && enableCheckin && (
          <LeaderboardTab
            currencyName={bootstrap?.config?.community?.currencyName || '积分'}
            onToast={showToast}
          />
        )}
      </main>

      {/* Floating Glass Pill Bottom Dock — auto-hides when only 1 tab is visible */}
      {orderedNavItems.length > 1 && (
        <nav className="bottom-dock-wrap" aria-label="主导航">
          <div className="bottom-dock">
            {orderedNavItems.map((item) => {
              const Icon = item.icon;
              const active = effectiveTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dock-item ${active ? 'active' : ''}`}
                  onClick={() => {
                    haptic('light');
                    switchTab(item.id);
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.9} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className={`dock-badge ${item.badgeAlert ? 'alert' : ''}`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Admin Visual Settings Drawer */}
      {isAdmin && settingsSection && bootstrap?.adminConfig && (
        <SettingsDrawer
          initialSection={settingsSection}
          adminConfig={bootstrap.adminConfig}
          botInfo={bootstrap.config?.bot}
          shareUrl={bootstrap.config?.shareUrl}
          appVersion={bootstrap.appVersion}
          onPreviewAppearance={(next) => setAppearancePreview(next)}
          onOpenWhatsNew={() =>
            setWhatsNewState({ open: true, mode: 'manual', previousVersion: '' })
          }
          onClose={() => {
            setAppearancePreview(null);
            setSettingsSection(null);
          }}
          onSaved={(savedRes) => {
            setAppearancePreview(null);
            setBootstrapFresh(true);
            setBootstrap((prev) =>
              prev
                ? {
                    ...prev,
                    config: savedRes.config,
                    adminConfig: savedRes.adminConfig,
                  }
                : prev
            );
            loadBootstrap();
          }}
          onToast={showToast}
        />
      )}

      {isAdmin && whatsNewState.open && (
        <WhatsNewModal
          appVersion={bootstrap?.appVersion}
          previousVersion={whatsNewState.previousVersion}
          mode={whatsNewState.mode}
          onClose={() => {
            try {
              if (bootstrap?.appVersion) {
                localStorage.setItem(SEEN_VERSION_STORAGE_KEY, String(bootstrap.appVersion));
              }
            } catch {
              // Ignore storage errors
            }
            setWhatsNewState((prev) => ({ ...prev, open: false }));
          }}
        />
      )}
    </div>
  );
}
