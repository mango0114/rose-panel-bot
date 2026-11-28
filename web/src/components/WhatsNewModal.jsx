import React from 'react';
import { ExternalLink, Sparkles, Star, X } from 'lucide-react';
import { haptic, openExternalUrl } from '../lib/telegram.js';

export const REPO_URL = 'https://github.com/mango0114/rose-panel-bot';
// Verified against live GitHub README heading anchor: 🚀 极简部署（免费上线）
export const DEPLOY_GUIDE_URL = `${REPO_URL}#${encodeURIComponent('-极简部署免费上线')}`;
export const FEEDBACK_URL = `${REPO_URL}/issues/new/choose`;
export const CHANGELOG_URL = 'https://github.com/mango0114/rose-panel-bot/blob/main/CHANGELOG.md';
export const SEEN_VERSION_STORAGE_KEY = 'rose_seen_version';

export const RECENT_RELEASES = [
  {
    version: '2.1.2',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v2.1.2',
    items: [
      {
        tag: '新增',
        tone: 'new',
        text: '无级昼夜光影调光：拖动顶部小兔子气泡可在 0%～100% 任意位置停靠并实时平滑渐变整页配色（午夜 → 星夜 → 落日黄昏 → 破晓雾光 → 晨雾柔光 → 白天），覆盖全部 5 套主题且高亮度下柔和不刺眼；点按左/中/右直达三段，双击恢复跟随 Telegram',
      },
      {
        tag: '改进',
        tone: 'imp',
        text: '滑块升级 2.15× 果冻色散玻璃旋钮与回弹手感，像素场景新增晨昏光幕扫过、14 盏挂灯逐盏亮灭、屋脊暖金顶光与拖动时刻悬浮胶囊',
      },
    ],
  },
  {
    version: '2.1.1',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v2.1.1',
    items: [
      {
        tag: '修复',
        tone: 'fix',
        text: '不再将升级前的历史访客倒推标为「待回复」，避免更新后出现已查看旧消息的红点',
      },
      {
        tag: '改进',
        tone: 'imp',
        text: '点开访客「聊过」查看最新消息、或在 TG 给访客消息点 Emoji 回应时自动消除「待回复」，并新增「全部标为已读」按钮',
      },
    ],
  },
  {
    version: '2.1.0',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v2.1.0',
    items: [
      {
        tag: '新增',
        tone: 'new',
        text: '零指令面板歌单：把任意 Telegram 音频（含音乐频道/音乐 Bot，支持多选转发）私聊转给机器人即可生成名片「最近在听」，访客点「听这首」直发原音质音频（零 CF 流量、自动深链兜底）',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '5 套主题配色（玫瑰瓷 / 海洋蓝 / 抹茶绿 / 薰衣草 / 极简黑白）与半透明毛玻璃底栏，0ms 开屏同步无闪屏',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '一键场景状态与 12 张内置动态小表情（非会员可用），搭配独立临时自动回复；新增访客「待回复」筛选与名片三格待办条',
      },
      {
        tag: '新增',
        tone: 'new',
        text: 'D1 存储层阶段二 / 三全量完成：聊天记录游标无限翻页、全历史关键词搜索与上下文跳转、可选自动保留周期，访客档案/限流/月访客全量迁入 D1（KV 旧数据继续保留作备份）',
      },
      {
        tag: '改进',
        tone: 'imp',
        text: '设置页低频折叠与吸底保存栏、广告词预设支持移除清空、统一 Bot 指令菜单，访客发私信前新增验证提示',
      },
    ],
  },
  {
    version: '2.0.0',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v2.0.0',
    items: [
      {
        tag: '新增',
        tone: 'new',
        text: 'Cloudflare D1 存储层升级：绑定 D1（变量名 DB，Wrangler v4 自动建库）后聊天记录、照片/链接归档与消息映射改存 D1，突破 60 条上限并大幅省下每日 KV 写入额度；未绑定 D1 时 100% 自动回退 KV',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '老访客聊天记录无感自动迁移 & 站内分批一键迁移：在「设置 → 版本更新 → 数据存储」可查看进度并一键搬迁，所有 KV 旧数据原样保留作备份绝不删除',
      },
      {
        tag: '改进',
        tone: 'imp',
        text: '升级瞬间旧消息引用回复与表情回应自动回退查 KV 无缝衔接，并复用定时任务每日自动清理过期映射；文档补充「动手前 1 分钟备齐 4 样」极简上手清单',
      },
    ],
  },
  {
    version: '1.11.0',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v1.11.0',
    items: [
      {
        tag: '新增',
        tone: 'new',
        text: '新访客观察期：刚通过验证的新访客发链接、@用户名、联系方式或转发消息时先暂存不转发，静默通知站长在通知按钮或面板内「放行（按序补发）」或「拉黑」，支持链接白名单域名',
      },
      {
        tag: '新增',
        tone: 'new',
        text: 'Komari 探针延迟与丢包显示：节点卡片展示各线路平均延迟与丢包率（悬停或展开可看最低 / 最高 / 最近），卡片顶部显示最低平均延迟（需在 Komari 后台添加延迟监测任务）',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '底部导航支持在设置中通过上移 / 下移自定义顺序与默认首页（老配置升级后顺序不变），广告屏蔽关键词新增 6 组短语预设（默认不选，支持单击或整组添加）',
      },
      {
        tag: '改进',
        tone: 'imp',
        text: '名片首页「站长速览」精简为一行防护 / 待审核提示条，累计拦截统计与「待审核」筛选整合至「访客」页并附带底部导航小红点',
      },
      {
        tag: '修复',
        tone: 'fix',
        text: '修复面板聊天窗口自动刷新时动态贴纸反复消失重播与图片重复加载的问题',
      },
    ],
  },
  {
    version: '1.9.0',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v1.9.0',
    items: [
      {
        tag: '新增',
        tone: 'new',
        text: 'Telegram 表情回应双向同步（访客私聊 ↔ 话题群 / Bot 私聊推送，取消同步消失），并在面板气泡下方展示双方回应',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '面板聊天窗口直接显示静态 / 动态 / 视频贴纸（走短时签名媒体代理，加载失败自动回退文字）',
      },
      {
        tag: '改进',
        tone: 'imp',
        text: '面板发消息、撤回与消息刷新全面提速，话题同步副本更简洁；设置页与更新弹窗新增「意见反馈」入口',
      },
    ],
  },
  {
    version: '1.8.0',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v1.8.0',
    items: [
      {
        tag: '新增',
        tone: 'new',
        text: '探针掉线 / 恢复与 CPU·内存·磁盘超限告警（默认关闭，在「设置 → 节点探针」一键开启，支持静音节点与测试告警）',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '名片页新增「分享名片」一键生成浅/深色二维码海报与社交平台链接预览（仅含公开名片信息）',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '访客来源追踪（src_<渠道名>）与设置页推广链接助手，在访客卡片与访客列表顶部查看各渠道来源统计',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '按人去重的「本月访客数」统计（站长在访客页查看本月/上月人数，可按需开启在名片底部公开显示，默认关闭）',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '名片底部新增 RosePanel 小字署名和「想要同款？」引导，可在设置里关闭',
      },
    ],
  },
  {
    version: '1.7.0',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v1.7.0',
    items: [
      {
        tag: '新增',
        tone: 'new',
        text: '未绑定通知群时自动启用「Bot 私聊直推」，配好 ADMIN_IDS 即可收发私信、引用回复与使用管理指令，四层防骚扰与人机验证照常生效',
      },
      {
        tag: '改进',
        tone: 'imp',
        text: '随时在话题群发送 /bind 自动切回话题模式；在设置「防骚扰验证」顶部新增通知方式状态与未 /start 提醒',
      },
    ],
  },
  {
    version: '1.6.0',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v1.6.0',
    items: [
      {
        tag: '新增',
        tone: 'new',
        text: '访客资料卡点开「聊过」直接在面板内看记录、打字、发图与撤回，自动同步通知群话题',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '陌生人点 /start 或名片「发私信」立即触发人机验证，通过后直通私聊',
      },
      {
        tag: '新增',
        tone: 'new',
        text: '顶栏全新玫瑰瓷像素风「昼夜气泡放大镜滑块」，可拖动切换夜晚 / 跟随 TG / 白天主题',
      },
      {
        tag: '改进',
        tone: 'imp',
        text: '自动同步未点开始前介绍框与左下角面板菜单开关，开放免验证天数与话题 /del 撤回',
      },
      {
        tag: '修复',
        tone: 'fix',
        text: '加固验证刷新防刷上限、发图真实文件头校验，未保存退出改用原生确认框',
      },
    ],
  },
  {
    version: '1.5.4',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v1.5.4',
    items: [
      {
        tag: '改进',
        tone: 'imp',
        text: '重写防脚本陷阱按钮文案，默认改为短暂冷却锁定防真人误触失联',
      },
      {
        tag: '修复',
        tone: 'fix',
        text: '自动找回早期版本拉黑记录支持一键解封，手动解封后豁免 CAS 重复拦截',
      },
    ],
  },
  {
    version: '1.5.0',
    url: 'https://github.com/mango0114/rose-panel-bot/releases/tag/v1.5.0',
    items: [
      {
        tag: '新增',
        tone: 'new',
        text: '免会员收到消息自动回复（防刷冷却）与最多 50 条关键词自动回复规则',
      },
      {
        tag: '改进',
        tone: 'imp',
        text: '通知群访客资料卡昵称支持一键直达主页，可选附带访客头像大图',
      },
    ],
  },
];

function compareSemver(a, b) {
  const pa = String(a || '')
    .replace(/^v/i, '')
    .split('.')
    .map((n) => Number(n) || 0);
  const pb = String(b || '')
    .replace(/^v/i, '')
    .split('.')
    .map((n) => Number(n) || 0);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

export function StarSupportBanner({ onDismiss = null, style = undefined }) {
  return (
    <div className="star-support-strip" style={style}>
      <div className="star-support-text">
        <Star size={16} fill="#F59E0B" color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>如果 RosePanel 帮到了你，请在 GitHub 点个 Star，这对我们意义重大</span>
      </div>
      <div className="star-support-actions">
        <button
          type="button"
          className="star-support-btn"
          onClick={() => {
            haptic('light');
            openExternalUrl(REPO_URL);
          }}
        >
          <Star size={12.5} /> 去点 Star
        </button>
        {onDismiss && (
          <button
            type="button"
            className="star-support-close"
            title="不再提示"
            aria-label="关闭提示"
            onClick={onDismiss}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function WhatsNewModal({
  appVersion = '2.1.1',
  previousVersion = '',
  mode = 'auto',
  onClose,
}) {
  const currentVer = String(appVersion || RECENT_RELEASES[0].version).replace(/^v/i, '');
  const hasOlderPrev =
    Boolean(previousVersion) && compareSemver(currentVer, previousVersion) > 0;

  let releasesToShow = RECENT_RELEASES;
  if (mode === 'auto' && hasOlderPrev) {
    const newer = RECENT_RELEASES.filter((r) => compareSemver(r.version, previousVersion) > 0);
    releasesToShow = newer.length > 0 ? newer : RECENT_RELEASES.slice(0, 2);
  } else if (mode === 'auto') {
    releasesToShow = RECENT_RELEASES.slice(0, 2);
  }

  return (
    <div className="whatsnew-backdrop" onClick={onClose}>
      <div
        className="whatsnew-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`已更新到 v${currentVer}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="whatsnew-head">
          <div className="whatsnew-title">
            <Sparkles size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
            <span>{mode === 'manual' ? `近期更新 · v${currentVer}` : `已更新到 v${currentVer}`}</span>
          </div>
          <div className="whatsnew-sub">
            {hasOlderPrev ? `自 v${previousVersion.replace(/^v/i, '')} 以来的更新` : '近期版本核心更新一览'}
          </div>
        </div>

        <div className="whatsnew-body">
          {releasesToShow.map((rel) => (
            <div className="whatsnew-ver-block" key={rel.version}>
              <div className="whatsnew-ver-head">
                <span className="whatsnew-ver-name">v{rel.version}</span>
                <button
                  type="button"
                  className="whatsnew-ver-link"
                  onClick={() => openExternalUrl(rel.url)}
                >
                  详情 <ExternalLink size={11} />
                </button>
              </div>
              <div className="whatsnew-items">
                {rel.items.map((it, idx) => (
                  <div className="whatsnew-item" key={idx}>
                    <span className={`whatsnew-tag ${it.tone || ''}`}>{it.tag}</span>
                    <span className="whatsnew-item-text">{it.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="whatsnew-foot">
          <div className="whatsnew-foot-links">
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              onClick={() => {
                haptic('light');
                openExternalUrl(CHANGELOG_URL);
              }}
            >
              完整更新日志
            </button>
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              onClick={() => {
                haptic('light');
                openExternalUrl(FEEDBACK_URL);
              }}
            >
              💬 意见反馈
            </button>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              haptic('light');
              onClose();
            }}
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
