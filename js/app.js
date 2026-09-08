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

  // --- Sound Engine ---
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
    theme: Storage.get('korosh_theme', 'night'),
    currentView: Storage.get('korosh_view', 'dashboard'),
    currency: Storage.get('korosh_currency', 'IRT'),
    timerActive: false,
    timerSecondsLeft: 0,
    timerTotalSeconds: 0,
    isPrivacyActive: false,
    currentSelectedProperty: null,
    currentFormImages: [],
    cardImageIndices: {},
    calYear: 2026,
    calMonth: 8, // 0-indexed: 8 = September
    calSelectedDay: 17,
    mockEntities: [
      { id: 'PROP-1049', type: 'ملک', title: 'پنت‌هاوس ۴۵۰ متری الهیه فرشته', targetView: 'properties' },
      { id: 'PROP-1050', type: 'ملک', title: 'ویلای مدرن ۶۵۰ متری شهرک غرب', targetView: 'properties' },
      { id: 'PROP-1051', type: 'ملک', title: 'سند اداری نوساز تقاطع پارک‌وی', targetView: 'properties' },
      { id: 'CUST-301', type: 'مشتری', title: 'دکتر داریوش رضوی (سرمایه‌گذار)', targetView: 'customers' },
      { id: 'CTR-9012', type: 'قرارداد', title: 'مبایعه‌نامه رسمی آرشام افشار - الهیه', targetView: 'contracts' }
    ]
  };

  // =====================================================
  // 1. Modern Spotlight Calendar Engine (قابلیت کامل ورق زدن و انتخاب)
  // =====================================================
  const ModernCalendarEngine = {
    monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    init() {
      this.monthTitle = document.getElementById('calDisplayMonth');
      this.grid = document.getElementById('calendarDaysGrid');
      this.btnPrev = document.getElementById('btnPrevMonth');
      this.btnNext = document.getElementById('btnNextMonth');

      // دکمه ماه قبل
      this.btnPrev?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        AppState.calMonth--;
        if (AppState.calMonth < 0) {
          AppState.calMonth = 11;
          AppState.calYear--;
        }
        this.renderCalendar();
      });

      // دکمه ماه بعد
      this.btnNext?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        AppState.calMonth++;
        if (AppState.calMonth > 11) {
          AppState.calMonth = 0;
          AppState.calYear++;
        }
        this.renderCalendar();
      });

      this.renderCalendar();
    },

    renderCalendar() {
      if (!this.grid || !this.monthTitle) return;

      this.monthTitle.textContent = `${this.monthNames[AppState.calMonth]} ${AppState.calYear}`;
      this.grid.innerHTML = '';

      // محاسبه اولین روز ماه (Monday-based)
      const firstDayOfMonth = new Date(AppState.calYear, AppState.calMonth, 1).getDay();
      const startDayIndex = (firstDayOfMonth + 6) % 7;

      const daysInCurrentMonth = new Date(AppState.calYear, AppState.calMonth + 1, 0).getDate();
      const daysInPrevMonth = new Date(AppState.calYear, AppState.calMonth, 0).getDate();

      // روزهای متعلق به ماه قبل (کمرنگ)
      for (let i = startDayIndex - 1; i >= 0; i--) {
        const span = document.createElement('span');
        span.className = 'cal-day-cell dimmed';
        span.textContent = daysInPrevMonth - i;
        this.grid.appendChild(span);
      }

      // روزهای ماه جاری
      for (let day = 1; day <= daysInCurrentMonth; day++) {
        const span = document.createElement('span');
        span.className = 'cal-day-cell';
        span.textContent = day;

        // هایلایت روز انتخابی
        if (day === AppState.calSelectedDay) {
          span.classList.add('active');
        }

        span.addEventListener('click', () => {
          this.grid.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('active'));
          span.classList.add('active');
          AppState.calSelectedDay = day;
          ToastManager.show(`تاریخ ${day} ${this.monthNames[AppState.calMonth]} ${AppState.calYear} تنظیم شد.`, 'info');
        });

        this.grid.appendChild(span);
      }

      // روزهای اول ماه بعد (کمرنگ)
      const totalCells = startDayIndex + daysInCurrentMonth;
      const remaining = (7 - (totalCells % 7)) % 7;
      for (let nextDay = 1; nextDay <= remaining; nextDay++) {
        const span = document.createElement('span');
        span.className = 'cal-day-cell dimmed';
        span.textContent = nextDay;
        this.grid.appendChild(span);
      }
    }
  };

  // =====================================================
  // 2. Modular Time Engine
  // =====================================================
  const ModularTimeEngine = {
    init() {
      this.htmlRoot = document.documentElement;
      this.flipHours = document.getElementById('flipHours');
      this.flipMinutes = document.getElementById('flipMinutes');
      this.flipAmPm = document.getElementById('flipAmPm');

      const savedTheme = Storage.get('korosh_theme', 'night');
      this.setTheme(savedTheme);

      document.querySelectorAll('[data-theme-set]').forEach(btn => {
        btn.addEventListener('click', () => {
          const tName = btn.getAttribute('data-theme-set');
          this.setTheme(tName);
          ToastManager.show(`تم به "${tName}" تغییر یافت.`, 'success');
        });
      });

      this.updateClock();
      setInterval(() => this.updateClock(), 1000);
    },

    setTheme(themeName) {
      AppState.theme = themeName;
      this.htmlRoot.setAttribute('data-time-theme', themeName);
      document.body.setAttribute('data-time-theme', themeName);
      Storage.set('korosh_theme', themeName);
    },

    updateClock() {
      const now = new Date();
      const rawHours = now.getHours();
      const minutes = now.getMinutes();
      const hours12 = rawHours % 12 || 12;
      const ampm = rawHours >= 12 ? 'PM' : 'AM';

      if (this.flipHours) this.flipHours.textContent = String(hours12).padStart(2, '0');
      if (this.flipMinutes) this.flipMinutes.textContent = String(minutes).padStart(2, '0');
      if (this.flipAmPm) this.flipAmPm.textContent = ampm;

      const dateTarget = document.getElementById('smartDateDisplay');
      if (dateTarget) {
        try {
          const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          dateTarget.textContent = formatter.format(now);
        } catch {
          dateTarget.textContent = 'سه‌شنبه ۱۷ شهریور ۱۴۰۵';
        }
      }
    }
  };

  // =====================================================
  // 3. Dedicated Timer Engine
  // =====================================================
  const DedicatedTimerEngine = {
    timerInterval: null,

    init() {
      this.island = document.getElementById('smartIsland');
      this.timerTrack = document.querySelector('.timer-progress-track');
      this.timerDisplay = document.getElementById('timerDisplay');
      this.btnCancel = document.getElementById('btnCancelTimer');

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

      this.btnCancel?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopTimer();
      });
    },

    stopTimer() {
      clearInterval(this.timerInterval);
      AppState.timerActive = false;
      AppState.timerSecondsLeft = 0;
      if (this.timerTrack) this.timerTrack.style.strokeDashoffset = 520;
      if (this.island?.getAttribute('data-state') === 'timer') {
        this.island.setAttribute('data-state', 'idle');
      }
    }
  };

  // =====================================================
  // 4. Navigation Router
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
  // 5. Toast Notification System
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

    show(message, type = 'info', duration = 3000) {
      if (!this.container) this.init();

      const toast = document.createElement('div');
      toast.style.padding = '10px 16px';
      toast.style.borderRadius = '10px';
      toast.style.border = `1px solid rgba(255, 255, 255, 0.08)`;
      toast.style.background = '#181b22';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.6)';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '8px';
      toast.style.fontSize = '0.8rem';
      toast.style.fontWeight = '700';
      toast.style.color = '#f8fafc';
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.25s ease';

      toast.innerHTML = `
        <span style="color: #8b5cf6; font-size: 1.2rem; line-height:1;">•</span>
        <span>${message}</span>
      `;

      this.container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
      });

      window.setTimeout(() => {
        toast.style.opacity = '0';
        window.setTimeout(() => toast.remove(), 250);
      }, duration);
    }
  };

  // =====================================================
  // 6. Property Cards Engine
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

      // آپلود چندین فایل عکس
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

      // باز شدن مودال برای ثبت جدید
      const addModal = document.getElementById('addPropertyModal');
      const btnOpenAdd = document.getElementById('btnOpenAddPropertyModal');
      const btnCloseAdd = document.getElementById('btnCloseAddPropertyModal');
      const formNewProp = document.getElementById('formNewProperty');

      if (btnOpenAdd && addModal && !btnOpenAdd.dataset.bound) {
        btnOpenAdd.dataset.bound = "true";
        btnOpenAdd.addEventListener('click', () => {
          this.resetForm();
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

      // ثبت و ذخیره اطلاعات در Dexie
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
              ToastManager.show('فایل ملک جدید ذخیره گردید.', 'success');
            }
          }

          this.resetForm();
          if (addModal) addModal.style.display = 'none';
          loadPropertiesData();
        });
      }
    },

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
        container.innerHTML = `<span style="font-size: 0.74rem; color: #828a9c; margin: auto;">عکسی انتخاب نشده است.</span>`;
        return;
      }

      container.innerHTML = AppState.currentFormImages.map((src, i) => `
        <div style="position: relative; width: 68px; height: 55px; flex-shrink: 0; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15);">
          <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;">
          <button type="button" class="btn-remove-preview-img" data-idx="${i}" style="position: absolute; top: 2px; right: 2px; background: rgba(220,38,38,0.85); color: #fff; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer;">✕</button>
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

    renderCards(properties) {
      const container = document.getElementById('propertiesCardsContainer');
      if (!container) return;

      if (!properties || properties.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; background: var(--paper-card); border: 1px dashed var(--paper-border); border-radius: var(--radius-sm);">
            <p style="font-weight: 700; color: var(--ink-secondary); font-size: 0.85rem;">هیچ ملکی ثبت نشده است.</p>
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
          <div style="display: flex; flex-direction: column; padding: 0; overflow: hidden; background: var(--paper-card); border: 1px solid var(--paper-border); border-radius: var(--radius-md); box-shadow: 0 4px 18px var(--shadow-color); transition: transform 0.2s ease;">
            
            <div style="position: relative; width: 100%; height: 175px; background: #000; overflow: hidden;">
              <img id="cardImg-${item.id}" src="${activeImg}" 
                   alt="${item.title || 'ملک'}" 
                   style="width: 100%; height: 100%; object-fit: cover;">
              
              <span style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.75); color: #c4b5fd; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-family: monospace; font-weight: 800; border: 1px solid rgba(255,255,255,0.1);">
                ${item.code || item.id || 'PROP-#'}
              </span>

              ${imagesList.length > 1 ? `
                <div style="position: absolute; bottom: 8px; left: 8px; display: flex; gap: 4px; z-index: 2;">
                  <button class="btn-prev-card-img story-btn" data-id="${item.id}" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(0,0,0,0.7); color: #fff;">‹</button>
                  <span style="background: rgba(0,0,0,0.7); color: #fff; font-size: 0.62rem; padding: 2px 5px; border-radius: 4px;">${(currentIdx % imagesList.length) + 1}/${imagesList.length}</span>
                  <button class="btn-next-card-img story-btn" data-id="${item.id}" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(0,0,0,0.7); color: #fff;">›</button>
                </div>
              ` : ''}

              <div style="position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; z-index: 2;">
                <button class="btn-card-edit" data-idx="${idx}" title="ویرایش" style="background: rgba(0,0,0,0.75); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="btn-card-delete" data-idx="${idx}" title="حذف" style="background: rgba(0,0,0,0.75); color: #f87171; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

            <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; flex: 1;">
              
              <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 6px;">
                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 900; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${item.title || 'آپارتمان مسکونی'}
                </h4>
                <span style="font-size: 0.72rem; color: #828a9c; font-weight: 700; white-space: nowrap;">
                  ${item.area || '---'} متر
                </span>
              </div>

              <div style="font-size: 1rem; color: #34d399; font-weight: 900;">
                ${item.price || 'توافقی'}
              </div>

              <div style="background: rgba(255, 255, 255, 0.025); padding: 6px 8px; border-radius: 6px; border: 1px dashed rgba(255,255,255,0.08); font-size: 0.7rem; margin-top: 2px;">
                <div class="card-private-data" style="${blurStyle} transition: filter 0.2s, opacity 0.2s; color: var(--ink-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  <strong>مالک:</strong> ${item.ownerName || 'ثبت نشده'} (${item.ownerPhone || '---'})
                </div>
                <div class="card-private-data" style="${blurStyle} margin-top: 3px; transition: filter 0.2s, opacity 0.2s; color: var(--ink-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>${item.address || item.location || 'تهران'}</span>
                </div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 8px;">
                <button class="story-btn btn-trigger-share" data-index="${idx}" style="flex: 1; padding: 7px; font-size: 0.76rem; font-weight: 800; border-radius: 6px; background: rgba(139,92,246,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  <span>ارسال / پرزنت</span>
                </button>
              </div>

            </div>

          </div>
        `;
      }).join('');

      // اتصال رویدادهای کارت‌ها
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

      container.querySelectorAll('.btn-card-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx, 10);
          const prop = properties[idx];
          if (prop) {
            document.getElementById('propEditId').value = prop.id || '';
            document.getElementById('propTitle').value = prop.title || '';
            document.getElementById('propCode').value = prop.code || '';
            document.getElementById('propArea').value = prop.area || '';
            document.getElementById('propRooms').value = prop.rooms || '';
            document.getElementById('propPrice').value = prop.price || '';
            document.getElementById('propOwner').value = prop.ownerName !== 'محرمانه' ? (prop.ownerName || '') : '';
            document.getElementById('propPhone').value = prop.ownerPhone !== '---' ? (prop.ownerPhone || '') : '';
            document.getElementById('propAddress').value = prop.address || prop.location || '';
            document.getElementById('addPropertyModal').style.display = 'flex';
          }
        });
      });

      container.querySelectorAll('.btn-card-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx, 10);
          const prop = properties[idx];
          if (prop && confirm(`آیا از حذف ملک "${prop.title}" مطمئن هستید؟`)) {
            await window.PropertyService.delete(prop.id);
            ToastManager.show('ملک با موفقیت حذف شد.', 'warning');
            loadPropertiesData();
          }
        });
      });

      container.querySelectorAll('.btn-trigger-share').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index, 10);
          const property = properties[index];
          if (property) {
            AppState.currentSelectedProperty = property;
            const modal = document.getElementById('sharePropertyModal');
            document.getElementById('sharePreviewImg').src = (property.images && property.images[0]) || property.image || '';
            document.getElementById('sharePreviewTitle').textContent = property.title || 'ملک';
            document.getElementById('sharePreviewSpecs').textContent = `${property.area || '---'} متر • ${property.rooms || '---'} خواب`;
            document.getElementById('sharePreviewPrice').textContent = property.price || 'توافقی';
            document.getElementById('shareGeneratedText').value = `فایل املاک کوروش\nعنوان: ${property.title}\nمتراژ: ${property.area} متر\nقیمت: ${property.price}\nکد: ${property.code}`;
            modal.style.display = 'flex';
          }
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
      PropertyCardsEngine.renderCards(properties);

      const tbody = document.getElementById('dealsTableBody');
      if (tbody && properties && properties.length > 0) {
        tbody.innerHTML = '';
        properties.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td style="font-family: monospace; font-weight: 700;"><span class="ink-code">${item.code || 'KR-00'}</span></td>
            <td><strong>${item.buyer || 'دکتر آرشام فرهمند'}</strong></td>
            <td>${item.title || 'ملک'} (${item.location || 'تهران'})</td>
            <td>${item.price || 'توافقی'}</td>
            <td><span class="stamp-chip ${item.status === 'امضای نهایی شد' ? 'green' : 'violet'}">${item.status || 'فعال'}</span></td>
          `;
          tbody.appendChild(row);
        });
      }
    } catch (err) {
      console.error('خطا در دریافت املاک:', err);
    }
  }

  // =====================================================
  // 7. Bootstrap
  // =====================================================
  document.addEventListener('DOMContentLoaded', () => {
    ModernCalendarEngine.init();
    ModularTimeEngine.init();
    DedicatedTimerEngine.init();
    NavigationRouter.init();
    ToastManager.init();
    loadPropertiesData();

    document.getElementById('btnCloseShareModal')?.addEventListener('click', () => {
      document.getElementById('sharePropertyModal').style.display = 'none';
    });

    document.getElementById('btnCopyShareText')?.addEventListener('click', () => {
      const txt = document.getElementById('shareGeneratedText')?.value;
      if (txt) {
        navigator.clipboard.writeText(txt);
        ToastManager.show('متن پرزنت کپی شد.', 'success');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('sharePropertyModal')?.style.setProperty('display', 'none');
        document.getElementById('addPropertyModal')?.style.setProperty('display', 'none');
      }
    });
  });

  window.showToast = (msg, type) => ToastManager.show(msg, type);

})();