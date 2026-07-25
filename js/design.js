(() => {
  "use strict";

  const library = Array.isArray(window.DESIGN_LIBRARY)
    ? window.DESIGN_LIBRARY
    : [];

  const controls = document.querySelector("[data-design-controls]");
  const grid = document.querySelector("[data-design-grid]");
  const pagination = document.querySelector("[data-design-pagination]");
  const summary = document.querySelector("[data-design-summary]");
  const pageSummary = document.querySelector("[data-design-page-summary]");
  const emptyState = document.querySelector("[data-design-empty]");
  const resetButton = document.querySelector("[data-design-reset]");

  const modal = document.querySelector("[data-design-modal]");
  const modalImage = document.querySelector("[data-design-modal-image]");
  const modalTitle = document.querySelector("[data-design-modal-title]");
  const modalMeta = document.querySelector("[data-design-modal-meta]");
  const modalDescription = document.querySelector("[data-design-modal-description]");
  const modalTags = document.querySelector("[data-design-modal-tags]");
  const modalClose = document.querySelector("[data-design-modal-close]");
  const previousButton = document.querySelector("[data-design-previous]");
  const nextButton = document.querySelector("[data-design-next]");

  if (!controls || !grid || !pagination) return;

  const tagSelect = controls.elements.tag;
  const yearSelect = controls.elements.year;
  const arrangeSelect = controls.elements.arrange;
  const perPageSelect = controls.elements.perPage;

  let state = {
    tag: "",
    year: "",
    arrange: "newest",
    perPage: 12,
    page: 1
  };

  let filteredDesigns = [];
  let activeModalIndex = -1;

  function normalizeDesign(design, index) {
    return {
      src: String(design.src || ""),
      thumb: String(design.thumb || design.src || ""),
      alt: String(design.alt || design.title || `Design ${index + 1}`),
      title: String(design.title || `Design ${index + 1}`),
      year: Number(design.year) || "",
      date: String(design.date || ""),
      tags: Array.isArray(design.tags) ? design.tags.map(String) : [],
      description: String(design.description || ""),
      originalIndex: index
    };
  }

  const designs = library
    .map(normalizeDesign)
    .filter((design) => design.src);

  function getDesignTimestamp(design) {
    if (design.date) {
      const timestamp = Date.parse(design.date);
      if (!Number.isNaN(timestamp)) return timestamp;
    }

    if (design.year) {
      return new Date(Number(design.year), 0, 1).getTime();
    }

    return 0;
  }

  function buildFilterOptions() {
    const tags = [...new Set(designs.flatMap((design) => design.tags))]
      .sort((a, b) => a.localeCompare(b));

    const years = [...new Set(designs.map((design) => design.year).filter(Boolean))]
      .sort((a, b) => b - a);

    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      tagSelect.append(option);
    });

    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.append(option);
    });
  }

  function syncControls() {
    tagSelect.value = state.tag;
    yearSelect.value = state.year;
    arrangeSelect.value = state.arrange;
    perPageSelect.value = String(state.perPage);
  }

  function readUrlState() {
    const parameters = new URLSearchParams(window.location.search);
    const tag = parameters.get("tag") || "";
    const year = parameters.get("year") || "";
    const arrange = parameters.get("arrange") || "newest";
    const perPage = Number(parameters.get("perPage"));
    const page = Number(parameters.get("page"));

    state.tag = [...tagSelect.options].some((option) => option.value === tag)
      ? tag
      : "";

    state.year = [...yearSelect.options].some((option) => option.value === year)
      ? year
      : "";

    state.arrange = ["newest", "oldest"].includes(arrange)
      ? arrange
      : "newest";

    state.perPage = [6, 12, 24, 48, 96].includes(perPage)
      ? perPage
      : 12;

    state.page = Number.isInteger(page) && page > 0 ? page : 1;
    syncControls();
  }

  function updateUrl() {
    const parameters = new URLSearchParams();

    if (state.tag) parameters.set("tag", state.tag);
    if (state.year) parameters.set("year", state.year);
    if (state.arrange !== "newest") parameters.set("arrange", state.arrange);
    if (state.perPage !== 12) parameters.set("perPage", String(state.perPage));
    if (state.page !== 1) parameters.set("page", String(state.page));

    const query = parameters.toString();

    window.history.replaceState(
      {},
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname
    );
  }

  function applyFilters() {
    filteredDesigns = designs
      .filter((design) => {
        const matchesTag = !state.tag || design.tags.includes(state.tag);
        const matchesYear = !state.year || String(design.year) === state.year;
        return matchesTag && matchesYear;
      })
      .sort((designA, designB) => {
        const dateA = getDesignTimestamp(designA);
        const dateB = getDesignTimestamp(designB);

        if (dateA !== dateB) {
          return state.arrange === "oldest"
            ? dateA - dateB
            : dateB - dateA;
        }

        return designA.originalIndex - designB.originalIndex;
      });

    const pageCount = Math.max(
      1,
      Math.ceil(filteredDesigns.length / state.perPage)
    );

    state.page = Math.min(state.page, pageCount);

    renderGrid();
    renderPagination(pageCount);
    renderSummary(pageCount);
    updateUrl();
  }

  function renderGrid() {
    grid.replaceChildren();

    const start = (state.page - 1) * state.perPage;
    const visibleDesigns = filteredDesigns.slice(start, start + state.perPage);

    emptyState.hidden = visibleDesigns.length > 0;
    grid.hidden = visibleDesigns.length === 0;

    const fragment = document.createDocumentFragment();

    visibleDesigns.forEach((design, visibleIndex) => {
      const globalIndex = start + visibleIndex;
      const button = document.createElement("button");
      button.className = "design-tile";
      button.type = "button";
      button.dataset.designIndex = String(globalIndex);
      button.setAttribute("aria-label", `Open ${design.title}`);

      const image = document.createElement("img");
      image.src = design.thumb;
      image.alt = design.alt;
      image.loading = "lazy";
      image.decoding = "async";

      const caption = document.createElement("span");
      caption.className = "design-tile__caption";

      const title = document.createElement("strong");
      title.textContent = design.title;

      const metadata = document.createElement("span");
      metadata.textContent = [
        design.year,
        design.tags.slice(0, 2).join(" • ")
      ].filter(Boolean).join(" • ");

      caption.append(title, metadata);
      button.append(image, caption);
      fragment.append(button);
    });

    grid.append(fragment);
  }

  function getPageItems(pageCount) {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    const items = [1];
    if (state.page > 4) items.push("ellipsis-start");

    const start = Math.max(2, state.page - 1);
    const end = Math.min(pageCount - 1, state.page + 1);

    for (let page = start; page <= end; page += 1) items.push(page);

    if (state.page < pageCount - 3) items.push("ellipsis-end");
    items.push(pageCount);

    return [...new Set(items)];
  }

  function createPageButton(label, page, disabled, iconClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.page = String(page);
    button.disabled = disabled;
    button.setAttribute(
      "aria-label",
      iconClass ? `${label} page` : `Page ${label}`
    );

    if (iconClass) {
      button.innerHTML = `<i class="fa-solid ${iconClass}" aria-hidden="true"></i>`;
    } else {
      button.textContent = label;
    }

    return button;
  }

  function renderPagination(pageCount) {
    pagination.replaceChildren();

    if (pageCount <= 1) {
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;
    pagination.append(
      createPageButton(
        "Previous",
        state.page - 1,
        state.page === 1,
        "fa-chevron-left"
      )
    );

    getPageItems(pageCount).forEach((item) => {
      if (typeof item === "string") {
        const ellipsis = document.createElement("span");
        ellipsis.className = "design-pagination__ellipsis";
        ellipsis.textContent = "…";
        ellipsis.setAttribute("aria-hidden", "true");
        pagination.append(ellipsis);
        return;
      }

      const button = createPageButton(String(item), item, false);
      if (item === state.page) button.setAttribute("aria-current", "page");
      pagination.append(button);
    });

    pagination.append(
      createPageButton(
        "Next",
        state.page + 1,
        state.page === pageCount,
        "fa-chevron-right"
      )
    );
  }

  function renderSummary(pageCount) {
    const total = filteredDesigns.length;
    const start = total ? (state.page - 1) * state.perPage + 1 : 0;
    const end = Math.min(state.page * state.perPage, total);

    summary.textContent = `${total.toLocaleString()} design${total === 1 ? "" : "s"}`;

    pageSummary.textContent = total
      ? `Showing ${start.toLocaleString()}–${end.toLocaleString()} • Page ${state.page} of ${pageCount}`
      : "";
  }

  function setPage(page) {
    const pageCount = Math.max(
      1,
      Math.ceil(filteredDesigns.length / state.perPage)
    );

    state.page = Math.min(Math.max(page, 1), pageCount);

    renderGrid();
    renderPagination(pageCount);
    renderSummary(pageCount);
    updateUrl();

    document.querySelector(".design-archive")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function openModal(index) {
    const design = filteredDesigns[index];
    if (!design || !modal) return;

    activeModalIndex = index;
    modalImage.src = design.src;
    modalImage.alt = design.alt;
    modalTitle.textContent = design.title;
    modalMeta.textContent = design.date || String(design.year || "");
    modalDescription.textContent = design.description;
    modalDescription.hidden = !design.description;
    modalTags.replaceChildren();

    design.tags.forEach((tag) => {
      const item = document.createElement("span");
      item.textContent = tag;
      modalTags.append(item);
    });

    previousButton.disabled = filteredDesigns.length <= 1;
    nextButton.disabled = filteredDesigns.length <= 1;

    document.body.classList.add("design-modal-open");

    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");

    modalClose.focus();
  }

  function closeModal() {
    if (!modal) return;

    document.body.classList.remove("design-modal-open");

    if (typeof modal.close === "function" && modal.open) modal.close();
    else modal.removeAttribute("open");

    grid.querySelector(`[data-design-index="${activeModalIndex}"]`)?.focus();
  }

  function stepModal(direction) {
    if (!filteredDesigns.length) return;

    activeModalIndex =
      (activeModalIndex + direction + filteredDesigns.length) %
      filteredDesigns.length;

    openModal(activeModalIndex);
  }

  controls.addEventListener("change", () => {
    state.tag = tagSelect.value;
    state.year = yearSelect.value;
    state.arrange = arrangeSelect.value;
    state.perPage = Number(perPageSelect.value);
    state.page = 1;
    applyFilters();
  });

  resetButton?.addEventListener("click", () => {
    state = {
      tag: "",
      year: "",
      arrange: "newest",
      perPage: 12,
      page: 1
    };

    syncControls();
    applyFilters();
  });

  grid.addEventListener("click", (event) => {
    const tile = event.target.closest("[data-design-index]");
    if (tile) openModal(Number(tile.dataset.designIndex));
  });

  pagination.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (button && !button.disabled) setPage(Number(button.dataset.page));
  });

  modalClose?.addEventListener("click", closeModal);
  previousButton?.addEventListener("click", () => stepModal(-1));
  nextButton?.addEventListener("click", () => stepModal(1));

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  modal?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (!modal?.open) return;
    if (event.key === "ArrowLeft") stepModal(-1);
    if (event.key === "ArrowRight") stepModal(1);
  });

  buildFilterOptions();
  readUrlState();
  applyFilters();
})();
