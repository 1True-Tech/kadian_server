import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import os from "os";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Server metrics are stored at module level for persistence between requests
let serverStartTime = new Date();
let serverMetrics = {
  requestsTotal: 0,
  requestsSuccess: 0,
  requestsError: 0,
  lastError: null,
  lastErrorTime: null
};

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

/**
 * Home route that returns interactive HTML API documentation
 * @param {import("../../lib/utils/withErrorHandling").RouteEvent} event
 */
export async function homeLogic(event) {
  try {
    const routeDetailsPath = join(
      __dirname,
      "../../lib/constants/routeDetails.json"
    );
    const routeDetailsContent = readFileSync(routeDetailsPath, "utf8");
    const routeDetails = JSON.parse(routeDetailsContent);

    // Increment request counter
    serverMetrics.requestsTotal++;
    
    let uptime = Math.floor((new Date() - serverStartTime) / 1000);
    setInterval(() => {
      uptime = Math.floor((new Date() - serverStartTime) / 1000)
    }, 1000);
    
    const serverInfo = {
      server_status: "online",
      current_time: new Date().toISOString(),
      server_url: event.req.protocol + "://" + event.req.get("host"),
      health: {
        uptime: {
          seconds: uptime,
          formatted: formatUptime(uptime)
        },
        started_at: serverStartTime.toISOString(),
        memory: {
          total: Math.round(os.totalmem() / (1024 * 1024)) + " MB",
          free: Math.round(os.freemem() / (1024 * 1024)) + " MB",
          usage_percent: Math.round((1 - os.freemem() / os.totalmem()) * 100)
        },
        cpu: {
          cores: os.cpus().length,
          load: os.loadavg()
        },
        process: {
          pid: process.pid,
          memory_usage: Math.round(process.memoryUsage().rss / (1024 * 1024)) + " MB"
        }
      },
      metrics: {
        requests: {
          total: serverMetrics.requestsTotal,
          success: serverMetrics.requestsSuccess,
          error: serverMetrics.requestsError,
          success_rate: serverMetrics.requestsTotal > 0 
            ? Math.round((serverMetrics.requestsSuccess / serverMetrics.requestsTotal) * 100) 
            : 100
        },
        last_error: serverMetrics.lastError 
          ? { message: serverMetrics.lastError, time: serverMetrics.lastErrorTime }
          : null
      },
      request_info: {
        method: event.req.method,
        path: event.req.path,
        user_agent: event.req.get("User-Agent"),
        ip: event.req.ip || event.req.connection.remoteAddress,
      },
    };

    routeDetails.api_documentation.base_url = serverInfo.server_url;

    const docsObj = {
      message:
        "Welcome to Kadian Server API - Comprehensive documentation below",
      connectionActivity: "online",
      statusCode: 200,
      success: true,
      status: "good",
      server_info: serverInfo,
      data: routeDetails.api_documentation,
    };

    const safePayload = JSON.stringify(docsObj).replace(/</g, "\\u003c");

    const html = `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kadian Server API Docs</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="wrap">
<header>
  <div class="brand">
    <div class="logo">K</div>
    <div>
      <div class="title">Kadian Server API</div>
      <div class="small">Documentation, examples, and quick actions</div>
    </div>
  </div>
  <div class="controls">
    <input id="search" class="search" placeholder="Search endpoints, paths, methods" />
    <button id="copyAll" class="btn">Copy JSON</button>
  </div>
</header>
<aside>
  <div class="small" style="margin-bottom:10px">Server</div>
  <div class="card" id="serverCard">
    <div style="display:flex; justify-content:space-between; align-items:center">
      <div>
        <div style="font-weight:700">Status</div>
        <div class="small" id="serverStatus">loading</div>
      </div>
      <div class="badge" id="serverTime">--</div>
    </div>
    <div style="margin-top:10px">
      <div class="small">Base URL</div>
      <div class="mono" id="baseUrl"></div>
    </div>
  </div>
  <div style="height:12px"></div>
  <div class="small">Sections</div>
  <div class="section-list" id="sections"></div>
  <div class="footer">Click a section to focus it. Use search to filter endpoints.</div>
</aside>

<div class="main">
<section class="dashboard">
    <div class="metric-card">
      <div class="card-header">
        <span class="metric-icon">⏱️</span>
        <span class="metric-label">Uptime</span>
      </div>
      <div class="card-body">
        <span id="serverUptime" class="metric-value">--</span>
      </div>
    </div>
    <div class="metric-card">
      <div class="card-header">
        <span class="metric-icon">💾</span>
        <span class="metric-label">Memory Usage</span>
      </div>
      <div class="card-body">
        <span id="memoryUsage" class="metric-value">--</span>
      </div>
    </div>
    <div class="metric-card">
      <div class="card-header">
        <span class="metric-icon">✅</span>
        <span class="metric-label">Success Rate</span>
      </div>
      <div class="card-body">
        <span id="successRate" class="metric-value">--</span>
      </div>
    </div>
    <div class="metric-card">
      <div class="card-header">
        <span class="metric-icon">📊</span>
        <span class="metric-label">Total Requests</span>
      </div>
      <div class="card-body">
        <span id="totalRequests" class="metric-value">--</span>
      </div>
    </div>
    <div class="metric-card">
      <div class="card-header">
        <span class="metric-icon">🧮</span>
        <span class="metric-label">CPU Cores</span>
      </div>
      <div class="card-body">
        <span id="cpuCores" class="metric-value">--</span>
      </div>
    </div>
    <div class="metric-card">
      <div class="card-header">
        <span class="metric-icon">🔢</span>
        <span class="metric-label">Process ID</span>
      </div>
      <div class="card-body">
        <span id="processPid" class="metric-value">--</span>
      </div>
    </div>
  </section>
<div id="meta-data"></div><div id="content"></div></main>
<div id="modal" class="modal hidden">
  <div class="modal-content">
    <button id="modalClose" class="btn">Close</button>
    <div id="modalBody"></div>
  </div>
</div>
</div>
  <script id="docs-data" type="application/json">
${safePayload}
</script>

<script src="/renderRouteDetails.js"></script>
<script src="/renderApiMetadata.js"></script>
<script src="/renderServerHealth.js"></script>
<script src="/initDocs.js"></script>

</body>
</html>
`;

    event.res.setHeader("Content-Type", "text/html; charset=utf-8");
    event.res.status(200).send(html);
  } catch (error) {
    // Track the error
    serverMetrics.requestsError++;
    serverMetrics.lastError = error instanceof Error ? error.message : String(error);
    serverMetrics.lastErrorTime = new Date().toISOString();
    
    return {
      status: "bad",
      statusCode: 500,
      message:
        "Failed to load API documentation: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
  
  // Track successful request
  serverMetrics.requestsSuccess++;
}


