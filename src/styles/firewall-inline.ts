/**
 * 防火墙组件内联样式加载器
 * 这个脚本会在页面加载时立即应用基本样式，防止样式闪烁
 */

// 创建一个立即执行的函数
(function() {
  // 基本样式定义
  const styles = `
    .firewall-container {
      width: 100% !important;
      display: block !important;
      box-sizing: border-box !important;
      font-family: var(--el-font-family) !important;
      color: var(--el-text-color-primary) !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    .firewall-container .el-table {
      width: 100% !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
    }
    
    .firewall-container .el-card {
      margin-bottom: 16px !important;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
      border: 1px solid #e4e7ed !important;
      border-radius: 4px !important;
    }
    
    .firewall-container .el-tabs {
      display: flex !important;
      flex-direction: column !important;
    }
    
    .firewall-container .el-button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
      cursor: pointer !important;
    }
    
    .firewall-container .el-form-item {
      margin-bottom: 18px !important;
    }
    
    .firewall-container .el-input {
      position: relative !important;
      font-size: 14px !important;
      display: inline-flex !important;
      width: 100% !important;
    }
    
    .firewall-container .el-select {
      width: 100% !important;
      display: inline-block !important;
      position: relative !important;
    }
    
    .firewall-container .el-pagination {
      margin-top: 16px !important;
      display: flex !important;
      align-items: center !important;
    }
    
    .mask {
      position: relative !important;
      opacity: 0.6 !important;
      pointer-events: none !important;
    }
    
    .mask::after {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background-color: rgba(255, 255, 255, 0.5) !important;
      z-index: 10 !important;
    }
  `;

  // 创建样式元素
  const styleElement = document.createElement('style');
  styleElement.id = 'firewall-inline-styles';
  styleElement.textContent = styles;

  // 将样式元素添加到文档头部
  document.head.appendChild(styleElement);

  // 监听路由变化，确保在防火墙页面加载时应用样式
  function checkAndApplyStyles() {
    // 检查当前URL是否包含防火墙页面的路径
    if (window.location.pathname.includes('/agents/firewall')) {
      // 确保样式元素存在
      if (!document.getElementById('firewall-inline-styles')) {
        document.head.appendChild(styleElement);
      }
    } else {
      // 如果不在防火墙页面，可以移除样式元素以避免影响其他页面
      const existingStyle = document.getElementById('firewall-inline-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }

  // 初始检查
  checkAndApplyStyles();

  // 监听历史状态变化（用于SPA路由变化）
  window.addEventListener('popstate', checkAndApplyStyles);
  
  // 创建一个MutationObserver来监视DOM变化
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // 检查是否添加了防火墙容器
        if (document.getElementById('firewall-container')) {
          // 确保样式元素存在
          if (!document.getElementById('firewall-inline-styles')) {
            document.head.appendChild(styleElement);
          }
        }
      }
    });
  });
  
  // 开始观察文档体的变化
  observer.observe(document.body, { childList: true, subtree: true });
})();

export default {};
