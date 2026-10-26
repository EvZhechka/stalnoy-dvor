// URL вашего Cloudflare Worker
const WORKER_URL = "https://late-sound-f938.mravsyankin.workers.dev";

// ==========================================
// 1. Мобильное меню (Burger)
// ==========================================
const burgerBtn = document.getElementById('burgerBtn');
const navLinks = document.getElementById('navLinks');

if (burgerBtn && navLinks) {
  burgerBtn.addEventListener('click', function() {
    const isOpen = navLinks.classList.toggle('open');
    burgerBtn.classList.toggle('active', isOpen);
    burgerBtn.setAttribute('aria-expanded', isOpen);
  });

  // Закрывать меню при переходе по любой ссылке
  navLinks.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      navLinks.classList.remove('open');
      burgerBtn.classList.remove('active');
      burgerBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ==========================================
// 2. Валидация и маска для телефона (+375)
// ==========================================
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const nameField = document.getElementById('nameField');
const phoneField = document.getElementById('phoneField');
const nameError = document.getElementById('nameError');
const phoneError = document.getElementById('phoneError');

function formatPhone(value) {
  let digits = value.replace(/\D/g, '');

  // Поддержка ввода с 80... (старый формат РБ) или без 375
  if (digits.startsWith('80')) {
    digits = '375' + digits.slice(2);
  } else if (!digits.startsWith('375')) {
    if (digits.startsWith('37')) digits = '375';
    else if (digits.startsWith('3')) digits = '375';
    else if (digits.length > 0) digits = '375' + digits;
    else digits = '375';
  }

  digits = digits.slice(0, 12); // максимум 12 цифр (375 + 9 цифр)

  let formatted = '+375';
  if (digits.length > 3) {
    formatted += ' (' + digits.substring(3, 5);
  }
  if (digits.length >= 5) {
    formatted += ') ';
  }
  if (digits.length > 5) {
    formatted += digits.substring(5, 8);
  }
  if (digits.length > 8) {
    formatted += '-' + digits.substring(8, 10);
  }
  if (digits.length > 10) {
    formatted += '-' + digits.substring(10, 12);
  }

  return formatted;
}

if (phoneInput) {
  phoneInput.addEventListener('focus', function() {
    if (!phoneInput.value.trim()) {
      phoneInput.value = '+375 (';
    }
  });

  phoneInput.addEventListener('input', function(e) {
    const raw = phoneInput.value;
    // Если пользователь стёр почти всё, оставляем чистый ввод
    if (raw.replace(/\D/g, '').length <= 3 && e.inputType && e.inputType.includes('delete')) {
      return;
    }
    phoneInput.value = formatPhone(raw);
    validatePhone(false);
  });

  phoneInput.addEventListener('blur', function() {
    validatePhone(true);
  });
}

function validateName(showIfEmpty = true) {
  const val = nameInput.value.trim();
  if (!val) {
    if (showIfEmpty) {
      setFieldError(nameField, nameError, 'Пожалуйста, укажите ваше имя');
      return false;
    }
    clearFieldError(nameField, nameError);
    return false;
  }
  if (val.length < 2) {
    setFieldError(nameField, nameError, 'Имя должно содержать не менее 2 символов');
    return false;
  }
  if (/^\d+$/.test(val)) {
    setFieldError(nameField, nameError, 'Имя не должно состоять только из цифр');
    return false;
  }
  setFieldValid(nameField, nameError);
  return true;
}

function validatePhone(showIfEmpty = true) {
  const digits = phoneInput.value.replace(/\D/g, '');
  if (digits.length <= 3) {
    if (showIfEmpty) {
      setFieldError(phoneField, phoneError, 'Пожалуйста, укажите контактный телефон');
      return false;
    }
    clearFieldError(phoneField, phoneError);
    return false;
  }
  if (digits.length < 12) {
    setFieldError(phoneField, phoneError, 'Введите номер полностью: +375 (XX) XXX-XX-XX');
    return false;
  }
  setFieldValid(phoneField, phoneError);
  return true;
}

function setFieldError(field, errorEl, msg) {
  field.classList.add('has-error');
  field.classList.remove('is-valid');
  if (errorEl) errorEl.textContent = msg;
}

function setFieldValid(field, errorEl) {
  field.classList.remove('has-error');
  field.classList.add('is-valid');
  if (errorEl) errorEl.textContent = '';
}

function clearFieldError(field, errorEl) {
  field.classList.remove('has-error');
  field.classList.remove('is-valid');
  if (errorEl) errorEl.textContent = '';
}

if (nameInput) {
  nameInput.addEventListener('input', function() {
    validateName(false);
  });
  nameInput.addEventListener('blur', function() {
    validateName(true);
  });
}

// ==========================================
// 3. Отправка формы с проверкой данных
// ==========================================
const form = document.getElementById('requestForm');
const submitBtn = document.getElementById('submitBtn');
const statusBox = document.getElementById('formStatus');

function showStatus(kind, text){
  statusBox.className = 'form-status ' + kind;
  statusBox.textContent = text;
}

if (form) {
  form.addEventListener('submit', async function(e){
    e.preventDefault();

    // Проверяем все поля перед отправкой
    const isNameValid = validateName(true);
    const isPhoneValid = validatePhone(true);

    if (!isNameValid || !isPhoneValid) {
      showStatus('err', 'Пожалуйста, проверьте и исправьте подсвеченные поля.');
      if (!isNameValid) {
        nameInput.focus();
      } else {
        phoneInput.focus();
      }
      return;
    }

    const name    = nameInput.value.trim();
    const phone   = phoneInput.value.trim();
    const serviceRadio = form.querySelector('input[name="service"]:checked');
    const service = serviceRadio ? serviceRadio.value : 'Не указано';
    const message = (document.getElementById('message')?.value || '').trim();

    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляем заявку…";

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, service, message })
      });

      const data = await res.json();

      if(data.ok){
        showStatus('ok', 'Заявка успешно отправлена! Мы свяжемся с вами в течение дня.');
        form.reset();
        clearFieldError(nameField, nameError);
        clearFieldError(phoneField, phoneError);
      } else {
        showStatus('err', 'Не удалось отправить заявку. Попробуйте позвонить нам напрямую по номеру +375 44 760-70-71.');
      }
    } catch(err){
      showStatus('err', 'Ошибка соединения с сервером. Пожалуйста, позвоните нам напрямую: +375 44 760-70-71.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить заявку";
    }
  });
}
