(() => {
  "use strict";

  const modal = document.querySelector(
    "[data-home-gallery-modal]"
  );

  const modalImage = document.querySelector(
    "[data-home-gallery-modal-image]"
  );

  const modalTitle = document.querySelector(
    "[data-home-gallery-modal-title]"
  );

  const modalMeta = document.querySelector(
    "[data-home-gallery-modal-meta]"
  );

  const modalDescription = document.querySelector(
    "[data-home-gallery-modal-description]"
  );

  const modalTags = document.querySelector(
    "[data-home-gallery-modal-tags]"
  );

  const modalClose = document.querySelector(
    "[data-home-gallery-modal-close]"
  );

  const previousButton = document.querySelector(
    "[data-home-gallery-previous]"
  );

  const nextButton = document.querySelector(
    "[data-home-gallery-next]"
  );

  if (
    !modal ||
    !modalImage ||
    !modalTitle ||
    !modalClose ||
    !previousButton ||
    !nextButton
  ) {
    return;
  }

  const MAXIMUM_ITEMS = 6;

  let activeItems = [];
  let activeIndex = -1;
  let activeCard = null;

  function getItemTimestamp(item) {
    if (item.date) {
      const timestamp = Date.parse(item.date);

      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }

    if (item.year) {
      return new Date(
        Number(item.year),
        0,
        1
      ).getTime();
    }

    return 0;
  }

  function getNewestItems(library) {
    if (!Array.isArray(library)) {
      return [];
    }

    return library
      .map((item, index) => ({
        ...item,
        originalIndex: index
      }))
      .filter((item) => Boolean(item.src))
      .sort((first, second) => {
        const dateDifference =
          getItemTimestamp(second) -
          getItemTimestamp(first);

        if (dateDifference !== 0) {
          return dateDifference;
        }

        return (
          first.originalIndex -
          second.originalIndex
        );
      })
      .slice(0, MAXIMUM_ITEMS);
  }

  function renderModal() {
    const item = activeItems[activeIndex];

    if (!item) {
      return;
    }

    /*
      item.src is the full-resolution image.
      The homepage cards continue to use item.thumb.
    */
    modalImage.src = item.src;
    modalImage.alt =
      item.alt ||
      item.title ||
      "";

    modalTitle.textContent =
      item.title ||
      "Untitled";

    modalMeta.textContent = [
      item.year,
      item.date
    ]
      .filter(Boolean)
      .join(" • ");

    modalDescription.textContent =
      item.description || "";

    modalDescription.hidden =
      !item.description;

    modalTags.replaceChildren();

    const tags = Array.isArray(item.tags)
      ? item.tags
      : [];

    tags.forEach((tag) => {
      const tagElement =
        document.createElement("span");

      tagElement.textContent = tag;
      modalTags.append(tagElement);
    });

    const hasMultipleItems =
      activeItems.length > 1;

    previousButton.disabled =
      !hasMultipleItems;

    nextButton.disabled =
      !hasMultipleItems;
  }

  function openModal(items, index, card) {
    activeItems = items;
    activeIndex = index;
    activeCard = card;

    renderModal();

    document.body.classList.add(
      "home-gallery-modal-open"
    );

    if (
      typeof modal.showModal === "function"
    ) {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }

    modalClose.focus();
  }

  function closeModal() {
    document.body.classList.remove(
      "home-gallery-modal-open"
    );

    if (
      typeof modal.close === "function" &&
      modal.open
    ) {
      modal.close();
    } else {
      modal.removeAttribute("open");
    }

    activeCard?.focus();
  }

  function stepModal(direction) {
    if (!activeItems.length) {
      return;
    }

    activeIndex =
      (
        activeIndex +
        direction +
        activeItems.length
      ) % activeItems.length;

    renderModal();
  }

  function initializeSection(
    sectionSelector,
    library
  ) {
    const items = getNewestItems(library);

    const cards = [
      ...document.querySelectorAll(
        `${sectionSelector} ` +
        ".gallery-grid .media-card"
      )
    ];

    cards.forEach((card, index) => {
      const item = items[index];

      if (!item || card.hidden) {
        return;
      }

      card.tabIndex = 0;
      card.setAttribute("role", "button");

      card.setAttribute(
        "aria-label",
        `Open ${item.title || "image"}`
      );

      card.addEventListener("click", () => {
        openModal(items, index, card);
      });

      card.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();

            openModal(
              items,
              index,
              card
            );
          }
        }
      );
    });
  }

  initializeSection(
    "#photography",
    window.PHOTO_LIBRARY
  );

  initializeSection(
    "#design",
    window.DESIGN_LIBRARY
  );

  modalClose.addEventListener(
    "click",
    closeModal
  );

  previousButton.addEventListener(
    "click",
    () => stepModal(-1)
  );

  nextButton.addEventListener(
    "click",
    () => stepModal(1)
  );

  modal.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) {
        closeModal();
      }
    }
  );

  modal.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      closeModal();
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (!modal.open) {
        return;
      }

      if (event.key === "ArrowLeft") {
        stepModal(-1);
      }

      if (event.key === "ArrowRight") {
        stepModal(1);
      }
    }
  );
})();
