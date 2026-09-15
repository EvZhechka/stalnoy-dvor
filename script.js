// Вставьте сюда URL вашего Cloudflare Worker
const WORKER_URL = "https://late-sound-f938.mravsyankin.workers.dev";

const form = document.getElementById('requestForm');
const submitBtn = document.getElementById('submitBtn');
const statusBox = document.getElementById('formStatus');

function showStatus(kind, text){
  statusBox.className = 'form-status ' + kind;
  statusBox.textContent = text;
}

form.addEventListener('submit', async function(e){
  e.preventDefault();

  const name    = document.getElementById('name').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const service = form.querySelector('input[name="service"]:checked').value;
  const message = document.getElementById('message').value.trim();

  if(!name || !phone){
    showStatus('err', 'Пожалуйста, укажите имя и телефон.');
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
    showStatus('err', 'Ошибка соединения. Проверьте интернет и попробуйте ещё раз.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Отправить заявку";
  }
});
