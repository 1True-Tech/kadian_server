window.renderApiMetadata = (meta) => {
  const container = document.createElement("div");
  container.className = "card";

  const uid = "detail-open-" + Math.random().toString(36).substr(2, 9);

  // --- Preview content ---
  let preview = `
    <h2 style="margin-bottom:0.5rem">API Metadata</h2>
    <div class="small" style="margin-bottom:1rem; color:var(--muted)">
      Quick overview of API configuration
    </div>
    <ul class="small" style="margin:0 0 1rem 1.2rem; line-height:1.6">
      ${meta.authentication ? `<li><b>Auth:</b> ${meta.authentication.type}</li>` : ""}
      ${meta.security_features ? `<li><b>Security Features:</b> ${Object.keys(meta.security_features).length}</li>` : ""}
      ${meta.error_responses ? `<li><b>Error Codes:</b> ${Object.keys(meta.error_responses).length}</li>` : ""}
      ${meta.data_types ? `<li><b>Data Types:</b> ${Object.keys(meta.data_types).length}</li>` : ""}
      ${meta.notes ? `<li><b>Notes:</b> ${Object.keys(meta.notes).length}</li>` : ""}
    </ul>
    <button class="btn" id="${uid}" style="margin-top:0.5rem">View Details</button>
  `;

  // --- Full details for modal ---
  let details = `
    <h2 style="margin-bottom:0.75rem">API Metadata</h2>
    <div class="small" style="margin-bottom:1.5rem; color:var(--muted)">
      Full configuration and references
    </div>
  `;

  if (meta.authentication) {
    details += `
      <h3>Authentication</h3>
      <p><b>Type:</b> ${meta.authentication.type}</p>
      <p><b>Header:</b> <span class="mono">${meta.authentication.header}</span></p>
      <p class="small" style="margin-top:0.25rem">${meta.authentication.description}</p>
    `;
  }

  if (meta.security_features) {
    details += `<h3>Security Features</h3><ul>`;
    if (meta.security_features.rate_limiting) {
      details += `<li><b>Rate Limiting:</b> General: ${meta.security_features.rate_limiting.general}, Auth: ${meta.security_features.rate_limiting.auth_endpoints}</li>`;
    }
    if (meta.security_features.cors) {
      details += `<li><b>CORS:</b> ${meta.security_features.cors}</li>`;
    }
    if (meta.security_features.security_headers) {
      details += `<li><b>Security Headers:</b> ${meta.security_features.security_headers}</li>`;
    }
    details += `</ul>`;
  }

  if (meta.error_responses) {
    details += `<h3>Error Responses</h3>
      <div class="grid" style="gap:1rem">`;
    for (const [code, d] of Object.entries(meta.error_responses)) {
      details += `
        <div class="card" style="padding:0.75rem">
          <div style="margin-bottom:0.5rem"><b>${code}</b> - ${d.message}</div>
          <pre style="font-size:0.8rem; background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:6px; overflow-x:auto">${JSON.stringify(d, null, 2)}</pre>
        </div>`;
    }
    details += `</div>`;
  }

  if (meta.data_types) {
    details += `<h3>Data Types</h3>`;
    for (const [type, fields] of Object.entries(meta.data_types)) {
      details += `
        <h4 style="margin-top:1rem">${type}</h4>
        <pre style="font-size:0.8rem; background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:6px; overflow-x:auto">${JSON.stringify(fields, null, 2)}</pre>
      `;
    }
  }

  if (meta.notes) {
    details += `<h3>Notes</h3><ul>`;
    for (const [k, v] of Object.entries(meta.notes)) {
      details += `<li><b>${k}:</b> ${v}</li>`;
    }
    details += `</ul>`;
  }

  container.innerHTML = preview;

  // Attach event listener safely
  setTimeout(() => {
    const button = document.getElementById(uid);
    if (button) {
      button.addEventListener("click", () => {
        const modal = document.getElementById("modal");
        const modalBody = document.getElementById("modalBody");
        modalBody.innerHTML = details;
        modal.classList.remove("hidden");
      });
    }
  }, 0);

  // Close modal
  const modalClose = document.getElementById("modalClose");
  if (modalClose) {
    modalClose.onclick = () => {
      document.getElementById("modal").classList.add("hidden");
    };
  }

  return container;
};
