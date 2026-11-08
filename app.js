
(() => {
  "use strict";

  const STORAGE_KEY = "robinlinks_draft_v1";
  const form = document.getElementById("linkForm");
  const list = document.getElementById("linkList");
  const result = document.getElementById("result");
  const search = document.getElementById("search");
  const exportBtn = document.getElementById("exportBtn");

  let links = {};

  function baseUrl() {
    const path = window.location.pathname;
    const directory = path.endsWith("/")
      ? path
      : path.slice(0, path.lastIndexOf("/") + 1);

    return window.location.origin + directory;
  }

  function shortUrl(alias) {
    return baseUrl() + "s/" + encodeURIComponent(alias);
  }

  function validAlias(alias) {
    return /^[A-Za-z0-9_-]{1,60}$/.test(alias);
  }

  function validUrl(value) {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol);
    } catch {
      return false;
    }
  }

  function normalizeRecords(data) {
    const clean = {};

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return clean;
    }

    for (const [alias, record] of Object.entries(data)) {
      if (!validAlias(alias)) continue;

      const url = typeof record === "string"
        ? record
        : record && record.url;

      if (typeof url !== "string" || !validUrl(url)) continue;

      clean[alias] = {
        url,
        title: typeof record === "object" &&
          typeof record.title === "string"
          ? record.title.slice(0, 100)
          : "",
        created: typeof record === "object" &&
          typeof record.created === "string"
          ? record.created
          : ""
      };
    }

    return clean;
  }

  async function loadLinks() {
    let published = {};

    try {
      const response = await fetch(
        "links.json?version=" + Date.now(),
        { cache: "no-store" }
      );

      if (response.ok) {
        published = normalizeRecords(await response.json());
      }
    } catch (error) {
      console.warn("Unable to load published links.", error);
    }

    let draft = {};

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) draft = normalizeRecords(JSON.parse(stored));
    } catch (error) {
      console.warn("Unable to load browser drafts.", error);
    }

    links = { ...published, ...draft };
    saveDraft();
    render();
  }

  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    } catch (error) {
      console.warn("Unable to save browser drafts.", error);
      showMessage("Browser storage is unavailable. Export your links now.", true);
    }
  }

  function showMessage(message, isError = false) {
    result.textContent = message;
    result.classList.remove("hidden");
    result.classList.toggle("error", isError);
  }

  function generateAlias() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (let attempt = 0; attempt < 100; attempt++) {
      const bytes = new Uint8Array(7);
      crypto.getRandomValues(bytes);

      const alias = Array.from(
        bytes,
        value => chars[value % chars.length]
      ).join("");

      if (!Object.prototype.hasOwnProperty.call(links, alias)) {
        return alias;
      }
    }

    throw new Error("Could not generate a unique alias.");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const url = document.getElementById("longUrl").value.trim();
    let alias = document.getElementById("alias").value.trim();
    const title = document.getElementById("linkTitle").value.trim();

    if (!validUrl(url)) {
      showMessage("Please enter a valid HTTP or HTTPS URL.", true);
      return;
    }

    if (!alias) alias = generateAlias();

    if (!validAlias(alias)) {
      showMessage("Alias can contain only letters, numbers, - and _.", true);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(links, alias)) {
      showMessage("This alias already exists. Choose another.", true);
      return;
    }

    links[alias] = {
      url,
      title,
      created: new Date().toISOString()
    };

    saveDraft();
    render();
    form.reset();

    showMessage(
      "Created: " + shortUrl(alias) +
      " — Export links.json and upload it to GitHub before sharing."
    );
  });

  function makeButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    list.replaceChildren();

    const entries = Object.entries(links)
      .filter(([alias, record]) => {
        return [alias, record.url, record.title]
          .some(value => value.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        return (b[1].created || "").localeCompare(a[1].created || "");
      });

    if (entries.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No links found.";
      list.appendChild(empty);
      return;
    }

    for (const [alias, record] of entries) {
      const item = document.createElement("div");
      item.className = "link-item";

      const info = document.createElement("div");
      info.className = "link-info";

      const link = document.createElement("a");
      link.className = "short-link";
      link.href = shortUrl(alias);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = record.title
        ? record.title + " — " + alias
        : alias;

      const short = document.createElement("div");
      short.className = "small";
      short.textContent = shortUrl(alias);

      const original = document.createElement("div");
      original.className = "original";
      original.textContent = record.url;

      info.append(link, short, original);

      const actions = document.createElement("div");
      actions.className = "actions";

      actions.appendChild(makeButton(
        "Copy",
        "secondary",
        async () => {
          try {
            await navigator.clipboard.writeText(shortUrl(alias));
            showMessage("Short link copied: " + shortUrl(alias));
          } catch {
            showMessage("Copy failed. Select the URL manually.", true);
          }
        }
      ));

      actions.appendChild(makeButton(
        "Delete",
        "danger",
        () => {
          if (!confirm("Delete this link from your draft?")) return;
          delete links[alias];
          saveDraft();
          render();
          showMessage(
            "Deleted from browser draft. Export and upload links.json " +
            "to remove it from GitHub."
          );
        }
      ));

      item.append(info, actions);
      list.appendChild(item);
    }
  }

  exportBtn.addEventListener("click", () => {
    const json = JSON.stringify(links, null, 2);
    const blob = new Blob([json], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "links.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showMessage(
      "links.json downloaded. Replace the file in your GitHub repository."
    );
  });

  search.addEventListener("input", render);
  loadLinks();
})();
