document.addEventListener("DOMContentLoaded", () => {
  const config = window.cookieConsentConfig;
  const banner = document.getElementById("cookie-banner");
  const categoryContainer = document.getElementById("cookie-categories");
  const privacyLink = document.getElementById("privacy-link");
  privacyLink.href = config.privacyUrl;

  // Checkboxen rendern
  for (const key in config.categories) {
    const cat = config.categories[key];
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <label>
        <input type="checkbox" name="${key}" ${
      cat.required ? "checked disabled" : ""
    }>
        <strong>${cat.name}:</strong> ${cat.description}
      </label>
    `;
    categoryContainer.appendChild(wrapper);
  }

  // Button: Alle akzeptieren
  document.getElementById("accept-all").addEventListener("click", () => {
    saveConsent(Object.keys(config.categories));
    hideBanner();
  });

  // Button: Nur notwendige
  document
    .getElementById("accept-only-necessary")
    .addEventListener("click", () => {
      const necessaryOnly = Object.entries(config.categories)
        .filter(([_, val]) => val.required)
        .map(([key]) => key);
      saveConsent(necessaryOnly);
      hideBanner();
    });

  // Button: Auswahl bestätigen
  document.getElementById("accept-selection").addEventListener("click", () => {
    const selected = [];

    for (const key in config.categories) {
      const checkbox = document.querySelector(`input[name="${key}"]`);
      if (checkbox && checkbox.checked) {
        selected.push(key);
      }
    }

    saveConsent(selected);
    hideBanner();
  });

  // Footer-Link: Einstellungen ändern
  const settingsLink = document.getElementById("cookie-settings-link");
  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("cookieConsent"); // Optional
      banner.style.display = "block";
    });
  }

  // Consent speichern + an Server senden
  function saveConsent(consentArray) {
    const consentData = {
      timestamp: new Date().toISOString(),
      categories: consentArray,
    };
    localStorage.setItem("cookieConsent", JSON.stringify(consentData));

    fetch("http://localhost:3000/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: consentArray }),
    });
  }

  // Banner ausblenden
  function hideBanner() {
    banner.style.display = "none";
  }

  // Bereits gewählt?
  const saved = localStorage.getItem("cookieConsent");
  if (!saved) {
    banner.style.display = "block";
  }
});
