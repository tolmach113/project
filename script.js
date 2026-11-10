/* ============================================================
   PhoneFix — script.js
   ============================================================ */

/* ------------------------------------------------------------
   ⚙️ НАСТРОЙКА: URL вашего Google Apps Script Web App
   Получите его после публикации скрипта (см. инструкцию).
   Замените ссылку ниже на свою.
   ------------------------------------------------------------ */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_3phYs5tR6iv82j7xKocfJmXWbumyywFoiCBFni8zSKCyxzjcGl5KBVqxQGqSij0t/exec";

/* ------------------------------------------------------------
   1. МОБИЛЬНОЕ МЕНЮ (бургер)
   ------------------------------------------------------------ */
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");

if (burger && nav) {
  burger.addEventListener("click", () => {
    burger.classList.toggle("active");
    nav.classList.toggle("open");
  });

  // Закрываем меню при клике на ссылку
  nav.querySelectorAll(".nav__link").forEach((link) => {
    link.addEventListener("click", () => {
      burger.classList.remove("active");
      nav.classList.remove("open");
    });
  });

  // Закрываем меню при клике вне его
  document.addEventListener("click", (e) => {
    const isClickInsideNav = nav.contains(e.target);
    const isClickOnBurger = burger.contains(e.target);

    if (!isClickInsideNav && !isClickOnBurger && nav.classList.contains("open")) {
      burger.classList.remove("active");
      nav.classList.remove("open");
    }
  });
}

/* ------------------------------------------------------------
   2. ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРЯМ (страховка для старых браузеров)
   ------------------------------------------------------------ */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (targetId === "#" || targetId === "") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();
    const headerOffset = 80;
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  });
});

/* ------------------------------------------------------------
   3. ФОРМА ЗАЯВКИ — валидация и отправка в Google Таблицу
   ------------------------------------------------------------ */
const form = document.getElementById("order-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");

// --- Маска/валидация телефона: разрешаем цифры, +, пробелы, скобки, дефис
const phoneInput = document.getElementById("phone");

if (phoneInput) {
  phoneInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^\d+()\-\s]/g, "");
    if (value.length > 18) value = value.slice(0, 18);
    e.target.value = value;
    e.target.classList.remove("error");
  });
}

// --- Убираем класс ошибки при вводе
form?.querySelectorAll("input, textarea").forEach((field) => {
  field.addEventListener("input", () => field.classList.remove("error"));
});

// --- Простая валидация
function validateForm(data) {
  const errors = [];
  const nameInput = document.getElementById("name");
  const phoneField = document.getElementById("phone");

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Введите имя (минимум 2 символа)");
    nameInput?.classList.add("error");
  }

  // Телефон: минимум 10 цифр
  const digits = (data.phone || "").replace(/\D/g, "");
  if (digits.length < 10) {
    errors.push("Введите корректный телефон");
    phoneField?.classList.add("error");
  }

  return errors;
}

// --- Показать статус
function showStatus(message, type) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = "form__status " + type;
}

// --- Отправка формы
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Собираем данные
    const formData = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      device: form.device.value.trim(),
      problem: form.problem.value.trim(),
      page: window.location.href,
      timestamp: new Date().toLocaleString("ru-RU"),
    };

    // Валидация
    const errors = validateForm(formData);
    if (errors.length > 0) {
      showStatus(errors[0], "error");
      return;
    }

    // Блокируем кнопку
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Отправляем...";
    showStatus("", "");

    try {
      // ⚠️ Google Apps Script требует отправку без кастомных заголовков,
      // иначе браузер сделает CORS-preflight и всё сломается.
      // Отправляем как form-urlencoded (script читает e.parameter)
      const body = new URLSearchParams();
      body.append("name", formData.name);
      body.append("phone", formData.phone);
      body.append("device", formData.device);
      body.append("problem", formData.problem);
      body.append("page", formData.page);
      body.append("timestamp", formData.timestamp);

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // обходим CORS для Google Apps Script
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      // При mode: "no-cors" мы не можем прочитать ответ,
      // но если запрос дошёл — считаем успехом.
      showStatus(
        "✅ Заявка отправлена! Мы перезвоним в течение 5 минут.",
        "success"
      );
      form.reset();

      // Логируем для отладки (можно убрать)
      console.log("Form sent. Response (opaque):", response);
    } catch (error) {
      console.error("Ошибка отправки:", error);
      showStatus(
        "❌ Не удалось отправить заявку. Позвоните нам: +7 (999) 123-45-67",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

/* ------------------------------------------------------------
   4. АНИМАЦИЯ ПОЯВЛЕНИЯ БЛОКОВ ПРИ СКРОЛЛЕ (необязательно, но приятно)
   ------------------------------------------------------------ */
const observerOptions = {
  threshold: 0.12,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Применяем только к карточкам и крупным блокам, чтобы не тормозило
document
  .querySelectorAll(".card, .why-item, .review, .geo-block, .prices, .form")
  .forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });

/* ------------------------------------------------------------
   5. АКТИВНАЯ ССЫЛКА В МЕНЮ ПРИ СКРОЛЛЕ (подсветка текущего раздела)
   ------------------------------------------------------------ */
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav__link");

if (sections.length && navLinks.length) {
  const highlightNav = () => {
    const scrollY = window.pageYOffset;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === "#" + sectionId) {
            link.classList.add("active");
          }
        });
      }
    });
  };

  window.addEventListener("scroll", highlightNav, { passive: true });
}