/**
 * 章节配置：{ title, file }
 */
const chapters = [
  { title: '题目搜索', file: 'HTML/search.html' },// Added new quiz page
  { title: '第一章 · 概论', file: 'HTML/chapter1.html' },
  { title: '第二章 · 智能优化技术', file: 'HTML/chapter2.html' },
  { title: '第三章 · 模式与图像识别-1', file: 'HTML/chapter3-1.html' },
  { title: '第三章 · 模式与图像识别-2', file: 'HTML/chapter3-2.html' },
  { title: '第三章 · 模式与图像识别-3', file: 'HTML/chapter3.html' },
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
  { title: '题库(模拟)', file: 'HTML/chapter13.html' },
  { title: '选择题(新版模拟)', file: 'HTML/chapter14.html' },
  { title: '代码解释', file: 'HTML/code.html' },
  { title: '总结', file: 'HTML/summary.html' },
  { title: '随机抽题', file: 'HTML/quiz.html' }, 
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

// 首先添加题目搜索链接（在分组之前）
const searchLink = document.createElement('a');
searchLink.href = '#0';
searchLink.textContent = chapters[0].title;
searchLink.dataset.idx = 0;
searchLink.addEventListener('click', e => {
  e.preventDefault();
  switchTo(0);
  if (window.matchMedia('(max-width:768px)').matches) {
    document.body.classList.add('hide-sidebar');
  }
});
sidebar.appendChild(searchLink);

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
  
  // 跳过索引0（题目搜索），因为已经在分组之前添加了
  if (idx === 0) {
    return; // 跳过题目搜索，已经单独添加
  }
  
  // 根据章节索引分组：1-7为制造技术，8-14为数据技术，15-19单独放在最后
  if (idx >= 1 && idx <= 7) {
    manufacturingContent.appendChild(link);
  } else if (idx >= 8 && idx <= 14) {
    dataContent.appendChild(link);
  } else {
    // 其他章节直接添加到侧边栏，不在分组内
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
  window.open('https://wulinggui.com/', '_blank');
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

// 创建GitHub按钮
const githubBtn = document.createElement('button');
githubBtn.id = 'github-btn';
githubBtn.textContent = '📁GitHub';
githubBtn.title = '查看GitHub仓库';
githubBtn.addEventListener('click', () => {
  window.open('https://github.com/Lang7910/2024-2025-term-2-review', '_blank');
});

// 倒计时紧急状态阈值（毫秒）- 可调整用于测试
// 默认1小时 = 60 * 60 * 1000，可改为更小值测试效果，如 5 * 60 * 1000 (5分钟)
// 当前设置为5分钟以便测试效果，实际使用时可改回 60 * 60 * 1000
const URGENT_THRESHOLD = 2460 * 60 * 1000; // 5分钟（测试用）

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
    
    // 检查是否进入紧急状态（剩余时间不足阈值）
    if (minDiff <= URGENT_THRESHOLD) {
      countdownDiv.classList.add('urgent');
    } else {
      countdownDiv.classList.remove('urgent');
    }
  } else {
    countdownDiv.querySelector('.countdown-label').textContent = '考试已结束';
    countdownDiv.querySelector('.countdown-time').textContent = '';
    countdownDiv.classList.remove('urgent');
  }
}

// 初始化倒计时并每秒更新
updateCountdown();
setInterval(updateCountdown, 1000);

navWrap.append(prevBtn, nextBtn, websiteBtn, countdownDiv, refreshBtn, githubBtn);
/* 把按钮插在 iframe 前，也可以改成 content.appendChild(navWrap) 放在后面 */
content.prepend(navWrap);
// === 新增结束 ===

// === 弹窗提示功能 ===
function createNotificationModal() {
  // 弹窗内容配置 - 在这里修改提示内容
  const notificationContent = {
    version: '0.8.8', // 版本号，更新内容时修改此版本号
    title: '更新内容',
    message: `
      <div style="text-align: left; line-height: 1.6;">
        <h3 style="color: #2c3e50; margin-top: 0;">🎯 复习提醒</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>🔍 增加了搜索页面，查看题目更方便</li>
          <li>📚 百题斩：抽题随机模式增加自适应刷题</li>
          <li>📚 增加了新版工业互联网【模拟】选择题</li>
          <li>💡 遇到问题可联系作者</li>
        </ul>
        <p style="color: #666; font-size: 14px; margin-bottom: 0;">祝您考试顺利！🎉</p>
      </div>
    `
  };
  
  // 检查是否已经显示过此版本的提示
  const lastShownVersion = localStorage.getItem('notificationVersion');
  if (lastShownVersion === notificationContent.version) {
    return; // 已经显示过，不再弹出
  }
  
  // 创建弹窗遮罩
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.3s ease;
  `;
  
  // 创建弹窗主体
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    position: relative;
    animation: slideIn 0.3s ease;
  `;
  
  // 创建关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 15px;
    right: 20px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  `;
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#f0f0f0';
    closeBtn.style.color = '#333';
  });
  
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
    closeBtn.style.color = '#999';
  });
  
  // 创建内容区域
  const content = document.createElement('div');
  content.innerHTML = `
    <h2 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">${notificationContent.title}</h2>
    ${notificationContent.message}
  `;
  
  // 创建确认按钮
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '我知道了';
  confirmBtn.style.cssText = `
    background: #007bff;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 20px;
    width: 100%;
    transition: background 0.2s ease;
  `;
  
  confirmBtn.addEventListener('mouseenter', () => {
    confirmBtn.style.background = '#0056b3';
  });
  
  confirmBtn.addEventListener('mouseleave', () => {
    confirmBtn.style.background = '#007bff';
  });
  
  // 关闭弹窗函数
  const closeModal = () => {
    overlay.style.animation = 'fadeOut 0.3s ease';
    modal.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
    
    // 记录已显示的版本
    localStorage.setItem('notificationVersion', notificationContent.version);
  };
  
  // 绑定关闭事件
  closeBtn.addEventListener('click', closeModal);
  confirmBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // 组装弹窗
  modal.appendChild(closeBtn);
  modal.appendChild(content);
  modal.appendChild(confirmBtn);
  overlay.appendChild(modal);
  
  // 添加CSS动画
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes slideIn {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(-50px); opacity: 0; }
    }
    
    /* 暗色模式支持 */
    html.dark-mode .notification-modal {
      background: #2a2a2a !important;
      color: #e0e0e0 !important;
    }
    html.dark-mode .notification-modal h2,
    html.dark-mode .notification-modal h3 {
      color: #e0e0e0 !important;
    }
    html.dark-mode .notification-modal button {
      background: #495057 !important;
    }
    html.dark-mode .notification-modal button:hover {
      background: #6c757d !important;
    }
  `;
  document.head.appendChild(style);
  
  // 添加暗色模式类
  modal.className = 'notification-modal';
  
  // 显示弹窗
  document.body.appendChild(overlay);
  
  // ESC键关闭
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

// 页面加载完成后显示弹窗
window.addEventListener('load', () => {
  // 延迟1秒显示，确保页面完全加载
  setTimeout(createNotificationModal, 1000);
});
// === 弹窗提示功能结束 ===

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
  
  // 处理来自搜索页面的章节导航请求
  if (event.data && event.data.type === 'navigateToChapter') {
    const { chapterIndex, questionText } = event.data;
    if (typeof chapterIndex === 'number' && chapterIndex >= 0 && chapterIndex < chapters.length) {
      switchTo(chapterIndex);
      
      // 如果有题目文本，等待iframe加载完成后定位到题目
      if (questionText) {
        const locateQuestion = () => {
          try {
            const iframeDoc = frame.contentDocument || frame.contentWindow.document;
            if (iframeDoc) {
              // 查找包含题目文本的元素
              const strongElements = iframeDoc.querySelectorAll('p strong');
              for (let element of strongElements) {
                if (element.textContent.includes(questionText.substring(0, 20))) {
                  // 滚动到题目位置
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // 高亮显示题目（可选）
                  element.style.backgroundColor = '#ffeb3b';
                  element.style.transition = 'background-color 0.3s ease';
                  setTimeout(() => {
                    element.style.backgroundColor = '';
                  }, 3000);
                  break;
                }
              }
            }
          } catch (error) {
            console.warn('无法定位到题目:', error);
          }
        };
        
        // 等待iframe加载完成
        if (frame.contentDocument && frame.contentDocument.readyState === 'complete') {
          setTimeout(locateQuestion, 100);
        } else {
          frame.addEventListener('load', () => {
            setTimeout(locateQuestion, 100);
          }, { once: true });
        }
      }
      
      // 如果侧边栏在移动设备上是隐藏的，显示它以便用户看到导航结果
      if (window.matchMedia('(max-width:768px)').matches) {
        document.body.classList.remove('hide-sidebar');
        // 短暂显示后自动隐藏
        setTimeout(() => {
          document.body.classList.add('hide-sidebar');
        }, 2000);
      }
    }
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
