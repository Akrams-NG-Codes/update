const siteRoot = new URL("../../", document.currentScript.src);

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector("header nav[aria-label='Main navigation']");
  const navItems = [
    ["About us", "other%20pages/about-us"],
    ["Our work", "other%20pages/our-work"],
    ["Programmes", "programs"],
    ["Events and news", "other%20pages/events-news"],
    ["Gallery", "gallery"],
    ["AcroMind pulse", "blog"],
    ["Get involved", "other%20pages/get-involved"],
    ["General debate", "other%20pages/general-debate"],
    ["Contact", "other%20pages/contact"],
  ];

  if (nav) {
    nav.id = "primary-navigation";
    const list = document.createElement("ul");
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = "";

    navItems.forEach(([label, path]) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = new URL(path, siteRoot).href;
      link.textContent = label;
      if (link.href === currentUrl.href) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
      item.append(link);
      list.append(item);
    });

    const searchItem = document.createElement("li");
    searchItem.className = "search-item";
    searchItem.innerHTML = '<button class="search" type="button" aria-label="Search site" title="Search site" data-search-toggle><span class="search-icon" aria-hidden="true"></span></button>';
    list.append(searchItem);

    const donateItem = document.createElement("li");
    const donateLink = document.createElement("a");
    donateLink.className = "button";
    donateLink.href = new URL("other%20pages/donate", siteRoot).href;
    donateLink.textContent = "Donate";
    donateItem.append(donateLink);
    list.append(donateItem);
    nav.replaceChildren(list);

    const navContainer = nav.parentElement;
    const menuButton = document.createElement("button");
    menuButton.className = "menu-toggle";
    menuButton.type = "button";
    menuButton.setAttribute("aria-controls", nav.id);
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.innerHTML = '<span class="menu-icon" aria-hidden="true"></span><span>Menu</span>';
    navContainer.insertBefore(menuButton, nav);
    navContainer.classList.add("menu-enhanced");

    const closeMenu = () => {
      navContainer.classList.remove("menu-open");
      menuButton.setAttribute("aria-expanded", "false");
    };
    menuButton.addEventListener("click", () => {
      const isOpen = navContainer.classList.toggle("menu-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  document.querySelectorAll(".logo").forEach((logo) => {
    logo.href = new URL("/", siteRoot).href;
  });

  const trackEvent = (eventName, details = {}) => {
    try {
      const key = "acromind-analytics";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const payload = { eventName, page: window.location.pathname, timestamp: new Date().toISOString(), ...details };
      existing.push(payload);
      localStorage.setItem(key, JSON.stringify(existing.slice(-50)));
    } catch (error) {
      // Ignore storage errors in restricted browsers.
    }
  };

  document.querySelectorAll("[data-track]").forEach((element) => {
    element.addEventListener("click", () => trackEvent(element.dataset.track, { label: element.textContent.trim() }));
  });

  document.querySelectorAll("[data-mailto-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const name = (formData.get("name") || "").toString().trim() || "Supporter";
      const email = (formData.get("email") || "").toString().trim();
      const interest = (formData.get("interest") || "").toString().trim();
      const message = (formData.get("message") || "").toString().trim();
      const subjectBase = form.dataset.subject || "Acromind Initiative enquiry";
      const subject = `${subjectBase}: ${interest || name}`;
      const details = [
        `Name: ${name}`,
        email ? `Email: ${email}` : "Email: not provided",
        interest ? `Interest: ${interest}` : "",
        "",
        message || "No extra message provided.",
      ].filter(Boolean).join("\n");
      const mailtoLink = `mailto:olangoacrobat@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(details)}`;
      trackEvent("form_submit", { form: form.dataset.subject || "enquiry", interest });
      const success = form.querySelector("[data-form-success]");
      if (success) {
        success.hidden = false;
        success.textContent = "Your email app should open with a draft. Review and send it there; nothing is sent automatically. If it does not open, email us directly at olangoacrobat@gmail.com.";
      }
      window.location.href = mailtoLink;
    });
  });

  const searchButton = document.querySelector("[data-search-toggle]");
  if (!searchButton) return;

  const searchablePages = [
    ["/", "Home"],
    ["programs", "Programmes"],
    ["gallery", "Gallery"],
    ["blog", "AcroMind pulse"],
    ["other%20pages/about-us", "About us"],
    ["other%20pages/contact", "Contact"],
    ["other%20pages/donate", "Donate"],
    ["other%20pages/events-news", "Events and news"],
    ["other%20pages/general-debate", "General debate"],
    ["other%20pages/get-involved", "Get involved"],
    ["other%20pages/impact-report", "Our impact approach"],
    ["other%20pages/our-work", "Our work"],
    ["other%20pages/privacy-policy", "Privacy policy"],
    ["other%20pages/safeguarding-policy", "Safeguarding policy"],
  ];
  const textSelectors = "main h1, main h2, main h3, main p, main figcaption";
  const currentUrl = new URL(window.location.href);
  currentUrl.hash = "";
  let searchIndexPromise;
  let searchIncomplete = false;
  let searchRequestId = 0;

  const getPageEntries = (documentToRead, pageUrl, title) => [...documentToRead.querySelectorAll(textSelectors)]
    .map((item) => item.textContent.trim())
    .filter(Boolean)
    .map((text) => ({ text, title, url: pageUrl }));

  const loadSearchIndex = () => {
    if (searchIndexPromise) return searchIndexPromise;
    const currentEntries = getPageEntries(document, currentUrl, document.title);
    const otherPages = searchablePages
      .map(([path, title]) => ({ url: new URL(path, siteRoot), title }))
      .filter((page) => page.url.href !== currentUrl.href);

    searchIndexPromise = Promise.allSettled(otherPages.map(async (page) => {
      const response = await fetch(page.url);
      if (!response.ok) throw new Error(`Could not load ${page.url.pathname}`);
      const pageDocument = new DOMParser().parseFromString(await response.text(), "text/html");
      return getPageEntries(pageDocument, page.url, pageDocument.title || page.title);
    })).then((results) => {
      searchIncomplete = results.some((result) => result.status === "rejected");
      return [
        ...currentEntries,
        ...results.filter((result) => result.status === "fulfilled").flatMap((result) => result.value),
      ];
    });
    return searchIndexPromise;
  };

  const panel = document.createElement("div");
  panel.className = "search-panel";
  panel.id = "site-search-panel";
  panel.hidden = true;
  panel.innerHTML = '<div class="search-backdrop" data-search-close></div><div class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title"><button class="search-close" type="button" aria-label="Close search" data-search-close>&times;</button><p class="eyebrow">Search the site</p><h2 id="search-title">Find a story, programme, or idea.</h2><label class="sr-only" for="site-search">Search site content</label><input id="site-search" type="search" placeholder="Start typing..." autocomplete="off"><div class="search-results" aria-live="polite">Type to search site content.</div></div>';
  document.body.append(panel);
  searchButton.setAttribute("aria-haspopup", "dialog");
  searchButton.setAttribute("aria-controls", panel.id);
  searchButton.setAttribute("aria-expanded", "false");

  const input = panel.querySelector("input");
  const results = panel.querySelector(".search-results");
  const close = (restoreFocus = true) => {
    panel.hidden = true;
    searchButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) searchButton.focus();
  };

  const renderResults = async () => {
    const requestId = ++searchRequestId;
    const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    results.replaceChildren();
    if (!terms.length) {
      results.textContent = "Type to search site content.";
      return;
    }

    results.textContent = "Searching...";
    const index = await loadSearchIndex();
    if (requestId !== searchRequestId || panel.hidden) return;
    const matches = index.filter((entry) => terms.every((term) => entry.text.toLowerCase().includes(term))).slice(0, 12);
    results.replaceChildren();
    if (!matches.length) {
      results.textContent = searchIncomplete ? "No matching content found. Some pages could not be searched." : "No matching content found.";
      return;
    }

    matches.forEach((match) => {
      const result = document.createElement("a");
      const target = new URL(match.url);
      target.hash = "top";
      result.href = target.href;
      result.textContent = `${match.title}: ${match.text}`;
      results.append(result);
    });
  };

  searchButton.addEventListener("click", () => {
    const navContainer = searchButton.closest(".nav.menu-enhanced");
    if (navContainer) {
      navContainer.classList.remove("menu-open");
      navContainer.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
    }
    panel.hidden = false;
    searchButton.setAttribute("aria-expanded", "true");
    input.value = "";
    results.textContent = "Type to search site content.";
    input.focus();
  });
  panel.addEventListener("click", (event) => {
    if (event.target.matches("[data-search-close]")) close();
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...panel.querySelectorAll("button:not([disabled]), input:not([disabled]), a[href]")];
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