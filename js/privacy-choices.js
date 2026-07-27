(() => {
  const STORAGE_KEY = "13audhd-privacy-choices";

  const form = document.querySelector(
    "[data-privacy-form]"
  );

  if (!form) {
    return;
  }

  const status = form.querySelector(
    "[data-privacy-status]"
  );

  const preferencesInput = form.elements.preferences;
  const analyticsInput = form.elements.analytics;
  const marketingInput = form.elements.marketing;

  const rejectButton = form.querySelector(
    "[data-reject-optional]"
  );

  const acceptButton = form.querySelector(
    "[data-accept-optional]"
  );

  const globalPrivacyControl =
    navigator.globalPrivacyControl === true;

  function readChoices() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      );

      return {
        necessary: true,
        preferences:
          stored?.preferences ?? true,
        analytics:
          globalPrivacyControl
            ? false
            : stored?.analytics ?? false,
        marketing:
          globalPrivacyControl
            ? false
            : stored?.marketing ?? false
      };
    } catch {
      return {
        necessary: true,
        preferences: true,
        analytics: false,
        marketing: false
      };
    }
  }

  function applyChoices(choices) {
    preferencesInput.checked =
      Boolean(choices.preferences);

    analyticsInput.checked =
      Boolean(choices.analytics);

    marketingInput.checked =
      Boolean(choices.marketing);

    if (globalPrivacyControl) {
      analyticsInput.checked = false;
      marketingInput.checked = false;

      analyticsInput.disabled = true;
      marketingInput.disabled = true;
    }
  }

  function saveChoices(choices, message) {
    const normalizedChoices = {
      necessary: true,
      preferences:
        Boolean(choices.preferences),
      analytics:
        globalPrivacyControl
          ? false
          : Boolean(choices.analytics),
      marketing:
        globalPrivacyControl
          ? false
          : Boolean(choices.marketing),
      updated:
        new Date().toISOString()
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizedChoices)
    );

    applyChoices(normalizedChoices);

    document.documentElement.dataset.analyticsConsent =
      String(normalizedChoices.analytics);

    document.documentElement.dataset.marketingConsent =
      String(normalizedChoices.marketing);

    status.textContent = message;
  }

  applyChoices(readChoices());

  if (globalPrivacyControl) {
    status.textContent =
      "Global Privacy Control detected. " +
      "Analytics and marketing remain disabled.";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    saveChoices(
      {
        preferences:
          preferencesInput.checked,
        analytics:
          analyticsInput.checked,
        marketing:
          marketingInput.checked
      },
      "Your privacy choices have been saved."
    );
  });

  rejectButton.addEventListener("click", () => {
    saveChoices(
      {
        preferences: true,
        analytics: false,
        marketing: false
      },
      "Optional analytics and marketing have been disabled."
    );
  });

  acceptButton.addEventListener("click", () => {
    if (globalPrivacyControl) {
      saveChoices(
        {
          preferences: true,
          analytics: false,
          marketing: false
        },
        "Global Privacy Control is active, so analytics and marketing remain disabled."
      );

      return;
    }

    saveChoices(
      {
        preferences: true,
        analytics: true,
        marketing: true
      },
      "Optional preferences have been accepted."
    );
  });
})();
