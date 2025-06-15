// IP信息追踪器
class IPTracker {
  constructor() {
    this.storageKey = 'visitor_ip_logs';
    this.maxLogs = 1000; // 最多保存100条记录
  }

  // 获取访问者IP信息
  async getIPInfo() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        timezone: data.timezone,
        isp: data.org,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        screen: `${screen.width}x${screen.height}`,
        referrer: document.referrer || '直接访问'
      };
    } catch (error) {
      console.log('获取IP信息失败，尝试备用API:', error);
      return await this.getIPInfoBackup();
    }
  }

  // 备用IP获取方法
  async getIPInfoBackup() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return {
        ip: data.ip,
        city: '未知',
        region: '未知',
        country: '未知',
        timezone: '未知',
        isp: '未知',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        screen: `${screen.width}x${screen.height}`,
        referrer: document.referrer || '直接访问'
      };
    } catch (error) {
      console.log('所有IP API都失败了:', error);
      return null;
    }
  }

  // 保存IP信息到本地存储
  saveIPInfo(ipInfo) {
    if (!ipInfo) return;

    try {
      // 获取现有记录
      let logs = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      
      // 检查是否是同一IP的重复访问（1小时内）
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentSameIP = logs.find(log => 
        log.ip === ipInfo.ip && log.timestamp > oneHourAgo
      );
      
      if (!recentSameIP) {
        // 添加新记录
        logs.unshift(ipInfo);
        
        // 限制记录数量
        if (logs.length > this.maxLogs) {
          logs = logs.slice(0, this.maxLogs);
        }
        
        // 保存到localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(logs));
        console.log('IP信息已保存:', ipInfo.ip);
      } else {
        console.log('1小时内重复访问，跳过记录');
      }
    } catch (error) {
      console.log('保存IP信息失败:', error);
    }
  }

  // 获取所有访问记录
  getAllLogs() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch (error) {
      console.log('读取访问记录失败:', error);
      return [];
    }
  }

  // 导出访问记录为JSON文件
  exportLogs() {
    const logs = this.getAllLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `访问记录_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  // 清空访问记录
  clearLogs() {
    localStorage.removeItem(this.storageKey);
    console.log('访问记录已清空');
  }

  // 显示访问统计（已禁用显示）
  displayStats() {
    // 统计功能已隐藏，不在页面上显示
    // 数据仍然会被收集和存储
    const logs = this.getAllLogs();
    const uniqueIPs = new Set(logs.map(log => log.ip)).size;
    const totalVisits = logs.length;
    
    // 仅在控制台输出统计信息
    console.log(`访问统计 - 总访问: ${totalVisits}次, 独立IP: ${uniqueIPs}个`);
  }

  // 初始化追踪
  async init() {
    console.log('开始IP追踪...');
    const ipInfo = await this.getIPInfo();
    if (ipInfo) {
      this.saveIPInfo(ipInfo);
      this.displayStats();
    }
  }
}

// 创建全局实例
const ipTracker = new IPTracker();

// 页面加载完成后开始追踪
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ipTracker.init());
} else {
  ipTracker.init();
}