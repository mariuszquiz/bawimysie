let DATA = [];
let order = [];
let idx = 0;
let score = 0;
const state = { answered: false };

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

async function loadDefaultJSON() {
  const resp = await fetch('questions.json', { cache: 'no-store' });
  if (!resp.ok) throw new Error('Brak questions.json obok index.html');
  return await resp.json();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeItems(raw) {
  // oczekujemy pól: article, question, A, B, C, correct
  return raw.filter(q =>
    q && q.article && q.question && q.A && q.B && q.C && /[ABC]/.test(q.correct)
  );
}

function startQuiz(limit) {
  idx = 0; score = 0; state.answered = false;
  order = shuffle([...Array(Math.min(limit, DATA.length)).keys()]);
  $('#result').classList.add('hidden');
  $('#quiz').classList.remove('hidden');
  renderQuestion();
}

function renderQuestion() {
  const q = DATA[order[idx]];
  $('#counter').textContent = `Pytanie ${idx + 1}/${order.length}`;
  $('#article').textContent = q.article;
  $('#question').textContent = q.question;

  const answers = [
    {key: 'A', text: q.A},
    {key: 'B', text: q.B},
    {key: 'C', text: q.C},
  ];

  const box = $('#answers');
  box.innerHTML = '';
  answers.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.textContent = `${a.key}) ${a.text}`;
    btn.addEventListener('click', () => onAnswer(a.key, q.correct, btn, box));
    box.appendChild(btn);
  });

  $('#nextBtn').classList.add('hidden');
  state.answered = false;
}

function onAnswer(choice, correct, btn, box) {
  if (state.answered) return;
  state.answered = true;

  const ans = [...box.children];
  ans.forEach(el => {
    const isCorrect = el.textContent.trim().startsWith(`${correct})`);
    el.classList.add(isCorrect ? 'correct' : 'wrong');
  });

  if (choice === correct) score++;
  $('#nextBtn').classList.remove('hidden');
}

function nextQuestion() {
  if (idx + 1 < order.length) {
    idx++;
    renderQuestion();
  } else {
    endQuiz();
  }
}

function endQuiz() {
  $('#quiz').classList.add('hidden');
  $('#result').classList.remove('hidden');
  $('#score').textContent = `Twój wynik: ${score} / ${order.length}`;
}

async function boot() {
  // domyślnie ładuj questions.json z katalogu
  let raw = [];
  try {
    raw = await loadDefaultJSON();
  } catch (e) {
    console.warn(e.message);
  }
  if (raw.length) {
    DATA = normalizeItems(raw);
  }

  // obsługa wczytywania własnego pliku
  $('#fileInput').addEventListener('change', async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      DATA = normalizeItems(parsed);
      alert(`Wczytano ${DATA.length} pytań z pliku: ${file.name}`);
    } catch {
      alert('To nie wygląda na poprawny JSON z pytaniami.');
    }
  });

  $('#startBtn').addEventListener('click', () => {
    const limit = Math.max(1, Math.min(2000, Number($('#limit').value || 20)));
    if (!DATA.length) { alert('Brak pytań. Upewnij się, że questions.json jest obok index.html lub wczytaj własny plik.'); return; }
    startQuiz(limit);
  });

  $('#nextBtn').addEventListener('click', nextQuestion);
  $('#restartBtn').addEventListener('click', () => {
    $('#result').classList.add('hidden');
    $('#quiz').classList.add('hidden');
  });
}

boot();
