(function () {
  const el = document.getElementById("docs-data");
  if (!el) {
    console.error("Docs data element missing");
    return;
  }

  try {
    const docs = JSON.parse(el.textContent);
    if (!docs) {
      console.error("Docs JSON is empty or invalid");
      return;
    }

    window.renderDocs(docs);
    if (docs.data) {
      const metaPanel = window.renderApiMetadata(docs.data);
      document.getElementById("meta-data").prepend(metaPanel);
    }
  } catch (err) {
    console.error("Failed to parse docs JSON", err);
  }
})();
