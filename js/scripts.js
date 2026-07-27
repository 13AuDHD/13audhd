
const $ = (selector, context = document) =>
  context.querySelector(selector);

const $$ = (selector, context = document) =>
  [...context.querySelectorAll(selector)];

async function loadIncludes() {
  const includeElements = $$("[data-include]");

  await Promise.all(
    includeElements.map(async (element) => {
      const file = element.dataset.include;

      try {
        const response = await fetch(file);

        if (!response.ok) {
          throw new Error(
            `Could not load ${file}: ${response.status}`
          );
        }

        element.innerHTML = await response.text();
      } catch (error) {
        console.error(error);

        element.innerHTML = `
          <p class="include-error">
            Part of this page could not be loaded.
          </p>
        `;
      }
    })
  );
}

function initializeMenu() {
  const body = document.body;
  const toggle = $("[data-menu-toggle]");

  function setMenu(open) {
    body.classList.toggle("menu-open", open);

    toggle?.setAttribute(
      "aria-expanded",
      String(open)
    );

    toggle?.setAttribute(
      "aria-label",
      open ? "Close menu" : "Open menu"
    );
  }

  toggle?.addEventListener("click", () => {
    const isOpen =
      body.classList.contains("menu-open");

    setMenu(!isOpen);
  });

  $$(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      body.classList.contains("menu-open")
    ) {
      setMenu(false);
      toggle?.focus();
    }
  });
}

function initializeTheme() {
  const root = document.documentElement;
  const themeButtons = $$("[data-theme-toggle]");

  function applyTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem("theme", theme);

    themeButtons.forEach((button) => {
      button.innerHTML =
        theme === "light"
          ? '<i class="fa-solid fa-moon"></i>'
          : '<i class="fa-solid fa-lightbulb"></i>';

      button.setAttribute(
        "aria-label",
        theme === "light"
          ? "Use dark theme"
          : "Use light theme"
      );
    });
  }

  applyTheme(
    localStorage.getItem("theme") || "dark"
  );

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(
        root.dataset.theme === "light"
          ? "dark"
          : "light"
      );
    });
  });
}

function initializeCopyright() {
  $$("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}

function initializeStatistics() {
  const statistics = $$("[data-count]");

  if (!statistics.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (
          !entry.isIntersecting ||
          entry.target.dataset.done
        ) {
          return;
        }

        entry.target.dataset.done = "1";
        entry.target.classList.add("is-visible");

        const output = $(
          "[data-count-output]",
          entry.target
        );

        const target = Number(
          entry.target.dataset.count
        );

        const suffix =
          entry.target.dataset.suffix || "";

        const start = performance.now();
        const duration = 2200;

        function animate(now) {
          const progress = Math.min(
            (now - start) / duration,
            1
          );

          const eased =
            1 - Math.pow(1 - progress, 4);

          output.textContent =
            Math.round(target * eased).toLocaleString() +
            suffix;

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        }

        requestAnimationFrame(animate);
      });
    },
    {
      threshold: 0.35
    }
  );

  statistics.forEach((statistic) => {
    observer.observe(statistic);
  });
}

function initializeBlogFilters() {
  const filterForm = $("[data-blog-filters]");

  if (!filterForm) {
    return;
  }

  const cards = $$("[data-post-card]");
  const grid = $("[data-post-grid]");

  function filterPosts() {
    const searchValue = $(
      "[name=q]",
      filterForm
    ).value
      .trim()
      .toLowerCase();

    const category = $(
      "[name=category]",
      filterForm
    ).value;

    const length = $(
      "[name=length]",
      filterForm
    ).value;

    const sort = $(
      "[name=sort]",
      filterForm
    ).value;

    cards.forEach((card) => {
      const searchableText = (
        `${card.dataset.title} ${card.dataset.content}`
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        searchableText.includes(searchValue);

      const matchesCategory =
        !category ||
        card.dataset.category === category;

      const matchesLength =
        !length ||
        card.dataset.length === length;

      card.hidden = !(
        matchesSearch &&
        matchesCategory &&
        matchesLength
      );
    });

    [...cards]
      .sort((first, second) => {
        if (sort === "oldest") {
          return first.dataset.date.localeCompare(
            second.dataset.date
          );
        }

        return second.dataset.date.localeCompare(
          first.dataset.date
        );
      })
      .forEach((card) => {
        grid.append(card);
      });
  }

  filterForm.addEventListener(
    "input",
    filterPosts
  );

  filterPosts();
}

function initializeParallax() {
  const sections = $$("[data-parallax-section]");

  if (!sections.length) {
    return;
  }

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    return;
  }

  let ticking = false;

  function updateParallax() {
    sections.forEach((section) => {
      const image = $("[data-parallax-image]", section);

      if (!image) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (
        rect.bottom < 0 ||
        rect.top > viewportHeight
      ) {
        return;
      }

      const sectionCenter =
        rect.top + rect.height / 2;

      const viewportCenter =
        viewportHeight / 2;

      const distance =
        sectionCenter - viewportCenter;

      const movement = distance * -0.12;

      image.style.transform =
        `translate3d(0, ${movement}px, 0) scale(1.04)`;
    });

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) {
      return;
    }

    ticking = true;
    requestAnimationFrame(updateParallax);
  }

  window.addEventListener(
    "scroll",
    requestUpdate,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    requestUpdate
  );

  updateParallax();
}

function initializeCardReveals() {
  const cards = $$(
    "#design .media-card, " +
    "#living-system .horizon-feature-grid article"
  );

  if (!cards.length) {
    return;
  }

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  document.documentElement.classList.add(
    "has-card-reveals"
  );

  if (reduceMotion) {
    cards.forEach((card) => {
      card.classList.add("is-revealed");
    });

    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add(
          "is-revealed"
        );

        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  cards.forEach((card) => {
    observer.observe(card);
  });
}

async function initializeSite() {
  await loadIncludes();

  initializeMenu();
  initializeTheme();
  initializeCopyright();
  initializeStatistics();
  initializeBlogFilters();
  initializeParallax();
  initializeCardReveals();
}

initializeSite();
