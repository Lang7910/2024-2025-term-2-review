/**
 * 章节配置：{ title, file }
 */
const chapters = [
  { title: '第一章 · 概论', file: 'HTML/chapter1.html' },
  { title: '第二章 · 智能优化技术', file: 'HTML/chapter2.html' },
  { title: '第三章 · 模式与图像识别', file: 'HTML/chapter3.html' },
  { title: '第三章 · 模式与图像识别-2', file: 'HTML/chapter3-2.html' },
  { title: '第四章 · 模糊控制', file: 'HTML/chapter4.html' },
  { title: '第五章 · 神经网络', file: 'HTML/chapter5.html' },
  { title: '第一章 · 大数据基础', file: 'HTML/chapter6.html' },
  { title: '第二章 · 大数据处理架构', file: 'HTML/chapter7.html' },
  { title: '第三章 · 分布式文件系统HDFS', file: 'HTML/chapter8.html' },
  { title: '第四章 · 分布式数据库HBase', file: 'HTML/chapter9.html' },
  { title: '第五章 · NoSql数据库', file: 'HTML/chapter10.html' },
  { title: '第七章 · MapReduce', file: 'HTML/chapter11.html' },
  { title: '第十章 · Spark', file: 'HTML/chapter12.html' },
  { title: '工业互联网', file: 'HTML/IndustrialInternet.html' },
  { title: '选择题(模拟)', file: 'HTML/chapter13.html' },
  { title: '总结', file: 'HTML/summary.html' },
  { title: '随机抽题', file: 'HTML/quiz.html' }, // Added new quiz page
];

const rootElement = document.documentElement;

// Apply theme from localStorage on initial load for the parent page
(function() {
  const savedTheme = localStorage.getItem('prefers-dark');
  if (savedTheme !== null) {
    rootElement.classList.toggle('dark-mode', savedTheme === 'true');
  }
})();

const sidebar = document.getElementById('sidebar');

// 创建制造技术分组
const manufacturingGroup = document.createElement('div');
manufacturingGroup.className = 'chapter-group';

const manufacturingHeader = document.createElement('div');
manufacturingHeader.className = 'group-header';
manufacturingHeader.innerHTML = '<span class="group-toggle">▼</span> 制造技术';
manufacturingHeader.addEventListener('click', () => {
  const content = manufacturingGroup.querySelector('.group-content');
  const toggle = manufacturingHeader.querySelector('.group-toggle');
  const isCollapsed = content.style.display === 'none';
  content.style.display = isCollapsed ? 'block' : 'none';
  toggle.textContent = isCollapsed ? '▼' : '▶';
});

const manufacturingContent = document.createElement('div');
manufacturingContent.className = 'group-content';

manufacturingGroup.appendChild(manufacturingHeader);
manufacturingGroup.appendChild(manufacturingContent);
sidebar.appendChild(manufacturingGroup);

// 创建数据技术分组
const dataGroup = document.createElement('div');
dataGroup.className = 'chapter-group';

const dataHeader = document.createElement('div');
dataHeader.className = 'group-header';
dataHeader.innerHTML = '<span class="group-toggle">▼</span> 数据技术';
dataHeader.addEventListener('click', () => {
  const content = dataGroup.querySelector('.group-content');
  const toggle = dataHeader.querySelector('.group-toggle');
  const isCollapsed = content.style.display === 'none';
  content.style.display = isCollapsed ? 'block' : 'none';
  toggle.textContent = isCollapsed ? '▼' : '▶';
});

const dataContent = document.createElement('div');
dataContent.className = 'group-content';

dataGroup.appendChild(dataHeader);
dataGroup.appendChild(dataContent);
sidebar.appendChild(dataGroup);

// 添加章节链接到相应分组
chapters.forEach((ch, idx) => {
  const link = document.createElement('a');
  link.href = `#${idx}`;
  link.textContent = ch.title;
  link.dataset.idx = idx;
  link.addEventListener('click', e => {
    e.preventDefault();
    switchTo(idx);
    if (window.matchMedia('(max-width:768px)').matches) {
      document.body.classList.add('hide-sidebar');
    }
  });
  
  // 根据章节索引分组：0-5为制造技术，6-12为数据技术，13-14(总结和随机抽题)单独放在最后
  if (idx <= 5) {
    manufacturingContent.appendChild(link);
  } else if (idx >= 6 && idx <= 12) {
    dataContent.appendChild(link);
  } else {
    // 总结和随机抽题直接添加到侧边栏，不在分组内
    sidebar.appendChild(link);
  }
});

const frame   = document.getElementById('chapter-frame');
const content = document.getElementById('content');   // === 新增 ===

// === 新增：创建上一章 / 下一章按钮 ===
const navWrap  = document.createElement('div');
navWrap.className = 'chapter-nav';

const prevBtn  = document.createElement('button');
prevBtn.id     = 'prev-btn';
prevBtn.textContent = '← 上一章';
prevBtn.addEventListener('click', () => switchTo(currentIdx - 1));

const nextBtn  = document.createElement('button');
nextBtn.id     = 'next-btn';
nextBtn.textContent = '下一章 →';
nextBtn.addEventListener('click', () => switchTo(currentIdx + 1));

const websiteBtn = document.createElement('button');
websiteBtn.id = 'website-btn';
websiteBtn.textContent = '🌐反馈';
websiteBtn.addEventListener('click', () => {
  window.open('https://langwu.top/%e5%a4%8d%e4%b9%a0/', '_blank');
});

// 创建倒计时组件
const countdownDiv = document.createElement('div');
countdownDiv.id = 'countdown-timer';
countdownDiv.innerHTML = '<span class="countdown-label">考试倒计时:</span><span class="countdown-time">--:--:--</span>';

// 创建强制刷新按钮
const refreshBtn = document.createElement('button');
refreshBtn.id = 'refresh-btn';
refreshBtn.textContent = '🔄刷新';
refreshBtn.title = '强制刷新页面';
refreshBtn.addEventListener('click', () => {
  // 强制刷新页面，绕过缓存
  window.location.reload(true);
});

// 倒计时逻辑
function updateCountdown() {
  // 设置目标时间 - 根据用户提供的考试时间表
  const examDates = [
    { name: '工业互联网基础', date: new Date('2025-06-20T09:00:00+08:00') },
    { name: '制造智能技术基础', date: new Date('2025-06-19T09:00:00+08:00') },
    { name: '数据技术基础', date: new Date('2025-06-17T09:00:00+08:00') }
  ];
  
  // 获取北京时间
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000));
  
  // 找到最近的考试
  let nextExam = null;
  let minDiff = Infinity;
  
  examDates.forEach(exam => {
    const diff = exam.date.getTime() - beijingTime.getTime();
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      nextExam = exam;
    }
  });
  
  if (nextExam && minDiff > 0) {
    const days = Math.floor(minDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((minDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((minDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((minDiff % (1000 * 60)) / 1000);
    
    const timeStr = days > 0 
      ? `${days}天${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    countdownDiv.querySelector('.countdown-label').textContent = `${nextExam.name}:`;
    countdownDiv.querySelector('.countdown-time').textContent = timeStr;
  } else {
    countdownDiv.querySelector('.countdown-label').textContent = '考试已结束';
    countdownDiv.querySelector('.countdown-time').textContent = '';
  }
}

// 初始化倒计时并每秒更新
updateCountdown();
setInterval(updateCountdown, 1000);

navWrap.append(prevBtn, nextBtn, websiteBtn, countdownDiv, refreshBtn);
/* 把按钮插在 iframe 前，也可以改成 content.appendChild(navWrap) 放在后面 */
content.prepend(navWrap);
// === 新增结束 ===

let currentIdx = -1;   // === 新增 ===

/* 切换章节 */
function switchTo(idx) {
  idx = Math.max(0, Math.min(idx, chapters.length - 1));   // 边界保护
  if (idx === currentIdx) return;                          // 没有变化

  frame.src = chapters[idx].file;
  // 添加时间戳参数破坏缓存
  const timestamp = new Date().getTime();
  frame.src = chapters[idx].file + '?v=' + timestamp;
  // 激活状态 & 无障碍
  // 清除所有链接的激活状态
  const allLinks = sidebar.querySelectorAll('a');
  allLinks.forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });
  
  // 激活当前选中的链接
  const currentLink = sidebar.querySelector(`a[data-idx="${idx}"]`);
  if (currentLink) {
    currentLink.classList.add('active');
    currentLink.setAttribute('aria-current', 'page');
  }

  // 更新按钮可用状态
  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx === chapters.length - 1;

  // 更新哈希 & 当前索引
  history.replaceState(null, '', `#${idx}`);
  currentIdx = idx;
}

/* ====== 初始化 ====== */
const initIndex = Math.min(
  Math.max(parseInt(location.hash.substring(1)) || 0, 0),
  chapters.length - 1
);
switchTo(initIndex);

/* ====== 汉堡按钮 ====== */
document.getElementById('toggle-btn')
  .addEventListener('click', () => {
    document.body.classList.toggle('hide-sidebar');
  });

/* ====== 主题切换监听 ====== */
window.addEventListener('message', (event) => {
  // 确保消息来自我们信任的源（可选，但推荐）
  // if (event.origin !== 'expected-iframe-origin') return;

  if (event.data && event.data.type === 'themeChange') {
    rootElement.classList.toggle('dark-mode', event.data.isDark);
    // 可选：如果侧边栏等其他元素也需要独立切换，可以在这里操作
    // 例如: sidebar.classList.toggle('dark-mode', event.data.isDark);
  }
});

// 初始化时，也尝试从 iframe 获取当前主题状态
// 这需要 iframe 在加载后立即发送其初始主题
// 或者，我们可以在 iframe 加载完成后向其请求主题状态
frame.addEventListener('load', () => {
  // 尝试向 iframe 发送消息，请求当前主题状态
  // 这需要 iframe 中的 toggle-theme.js 响应此消息
  // 为了简单起见，这里我们假设 iframe 会在加载时通过 postMessage 发送初始状态
  // 或者，如果 iframe 的 toggle-theme.js 已经修改为在初始化时发送消息，则这里不需要额外操作
  // 如果 iframe 还没有加载完成，我们可能需要一种方式来获取初始状态
  // 一个简单的方法是让 iframe 在其 toggle-theme.js 初始化时就发送一次主题状态
  // 另一个方法是，在父页面加载时，如果 localStorage 中有主题设置，则应用它
  const savedTheme = localStorage.getItem('prefers-dark');
  if (savedTheme !== null) {
    // Ensure parent theme is consistent if iframe reloads or has a theme
    // The message listener will handle updates if the iframe's theme changes *after* load
    rootElement.classList.toggle('dark-mode', savedTheme === 'true');
  }
  // Additionally, after iframe loads, we could ask it for its current theme
  // if its toggle-theme.js supports responding to such a request.
  // For now, the iframe sends its theme on its own init and on change.
});
