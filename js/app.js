// =====================================================
// KOROSH CRM — Application Core (Vanilla ES6+)
// KOROSH BOZORG IRAN HAST
// File: js/app.js
// =====================================================

(() => {
  'use strict';

  // --- Safe Local Storage Wrapper ---
  const Storage = {
    get(key, fallback = null) {
      try {
        const item = localStorage.getItem(key);
        return item !== null ? JSON.parse(item) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.warn('Storage setItem failed:', err);
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Fail silently
      }
    }
  };

  // --- Sound Engine (صدای زنگ دینگگگگ بلوری) ---
  const SoundSynthesizer = {
    audioCtx: null,

    playDing() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        if (!this.audioCtx) {
          this.audioCtx = new AudioContext();
        }

        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.50, now);
        osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2093.00, now);

        gainNode.gain.setValueAtTime(0.7, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.6);
        osc2.stop(now + 2.6);
      } catch (e) {
        console.warn('Web Audio synthesis not available:', e);
      }
    }
  };

  // --- Application State Architecture ---
  const AppState = {
    theme: Storage.get('korosh_theme', 'morning'),
    currentView: Storage.get('korosh_view', 'dashboard'),
    currency: Storage.get('korosh_currency', 'IRT'),
    timerActive: false,
    timerSecondsLeft: 0,
    timerTotalSeconds: 0,
    isPrivacyActive: false,
    currentSelectedProperty: null,
    currentFormImages: [],
    cardImageIndices: {},
    mockEntities: [
      { id: 'PROP-1049', type: 'ملک', title: 'پنت‌هاوس ۴۵۰ متری الهیه فرشته', targetView: 'properties' },
      { id: 'PROP-1050', type: 'ملک', title: 'ویلای مدرن ۶۵۰ متری شهرک غرب', targetView: 'properties' },
      { id: 'PROP-1051', type: 'ملک', title: 'سند اداری نوساز تقاطع پارک‌وی', targetView: 'properties' },
      { id: 'CUST-301', type: 'مشتری', title: 'دکتر داریوش رضوی (سرمایه‌گذار)', targetView: 'customers' },
      { id: 'CUST-302', type: 'مشتری', title: 'مریم تدین (متقاضی رهن ویلا)', targetView: 'customers' },
      { id: 'CUST-303', type: 'مشتری', title: 'هلدینگ آرمان سازه (متقاضی خرید زمین)', targetView: 'customers' },
      { id: 'CTR-9012', type: 'قرارداد', title: 'مبایعه‌نامه رسمی آرشام افشار - الهیه', targetView: 'contracts' },
      { id: 'CTR-9013', type: 'قرارداد', title: 'اجاره‌نامه ثریا معتمدی - اندرزگو', targetView: 'contracts' }
    ]
  };

  // =====================================================
  // 1. Modular Clock & Smart Daytime Phase Engine
  // =====================================================
  const ModularTimeEngine = {
    init() {
      this.htmlRoot = document.documentElement;
      this.phaseLabel = document.getElementById('daytimePhaseLabel');
      this.dayName = document.getElementById('modDayName');
      this.dayNum = document.getElementById('modDayNum');

      this.hourHand = document.getElementById('analogHour');
      this.minHand = document.getElementById('analogMin');
      this.secHand = document.getElementById('analogSec');

      this.flipHours = document.getElementById('flipHours');
      this.flipMinutes = document.getElementById('flipMinutes');
      this.flipAmPm = document.getElementById('flipAmPm');

      const savedTheme = Storage.get('korosh_theme', 'morning');
      this.setTheme(savedTheme, false);

      document.querySelectorAll('[data-theme-set]').forEach(btn => {
        btn.addEventListener('click', () => {
          const tName = btn.getAttribute('data-theme-set');
          this.setTheme(tName, true);
          ToastManager.show(`تم رنگی به "${btn.querySelector('strong')?.textContent || tName}" تغییر یافت.`, 'success');
        });
      });

      this.updateClock();
      setInterval(() => this.updateClock(), 1000);
    },

    setTheme(themeName, manualOverride = false) {
      AppState.theme = themeName;
      this.htmlRoot.setAttribute('data-time-theme', themeName);
      document.body.setAttribute('data-time-theme', themeName);
      Storage.set('korosh_theme', themeName);
      if (manualOverride) {
        Storage.set('manual_theme_override', true);
      }
    },

    updateClock() {
      const now = new Date();
      const rawHours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const hours12 = rawHours % 12 || 12;
      const ampm = rawHours >= 12 ? 'PM' : 'AM';

      if (this.flipHours) this.flipHours.textContent = String(hours12).padStart(2, '0');
      if (this.flipMinutes) this.flipMinutes.textContent = String(minutes).padStart(2, '0');
      if (this.flipAmPm) this.flipAmPm.textContent = ampm;

      const secDeg = (seconds / 60) * 360;
      const minDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
      const hourDeg = ((rawHours % 12) / 12) * 360 + (minutes / 60) * 30;

      if (this.secHand) this.secHand.style.transform = `rotate(${secDeg}deg)`;
      if (this.minHand) this.minHand.style.transform = `rotate(${minDeg}deg)`;
      if (this.hourHand) this.hourHand.style.transform = `rotate(${hourDeg}deg)`;

      try {
        const faDayName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' }).format(now);
        const faDayNum = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }).format(now);
        if (this.dayName) this.dayName.textContent = faDayName;
        if (this.dayNum) this.dayNum.textContent = faDayNum;
      } catch {
        if (this.dayName) this.dayName.textContent = 'شنبه';
        if (this.dayNum) this.dayNum.textContent = '۱۵';
      }

      let phaseText = 'ظهر';
      let phaseTheme = 'noon';

      if (rawHours >= 4 && rawHours < 7) {
        phaseText = 'صبح زود';
        phaseTheme = 'dawn';
      } else if (rawHours >= 7 && rawHours < 12) {
        phaseText = 'صبح';
        phaseTheme = 'morning';
      } else if (rawHours >= 12 && rawHours < 16) {
        phaseText = 'ظهر';
        phaseTheme = 'noon';
      } else if (rawHours >= 16 && rawHours < 19) {
        phaseText = 'عصر';
        phaseTheme = 'sunset';
      } else if (rawHours >= 19 && rawHours < 23) {
        phaseText = 'شب';
        phaseTheme = 'night';
      } else {
        phaseText = 'بامداد';
        phaseTheme = 'midnight';
      }

      if (this.phaseLabel) this.phaseLabel.textContent = phaseText;
      if (!Storage.get('manual_theme_override') && this.htmlRoot.getAttribute('data-time-theme') !== phaseTheme) {
        this.htmlRoot.setAttribute('data-time-theme', phaseTheme);
        document.body.setAttribute('data-time-theme', phaseTheme);
      }
    }
  };

  // =====================================================
  // 2. Dynamic Island & Dedicated Timer Engine
  // =====================================================
  const DedicatedTimerEngine = {
    timerInterval: null,
    dialMinutes: 20,

    init() {
      this.island = document.getElementById('smartIsland');
      this.timerTrack = document.querySelector('.timer-progress-track');
      this.timerDisplay = document.getElementById('timerDisplay');
      this.btnCancel = document.getElementById('btnCancelTimer');

      this.islandSandTop = document.getElementById('svgSandTop');
      this.islandSandBottom = document.getElementById('svgSandBottom');

      this.sandTop = document.getElementById('sandTop');
      this.sandBottom = document.getElementById('sandBottom');

      this.dialNum = document.getElementById('dialDisplayNum');
      this.btnPlus = document.getElementById('btnStepPlus');
      this.btnMinus = document.getElementById('btnStepMinus');
      this.btnPlay = document.getElementById('btnPlayTimerDial');
      this.btnReset = document.getElementById('btnResetTimerDial');

      this.inputYears = document.getElementById('inputYears');
      this.inputMonths = document.getElementById('inputMonths');
      this.inputDays = document.getElementById('inputDays');
      this.inputHours = document.getElementById('inputHours');
      this.inputMins = document.getElementById('inputMins');
      this.inputSecs = document.getElementById('inputSecs');

      this.btnLaunchCustom = document.getElementById('btnLaunchCustomTimer');
      this.btnTestDing = document.getElementById('btnTestDing');

      this.island?.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        e.stopPropagation();

        const currentState = this.island.getAttribute('data-state');
        if (currentState === 'news') {
          this.island.setAttribute('data-state', AppState.timerActive ? 'timer' : 'idle');
        } else {
          this.island.setAttribute('data-state', 'news');
        }
      });

      document.addEventListener('click', (e) => {
        if (!this.island?.contains(e.target) && this.island?.getAttribute('data-state') === 'news') {
          this.island.setAttribute('data-state', AppState.timerActive ? 'timer' : 'idle');
        }
      });

      this.btnPlus?.addEventListener('click', () => {
        this.dialMinutes += 5;
        this.updateDialUI();
      });

      this.btnMinus?.addEventListener('click', () => {
        if (this.dialMinutes > 5) this.dialMinutes -= 5;
        this.updateDialUI();
      });

      this.btnPlay?.addEventListener('click', () => {
        this.startTimer(this.dialMinutes * 60);
      });

      this.btnReset?.addEventListener('click', () => {
        this.dialMinutes = 20;
        this.updateDialUI();
        this.stopTimer();
      });

      this.btnLaunchCustom?.addEventListener('click', () => {
        const y = parseInt(this.inputYears?.value || '0', 10);
        const mo = parseInt(this.inputMonths?.value || '0', 10);
        const d = parseInt(this.inputDays?.value || '0', 10);
        const h = parseInt(this.inputHours?.value || '0', 10);
        const m = parseInt(this.inputMins?.value || '0', 10);
        const s = parseInt(this.inputSecs?.value || '0', 10);

        const totalSeconds = (y * 31536000) + (mo * 2592000) + (d * 86400) + (h * 3600) + (m * 60) + s;

        if (totalSeconds <= 0) {
          ToastManager.show('لطفاً حداقل ۱ ثانیه برای تایمر مشخص کنید.', 'warning');
          return;
        }

        this.startTimer(totalSeconds);
      });

      this.btnCancel?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopTimer();
      });

      this.btnTestDing?.addEventListener('click', () => {
        SoundSynthesizer.playDing();
        ToastManager.show('در حال پخش صدای زنگ...', 'info');
      });
    },

    updateDialUI() {
      if (this.dialNum) this.dialNum.textContent = this.dialMinutes;
      if (this.inputMins) this.inputMins.value = this.dialMinutes;
    },

    startTimer(seconds) {
      this.stopTimer();
      AppState.timerActive = true;
      AppState.timerTotalSeconds = seconds;
      AppState.timerSecondsLeft = seconds;

      this.island?.classList.remove('timer-ringing');
      this.island?.setAttribute('data-state', 'timer');
      this.updateTimerDisplay();

      this.timerInterval = setInterval(() => {
        AppState.timerSecondsLeft--;

        if (AppState.timerSecondsLeft <= 0) {
          this.triggerTimerFinish();
        } else {
          this.updateTimerDisplay();
        }
      }, 1000);

      ToastManager.show(`تایمر برای ${this.formatReadableTime(seconds)} فعال شد.`, 'success');
    },

    triggerTimerFinish() {
      this.stopTimer();
      SoundSynthesizer.playDing();

      if (this.island) {
        this.island.classList.add('timer-ringing');
        this.island.setAttribute('data-state', 'timer');
        if (this.timerDisplay) this.timerDisplay.textContent = '00:00';
        const sub = document.getElementById('timerSubMsg');
        if (sub) sub.textContent = 'زمان پایان یافت!';
      }

      ToastManager.show('زمان تایمر به پایان رسید.', 'warning');

      setTimeout(() => {
        if (this.island) {
          this.island.classList.remove('timer-ringing');
          this.island.setAttribute('data-state', 'idle');
          const sub = document.getElementById('timerSubMsg');
          if (sub) sub.textContent = 'تایمر فعال';
        }
      }, 7000);
    },

    updateTimerDisplay() {
      const left = AppState.timerSecondsLeft;
      const total = AppState.timerTotalSeconds;

      const days = Math.floor(left / 86400);
      const hours = Math.floor((left % 86400) / 3600);
      const mins = Math.floor((left % 3600) / 60);
      const secs = left % 60;

      let timeText = '';
      if (days > 0) {
        timeText = `${days}d ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      } else if (hours > 0) {
        timeText = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      } else {
        timeText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }

      if (this.timerDisplay) this.timerDisplay.textContent = timeText;

      if (this.timerTrack) {
        const perimeter = 520;
        const progress = Math.max(0, Math.min(1, (total - left) / total));
        const offset = perimeter * (1 - progress);
        this.timerTrack.style.strokeDashoffset = offset;
      }

      const progressRatio = Math.max(0, Math.min(1, (total - left) / total));
      if (this.islandSandTop) {
        this.islandSandTop.style.transform = `scaleY(${1 - progressRatio})`;
        this.islandSandTop.style.transformOrigin = 'bottom';
      }
      if (this.islandSandBottom) {
        this.islandSandBottom.style.transform = `scale(${0.4 + (progressRatio * 0.6)})`;
        this.islandSandBottom.style.transformOrigin = 'bottom';
      }
      if (this.sandTop) {
        this.sandTop.style.transform = `scaleY(${1 - progressRatio})`;
        this.sandTop.style.transformOrigin = 'bottom';
      }
      if (this.sandBottom) {
        this.sandBottom.style.transform = `scale(${0.4 + (progressRatio * 0.6)})`;
        this.sandBottom.style.transformOrigin = 'bottom';
      }
    },

    stopTimer() {
      clearInterval(this.timerInterval);
      AppState.timerActive = false;
      AppState.timerSecondsLeft = 0;
      if (this.timerTrack) this.timerTrack.style.strokeDashoffset = 520;
      if (this.island?.getAttribute('data-state') === 'timer') {
        this.island.setAttribute('data-state', 'idle');
      }
    },

    formatReadableTime(sec) {
      if (sec >= 86400) return `${Math.floor(sec / 86400)} روز`;
      if (sec >= 3600) return `${Math.floor(sec / 3600)} ساعت`;
      if (sec >= 60) return `${Math.floor(sec / 60)} دقیقه`;
      return `${sec} ثانیه`;
    }
  };

  // =====================================================
  // 3. Floating AI Orb
  // =====================================================
  const FloatingAiOrbManager = {
    init() {
      this.orbBtn = document.getElementById('btnOpenAiOrb');
      this.drawer = document.getElementById('aiDrawer');
      this.closeBtn = document.getElementById('btnCloseAiDrawer');
      this.input = document.getElementById('aiUserInput');
      this.sendBtn = document.getElementById('btnSendAiMessage');
      this.chat = document.getElementById('aiChatArea');

      if (!this.orbBtn || !this.drawer) return;

      this.orbBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.drawer.classList.toggle('active');
        if (this.drawer.classList.contains('active')) {
          setTimeout(() => this.input?.focus(), 300);
        }
      });

      this.closeBtn?.addEventListener('click', () => {
        this.drawer.classList.remove('active');
      });

      document.addEventListener('click', (e) => {
        if (!this.drawer.contains(e.target) && !this.orbBtn.contains(e.target)) {
          this.drawer.classList.remove('active');
        }
      });

      const handleUserMessage = () => {
        if (!this.input || !this.chat) return;
        const text = this.input.value.trim();
        if (!text) return;

        const uMsg = document.createElement('div');
        uMsg.className = 'ai-speech-bubble user';
        uMsg.textContent = text;
        this.chat.appendChild(uMsg);
        this.input.value = '';
        this.chat.scrollTop = this.chat.scrollHeight;

        setTimeout(() => {
          const bMsg = document.createElement('div');
          bMsg.className = 'ai-speech-bubble bot';

          if (text.includes('قرارداد') || text.includes('الهیه')) {
            bMsg.innerHTML = `پرونده و پیش‌نویس مبایعه‌نامه الهیه به ارزش ۱۵۵ میلیارد تومان ثبت گردید و جهت امضای نهایی آماده است.`;
          } else if (text.includes('سود') || text.includes('گردش')) {
            bMsg.innerHTML = `گردش مالی این ماه ۳۸۴ میلیارد تومان است که کمیسیون برآوردی ۲.۹ میلیارد تومان محاسبه شده است.`;
          } else {
            bMsg.innerHTML = `درخواست شما بررسی شد. نتایج و فایل‌های مربوط به "<strong>${text}</strong>" استخراج گردیدند.`;
          }

          this.chat.appendChild(bMsg);
          this.chat.scrollTop = this.chat.scrollHeight;
        }, 500);
      };

      this.sendBtn?.addEventListener('click', handleUserMessage);
      this.input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleUserMessage();
        }
      });
    }
  };

  // =====================================================
  // 4. Navigation & Tab Switcher
  // =====================================================
  const NavigationRouter = {
    init() {
      this.panels = Array.from(document.querySelectorAll('.view-panel[data-view]'));

      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-route], [data-route-trigger], [data-view]');
        if (!trigger) return;

        const route = trigger.dataset.route || trigger.dataset.routeTrigger || trigger.dataset.view;
        if (!route) return;

        e.preventDefault();
        this.switchView(route);
      });

      this.switchView(AppState.currentView);
    },

    switchView(targetRoute) {
      const targetPanel = document.querySelector(`.view-panel[data-view="${targetRoute}"]`);
      if (targetPanel) {
        this.panels.forEach(panel => {
          panel.hidden = true;
          panel.classList.remove('active-panel');
        });

        targetPanel.hidden = false;
        targetPanel.classList.add('active-panel');
      }

      AppState.currentView = targetRoute;
      Storage.set('korosh_view', targetRoute);

      document.querySelectorAll('[data-view]').forEach(link => {
        const linkRoute = link.dataset.view;
        const isCurrent = linkRoute === targetRoute;
        link.classList.toggle('active', isCurrent);
      });
    }
  };

  // =====================================================
  // 5. Global Search & Ctrl + K
  // =====================================================
  const SearchEngine = {
    init() {
      this.container = document.querySelector('.retro-search-input');
      this.input = document.getElementById('globalSearchInput');
      if (!this.container || !this.input) return;

      this.buildResultsDropdown();
      this.bindEvents();
    },

    buildResultsDropdown() {
      this.dropdown = document.createElement('div');
      this.dropdown.className = 'search-results-dropdown';
      this.dropdown.hidden = true;
      this.dropdown.style.width = '100%';
      this.dropdown.style.left = '0';
      this.dropdown.style.right = '0';
      this.dropdown.style.position = 'absolute';
      this.dropdown.style.top = '115%';
      this.dropdown.style.zIndex = '1000';
      this.dropdown.style.background = 'var(--paper-card)';
      this.dropdown.style.border = '1.5px solid var(--border-dark)';
      this.dropdown.style.borderRadius = 'var(--radius-sm)';
      this.dropdown.style.boxShadow = '0 10px 25px var(--shadow-color)';
      this.container.style.position = 'relative';
      this.container.appendChild(this.dropdown);
    },

    bindEvents() {
      this.input.addEventListener('input', () => {
        this.performSearch(this.input.value.trim());
      });

      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
          e.preventDefault();
          this.input.focus();
          this.input.select();
        }
      });

      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          this.closeDropdown();
        }
      });
    },

    performSearch(query) {
      if (!query) {
        this.closeDropdown();
        return;
      }

      const matches = AppState.mockEntities.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.id.toLowerCase().includes(query.toLowerCase())
      );

      if (matches.length === 0) {
        this.dropdown.innerHTML = `<div style="padding: 12px; text-align: center; color: var(--ink-secondary); font-size: 0.8rem;">موردی یافت نشد.</div>`;
      } else {
        this.dropdown.innerHTML = `
          <ul style="max-height: 220px; overflow-y: auto; list-style: none; padding: 4px; margin: 0;">
            ${matches.map(m => `
              <li data-search-route="${m.targetView}" style="cursor: pointer; padding: 8px 10px; border-bottom: 1px dashed var(--paper-border); display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <p style="margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--ink-primary);">${m.title}</p>
                  <span style="font-size: 0.68rem; color: var(--accent-main); font-family: monospace;">${m.id}</span>
                </div>
                <span class="stamp-chip blue" style="font-size: 0.62rem;">${m.type}</span>
              </li>
            `).join('')}
          </ul>
        `;

        this.dropdown.querySelectorAll('[data-search-route]').forEach(row => {
          row.addEventListener('click', () => {
            NavigationRouter.switchView(row.dataset.searchRoute);
            this.closeDropdown();
            this.input.value = '';
          });
        });
      }

      this.dropdown.hidden = false;
    },

    closeDropdown() {
      if (this.dropdown) this.dropdown.hidden = true;
    }
  };

  // =====================================================
  // 6. Persian Header Date
  // =====================================================
  const PersianDateTime = {
    init() {
      this.dateTarget = document.getElementById('smartDateDisplay');
      if (!this.dateTarget) return;

      try {
        const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        this.dateTarget.textContent = formatter.format(new Date());
      } catch {
        this.dateTarget.textContent = 'شنبه ۱۵ شهریور ۱۴۰۵';
      }
    }
  };

  // =====================================================
  // 7. Attendance Shift Punch
  // =====================================================
  const AttendanceManager = {
    init() {
      this.btnPunch = document.getElementById('btnClockInOut');
      this.workOutTarget = document.getElementById('workOutTime');
      this.isPunchedOut = false;

      if (!this.btnPunch || !this.workOutTarget) return;

      this.btnPunch.addEventListener('click', () => {
        const timeStr = new Date().toTimeString().split(' ')[0];

        if (!this.isPunchedOut) {
          this.isPunchedOut = true;
          this.workOutTarget.textContent = timeStr;
          this.btnPunch.textContent = 'ورود مجدد به شیفت';
          this.btnPunch.style.background = '#3f6e37';
          ToastManager.show(`خروج شما در ساعت ${timeStr} ثبت شد.`, 'info');
        } else {
          this.isPunchedOut = false;
          this.btnPunch.textContent = 'ثبت وضعیت خروج';
          this.btnPunch.style.background = 'var(--accent-main)';
          ToastManager.show(`ورود مجدد شما در ساعت ${timeStr} ثبت شد.`, 'success');
        }
      });
    }
  };

  // =====================================================
  // 8. Charts Tooltip
  // =====================================================
  const ChartInteractions = {
    init() {
      document.querySelectorAll('.d-bar-slot').forEach(slot => {
        slot.addEventListener('click', () => {
          ToastManager.show(`آمار ماه: ارزش مبادلات ${slot.dataset.amount} • حجم: ${slot.dataset.deals}`, 'info');
        });
      });
    }
  };

  // =====================================================
  // 9. Telephony Pop-up Simulation
  // =====================================================
  const TelephonyManager = {
    init() {
      this.modal = document.getElementById('callModal');
      this.btnSimulate = document.getElementById('btnSimulateCall');
      this.btnAnswer = document.getElementById('btnAnswerCall');
      this.btnReject = document.getElementById('btnRejectCall');
      this.ctrlOngoing = document.getElementById('callOngoingCtrl');
      this.postWrap = document.getElementById('callPostWrap');
      this.btnSave = document.getElementById('btnSaveCallReport');

      if (!this.modal) return;

      this.btnSimulate?.addEventListener('click', () => {
        if (this.ctrlOngoing) this.ctrlOngoing.hidden = false;
        if (this.postWrap) this.postWrap.hidden = true;
        this.modal.classList.add('active');
      });

      this.btnAnswer?.addEventListener('click', () => {
        if (this.ctrlOngoing) this.ctrlOngoing.hidden = true;
        if (this.postWrap) this.postWrap.hidden = false;
      });

      this.btnReject?.addEventListener('click', () => {
        this.modal.classList.remove('active');
      });

      this.btnSave?.addEventListener('click', () => {
        ToastManager.show('گزارش مکالمه در پرونده متقاضی ثبت شد.', 'success');
        this.modal.classList.remove('active');
      });
    }
  };

  // =====================================================
  // 10. Toast Notification System
  // =====================================================
  const ToastManager = {
    init() {
      this.container = document.getElementById('toastContainer');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.style.position = 'fixed';
        this.container.style.bottom = '20px';
        this.container.style.left = '20px';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '8px';
        this.container.style.zIndex = '99999';
        document.body.appendChild(this.container);
      }
    },

    show(message, type = 'info', duration = 3500) {
      if (!this.container) this.init();

      const typeColors = {
        success: '#3f6e37',
        error: '#b84a39',
        warning: '#c98a2c',
        info: 'var(--accent-main)'
      };

      const toast = document.createElement('div');
      toast.style.padding = '10px 16px';
      toast.style.borderRadius = 'var(--radius-sm)';
      toast.style.border = `1.5px solid var(--border-dark)`;
      toast.style.background = 'var(--paper-card)';
      toast.style.boxShadow = '3px 3px 0px var(--shadow-color)';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '8px';
      toast.style.minWidth = '240px';
      toast.style.fontSize = '0.82rem';
      toast.style.fontWeight = '700';
      toast.style.color = 'var(--ink-primary)';
      toast.style.transform = 'translateY(10px)';
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.25s ease';

      toast.innerHTML = `
        <span style="color: ${typeColors[type] || 'var(--accent-main)'}; font-size: 1rem;">•</span>
        <span>${message}</span>
      `;

      this.container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      });

      window.setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        window.setTimeout(() => toast.remove(), 250);
      }, duration);
    }
  };

  // =====================================================
  // 11. Property Cards Deck: Multi-Image, Edit & Delete
  // =====================================================
  const PropertyCardsEngine = {
    init() {
      const btnPrivacy = document.getElementById('btnToggleDeckPrivacy');
      const labelPrivacy = document.getElementById('privacyBtnLabel');

      if (btnPrivacy && !btnPrivacy.dataset.bound) {
        btnPrivacy.dataset.bound = "true";
        btnPrivacy.addEventListener('click', (e) => {
          e.preventDefault();
          AppState.isPrivacyActive = !AppState.isPrivacyActive;
          
          if (labelPrivacy) {
            labelPrivacy.textContent = AppState.isPrivacyActive 
              ? 'حالت امن فعال (محو)' 
              : 'حالت امن پرزنت (عادی)';
          }

          document.querySelectorAll('.card-private-data').forEach(el => {
            el.style.filter = AppState.isPrivacyActive ? 'blur(6px)' : 'none';
            el.style.opacity = AppState.isPrivacyActive ? '0.35' : '1';
          });

          ToastManager.show(
            AppState.isPrivacyActive ? 'حالت پرزنت امن فعال شد.' : 'حالت عادی بازگردانی شد.',
            'info'
          );
        });
      }

      // آپلود چندین عکس همزمان با فشرده‌سازی خودکار
      const filesInput = document.getElementById('propImageFiles');
      if (filesInput && !filesInput.dataset.bound) {
        filesInput.dataset.bound = "true";
        filesInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;

          for (const file of files) {
            const compressedBase64 = await this.compressImageFile(file, 900, 0.82);
            AppState.currentFormImages.push(compressedBase64);
          }
          this.renderAlbumPreview();
        });
      }

      // باز شدن مودال برای ملک جدید
      const addModal = document.getElementById('addPropertyModal');
      const btnOpenAdd = document.getElementById('btnOpenAddPropertyModal');
      const btnCloseAdd = document.getElementById('btnCloseAddPropertyModal');
      const formNewProp = document.getElementById('formNewProperty');

      if (btnOpenAdd && addModal && !btnOpenAdd.dataset.bound) {
        btnOpenAdd.dataset.bound = "true";
        btnOpenAdd.addEventListener('click', () => {
          this.resetForm();
          document.getElementById('propModalTitle').textContent = 'ثبت مشخصات فایل ملک';
          document.getElementById('btnSubmitPropModal').textContent = 'ذخیره و درج در سامانه';
          addModal.style.display = 'flex';
        });
      }

      if (btnCloseAdd && addModal && !btnCloseAdd.dataset.bound) {
        btnCloseAdd.dataset.bound = "true";
        btnCloseAdd.addEventListener('click', () => {
          addModal.style.display = 'none';
        });
      }

      if (addModal && !addModal.dataset.bound) {
        addModal.dataset.bound = "true";
        addModal.addEventListener('click', (e) => {
          if (e.target === addModal) addModal.style.display = 'none';
        });
      }

      // ارسال فرم (ثبت ملک جدید یا ویرایش ملک قبلی)
      if (formNewProp && !formNewProp.dataset.bound) {
        formNewProp.dataset.bound = "true";
        formNewProp.addEventListener('submit', async (e) => {
          e.preventDefault();

          const editId = document.getElementById('propEditId')?.value;
          const fallbackImages = ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'];
          const finalImages = AppState.currentFormImages.length > 0 ? AppState.currentFormImages : fallbackImages;

          const propData = {
            title: document.getElementById('propTitle')?.value.trim() || 'فایل ملکی جدید',
            code: document.getElementById('propCode')?.value.trim() || `#KR-${Math.floor(100 + Math.random() * 900)}`,
            area: document.getElementById('propArea')?.value || '۲۰۰',
            rooms: document.getElementById('propRooms')?.value || '۳',
            price: document.getElementById('propPrice')?.value.trim() || 'توافقی',
            ownerName: document.getElementById('propOwner')?.value.trim() || 'محرمانه',
            ownerPhone: document.getElementById('propPhone')?.value.trim() || '---',
            location: document.getElementById('propAddress')?.value.trim() || 'تهران',
            address: document.getElementById('propAddress')?.value.trim() || 'تهران',
            buyer: 'ثبت در سامانه',
            status: 'آماده معامله',
            images: finalImages,
            image: finalImages[0]
          };

          if (window.PropertyService) {
            if (editId) {
              await window.PropertyService.update(editId, propData);
              ToastManager.show('مشخصات ملک با موفقیت ویرایش شد.', 'success');
            } else {
              await window.PropertyService.add(propData);
              ToastManager.show('فایل ملک جدید همراه با عکس‌ها ذخیره گردید.', 'success');
            }
          }

          this.resetForm();
          if (addModal) addModal.style.display = 'none';
          loadPropertiesData();
        });
      }

      this.initShareModal();
    },

    // فشرده‌سازی کلاینت‌ساید برای بهینگی Dexie
    compressImageFile(file, maxWidth = 900, quality = 0.8) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const image = new Image();
          image.onload = () => {
            let width = image.width;
            let height = image.height;

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          };
          image.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
      });
    },

    renderAlbumPreview() {
      const container = document.getElementById('propImagesAlbumPreview');
      if (!container) return;

      if (AppState.currentFormImages.length === 0) {
        container.innerHTML = `<span style="font-size: 0.74rem; color: var(--ink-secondary); margin: auto;">عکسی انتخاب نشده است.</span>`;
        return;
      }

      container.innerHTML = AppState.currentFormImages.map((src, i) => `
        <div style="position: relative; width: 68px; height: 55px; flex-shrink: 0; border-radius: 6px; overflow: hidden; border: 1.5px solid var(--border-dark);">
          <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;">
          <button type="button" class="btn-remove-preview-img" data-idx="${i}" style="position: absolute; top: 2px; right: 2px; background: rgba(220,38,38,0.85); color: #fff; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
        </div>
      `).join('');

      container.querySelectorAll('.btn-remove-preview-img').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          AppState.currentFormImages.splice(idx, 1);
          this.renderAlbumPreview();
        });
      });
    },

    resetForm() {
      const form = document.getElementById('formNewProperty');
      if (form) form.reset();
      document.getElementById('propEditId').value = '';
      AppState.currentFormImages = [];
      this.renderAlbumPreview();
    },

    openEditModal(property) {
      this.resetForm();
      const addModal = document.getElementById('addPropertyModal');
      if (!addModal) return;

      document.getElementById('propEditId').value = property.id || '';
      document.getElementById('propTitle').value = property.title || '';
      document.getElementById('propCode').value = property.code || '';
      document.getElementById('propArea').value = property.area || '';
      document.getElementById('propRooms').value = property.rooms || '';
      document.getElementById('propPrice').value = property.price || '';
      document.getElementById('propOwner').value = property.ownerName !== 'محرمانه' ? (property.ownerName || '') : '';
      document.getElementById('propPhone').value = property.ownerPhone !== '---' ? (property.ownerPhone || '') : '';
      document.getElementById('propAddress').value = property.address || property.location || '';

      const imgs = property.images && property.images.length > 0 
        ? property.images 
        : (property.image ? [property.image] : []);
      AppState.currentFormImages = [...imgs];
      this.renderAlbumPreview();

      document.getElementById('propModalTitle').textContent = `ویرایش ملک: ${property.title}`;
      document.getElementById('btnSubmitPropModal').textContent = 'ذخیره تغییرات ملک';

      addModal.style.display = 'flex';
    },

    async confirmDelete(property) {
      if (confirm(`آیا از حذف کامل ملک "${property.title}" از سامانه اطمینان دارید؟`)) {
        if (window.PropertyService && property.id) {
          await window.PropertyService.delete(property.id);
          ToastManager.show(`ملک ${property.title} با موفقیت حذف شد.`, 'warning');
          loadPropertiesData();
        }
      }
    },

    initShareModal() {
      const shareModal = document.getElementById('sharePropertyModal');
      const btnCloseShare = document.getElementById('btnCloseShareModal');
      const checkConfidential = document.getElementById('shareIncludeConfidential');
      const btnCopy = document.getElementById('btnCopyShareText');
      const btnTelegram = document.getElementById('btnShareTelegram');
      const btnWhatsapp = document.getElementById('btnShareWhatsapp');

      if (!shareModal) return;

      btnCloseShare?.addEventListener('click', () => {
        shareModal.style.display = 'none';
      });

      shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) shareModal.style.display = 'none';
      });

      checkConfidential?.addEventListener('change', () => {
        this.updateShareTextOutput();
      });

      btnCopy?.addEventListener('click', () => {
        const text = document.getElementById('shareGeneratedText')?.value;
        if (text) {
          navigator.clipboard.writeText(text);
          ToastManager.show('متن پرزنت کپی شد.', 'success');
        }
      });

      btnTelegram?.addEventListener('click', () => {
        const text = encodeURIComponent(document.getElementById('shareGeneratedText')?.value || '');
        window.open(`https://t.me/share/url?url=&text=${text}`, '_blank');
      });

      btnWhatsapp?.addEventListener('click', () => {
        const text = encodeURIComponent(document.getElementById('shareGeneratedText')?.value || '');
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      });
    },

    openShareModal(property) {
      AppState.currentSelectedProperty = property;
      const shareModal = document.getElementById('sharePropertyModal');
      if (!shareModal) return;

      const mainImg = (property.images && property.images[0]) || property.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
      document.getElementById('sharePreviewImg').src = mainImg;
      document.getElementById('sharePreviewTitle').textContent = property.title || 'ملک لوکس';
      document.getElementById('sharePreviewSpecs').textContent = `${property.area || '۳۲۰'} متر • ${property.rooms || '۳'} خواب`;
      document.getElementById('sharePreviewPrice').textContent = property.price || 'توافقی';

      const checkConfidential = document.getElementById('shareIncludeConfidential');
      if (checkConfidential) checkConfidential.checked = false;

      this.updateShareTextOutput();
      shareModal.style.display = 'flex';
    },

    updateShareTextOutput() {
      const p = AppState.currentSelectedProperty;
      if (!p) return;

      const isConfidential = document.getElementById('shareIncludeConfidential')?.checked;
      const textarea = document.getElementById('shareGeneratedText');

      let output = `فایل اختصاصی املاک کوروش\n`;
      output += `عنوان: ${p.title || 'آپارتمان لوکس'}\n`;
      output += `متراژ: ${p.area || '۳۲۰'} متر | تعداد خواب: ${p.rooms || '۳'}\n`;
      output += `ارزش اعلامی: ${p.price || 'توافقی'}\n`;
      output += `شناسه فایل: ${p.code || 'KR-00'}\n`;

      if (isConfidential) {
        output += `\n[اطلاعات محرمانه جهت پیگیری]:\n`;
        output += `مالک: ${p.ownerName || 'ثبت در سامانه'}\n`;
        output += `تلفن مالک: ${p.ownerPhone || '---'}\n`;
        output += `آدرس دقیق: ${p.address || p.location || 'تهران'}\n`;
      } else {
        output += `\nدارای سند رسمی تک‌برگ و آماده انتقال.\nجهت دریافت لوکیشن و هماهنگی بازدید پیام دهید.`;
      }

      if (textarea) textarea.value = output;
    },

    renderCards(properties) {
      const container = document.getElementById('propertiesCardsContainer');
      if (!container) return;

      if (!properties || properties.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; background: var(--paper-card); border: 1.5px dashed var(--border-dark); border-radius: var(--radius-sm);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--ink-secondary);"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <p style="margin-top: 8px; font-weight: 700; color: var(--ink-secondary); font-size: 0.85rem;">هیچ ملکی ثبت نشده است.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = properties.map((item, idx) => {
        const blurStyle = AppState.isPrivacyActive ? 'filter: blur(5px); opacity: 0.3;' : 'filter: none; opacity: 1;';
        
        const imagesList = (item.images && item.images.length > 0) 
          ? item.images 
          : (item.image ? [item.image] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80']);
        
        const currentIdx = AppState.cardImageIndices[item.id] || 0;
        const activeImg = imagesList[currentIdx % imagesList.length];

        return `
          <div class="stamp-kpi-card" style="display: flex; flex-direction: column; padding: 0; overflow: hidden; background: var(--paper-card); border: 1.5px solid var(--border-dark); border-radius: var(--radius-sm); box-shadow: 2px 2px 0px var(--shadow-color); transition: transform 0.15s ease;">
            
            <!-- تصویر، اسلایدر چندتایی و نشان کد -->
            <div style="position: relative; width: 100%; height: 165px; background: #1a1a1a; overflow: hidden;">
              <img id="cardImg-${item.id}" src="${activeImg}" 
                   alt="${item.title || 'ملک'}" 
                   style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.2s;">
              
              <span style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.75); color: #fff; padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-family: monospace; font-weight: 800; z-index: 2;">
                ${item.code || item.id || 'PROP-#'}
              </span>

              <!-- نشانگر و دکمه‌های اسلایدر چند تصویر -->
              ${imagesList.length > 1 ? `
                <div style="position: absolute; bottom: 8px; left: 8px; display: flex; gap: 4px; z-index: 2;">
                  <button class="btn-prev-card-img story-btn" data-id="${item.id}" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(0,0,0,0.7); color: #fff; border-color: rgba(255,255,255,0.3);">‹</button>
                  <span style="background: rgba(0,0,0,0.7); color: #fff; font-size: 0.62rem; padding: 2px 5px; border-radius: 3px; font-weight: bold;">${(currentIdx % imagesList.length) + 1}/${imagesList.length}</span>
                  <button class="btn-next-card-img story-btn" data-id="${item.id}" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(0,0,0,0.7); color: #fff; border-color: rgba(255,255,255,0.3);">›</button>
                </div>
              ` : ''}

              <!-- دکمه‌های سریع ویرایش و حذف با آیکون‌های SVG -->
              <div style="position: absolute; top: 8px; left: 8px; display: flex; gap: 4px; z-index: 2;">
                <button class="btn-card-edit" data-idx="${idx}" title="ویرایش ملک" style="background: rgba(0,0,0,0.75); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="btn-card-delete" data-idx="${idx}" title="حذف ملک" style="background: rgba(0,0,0,0.75); color: #f87171; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

            <!-- مشخصات مینیمال و خوانا -->
            <div style="padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; flex: 1;">
              
              <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 6px;">
                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 900; color: var(--ink-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${item.title || 'آپارتمان مسکونی'}
                </h4>
                <span style="font-size: 0.72rem; color: var(--ink-secondary); font-weight: 700; white-space: nowrap;">
                  ${item.area || '---'} متر
                </span>
              </div>

              <!-- قیمت اعلامی -->
              <div style="font-size: 0.95rem; color: #10b981; font-weight: 900;">
                ${item.price || 'توافقی'}
              </div>

              <!-- کادر اطلاعات محرمانه همراه با آیکون لوکیشن SVG -->
              <div style="background: rgba(0, 0, 0, 0.025); padding: 5px 8px; border-radius: 4px; border: 1px dashed var(--paper-border); font-size: 0.7rem; margin-top: 2px;">
                <div class="card-private-data" style="${blurStyle} transition: filter 0.2s, opacity 0.2s; color: var(--ink-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  <strong>مالک:</strong> ${item.ownerName || 'ثبت نشده'} (${item.ownerPhone || '---'})
                </div>
                <div class="card-private-data" style="${blurStyle} margin-top: 2px; transition: filter 0.2s, opacity 0.2s; color: var(--ink-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>${item.address || item.location || 'تهران'}</span>
                </div>
              </div>

              <!-- دکمه‌های پرزنت و اشتراک -->
              <div style="display: flex; gap: 6px; margin-top: auto; padding-top: 6px;">
                <button class="story-btn btn-trigger-share" data-index="${idx}" style="flex: 1; padding: 6px; font-size: 0.76rem; font-weight: 800; border-radius: 5px; background: var(--accent-sub); color: #000; border: 1px solid var(--border-dark); display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  <span>ارسال / پرزنت</span>
                </button>
                <button class="story-btn" onclick="window.showToast('متن آگهی تولید شد.', 'info')" style="padding: 6px 10px; font-size: 0.76rem; font-weight: 800; border-radius: 5px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                  <span>آگهی</span>
                </button>
              </div>

            </div>

          </div>
        `;
      }).join('');

      // دکمه‌های اسلایدر تصاویر کارت‌ها
      container.querySelectorAll('.btn-next-card-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const prop = properties.find(p => String(p.id) === String(id));
          if (prop && prop.images && prop.images.length > 1) {
            AppState.cardImageIndices[id] = (AppState.cardImageIndices[id] || 0) + 1;
            this.renderCards(properties);
          }
        });
      });

      container.querySelectorAll('.btn-prev-card-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const prop = properties.find(p => String(p.id) === String(id));
          if (prop && prop.images && prop.images.length > 1) {
            const cur = AppState.cardImageIndices[id] || 0;
            AppState.cardImageIndices[id] = (cur - 1 + prop.images.length);
            this.renderCards(properties);
          }
        });
      });

      // اتصال دکمه ویرایش
      container.querySelectorAll('.btn-card-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx, 10);
          const prop = properties[idx];
          if (prop) this.openEditModal(prop);
        });
      });

      // اتصال دکمه حذف
      container.querySelectorAll('.btn-card-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx, 10);
          const prop = properties[idx];
          if (prop) this.confirmDelete(prop);
        });
      });

      // اتصال دکمه ارسال / پرزنت
      container.querySelectorAll('.btn-trigger-share').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index, 10);
          const property = properties[index];
          if (property) this.openShareModal(property);
        });
      });
    }
  };

  async function loadPropertiesData() {
    PropertyCardsEngine.init();

    if (!window.PropertyService) {
      setTimeout(loadPropertiesData, 150);
      return;
    }

    try {
      const properties = await window.PropertyService.getAll();

      // ۱. رندر در شبکه کارت‌ها
      PropertyCardsEngine.renderCards(properties);

      // ۲. رندر در جدول داشبورد
      const tbody = document.getElementById('dealsTableBody') || document.querySelector('table tbody');
      if (tbody && properties && properties.length > 0) {
        tbody.innerHTML = '';
        properties.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td style="font-family: monospace; font-weight: 700;"><span class="ink-code">${item.code || 'KR-00'}</span></td>
            <td><strong>${item.buyer || item.customer || 'دکتر آرشام فرهمند'}</strong></td>
            <td>${item.title || 'ملک بدون عنوان'} (${item.location || 'تهران'})</td>
            <td>${item.price || 'توافقی'}</td>
            <td><span class="stamp-chip ${item.status === 'امضای نهایی شد' ? 'green' : 'blue'}">${item.status || 'فعال'}</span></td>
          `;
          tbody.appendChild(row);
        });
      }
    } catch (err) {
      console.error('خطا در بارگذاری دیتای املاک:', err);
    }
  }

  // =====================================================
  // 12. Bootstrap
  // =====================================================
  document.addEventListener('DOMContentLoaded', () => {
    ModularTimeEngine.init();
    DedicatedTimerEngine.init();
    FloatingAiOrbManager.init();
    NavigationRouter.init();
    SearchEngine.init();
    PersianDateTime.init();
    AttendanceManager.init();
    ChartInteractions.init();
    TelephonyManager.init();
    ToastManager.init();
    loadPropertiesData();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        SearchEngine.closeDropdown();
        document.getElementById('callModal')?.classList.remove('active');
        document.getElementById('aiDrawer')?.classList.remove('active');
        document.getElementById('sharePropertyModal')?.style.setProperty('display', 'none');
        document.getElementById('addPropertyModal')?.style.setProperty('display', 'none');
        const island = document.getElementById('smartIsland');
        if (island && island.getAttribute('data-state') === 'news') {
          island.setAttribute('data-state', AppState.timerActive ? 'timer' : 'idle');
        }
      }
    });
  });

  window.showToast = (msg, type) => ToastManager.show(msg, type);
  window.refreshPropertiesDeck = loadPropertiesData;

})();