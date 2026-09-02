---
name: 星河客户服务窗口（CustomerChatWidget）
description: 勘误手册 / 醋酸酯页签板——免登录客服窗的「可追踪服务手册」视觉世界（仅限 csw- 客户窗口作用域）
colors:
  paper: "#fafaf6"
  ink: "#16130d"
  card-white: "#ffffff"
  hairline: "rgba(22, 19, 13, 0.16)"
  vermilion: "#c23a26"
  consult-board: "#315bea"
  queue-board: "#d96c2c"
  human-board: "#1f7a78"
  review-board: "#e6b800"
  done-board: "#8c5a3c"
  errata-paper: "#faf5ef"
  notice-paper: "#eaf2e2"
  notice-ink: "#2d4a24"
  notice-edge: "#b7cfa4"
typography:
  headline:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Segoe UI', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.02em"
  body:
    fontFamily: "Georgia, 'Times New Roman', 'Songti SC', 'STSong', 'SimSun', serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Segoe UI', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  mono:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace"
    fontSize: "9.5px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  sm: "2px"
  md: "4px"
spacing:
  2xs: "2px"
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
components:
  orb-launcher:
    backgroundColor: "{colors.consult-board}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    size: "54px"
  panel-board-head:
    backgroundColor: "{colors.consult-board}"
    textColor: "{colors.paper}"
    padding: "13px 12px 11px 14px"
  customer-slip:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  errata-slip:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.errata-paper}"
    rounded: "{rounded.sm}"
    padding: "9px 12px"
  receipt-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
  checkbox-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 9px"
  message-input:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 11px"
  send-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  submit-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "9px"
---

# Design System: 星河客户服务窗口 ·「勘误手册 / 醋酸酯页签板」

> **记录边界**：本书记录的仅是**客户聊天窗口**（`src/chat/CustomerChatWidget.jsx` + `chat-widget.css` 的 `csw-` 世界，含 `.csw-panel` 作用域内的 `mm-*` 覆盖）。仓库其余界面（工作台 / admin / portal 及 `prototype.css` / `styles.css` 生态）是另一套既有系统，不在本记录主张范围内。`mm-*` 多媒体段为窗口与客服工作台**共用层**：其基础样式属共用/既有层，只有 `.csw-panel .mm-*` 覆盖属于本世界。

## Overview

**Creative North Star: 「一本可追踪的服务手册」**（勘误手册 / 醋酸酯页签板，rw-manual-acetate-tab-board · seed 06d61a5b）

一次咨询就是一本摊开的服务手册：对话逐条编入册页，服务阶段由右缘的五段阶梯页签管理，当前分区的颜色就是整窗的章节板色。窗口的材料系统来自印刷车间——牛奶纸底、印刷墨字、硬 1px 分区线、打孔申请单、铰链的醋酸酯输入页，以及贯穿全册的 mono 机械语气（回执号、LINK OK、§ 编号、ERRATA 标签）。它明确拒绝品类默认的「蓝色头部 + 圆角气泡」聊天窗语法：这里没有大圆角气泡、没有渐变头部、没有 emoji 图标。

一切状态变化以 **90ms steps(2, end) 两帧步进**呈现，无缓动——窗口不是「动起来」，而是像机械装置一样「跳到下一态」；唯一的戏剧时刻是完结时 `-5deg` 的落章。密度偏高（8–14px 的册页内距、9.5px 的 mono 标签），因为它是被阅读和归档的纸面，不是被浏览的卡片流。窗口悬浮在不可控的宿主页面上（亮色营销页或深色后台），因此**样式隔离是硬约束**：`csw-` 前缀、独立样式表、无外部字体与图片请求，且主题色由嵌入方经 `theme` prop 注入，视觉系统必须容忍任意板色。

**Key Characteristics:**
- 右缘五段阶梯页签轨（咨询 / 排队 / 人工 / 评价 / 完结），当前分区延伸且其色即整窗板色
- 章节板色满强度头部：星环印 + mono 回执行（SERVICE DESK · NO.XXX · LINK OK）
- 醋酸酯洗白阅读场：板色 × 纸色 alpha 运行时求解，正文相对亮度恒定 0.88
- 打孔申请单（客户消息）、勘误条（错误）、通知条、进度条组成的「页间纸条」系统
- 三声部字体：黑体司标题控件、宋体/Georgia 司正文阅读、IBM Plex Mono 司机器语气
- 硬 1px 墨线分区 + 16% 发丝线次级分隔；2px/4px 两级圆角
- 一切状态变化 90ms steps(2, end)，无缓动；完结落章为唯一强调时刻
- 浏览器表面同归世界：::selection 板色、caret 板色、focus-visible 2px 墨色 outline、细墨滚动条
- `prefers-reduced-motion` 下全部动画与过渡停用

## Colors

色板是一间印刷车间的库存：一种纸、一种墨、五种满强度的章节板色，以及一种只属于勘误的朱红。

### Primary —— 章节板色（五分区，满强度使用）
- **咨询蓝（主题板）** (#315bea 默认)：`consult` 分区与初始头部/启动钮。经 `theme` prop 注入，嵌入方可替换为任意色——运行时求解器保证任何板色下正文亮度与板字对比度不漂移。
- **氧化橙** (#d96c2c)：`queue` 排队分区板色。
- **青** (#1f7a78)：`human` 人工接待分区板色。
- **铬黄** (#e6b800)：`review` 评价分区板色。
- **赭石** (#8c5a3c)：`done` 完结分区板色。

### Secondary
- **朱红** (#c23a26)：勘误条背景 + 语音转写失败文字。全系统仅此两处可用，任何其他状态、装饰、强调一律不得取用。

### Neutral
- **牛奶纸** (#fafaf6)：面板底色、板色上的反白文字、复选项底色。
- **印刷墨** (#16130d)：正文与标题文字、分区线、墨块按钮（发送/提交/下载）、进度条填充、完结章。
- **卡纸白** (#ffffff)：客户申请单、回执卡、输入框、媒体按钮、进度条纸条——比牛奶纸亮半档的「贴上去的纸」。
- **发丝线** (rgba(22, 19, 13, 0.16))：次级分隔线与卡片描边（§ 条目分隔、卡边、输入框边）。
- **勘误纸** (#faf5ef)：勘误条上的文字色（朱红底的暖白）。
- **通知三色** (#eaf2e2 底 / #2d4a24 字 / #b7cfa4 边)：通知纸条专用的灰绿纸面，不与其他状态混用。

### Named Rules
**满强度板色规则。** 章节板色只以满强度出现——头部整条、页签、选区、光标、启动钮都是纯色，从不做浅色变体或渐变；板色唯一被「稀释」的地方是阅读场，而那是醋酸酯页叠在板色上（纸色 alpha 叠加），不是给板色调浅。

**朱红勘误规则。** 朱红 #c23a26 是勘误专色：错误条与转写失败之外，它在世界中不存在。状态的丰富性由五段板色承担，不靠新增红黄绿语义色。

**运行时定亮规则。** 阅读场 alpha 与板上字色不许手写：`--csw-field-a` 由二分求解使阅读场相对亮度恒为 0.88（`solveLeafAlpha`）；板上字色由 0.2 亮度阈值决定（>0.2 用墨字，≤0.2 用纸字）；头部 mono 行在纸字板上取全强度 1、墨字板上取 0.9。这是「嵌入方任意换主题色而窗口不坏」的机械保证。

## Typography

**标题/控件（黑体）：** 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', system-ui, sans-serif
**正文（宋体/Georgia）：** Georgia, 'Times New Roman', 'Songti SC', 'STSong', 'SimSun', serif
**机器语气（Mono）：** 'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace

**Character:** 黑体标题的规整、宋体正文的纸张感、mono 的打字机机械感，三者各司其职——像一本由人写正文、机器编号页码的手册。全部为系统字体栈：窗口嵌入第三方页面，零外部字体请求是硬约束（此为构建事实，见 Don't 的说明）。

### Hierarchy
- **Headline**（黑体 700，16px / 1.25，+0.02em）：面板标题「星河客户服务」；回执卡、感谢卡小标题用 14–14.5px 同族。
- **Body**（宋体/Georgia 400，13.5–14px / 1.7–1.8）：前言、§ 条目、客户备注输入框——一切被「阅读」的文字。
- **UI/Label**（黑体 400–700，11–13px / 1.6）：消息行 13.5px、按钮与选项 12–13px、媒体按钮 11px。
- **Mono 标签**（IBM Plex Mono 500–600，9.5px，大写，+0.1–0.16em）：区块标签（前言 · FOREWORD / 勘误 ERRATA / 服务回执 · RECEIPT）、头部回执行、发送者名、§ 编号。
- **Mono 系统**（IBM Plex Mono，10.5–11px，+0.05em）：系统行、脚注、加载中、百分比（tabular-nums）。

### Named Rules
**三声部规则。** 一处文字只属于一个声部：标题与控件用黑体，被阅读的正文用宋体/Georgia，机器事实（编号、状态、百分比、标签）用 mono。禁止用正文衬线写按钮，禁止用 mono 写长文。

**Mono 标签语法。** 区块标签一律 9.5px 大写 mono 宽字距、中英对照（「前言 · FOREWORD」「勘误 ERRATA」「SERVICE DESK · NO.XXXXXX · LINK OK」）；它是手册的页眉系统，不是装饰。

## Layout

窗口锚定宿主页面右下角（24px 边距，z-index 9999）：54px 书脊启动钮在角上，376px 宽、560px 高（`max-height: min(74vh, 640px)`）的手册面板从其上方 72px 处摊开，`max-width: calc(100vw - 48px)`。面板内部是「摊开的册页」结构：右缘 26px 阶梯页签轨（`writing-mode: vertical-rl`，奇偶页签 15/17px 交错、激活 25px 延伸），其余为 `margin-right: 26px` 的书页主体——满强度章节板头部、醋酸酯阅读场（`padding: 14px 10px 14px 14px`，子项 `gap: 10px`）、底缘铰链输入页。

间距节奏为紧凑册页级：2 / 6 / 8 / 9 / 10 / 12 / 14px，全部来自纸条内距与页间空隙，不出现 16px 以上的宽松留白。≤480px 窄屏：容器收至 10px 边距，面板宽 `calc(100vw - 28px)`、高 `min(76vh, 600px)`，页签轨收窄到 22px。窗口不依赖宿主栅格与样式，任何宿主页面中自成一册。

## Elevation & Depth

深度语言是「纸叠在桌上」，不是「浮在云端」：结构阴影全部是**硬错位阴影**（沿交互方向的实心墨色投影），软阴影全册只允许一个。层级由纸的物理手势表达：打孔（客户申请单与回执卡的 7px 径向渐变孔）、微旋转（加载纸条 -0.4deg、完结章 -5deg）、错位阴影随按压增减。

### Shadow Vocabulary
- **错位·纸条** (`1px 2px 0 rgba(22,19,13,0.12–0.16)`)：申请单、回执卡、进度纸条、输入框聚焦——贴上去的纸。
- **错位·书脊** (`2px 3px 0 rgba(22,19,13,0.32)`；hover `3px 4px 0`、active `1px 1px 0`)：启动钮，随按压「按进桌面」。
- **错位·面板** (`3px 4px 0 rgba(22,19,13,0.16)`)：整册压在桌面上的投影。
- **环境·悬浮** (`0 18px 44px rgba(22,19,13,0.26)`)：**全系统唯一的软阴影**，仅用于面板悬浮于宿主页面之上这一件事。

### Named Rules
**纸面错位规则。** 结构阴影只用硬错位实心投影，方向语义为「纸从哪边翘起」；软阴影只许面板的环境悬浮影一处，禁止给按钮、卡片再加柔光。

**打孔规则。** 7px 径向渐变打孔只打在「客户/系统提交的纸」上：客户申请单右上角、服务回执顶缘居中。打孔是出处的印章，不是装饰孔。

## Shapes

圆角两级：**4px** 只给外壳（面板与启动钮），**2px** 给一切内件（页签、纸条、按钮、输入框、卡）——窗口的内件是裁切纸，不是胶囊。完结章为 3px 描边框，星环印为 1.5px 描边正圆（32px）。分区靠**硬 1px 墨线**（头部下缘、§ 列表上缘、输入页上缘均压在墨线上），次级分隔与卡边用 16% 发丝线。两处半透明材料是形体的例外：阅读场的醋酸酯叠色（运行时 alpha）与输入页的 92% 纸色铰链页——它们表达「透明页叠在册子上」，而非玻璃拟态。

## Components

### 书脊启动钮（Orb）
- **Shape:** 54×54px，4px 圆角，1px 40% 墨边，左缘一条 55% 纸色竖线（书脊沟）。
- **Color:** 主题板色满强度底 + 纸色宋体「星」（20px/700）。
- **States:** hover 向左上位移 1px 且阴影加大，active 向右下按入；90ms steps(2)。

### 章节板头部（Board Head）
- **Shape:** 满强度板色整条，下缘硬 1px 墨线；32px 星环印（1.5px currentColor 圆环 + 宋体「星」）。
- **Typography:** 黑体 16px 标题 + mono 回执行（9.5px 大写，NO. 回执号 · LINK OK/LINKING）+ 11px 状态行（「AI 客服即时响应 · 人工客服工作时段在线」等客户语言）。
- **Color:** 板上文字用运行时求得的 `--csw-on-board`；mono 行透明度按板字极性取 1 或 0.9。关闭钮 24px 透明底，hover 现出 currentColor 边。

### 阶梯页签轨（Tab Rail）
- **Shape:** 右缘 26px 竖排页签列，`vertical-rl` 10px/500/+3px 字距；奇偶 15/17px 宽交错成锯齿，静息 50% 透明度。
- **Active:** 当前分区延伸至 25px、内距加大、全强度，其页签色同时成为整窗板色——状态即颜色，颜色即状态。

### 前言与 § 交叉引用（Foreword & Refs）
- **Shape:** 前言块（mono 标签 + 宋体 14px/1.8 段落）之下，1px 墨线起始、发丝线分隔的全宽条目列表。
- **Entry:** mono `§1/§2/§3` 编号 + 宋体 13.5px 问题；hover 白纱底（55% 白）+ 右移 5px；90ms steps(2)。
- **Footnote:** mono 10px 脚注（「聊天记录已在本机保存 · 随时回来接着聊」）。

### 消息行（Message Lines）
- **客服/AI 行：** 全宽拉通，上方 mono 9.5px 发送者名带延伸发丝线；正文 13.5px/1.7。
- **客户申请单：** 卡纸白底、发丝线边、2px 圆角、`1px 2px 0` 错位影、右对齐（≤88% 宽）、右上角 7px 打孔——客户提交的纸自带出处孔。
- **系统行：** 居中 mono 10.5px 灰字，60% 墨。
- **媒体行：** 本体是白色图版（图片/文件卡/语音），去掉文字页的衬垫与打孔，交给 mm-* 层渲染。

### 页间纸条（Slips：勘误 / 通知 / 进度）
- **勘误条：** 朱红满强度底 + 勘误纸文字 + mono 描边标签「勘误 ERRATA」+ 幽灵重试钮（currentColor 描边，hover 18% 纸白）+ × 关闭；`role="alert"`。
- **通知条：** 灰绿纸三色（#eaf2e2/#2d4a24/#b7cfa4）；`role="status"`。
- **进度条：** 白纸条 + 4px 墨色 scaleX 进度尺 + mono tabular-nums 百分比 + 阶段话术（「正在上传…」）。
- **文案法：** 错误说人话并给恢复路径（「内容没有丢失，可直接重试」），原始报错只进控制台（`describeError` 映射）。

### 服务回执（评价卡 Receipt）
- **Shape:** 卡纸白、1px 墨边、2px 圆角、顶缘居中打孔、12px 内距。
- **Contents:** mono 标签「服务回执 · RECEIPT」→ 黑体 14.5px 诉求句 → 11.5px 提示（「您的评价将直接结束本次会话」）。
- **选项：** 纸底描边复选钮，12px 方框 1.5px 墨边；选中时方框内落 6px 墨点。备注为宋体 12.5px 纸底文本域，focus 翻墨边。
- **提交：** 墨块钮（墨底纸字，9px 内距），未选时 40% 透明禁用。

### 完结章（Completion Stamp）
- `-5deg` 旋转的 2px 墨边章（13px/700，+0.32em 字距「已完结」），以 `csw-stamp-in`（scale 1.18 → 1，90ms steps(2)）落章——全系统唯一的强调动效时刻。其后 mono 标签 SERVICE COMPLETED + 黑体致谢 + 12px 说明。

### 输入页（Acetate Input Leaf）
- **Shape:** 92% 纸色半透明铰链页，上缘硬 1px 墨线；两行结构（媒体行 + 输入行）。
- **媒体钮：** 白底发丝边 11px 钮（描线 SVG 13px + 文字：图片/文件/语音），hover 翻墨边墨字；只读/上传中 40% 透明禁用。
- **输入框：** 白底发丝边 2px 圆角，**caret 为板色**；focus 翻墨边 + `1px 2px 0` 错位影。
- **发送钮：** 墨块（墨底纸字 13px），active 下沉 1px，禁用 40%。

### 共用多媒体层的手册覆盖（mm-* overrides）
`mm-*` 基础样式与工作台共用；手册只在 `.csw-panel` 作用域内覆盖：10px 圆角一律收为 2px，工作台蓝一律翻为墨/纸双色（播放钮、下载钮、停止/发送钮），元数据换 mono，转写失败文字用朱红，录音呼吸灯与声浪改用 steps(2) 关键帧、波形去圆角且进度不做过渡。共用层自身的样式不动。

## Do's and Don'ts

### Do:
- **Do** 用五段阶梯页签表达服务阶段：当前分区延伸、全强度，且其色即整窗板色——状态变化先换板色，再动内容。
- **Do** 板上文字用运行时求得的 `--csw-on-board` / `--csw-field-a`（0.2 阈值 + 0.88 定亮），让任意 `theme` 主题色下对比度自动成立。
- **Do** 错误写勘误条：mono 标签 + 人话原因 + 恢复路径（重试），原始状态码只进 `console`。
- **Do** 图标用 13px、1.4px 描边的手绘描线 SVG（`aria-hidden`），与 mono 标签同属机械语气。
- **Do** 让浏览器表面归入世界：`::selection` 板色反白、输入 caret 板色、`:focus-visible` 2px 墨色 outline（offset 1px）、细墨滚动条。
- **Do** 新状态优先「归入五分区之一 + 复用纸条系统」，而不是发明新的容器与颜色。

### Don't:
- **Don't** 使用品类默认的「蓝头 + 圆气泡」语法：不做大圆角气泡、渐变头部、圆角聊天气泡对坐排版。
- **Don't** 把朱红 #c23a26 用作勘误（错误条、转写失败）以外的任何用途——装饰、强调、成功态都不行。
- **Don't** 引入缓动曲线、弹簧或长过渡：状态变化一律 90ms steps(2, end)；`prefers-reduced-motion` 下全停。
- **Don't** 手写板上的字色或阅读场底色（不许「深板配白字」拍脑袋）——一律走运行时求解值。
- **Don't** 在 `.csw-panel` 之外改 `mm-*` 共用层样式：手册的覆盖只写在窗口作用域内，工作台那侧不动。
- **Don't** 让窗口依赖宿主页面：新样式必须 `csw-` 前缀并自包含；不发外部字体/图片请求。系统字体栈是嵌入约束下的既成事实，不是可推广到仓库其他首方界面的字体决策。
