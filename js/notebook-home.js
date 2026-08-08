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

  const postGrid =
    document.querySelector(
      "#notebook .post-grid"
    );

  const modal =
    document.querySelector(
      "[data-notebook-modal]"
    );

  const modalContent =
    document.querySelector(
      "[data-notebook-modal-content]"
    );

  const modalClose =
    document.querySelector(
      "[data-notebook-modal-close]"
    );

  if (
    !postGrid ||
    !notebookLibrary.length
  ) {
    return;
  }

  const latestEntries =
    [...notebookLibrary]
      .filter((entry) => entry.url)
      .sort(
        (a, b) =>
          Date.parse(b.date) -
          Date.parse(a.date)
      )
      .slice(0, 3);

  postGrid.replaceChildren();

  latestEntries.forEach((entry) => {
    const card =
      document.createElement("button");

    card.type = "button";

    card.className =
      "post-card notebook-home-card";

    card.dataset.url =
      notebookUrl(entry.url);

    card.innerHTML = `
      <img
        src="${notebookUrl(entry.hero)}"
        alt="${entry.alt || entry.title}"
        loading="lazy"
      >

      <div class="post-card__body">
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

    postGrid.append(card);
  });

  async function openEntry(url) {
    if (
      !modal ||
      !modalContent
    ) {
      location.href = url;
      return;
    }

    modalContent.innerHTML =
      '<p class="lede">Loading entry…</p>';

    document.body.classList.add(
      "notebook-modal-open"
    );

    modal.showModal();

    try {
      const response =
        await fetch(url);

      if (!response.ok) {
        throw Error();
      }

      const documentText =
        await response.text();

      const parsedDocument =
        new DOMParser().parseFromString(
          documentText,
          "text/html"
        );

      const article =
        parsedDocument.querySelector(
          "[data-notebook-entry]"
        );

      if (!article) {
        throw Error();
      }

      const clonedArticle =
        article.cloneNode(true);

      clonedArticle
        .querySelector(
          ".notebook-entry-actions"
        )
        ?.remove();

      clonedArticle
        .querySelector(
          ".notebook-entry-nav"
        )
        ?.remove();

      clonedArticle
        .querySelectorAll("[src]")
        .forEach((element) => {
          const source =
            element.getAttribute("src");

          if (
            source &&
            !source.startsWith("http") &&
            !source.startsWith("/")
          ) {
            element.src =
              new URL(
                source,
                new URL(
                  url,
                  location.href
                )
              ).href;
          }
        });

      modalContent.replaceChildren(
        clonedArticle
      );

      const readMoreLink =
        document.createElement("a");

      readMoreLink.className =
        "button";

      readMoreLink.href =
        "blog.html";

      readMoreLink.innerHTML =
        'Read more posts <i class="fa-solid fa-book-open"></i>';

      modalContent.append(
        readMoreLink
      );

      modalClose?.focus();
    } catch {
      modalContent.innerHTML = `
        <div class="callout">
          <strong>
            This entry could not be loaded.
          </strong>
        </div>

        <p>
          <a
            class="button"
            href="blog.html"
          >
            Read more posts
          </a>
        </p>
      `;
    }
  }

  function closeModal() {
    if (modal?.open) {
      modal.close();
    }

    document.body.classList.remove(
      "notebook-modal-open"
    );
  }

  postGrid.addEventListener(
    "click",
    (event) => {
      const card =
        event.target.closest(
          "[data-url]"
        );

      if (card) {
        openEntry(
          card.dataset.url
        );
      }
    }
  );

  modalClose?.addEventListener(
    "click",
    closeModal
  );

  modal?.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      closeModal();
    }
  );
})();
