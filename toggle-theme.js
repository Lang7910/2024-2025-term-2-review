// theme-toggle.js
(function () {
  const CLASS = 'dark-mode';
  const root  = document.documentElement;

  const init = () => {
    /* ---------- 初始化主题 ---------- */
    const saved   = localStorage.getItem('prefers-dark');
    const system  = matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark  = saved === null ? system : saved === 'true';
    root.classList.toggle(CLASS, isDark);

    // Inform parent window of the theme change
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'themeChange', isDark: isDark }, '*');
    }

    /* ---------- 构建右上角按钮 ---------- */
    const btn = Object.assign(document.createElement('button'), {
      id: 'theme-toggle',
      title: '切换暗/亮模式',
      textContent: '🌓'
    });
    Object.assign(btn.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      padding: '4px 6px',
      fontSize: '14px',
      lineHeight: '1',
      border: '1px solid #999',
      borderRadius: '4px',
      background: '#fff',
      color: '#333', // Default text color for light mode
      cursor: 'pointer',
      zIndex: '10000'
    });

    // Style for dark mode
    const style = document.createElement('style');
    style.textContent = `
      html.dark-mode #theme-toggle {
        background: #333;
        color: #fff;
        border-color: #555;
      }
    `;
    document.head.appendChild(style);

    btn.onclick = () => {
      let darkNow = !root.classList.contains(CLASS);
      darkNow = !root.classList.contains(CLASS);
      root.classList.toggle(CLASS, darkNow);
      localStorage.setItem('prefers-dark', darkNow);

      // Inform parent window of the theme change
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'themeChange', isDark: darkNow }, '*');
      }
    };

    document.body.appendChild(btn);
  };

  // 确保 DOM 完全加载后再执行初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
