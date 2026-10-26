// URL вашего Cloudflare Worker
const WORKER_URL = "https://late-sound-f938.mravsyankin.workers.dev";

// --- Мобильное меню (Burger) ---
const burgerBtn = document.getElementById('burgerBtn');
const navLinks = document.getElementById('navLinks');

if (burgerBtn && navLinks) {
  burgerBtn.addEventListener('click', function() {
    const isOpen = navLinks.classList.toggle('open');
    burgerBtn.classList.toggle('active', isOpen);
    burgerBtn.setAttribute('aria-expanded', isOpen);
  });

  // Закрывать меню при переходе по ссылке
  navLinks.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      navLinks.classList.remove('open');
      burgerBtn.classList.remove('active');
      burgerBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// --- Помощник ввода телефона (+375) ---
const phoneInput = document.getElementById('phone');
if (phoneInput) {
  phoneInput.addEventListener('focus', function() {
    if (!phoneInput.value.trim()) {
      phoneInput.value = '+375 ';
    }
  });
}

// --- Отправка формы в Cloudflare Worker ---
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

    const name    = document.getElementById('name').value.trim();
    const phone   = document.getElementById('phone').value.trim();
    const service = form.querySelector('input[name="service"]:checked').value;
    const message = document.getElementById('message').value.trim();

    if(!name || !phone || phone === '+375'){
      showStatus('err', 'Пожалуйста, укажите имя и контактный телефон.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляем…";

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, service, message })
      });

      const data = await res.json();

      if(data.ok){
        showStatus('ok', 'Заявка отправлена! Мы свяжемся с вами в течение дня.');
        form.reset();
      } else {
        showStatus('err', 'Не удалось отправить заявку. Попробуйте позвонить нам напрямую.');
      }
    } catch(err){
      showStatus('err', 'Ошибка соединения. Проверьте интернет или позвоните нам напрямую.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить заявку";
    }
  });
}
