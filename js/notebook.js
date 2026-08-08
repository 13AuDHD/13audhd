(() => {
  "use strict";

  const notebookBase =
    window.NOTEBOOK_BASE || "/";

  function notebookUrl(path) {
    return (
      notebookBase +
      String(path || "").replace(/^\/+/, "")
    );
  }

  const notebookLibrary =
    Array.isArray(window.NOTEBOOK_LIBRARY)
      ? window.NOTEBOOK_LIBRARY
      : [];

  const controls =
    document.querySelector(
      "[data-notebook-controls]"
    );

  const grid =
    document.querySelector(
      "[data-notebook-grid]"
    );

  const pagination =
    document.querySelector(
      "[data-notebook-pagination]"
    );

  const summary =
    document.querySelector(
      "[data-notebook-summary]"
    );

  const pageSummary =
    document.querySelector(
      "[data-notebook-page-summary]"
    );

  const emptyState =
    document.querySelector(
      "[data-notebook-empty]"
    );

  const resetButton =
    document.querySelector(
      "[data-notebook-reset]"
    );

  if (
    !controls ||
    !grid ||
    !pagination
  ) {
    return;
  }

  const searchInput =
    controls.elements.query;

  const tagSelect =
    controls.elements.tag;

  const yearSelect =
    controls.elements.year;

  const arrangeSelect =
    controls.elements.arrange;

  const perPageSelect =
    controls.elements.perPage;

  let state = {
    query: "",
    tag: "",
    year: "",
    arrange: "newest",
    perPage: 6,
    page: 1
  };

  let filteredEntries = [];

  const entries =
    notebookLibrary
      .map((entry, index) => ({
        ...entry,
        originalIndex: index
      }))
      .filter(
        (entry) => entry.url
      );

  function getTime(entry) {
    return (
      Date.parse(entry.date) || 0
    );
  }

  function getSearchText(entry) {
    return [
      entry.title,
      entry.excerpt,
      (entry.tags || []).join(" "),
      entry.searchText || ""
    ]
      .join(" ")
      .toLowerCase();
  }

  function buildFilterOptions() {
    const tags = [
      ...new Set(
        entries.flatMap(
          (entry) =>
            entry.tags || []
        )
      )
    ].sort();

    tags.forEach((tag) => {
      tagSelect.add(
        new Option(tag, tag)
      );
    });

    const years = [
      ...new Set(
        entries
          .map(
            (entry) => entry.year
          )
          .filter(Boolean)
      )
    ].sort(
      (a, b) => b - a
    );

    years.forEach((year) => {
      yearSelect.add(
        new Option(year, year)
      );
    });
  }

  function syncControls() {
    searchInput.value =
      state.query;

    tagSelect.value =
      state.tag;

    yearSelect.value =
      state.year;

    arrangeSelect.value =
      state.arrange;

    perPageSelect.value =
      state.perPage;
  }

  function updateUrl() {
    const params =
      new URLSearchParams();

    if (state.query) {
      params.set(
        "query",
        state.query
      );
    }

    if (state.tag) {
      params.set(
        "tag",
        state.tag
      );
    }

    if (state.year) {
      params.set(
        "year",
        state.year
      );
    }

    if (
      state.arrange !== "newest"
    ) {
      params.set(
        "arrange",
        state.arrange
      );
    }

    if (
      state.perPage !== 6
    ) {
      params.set(
        "perPage",
        state.perPage
      );
    }

    if (
      state.page !== 1
    ) {
      params.set(
        "page",
        state.page
      );
    }

    history.replaceState(
      {},
      "",
      params.toString()
        ? (
            location.pathname +
            "?" +
            params
          )
        : location.pathname
    );
  }

  function createCard(entry) {
    const link =
      document.createElement("a");

    link.className =
      "notebook-card";

    link.href =
      notebookUrl(entry.url);

    link.innerHTML = `
      <img
        src="${notebookUrl(entry.hero)}"
        alt="${entry.alt || entry.title}"
        loading="lazy"
      >

      <div class="notebook-card__body">
        <div class="entry-meta">
          <div class="entry-meta__row">
            <span>
              <i
                class="fa-regular fa-calendar"
                aria-hidden="true"
              ></i>

              ${entry.date}
            </span>

            <span>
              <i
                class="fa-regular fa-clock"
                aria-hidden="true"
              ></i>

              ${entry.readingTime || "Entry"}
            </span>
          </div>

          <div class="entry-meta__tag">
            <i
              class="fa-solid fa-hashtag"
              aria-hidden="true"
            ></i>

            ${entry.tags?.[0] || "Notebook"}
          </div>
        </div>

        <h3>
          ${entry.title}
        </h3>

        <p>
          ${entry.excerpt || ""}
        </p>
      </div>
    `;

    return link;
  }

  function renderEntries() {
    grid.replaceChildren();

    const start =
      (
        state.page - 1
      ) * state.perPage;

    const visibleEntries =
      filteredEntries.slice(
        start,
        start + state.perPage
      );

    emptyState.hidden =
      Boolean(
        visibleEntries.length
      );

    grid.hidden =
      !visibleEntries.length;

    visibleEntries.forEach(
      (entry) => {
        grid.append(
          createCard(entry)
        );
      }
    );
  }

  function renderPagination(
    pageCount
  ) {
    pagination.replaceChildren();

    if (pageCount <= 1) {
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;

    function createPageButton(
      label,
      page,
      disabled = false
    ) {
      const button =
        document.createElement(
          "button"
        );

      button.type = "button";
      button.dataset.page = page;
      button.disabled = disabled;
      button.textContent = label;

      return button;
    }

    pagination.append(
      createPageButton(
        "‹",
        state.page - 1,
        state.page === 1
      )
    );

    for (
      let page = 1;
      page <= pageCount;
      page += 1
    ) {
      const button =
        createPageButton(
          page,
          page
        );

      if (
        page === state.page
      ) {
        button.setAttribute(
          "aria-current",
          "page"
        );
      }

      pagination.append(button);
    }

    pagination.append(
      createPageButton(
        "›",
        state.page + 1,
        state.page === pageCount
      )
    );
  }

  function applyFilters() {
    const query =
      state.query
        .trim()
        .toLowerCase();

    filteredEntries =
      entries
        .filter((entry) => {
          const matchesQuery =
            !query ||
            getSearchText(
              entry
            ).includes(query);

          const matchesTag =
            !state.tag ||
            entry.tags.includes(
              state.tag
            );

          const matchesYear =
            !state.year ||
            String(entry.year) ===
              state.year;

          return (
            matchesQuery &&
            matchesTag &&
            matchesYear
          );
        })
        .sort(
          (a, b) =>
            state.arrange ===
            "oldest"
              ? (
                  getTime(a) -
                  getTime(b)
                )
              : (
                  getTime(b) -
                  getTime(a)
                )
        );

    const pageCount =
      Math.max(
        1,
        Math.ceil(
          filteredEntries.length /
          state.perPage
        )
      );

    state.page =
      Math.min(
        state.page,
        pageCount
      );

    renderEntries();
    renderPagination(pageCount);

    const start =
      filteredEntries.length
        ? (
            (
              state.page - 1
            ) *
            state.perPage +
            1
          )
        : 0;

    const end =
      Math.min(
        state.page *
          state.perPage,
        filteredEntries.length
      );

    summary.textContent =
      `${filteredEntries.length} entr${
        filteredEntries.length === 1
          ? "y"
          : "ies"
      }`;

    pageSummary.textContent =
      filteredEntries.length
        ? (
            `Showing ${start}–${end}` +
            ` • Page ${state.page}` +
            ` of ${pageCount}`
          )
        : "";

    updateUrl();
  }

  controls.addEventListener(
    "input",
    () => {
      state = {
        query:
          searchInput.value,
        tag:
          tagSelect.value,
        year:
          yearSelect.value,
        arrange:
          arrangeSelect.value,
        perPage:
          Number(
            perPageSelect.value
          ),
        page: 1
      };

      applyFilters();
    }
  );

  resetButton?.addEventListener(
    "click",
    () => {
      state = {
        query: "",
        tag: "",
        year: "",
        arrange: "newest",
        perPage: 6,
        page: 1
      };

      syncControls();
      applyFilters();
    }
  );

  pagination.addEventListener(
    "click",
    (event) => {
      const button =
        event.target.closest(
          "[data-page]"
        );

      if (
        button &&
        !button.disabled
      ) {
        state.page =
          Number(
            button.dataset.page
          );

        applyFilters();

        document
          .querySelector(
            ".notebook-archive"
          )
          ?.scrollIntoView({
            behavior: "smooth"
          });
      }
    }
  );

  buildFilterOptions();
  syncControls();
  applyFilters();
})();
