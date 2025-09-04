import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    const serverInfo = {
      server_status: "online",
      current_time: new Date().toISOString(),
      server_url: event.req.protocol + "://" + event.req.get("host"),
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
<main class="main"><div id="meta-data"></div><div id="content"></div></main>
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
<script src="/initDocs.js"></script>

</body>
</html>
`;

    event.res.setHeader("Content-Type", "text/html; charset=utf-8");
    event.res.status(200).send(html);
  } catch (error) {
    return {
      status: "bad",
      statusCode: 500,
      message:
        "Failed to load API documentation: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}
