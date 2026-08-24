(() => {
  "use strict";

  const form = document.querySelector("[data-lead-form]");
  if (!form) return;

  const statusEl = form.querySelector("[data-form-status]");
  const submitBtn = form.querySelector("[data-form-submit]");
  const submitLabel = submitBtn ? submitBtn.querySelector("span") : null;
  const phoneInput = form.querySelector("#leadPhone");
  const phoneError = form.querySelector("[data-phone-error]");

  const setStatus = (text, kind) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = "form-status" + (kind ? ` form-status--${kind}` : "");
  };

  const normalizePhone = (v) => v.replace(/[\s\-()]/g, "");

  /**
   * Перевіряє номер і повертає конкретну причину помилки, якщо є:
   * - порожньо
   * - недозволені символи
   * - замало / забагато цифр
   * - невірний формат коду країни
   * Приймає: +380XXXXXXXXX, 380XXXXXXXXX, 0XXXXXXXXX (рівно 9 цифр після коду/нуля).
   */
  const validatePhone = (raw) => {
    const clean = normalizePhone(raw);
    if (!clean) return "Вкажіть номер телефону.";
    if (!/^\+?\d+$/.test(clean)) return "Номер може містити лише цифри, «+», пробіли та дефіси.";

    const digits = clean.replace(/^\+/, "");

    if (clean.startsWith("+") || clean.startsWith("380")) {
      const national = digits.slice(3);
      if (!digits.startsWith("380")) return "Код країни має бути +380.";
      if (national.length < 9) return "Замало цифр — після +380 має бути 9 цифр номера.";
      if (national.length > 9) return "Забагато цифр — після +380 має бути рівно 9 цифр.";
      return "";
    }

    if (clean.startsWith("0")) {
      const rest = digits.slice(1);
      if (rest.length < 9) return "Замало цифр — номер має містити 10 цифр разом з 0.";
      if (rest.length > 9) return "Забагато цифр — номер має містити рівно 10 цифр.";
      return "";
    }

    return "Введіть номер, що починається з +380 або 0.";
  };
  const isValidPhone = (raw) => validatePhone(raw) === "";

  const setPhoneError = (message) => {
    if (phoneInput) phoneInput.setAttribute("aria-invalid", message ? "true" : "false");
    if (phoneError) {
      phoneError.textContent = message || "";
      phoneError.classList.toggle("is-visible", Boolean(message));
    }
  };

  if (phoneInput) {
    // Live-sanitize keystrokes: only digits, one leading "+", spaces and dashes allowed.
    phoneInput.addEventListener("input", () => {
      let v = phoneInput.value;
      const hasPlus = v.trim().startsWith("+");
      v = v.replace(/[^\d\s-]/g, "");
      if (hasPlus) v = "+" + v;
      // Cap raw digits to 12 (380 + 9-digit number) to prevent runaway typing.
      const digitsOnly = v.replace(/\D/g, "");
      if (digitsOnly.length > 12) {
        const overflow = digitsOnly.length - 12;
        v = v.replace(new RegExp(`\\d{${overflow}}$`), "");
      }
      phoneInput.value = v;
      if (phoneInput.getAttribute("aria-invalid") === "true") setPhoneError("");
    });
    phoneInput.addEventListener("blur", () => {
      if (!phoneInput.value.trim()) return;
      const msg = validatePhone(phoneInput.value);
      setPhoneError(msg);
    });
  }

  const escapeMd = (str) =>
    String(str).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (m) => `\\${m}`);

  async function sendLeadToTelegram({ name, phone, telegram, message }) {
    const cfg = typeof TELEGRAM_CONFIG !== "undefined" ? TELEGRAM_CONFIG : null;
    if (!cfg || !cfg.botToken || !cfg.chatId || cfg.chatId === "YOUR_CHAT_ID") {
      throw new Error("NOT_CONFIGURED");
    }

    const text = [
      "🌊 *Нова заявка з сайту Wave*",
      "",
      `*Імʼя:* ${escapeMd(name)}`,
      `*Телефон:* ${escapeMd(phone)}`,
      `*Telegram клієнта:* ${escapeMd(telegram || "не вказано")}`,
      message ? `*Повідомлення:* ${escapeMd(message)}` : null
    ].filter(Boolean).join("\n");

    const res = await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text,
        parse_mode: "MarkdownV2"
      })
    });

    if (!res.ok) throw new Error("SEND_FAILED");
    return res.json();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector("#leadName").value.trim();
    const phone = form.querySelector("#leadPhone").value.trim();
    const telegram = form.querySelector("#leadTelegram").value.trim();
    const message = form.querySelector("#leadMessage").value.trim();

    if (!name || !phone) {
      setStatus("Заповніть імʼя та номер телефону.", "error");
      return;
    }

    if (!isValidPhone(phone)) {
      setPhoneError(validatePhone(phone));
      setStatus("Перевірте номер телефону — здається, він некоректний.", "error");
      phoneInput.focus();
      return;
    }
    setPhoneError("");

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = "Надсилаємо…";
    setStatus("", "");

    try {
      await sendLeadToTelegram({ name, phone, telegram, message });
      setStatus("Дякуємо! Заявку надіслано — я звʼяжусь з вами найближчим часом.", "success");
      form.reset();
      if (typeof window.gtag === "function") {
        window.gtag("event", "lead_form_submit");
      }
    } catch (err) {
      if (err && err.message === "NOT_CONFIGURED") {
        setStatus(
          "Форму ще не підключено: додайте chat_id у js/telegram-config.js. Поки що напишіть напряму в Telegram.",
          "error"
        );
      } else {
        setStatus(
          "Не вдалося надіслати заявку. Спробуйте ще раз або напишіть напряму в Telegram.",
          "error"
        );
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = "Залишити заявку";
    }
  });
})();

