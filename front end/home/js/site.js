document.addEventListener("DOMContentLoaded", () => {
  const currentFile = decodeURIComponent(window.location.pathname.split("/").pop()) || "index.html";
  document.querySelectorAll("nav a[href]").forEach((link) => {
    const linkFile = decodeURIComponent(link.getAttribute("href").split("#")[0].split("?")[0].split("/").pop());
    if (linkFile && linkFile === currentFile) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  const searchLink = document.querySelector("[data-search-toggle]");
  if (!searchLink) return;

  const searchableItems = [...document.querySelectorAll("main h1, main h2, main h3, main p, main figcaption")];
  const panel = document.createElement("div");
  panel.className = "search-panel";
  panel.id = "site-search-panel";
  panel.hidden = true;
  panel.innerHTML = `<div class="search-backdrop" data-search-close></div><div class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title"><button class="search-close" type="button" aria-label="Close search" data-search-close>&times;</button><p class="eyebrow">Search this page</p><h2 id="search-title">Find a story, programme, or idea.</h2><label class="sr-only" for="site-search">Search this page</label><input id="site-search" type="search" placeholder="Start typing..." autocomplete="off"><div class="search-results" aria-live="polite"></div></div>`;
  document.body.append(panel);
  searchLink.setAttribute("aria-haspopup", "dialog");
  searchLink.setAttribute("aria-controls", panel.id);
  searchLink.setAttribute("aria-expanded", "false");

  const input = panel.querySelector("input");
  const results = panel.querySelector(".search-results");
  const close = () => {
    panel.hidden = true;
    searchLink.setAttribute("aria-expanded", "false");
    searchLink.focus();
  };
  const renderResults = () => {
    const term = input.value.trim().toLowerCase();
    if (!term) {
      results.innerHTML = "<p>Search the content on this page.</p>";
      return;
    }
    const matches = searchableItems.filter((item) => item.textContent.toLowerCase().includes(term)).slice(0, 8);
    results.replaceChildren();
    if (!matches.length) {
      const message = document.createElement("p");
      message.textContent = "No matching content found.";
      results.append(message);
      return;
    }
    matches.forEach((item) => {
      const result = document.createElement("button");
      result.type = "button";
      result.textContent = item.textContent.trim();
      result.addEventListener("click", () => {
        item.scrollIntoView({ behavior: "smooth", block: "center" });
        close();
      });
      results.append(result);
    });
  };

  searchLink.addEventListener("click", (event) => {
    event.preventDefault();
    panel.hidden = false;
    searchLink.setAttribute("aria-expanded", "true");
    input.value = "";
    renderResults();
    input.focus();
  });
  panel.addEventListener("click", (event) => {
    if (event.target.matches("[data-search-close]")) close();
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...panel.querySelectorAll("button:not([disabled]), input:not([disabled])")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  input.addEventListener("input", renderResults);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) close();
  });
});
