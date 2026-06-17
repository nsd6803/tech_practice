/* ==========================================================
   90 ЛЕТ МГУПИ · script.js
   Стек: GSAP 3.14 + ScrollTrigger + Lenis 1.3
   Блоки:
     0. Загрузка
     1. Lenis + синхронизация со ScrollTrigger
     2. Шапка (скрытие/появление, прогресс)
     3. Герой: счётчик лет, параллакс "90"
     4. Таймлайн: горизонтальный пиннинг + подсветка активной вехи
     5. Имена: морфинг аббревиатур + чипы
     6. Сегодня: анимация счётчиков
     7. reveal-анимации секций
     8. Капсула времени (интерактив)
   ========================================================== */

(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // данные имён вуза (для секции «Имена»)
  const NAMES = [
    { abbr: 'МЗИМП', full: 'Московский заочный институт металлообрабатывающей промышленности', year: '1936' },
    { abbr: 'ВЗМИ',  full: 'Всесоюзный заочный машиностроительный институт', year: '1950' },
    { abbr: 'МИП',   full: 'Московский институт приборостроения', year: '1988' },
    { abbr: 'МГАПИ', full: 'Московская государственная академия приборостроения и информатики', year: '1994' },
    { abbr: 'МГУПИ', full: 'Московский государственный университет приборостроения и информатики', year: '2005' },
    { abbr: 'РТУ МИРЭА', full: 'Институт перспективных технологий и индустриального программирования', year: '2015' },
  ];

  /* ===== 0. ЗАГРУЗКА ===== */
  function runLoader() {
    const loader = $('#loader');
    const num = $('#loaderNum');
    const bar = $('#loaderBar');
    if (prefersReduced) {
      loader.classList.add('is-done');
      start();
      return;
    }
    const from = 1936, to = 2026, dur = 1200;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      num.textContent = Math.round(from + (to - from) * eased);
      bar.style.width = (p * 100) + '%';
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(() => { loader.classList.add('is-done'); start(); }, 260);
    };
    requestAnimationFrame(step);
  }

  /* ===== ОСНОВНОЙ ЗАПУСК ===== */
  let lenis = null;

  function start() {
    gsap.registerPlugin(ScrollTrigger);

    initLenis();
    initTopbar();
    initHero();
    initTimeline();
    initNames();
    initStats();
    initReveals();
    initCapsule();
    initQuoteSection();
    initQuiz();

    // финальный пересчёт после загрузки шрифтов/раскладки
    ScrollTrigger.refresh();
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ===== 1. LENIS ===== */
  function initLenis() {
    if (prefersReduced) return;

    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // синхронизация Lenis ↔ ScrollTrigger (канонический паттерн)
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // якорные ссылки через Lenis
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -60 });
      });
    });
  }

  /* ===== 2. ШАПКА ===== */
  function initTopbar() {
    const topbar = $('#topbar');
    const progressBar = $('#progressBar');
    const topYear = $('#topYear');

    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        progressBar.style.width = (self.progress * 100) + '%';
        // год в шапке: интерполяция 1936→2026 по прогрессу
        const y = Math.round(1936 + self.progress * 90);
        topYear.textContent = y;
        // solid после первого экрана
        topbar.classList.toggle('is-solid', self.scroll() > window.innerHeight * 0.6);
      }
    });

    // скрытие при скролле вниз, появление вверх
    let lastY = 0;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        if (y > lastY && y > 300) topbar.classList.add('is-hidden');
        else topbar.classList.remove('is-hidden');
        lastY = y;
      }
    });
  }

  /* ===== 3. ГЕРОЙ ===== */
  function initHero() {
    // живой счётчик «лет в строю»
    const ageEl = $('#ageCounter');
    if (ageEl) {
      const target = 90;
      gsap.to({ v: 0 }, {
        v: target,
        duration: 2.2,
        ease: 'power2.out',
        delay: 0.3,
        onUpdate() { ageEl.textContent = Math.round(this.targets()[0].v); },
      });
    }

    if (prefersReduced) return;

    // параллакс гигантской "90"
    const bignum = $('.hero__bignum [data-parallax]');
    if (bignum) {
      gsap.to(bignum, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    // лёгкий уход заголовка
    gsap.to('.hero__content', {
      y: -40, opacity: 0.7, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true }
    });
  }

  /* ===== 4. ТАЙМЛАЙН — ГОРИЗОНТАЛЬНЫЙ ПИННИНГ ===== */
  function initTimeline() {
    const section = $('#timeline');
    const track = $('#timelineTrack');
    const cards = $$('.ms', track);
    const hint = $('#timelineHint');
    if (!section || !track || !cards.length) return;

    if (prefersReduced) {
      // без пиннинга — просто горизонтальный скролл вручную
      track.style.overflowX = 'auto';
      return;
    }

    // дистанция прокрутки = ширина трека минус видимая область
    const getScrollAmount = () => track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: () => -getScrollAmount(),
      ease: 'none',
    });

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => '+=' + getScrollAmount(),
      pin: true,
      scrub: 1,
      animation: tween,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (hint) hint.style.opacity = self.progress > 0.04 ? '0' : '1';
        // подсветка активной вехи — та, что ближе к центру экрана
        const center = window.innerWidth / 2;
        let best = null, bestDist = Infinity;
        cards.forEach(card => {
          const r = card.getBoundingClientRect();
          const mid = r.left + r.width / 2;
          const d = Math.abs(mid - center);
          if (d < bestDist) { bestDist = d; best = card; }
        });
        cards.forEach(c => c.classList.toggle('is-active', c === best));
      }
    });

    // мягкое появление карточек по мере въезда в кадр
    cards.forEach((card) => {
      const inner = card.querySelector('.ms__card');
      gsap.from(inner, {
        opacity: 0,
        y: 30,
        duration: 0.5,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: card,
          containerAnimation: tween,
          start: 'left 92%',
          toggleActions: 'play none none none',
        }
      });
    });
  }

  /* ===== 5. ИМЕНА — МОРФИНГ ===== */
  function initNames() {
    const abbrEl = $('#namesAbbr');
    const fullEl = $('#namesFull');
    const yearEl = $('#namesYear');
    const listEl = $('#namesList');
    if (!abbrEl || !listEl) return;

    // строим чипы
    NAMES.forEach((n, i) => {
      const chip = document.createElement('button');
      chip.className = 'names__chip' + (i === 0 ? ' is-active' : '');
      chip.type = 'button';
      chip.textContent = n.abbr;
      chip.setAttribute('role', 'listitem');
      chip.addEventListener('click', () => setName(i));
      listEl.appendChild(chip);
    });

    const chips = $$('.names__chip', listEl);
    let current = 0;

    function setName(i) {
      if (i === current) return;
      current = i;
      const n = NAMES[i];

      if (prefersReduced) {
        abbrEl.textContent = n.abbr;
        fullEl.textContent = n.full;
        yearEl.textContent = n.year;
      } else {
        gsap.to([abbrEl, fullEl], {
          opacity: 0, y: 14, duration: 0.22, ease: 'power1.in',
          onComplete() {
            abbrEl.textContent = n.abbr;
            fullEl.textContent = n.full;
            yearEl.textContent = n.year;
            gsap.to([abbrEl, fullEl], { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' });
          }
        });
      }
      chips.forEach((c, idx) => c.classList.toggle('is-active', idx === i));
    }

    // авто-перелистывание, пока секция в зоне видимости
    let auto = null;
    ScrollTrigger.create({
      trigger: '#names',
      start: 'top 70%',
      end: 'bottom 30%',
      onToggle: (self) => {
        if (self.isActive && !prefersReduced) {
          auto = setInterval(() => setName((current + 1) % NAMES.length), 2600);
        } else if (auto) {
          clearInterval(auto); auto = null;
        }
      }
    });

    // остановка авто при ручном клике
    listEl.addEventListener('click', () => { if (auto) { clearInterval(auto); auto = null; } });
  }

  /* ===== 6. СЧЁТЧИКИ ===== */
  function initStats() {
    $$('.stat__num').forEach(el => {
      const target = parseFloat(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter() {
          if (prefersReduced) { el.textContent = target + suffix; return; }
          gsap.to({ v: 0 }, {
            v: target, duration: 1.6, ease: 'power2.out',
            onUpdate() { el.textContent = Math.round(this.targets()[0].v) + suffix; },
          });
        }
      });
    });
  }

  /* ===== 7. REVEAL ===== */
  function initReveals() {
    if (prefersReduced) return;
    const groups = [
      '.intro__kicker, .intro__h, .intro__sub',
      '.today__kicker, .today__h',
      '.dir',
      '.capsule__kicker, .capsule__h, .capsule__sub, .capsule__form',
    ];
    groups.forEach(sel => {
      const els = $$(sel);
      els.forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 28, duration: 0.8, ease: 'power2.out', delay: i * 0.06,
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
        });
      });
    });
  }

  /* ===== 8. КАПСУЛА ===== */
  function initCapsule() {
    const name = $('#capsuleName');
    const msg = $('#capsuleMsg');
    const count = $('#capsuleCount');
    const btn = $('#capsuleBtn');
    const form = $('.capsule__form');
    const sealed = $('#capsuleSealed');
    const sealedTxt = $('#capsuleSealedTxt');
    const sealedMeta = $('#capsuleSealedMeta');
    const again = $('#capsuleAgain');
    if (!msg || !btn) return;

    const sync = () => {
      count.textContent = msg.value.length;
      btn.disabled = msg.value.trim().length === 0;
    };
    msg.addEventListener('input', sync);
    sync();

    btn.addEventListener('click', () => {
      const text = msg.value.trim();
      if (!text) return;
      const who = name.value.trim() || 'Аноним';
      sealedTxt.textContent = '«' + text + '»';
      sealedMeta.textContent = who + ' · запечатано в ' + new Date().getFullYear() + ' → вскрыть в 2036';

      form.hidden = true;
      sealed.hidden = false;
      if (!prefersReduced) {
        gsap.from(sealed, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' });
      }
    });

    again.addEventListener('click', () => {
      name.value = '';
      msg.value = '';
      sync();
      sealed.hidden = true;
      form.hidden = false;
      msg.focus();
    });
  }


  /* ===================================================
     СЕКЦИЯ ЦИТАТЫ — reveal-анимация
     =================================================== */
  function initQuoteSection() {
    if (prefersReduced) return;
    const inner = document.querySelector('.qs__inner');
    if (!inner) return;
    gsap.from(inner, {
      opacity: 0, y: 36, duration: 1.1, ease: 'power2.out',
      scrollTrigger: { trigger: '.qs', start: 'top 75%', toggleActions: 'play none none none' }
    });
  }


  /* ===================================================
     КВИЗ
     =================================================== */
  function initQuiz() {
    // ── ДАННЫЕ ──────────────────────────────────────
    // Поле img — замените URL на свои картинки.
    // Если оставить пустую строку, покажется текстовая заглушка.
    const QUESTIONS = [
      {
        img: '1.jpg',
        q: 'В каком году был основан МГУПИ (тогда ещё МЗИМП)?',
        options: ['1929', '1936', '1944'],
        correct: 1,
      },
      {
        img: '2.jpg',
        q: 'Как расшифровывается аббревиатура ВЗМИ?',
        options: [
          'Всесоюзный заочный машиностроительный институт',
          'Высший заочный медицинский институт',
          'Всесоюзный заочный математический институт',
        ],
        correct: 0,
      },
      {
        img: '3.jpg',
        q: 'В каком году МЗИМП был переименован во Всесоюзный заочный машиностроительный институт (ВЗМИ)?',
        options: ['1945', '1950', '1955'],
        correct: 1,
      },
      {
        img: '4.jpg',
        q: 'В каком году институт получил статус университета (МГУПИ)?',
        options: ['1999', '2005', '2010'],
        correct: 1,
      },
      {
        img: '5.jpg',
        q: 'В состав какого университета вошёл МГУПИ в 2015 году?',
        options: ['МГТУ им. Баумана', 'МГУ им. Ломоносова', 'РТУ МИРЭА'],
        correct: 2,
      },
    ];

    const LETTERS = ['А', 'Б', 'В'];

    // ── ЭЛЕМЕНТЫ ────────────────────────────────────
    const card        = document.getElementById('quizCard');
    const imgEl       = document.getElementById('quizImg');
    const imgPhEl     = document.getElementById('quizImgPlaceholder');
    const questionEl  = document.getElementById('quizQuestion');
    const optionsEl   = document.getElementById('quizOptions');
    const progressFill = document.getElementById('quizProgressFill');
    const progressLbl  = document.getElementById('quizProgressLbl');
    const resultEl    = document.getElementById('quizResult');
    const scoreEl     = document.getElementById('quizScore');
    const msgEl       = document.getElementById('quizMsg');
    const restartBtn  = document.getElementById('quizRestart');
    const winEl       = document.getElementById('quizWin');
    const winCloseBtn = document.getElementById('quizWinClose');

    if (!card) return; // секция не найдена

    let current = 0;
    let score   = 0;
    let answered = false;

    // ── РЕНДЕР ВОПРОСА ──────────────────────────────
    function renderQuestion(idx) {
      answered = false;
      const q = QUESTIONS[idx];

      // прогресс
      const pct = ((idx) / QUESTIONS.length * 100).toFixed(0);
      progressFill.style.width = pct + '%';
      progressLbl.textContent  = `Вопрос ${idx + 1} из ${QUESTIONS.length}`;

      // картинка
      if (q.img && !q.img.startsWith('ВСТАВЬТЕ')) {
        imgEl.src = q.img;
        imgEl.alt = `Вопрос ${idx + 1}`;
        imgEl.onload = () => imgEl.classList.add('is-loaded');
        imgPhEl.style.display = 'none';
      } else {
        imgEl.src = '';
        imgEl.classList.remove('is-loaded');
        imgPhEl.style.display = 'flex';
      }

      // текст вопроса
      questionEl.textContent = q.q;

      // варианты
      optionsEl.innerHTML = '';
      q.options.forEach((text, i) => {
        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'quiz__opt';
        btn.innerHTML = `<span class="quiz__opt-letter">${LETTERS[i]}</span><span>${text}</span>`;
        btn.addEventListener('click', () => selectAnswer(i, q.correct));
        optionsEl.appendChild(btn);
      });

      // анимация появления
      if (!prefersReduced) {
        gsap.from(card, { opacity: 0, y: 18, duration: 0.35, ease: 'power2.out', clearProps: 'all' });
      }
    }

    // ── ВЫБОР ОТВЕТА ────────────────────────────────
    function selectAnswer(chosen, correct) {
      if (answered) return;
      answered = true;

      // блокируем и красим кнопки
      const btns = optionsEl.querySelectorAll('.quiz__opt');
      btns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correct)       btn.classList.add('is-correct');
        else if (i === chosen)   btn.classList.add('is-wrong');
      });

      if (chosen === correct) score++;

      // через 1.1 с — следующий вопрос или результат
      setTimeout(() => {
        current++;
        if (current < QUESTIONS.length) {
          renderQuestion(current);
        } else {
          showResult();
        }
      }, 1100);
    }

    // ── РЕЗУЛЬТАТ ───────────────────────────────────
    function showResult() {
      // прогресс 100%
      progressFill.style.width = '100%';
      progressLbl.textContent  = 'Результат';

      card.hidden    = true;
      resultEl.hidden = false;

      scoreEl.textContent = `${score} / ${QUESTIONS.length}`;

      if (score > 3) {
        msgEl.textContent = 'Превосходно! История МГУПИ не имеет от вас секретов.';
        // показываем поздравительный оверлей с небольшой задержкой
        setTimeout(() => {
          winEl.hidden = false;
          if (!prefersReduced) {
            gsap.from(winEl, { opacity: 0, duration: 0.4, ease: 'power2.out' });
          }
        }, 600);
      } else if (score >= 3) {
        msgEl.textContent = 'Хороший результат! Ещё немного — и вы знаток.';
      } else {
        msgEl.textContent = 'Неплохое начало! Пройдите хронику ещё раз — и все ответы станут очевидны.';
      }
    }

    // ── ЗАКРЫТИЕ ОВЕРЛЕЯ ────────────────────────────
    winCloseBtn.addEventListener('click', () => {
      winEl.hidden = true;
    });
    // закрытие кликом по фону
    winEl.addEventListener('click', (e) => {
      if (e.target === winEl) winEl.hidden = true;
    });
    // закрытие по Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !winEl.hidden) winEl.hidden = true;
    });

    // ── РЕСТАРТ ─────────────────────────────────────
    restartBtn.addEventListener('click', () => {
      current  = 0;
      score    = 0;
      answered = false;
      winEl.hidden    = true;
      resultEl.hidden = true;
      card.hidden     = false;
      renderQuestion(0);
    });

    // ── СТАРТ ───────────────────────────────────────
    renderQuestion(0);
  }

  /* ===== ИНИЦИАЛИЗАЦИЯ ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runLoader);
  } else {
    runLoader();
  }
})();



