(() => {
  "use strict";

  const MAXIMUM_ITEMS = 6;

  function getItemTimestamp(item) {
    if (item.date) {
      const timestamp = Date.parse(item.date);

      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }

    /*
      When an exact date is unavailable,
      fall back to January 1 of the listed year.
    */
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
      .map((item, index) => {
        return {
          ...item,
          originalIndex: index
        };
      })
      .filter((item) => {
        return Boolean(item.src);
      })
      .sort((first, second) => {
        const dateDifference =
          getItemTimestamp(second) -
          getItemTimestamp(first);

        if (dateDifference !== 0) {
          return dateDifference;
        }

        /*
          Preserve the data-file order when
          two entries use the same date.
        */
        return (
          first.originalIndex -
          second.originalIndex
        );
      })
      .slice(0, MAXIMUM_ITEMS);
  }

  function populateGallery(
    sectionSelector,
    library
  ) {
    const cards = [
      ...document.querySelectorAll(
        `${sectionSelector} ` +
        ".gallery-grid .media-card"
      )
    ];

    if (!cards.length) {
      return;
    }

    const newestItems =
      getNewestItems(library);

    cards.forEach((card, index) => {
      const item = newestItems[index];

      if (!item) {
        card.hidden = true;
        return;
      }

      card.hidden = false;

      const image =
        card.querySelector("img");

      const labelParts =
        card.querySelectorAll(
          ".media-card__label span"
        );

      if (image) {
        image.src =
          item.thumb || item.src;

        image.alt =
          item.alt ||
          item.title ||
          "";

        image.loading = "lazy";
        image.decoding = "async";
      }

      if (labelParts[0]) {
        labelParts[0].textContent =
          item.title || "Untitled";
      }

      if (labelParts[1]) {
        labelParts[1].textContent =
          item.year || "";
      }
    });
  }

  function initializeHomeArchives() {
    populateGallery(
      "#photography",
      window.PHOTO_LIBRARY
    );

    populateGallery(
      "#design",
      window.DESIGN_LIBRARY
    );
  }

  initializeHomeArchives();
})();
