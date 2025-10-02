/**
 * Format uptime in days, hours, minutes, seconds
 * @param {number} seconds Total seconds of uptime
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}
(function() {
  window.renderServerHealth = function(data) {
    if (!data || !data.server_info) return;
    
    const serverInfo = data.server_info;
    
    // Update server status
    const serverStatus = document.getElementById('serverStatus');
    if (serverStatus) {
      serverStatus.textContent = serverInfo.server_status;
      serverStatus.className = 'small ' + (serverInfo.server_status === 'online' ? 'success' : 'error');
    }
    
    // Update server time
    const serverTime = document.getElementById('serverTime');
    if (serverTime) {
      const date = new Date(serverInfo.current_time);
      serverTime.textContent = date.toLocaleTimeString();
      setInterval(() => {
        // increase the time by a second
        date.setSeconds(date.getSeconds() + 1);
        serverTime.textContent = date.toLocaleTimeString();
      }, 1000);
    }
    
    // Update base URL
    const baseUrl = document.getElementById('baseUrl');
    if (baseUrl) {
      baseUrl.textContent = serverInfo.server_url;
    }
    
    // Update server health metrics
    if (serverInfo.health) {
      // Update uptime
      const serverUptime = document.getElementById('serverUptime');
      if (serverUptime) {
        serverUptime.textContent = serverInfo.health.uptime.formatted;
        setInterval(() => {
        // increase the time by a second
        serverUptime.textContent = formatUptime(serverInfo.health.uptime.seconds);
      }, 1000);
      }
      
      // Update memory usage
      const memoryUsage = document.getElementById('memoryUsage');
      if (memoryUsage) {
        memoryUsage.textContent = serverInfo.health.memory.usage_percent + '%';
        // Add color based on usage
        if (serverInfo.health.memory.usage_percent > 80) {
          memoryUsage.className = 'value error';
        } else if (serverInfo.health.memory.usage_percent > 60) {
          memoryUsage.className = 'value warning';
        } else {
          memoryUsage.className = 'value success';
        }
      }
      
      // Update success rate
      const successRate = document.getElementById('successRate');
      if (successRate && serverInfo.metrics) {
        successRate.textContent = serverInfo.metrics.requests.success_rate + '%';
        
        // Add color based on success rate
        if (serverInfo.metrics.requests.success_rate < 90) {
          successRate.className = 'value error';
        } else if (serverInfo.metrics.requests.success_rate < 95) {
          successRate.className = 'value warning';
        } else {
          successRate.className = 'value success';
        }
      }
      
      // Update total requests
      const totalRequests = document.getElementById('totalRequests');
      if (totalRequests && serverInfo.metrics) {
        totalRequests.textContent = serverInfo.metrics.requests.total;
      }
      
      // Update CPU cores
      const cpuCores = document.getElementById('cpuCores');
      if (cpuCores) {
        cpuCores.textContent = serverInfo.health.cpu.cores;
      }
      
      // Update process ID
      const processPid = document.getElementById('processPid');
      if (processPid) {
        processPid.textContent = serverInfo.health.process.pid;
      }
      
      // Display last error if any
      if (serverInfo.metrics && serverInfo.metrics.last_error) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerHTML = `
          <div class="small error">Last Error:</div>
          <div class="mono small">${serverInfo.metrics.last_error.message}</div>
          <div class="small">${new Date(serverInfo.metrics.last_error.time).toLocaleString()}</div>
        `;
        
        // Find a place to insert the error
        const serverCard = document.getElementById('serverCard');
        if (serverCard) {
          serverCard.appendChild(errorContainer);
        }
      }
    }
  };
})();

function renderServerHealth(docs) {
  if (!docs || typeof docs !== 'object') return;

  // Uptime
  const uptimeEl = document.getElementById('server-uptime');
  // Server Time
  const serverTimeEl = document.getElementById('server-time');
  // Memory Usage
  const memoryUsageEl = document.getElementById('memory-usage');
  // Success Rate
  const successRateEl = document.getElementById('success-rate');
  // Total Requests
  const totalRequestsEl = document.getElementById('total-requests');
  // CPU Cores
  const cpuCoresEl = document.getElementById('cpu-cores');
  // Process ID
  const processIdEl = document.getElementById('process-id');

  // Helper for formatting uptime
  function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor((seconds % (3600*24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  }

  // Live update timers
  let initialUptime = docs.uptimeSeconds || 0;
  let serverStartTime = docs.serverStartTime || Date.now();
  function updateMetrics() {
    // Uptime
    initialUptime++;
    if (uptimeEl) uptimeEl.textContent = formatUptime(initialUptime);
    // Server Time
    if (serverTimeEl) serverTimeEl.textContent = new Date(serverStartTime + initialUptime * 1000).toLocaleString();
    // Memory Usage
    if (memoryUsageEl) memoryUsageEl.textContent = docs.memoryUsage || '--';
    // Success Rate
    if (successRateEl) successRateEl.textContent = docs.successRate || '--';
    // Total Requests
    if (totalRequestsEl) totalRequestsEl.textContent = docs.totalRequests || '--';
    // CPU Cores
    if (cpuCoresEl) cpuCoresEl.textContent = docs.cpuCores || '--';
    // Process ID
    if (processIdEl) processIdEl.textContent = docs.processId || '--';
  }
  updateMetrics();
  setInterval(updateMetrics, 1000);
}
window.renderServerHealth = renderServerHealth;