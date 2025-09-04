
window.renderDocs = function (docs) {
  const data = docs.data;
  const server = docs.server_info;

  document.getElementById("serverStatus").innerText = server.server_status;
  document.getElementById("serverTime").innerText = new Date(
    server.current_time
  ).toLocaleString();
  document.getElementById("baseUrl").innerText =
    data.base_url || server.server_url || "n/a";

  document.getElementById("copyAll").onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(docs, null, 2));
    alert("Copied!");
  };

  const sectionsEl = document.getElementById("sections");
  const contentEl = document.getElementById("content");

  function renderSections(data, filter = "") {
    sectionsEl.innerHTML = "";
    contentEl.innerHTML = "";

    Object.keys(data.routes).forEach((sectionName) => {
      const section = data.routes[sectionName];

      // Flatten endpoints
      let endpoints = [];
      if (section.method) {
        // single endpoint (like health)
        endpoints.push(section);
      } else {
        // nested endpoints (like authentication, user_management, etc.)
        Object.keys(section).forEach((epName) => {
          endpoints.push(section[epName]);
        });
      }

      const navItem = document.createElement("div");
      navItem.className = "section-item";
      navItem.innerHTML =
        "<span>" +
        sectionName +
        "</span><span class='small'>" +
        endpoints.length +
        "</span>";
      navItem.onclick = () => {
        document
          .getElementById("sec-" + sectionName)
          .scrollIntoView({ behavior: "smooth" });
      };
      sectionsEl.appendChild(navItem);

      const secDiv = document.createElement("div");
      secDiv.id = "sec-" + sectionName;
      secDiv.className = "card";
      secDiv.innerHTML =
        "<h3>" +
        sectionName +
        "</h3><div class='small'>" +
        (section.description || "") +
        "</div>";

      const epGrid = document.createElement("div");
      epGrid.className = "grid";

      endpoints.forEach((ep) => {
        const match = filter.toLowerCase();
        const text = [ep.method, ep.path, ep.description]
          .join(" ")
          .toLowerCase();
        if (match && !text.includes(match)) return;

        const epCard = document.createElement("div");
        epCard.className = "card";
        epCard.innerHTML =
          "<div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:8px'>" +
          "<span class='badge'>" +
          ep.method +
          "</span>" +
          "<span class='path'>" +
          ep.path +
          "</span>" +
          "</div><div class='small'>" +
          (ep.description || "") +
          "</div>";
        epCard.onclick = () => {
          showModal(ep);
        };
        epGrid.appendChild(epCard);
      });

      if (epGrid.children.length > 0) {
        secDiv.appendChild(epGrid);
        contentEl.appendChild(secDiv);
      }
    });
  }
  function showModal(ep) {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modalBody");

    let html = `
    <h2>${ep.method} ${ep.path}</h2>
    <p>${ep.description || ""}</p>
    ${ep.auth_required ? "<p><b>Auth Required:</b> Yes</p>" : ""}
    ${ep.rate_limit ? "<p><b>Rate Limit:</b> ${ep.rate_limit}</p>" : ""}
  `;

    if (ep.path_params) {
      html +=
        "<h3>Path Params</h3><pre>" +
        JSON.stringify(ep.path_params, null, 2) +
        "</pre>";
    }
    if (ep.query_params) {
      html +=
        "<h3>Query Params</h3><pre>" +
        JSON.stringify(ep.query_params, null, 2) +
        "</pre>";
    }
    if (ep.body_structure) {
      html +=
        "<h3>Body Structure</h3><pre>" +
        JSON.stringify(ep.body_structure, null, 2) +
        "</pre>";
    }
    if (ep.example_request) {
      html +=
        "<h3>Example Request</h3><pre>" +
        JSON.stringify(ep.example_request, null, 2) +
        "</pre>";
    }
    if (ep.response) {
      html +=
        "<h3>Response</h3><pre>" +
        JSON.stringify(ep.response, null, 2) +
        "</pre>";
    }
    if (ep.response_success) {
      html +=
        "<h3>Response Success</h3><pre>" +
        JSON.stringify(ep.response_success, null, 2) +
        "</pre>";
    }
    if (ep.response_error) {
      html +=
        "<h3>Response Error</h3><pre>" +
        JSON.stringify(ep.response_error, null, 2) +
        "</pre>";
    }

    modalBody.innerHTML = html;
    modal.classList.remove("hidden");
  }

  document.getElementById("modalClose").onclick = () => {
    document.getElementById("modal").classList.add("hidden");
  };

  renderSections(data);
  document.getElementById("search").addEventListener("input", (e) => {
    renderSections(data, e.target.value);
  });
};
