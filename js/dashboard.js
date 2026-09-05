// =====================================================
// KOROSH CRM — Dashboard Controller
// KOROSH BOZORG IRAN HAST
// =====================================================

(() => {
  'use strict';

  // =====================================================
  // Configuration
  // =====================================================
  const CONFIG = {
    storageKeys: {
      favorites: 'korosh_favorites',
      locationScope: 'korosh_location_scope',
      chartPeriod: 'korosh_chart_period'
    },
    animation: {
      duration: 1200,
      steps: 60
    }
  };

  // Safe localStorage accessor
  const LocalStorage = {
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
      } catch {
        // Handled silently for sandbox / private mode
      }
    }
  };

  // =====================================================
  // Mock Dashboard Data (Django REST API Structure)
  // =====================================================
  const DashboardData = {
    overview: {
      'all': {
        properties: 1482,
        propertiesChange: '+۸.۴٪',
        propertiesNote: '۴۲ فایل جدید در ۲۴ ساعت گذشته',
        customers: 842,
        customersChange: '+۱۲.۱٪',
        customersNote: '۱۹ متقاضی آماده جلسه قرارداد',
        contracts: 68,
        contractsChange: '+۴.۷٪',
        contractsNote: '۵ عقد قرارداد نهایی امروز',
        revenueValue: 284000000000,
        revenueFormatted: '۲۸۴ میلیارد',
        revenueChange: '+۲۲.۰٪',
        revenueNote: 'کمیسیون ناخالص برآورد: ۲.۴ میلیارد تومان'
      },
      'tehran-shemiranat': {
        properties: 614,
        propertiesChange: '+۱۰.۲٪',
        propertiesNote: '۱۸ فایل لوکس جدید در نیاوران و فرمانیه',
        customers: 340,
        customersChange: '+۱۵.۴٪',
        customersNote: '۹ متقاضی آماده قرارداد پنت‌هاوس',
        contracts: 29,
        contractsChange: '+۶.۱٪',
        contractsNote: '۲ مبایعه‌نامه نهایی امروز در الهیه',
        revenueValue: 168000000000,
        revenueFormatted: '۱۶۸ میلیارد',
        revenueChange: '+۲۵.۴٪',
        revenueNote: 'کمیسیون برآورد: ۱.۵ میلیارد تومان'
      },
      'tehran-saadatabad': {
        properties: 520,
        propertiesChange: '+۷.۱٪',
        propertiesNote: '۱۴ فایل جدید در شهرک غرب فاز ۱',
        customers: 310,
        customersChange: '+۹.۳٪',
        customersNote: '۶ جلسه بازدید ویلا برای عصر امروز',
        contracts: 24,
        contractsChange: '+۳.۵٪',
        contractsNote: '۲ اجاره‌نامه مسکونی منعقد شد',
        revenueValue: 86000000000,
        revenueFormatted: '۸۶ میلیارد',
        revenueChange: '+۱۸.۲٪',
        revenueNote: 'کمیسیون برآورد: ۷۸۰ میلیون تومان'
      },
      'alborz-mehrshahr': {
        properties: 348,
        propertiesChange: '+۵.۶٪',
        propertiesNote: '۱۰ فایل باغ‌ویلا در چهارباندی',
        customers: 192,
        customersChange: '+۸.۰٪',
        customersNote: '۴ پرونده آماده تحویل اسناد',
        contracts: 15,
        contractsChange: '+۲.۸٪',
        contractsNote: '۱ قرارداد نهایی مشارکتی',
        revenueValue: 30000000000,
        revenueFormatted: '۳۰ میلیارد',
        revenueChange: '+۱۱.۵٪',
        revenueNote: 'کمیسیون برآورد: ۲۶۰ میلیون تومان'
      }
    },
    analytics: {
      month: {
        points: [
          { x: 0, y: 150 },
          { x: 120, y: 40 },
          { x: 240, y: 90 },
          { x: 360, y: 120 },
          { x: 480, y: 50 },
          { x: 600, y: 100 },
          { x: 700, y: 80 }
        ],
        pathD: 'M 0 150 Q 120 40, 240 90 T 480 50 T 700 80',
        areaD: 'M 0 200 L 0 150 Q 120 40, 240 90 T 480 50 T 700 80 L 700 240 L 0 240 Z',
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور']
      },
      quarter: {
        points: [
          { x: 0, y: 170 },
          { x: 175, y: 110 },
          { x: 350, y: 80 },
          { x: 525, y: 40 },
          { x: 700, y: 60 }
        ],
        pathD: 'M 0 170 Q 175 110, 350 80 T 700 60',
        areaD: 'M 0 200 L 0 170 Q 175 110, 350 80 T 700 60 L 700 240 L 0 240 Z',
        labels: ['بهار ۱۴۰۴', 'تابستان ۱۴۰۴', 'پاییز ۱۴۰۴', 'زمستان ۱۴۰۴', 'بهار ۱۴۰۵', 'تابستان ۱۴۰۵']
      },
      year: {
        points: [
          { x: 0, y: 180 },
          { x: 230, y: 140 },
          { x: 460, y: 85 },
          { x: 700, y: 35 }
        ],
        pathD: 'M 0 180 Q 230 140, 460 85 T 700 35',
        areaD: 'M 0 200 L 0 180 Q 230 140, 460 85 T 700 35 L 700 240 L 0 240 Z',
        labels: ['۱۳۰۱', '۱۴۰۲', '۱۴۰۳', '۱۴۰۴', '۱۴۰۵']
      }
    }
  };

  // =====================================================
  // DOM References
  // =====================================================
  const DOM = {
    dashboardView: null,
    locationSelect: null,
    kpiCards: [],
    chartSvg: null,
    chartLine: null,
    chartArea: null,
    chartNodes: [],
    chartLabelsWrapper: null,
    chartPeriodTabs: [],
    aiFeed: null,
    propertyCards: [],
    customerTable: null,
    contractsTable: null,

    init() {
      this.dashboardView = document.getElementById('dashboardView');
      if (!this.dashboardView) return false;

      this.locationSelect = document.getElementById('locationScopeSelect');
      this.kpiCards = Array.from(this.dashboardView.querySelectorAll('.kpi-card'));
      this.chartSvg = this.dashboardView.querySelector('.mock-chart-svg');
      if (this.chartSvg) {
        this.chartLine = this.chartSvg.querySelector('.chart-line');
        this.chartArea = this.chartSvg.querySelector('.chart-area');
        this.chartNodes = Array.from(this.chartSvg.querySelectorAll('.chart-data-node'));
      }
      this.chartLabelsWrapper = this.dashboardView.querySelector('.chart-labels-x');
      this.chartPeriodTabs = Array.from(this.dashboardView.querySelectorAll('.chart-action-tabs .tab-pill'));
      this.aiFeed = document.getElementById('aiDashboardFeed');
      this.propertyCards = Array.from(this.dashboardView.querySelectorAll('.property-card'));
      this.customerTable = document.getElementById('customersSummaryTable');
      this.contractsTable = document.getElementById('contractsSummaryTable');

      return true;
    }
  };

  // =====================================================
  // Utility Functions
  // =====================================================
  const toPersianDigits = (num) => {
    if (num === null || num === undefined) return '';
    return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  };

  const prefersReducedMotion = () => {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // Format currency value based on global currency state if available
  const formatAmount = (value, unit = 'تومان') => {
    if (window.KoroshComponents?.formatNumber) {
      return `${window.KoroshComponents.formatNumber(value)} ${unit}`;
    }
    return `${toPersianDigits(value.toLocaleString('fa-IR'))} ${unit}`;
  };

  // =====================================================
  // Number Animation
  // =====================================================
  const animateNumber = (element, targetValue, duration = CONFIG.animation.duration) => {
    if (!element) return;

    if (prefersReducedMotion() || isNaN(targetValue)) {
      element.textContent = window.KoroshComponents?.formatNumber
        ? window.KoroshComponents.formatNumber(targetValue)
        : toPersianDigits(targetValue);
      return;
    }

    const startValue = 0;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (targetValue - startValue) * easedProgress);

      element.textContent = window.KoroshComponents?.formatNumber
        ? window.KoroshComponents.formatNumber(current)
        : toPersianDigits(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = window.KoroshComponents?.formatNumber
          ? window.KoroshComponents.formatNumber(targetValue)
          : toPersianDigits(targetValue);
      }
    };

    requestAnimationFrame(update);
  };

  // =====================================================
  // KPI System
  // =====================================================
  const KPISystem = {
    init() {
      this.bindCardsHover();
      this.renderScopeData(LocalStorage.get(CONFIG.storageKeys.locationScope, 'all'), false);
    },

    bindCardsHover() {
      DOM.kpiCards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
          card.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s';
        });
      });
    },

    renderScopeData(scopeKey, animate = true) {
      const data = DashboardData.overview[scopeKey] || DashboardData.overview['all'];

      DOM.kpiCards.forEach((card) => {
        const metric = card.dataset.metric;
        const valElem = card.querySelector('.kpi-value');
        const trendElem = card.querySelector('.kpi-trend');
        const footerElem = card.querySelector('.kpi-footer span');

        if (!metric || !valElem) return;

        switch (metric) {
          case 'properties':
            if (animate) animateNumber(valElem, data.properties);
            else valElem.textContent = toPersianDigits(data.properties);
            if (trendElem) trendElem.textContent = data.propertiesChange;
            if (footerElem) footerElem.textContent = data.propertiesNote;
            break;

          case 'customers':
            if (animate) animateNumber(valElem, data.customers);
            else valElem.textContent = toPersianDigits(data.customers);
            if (trendElem) trendElem.textContent = data.customersChange;
            if (footerElem) footerElem.textContent = data.customersNote;
            break;

          case 'contracts':
            if (animate) animateNumber(valElem, data.contracts);
            else valElem.textContent = toPersianDigits(data.contracts);
            if (trendElem) trendElem.textContent = data.contractsChange;
            if (footerElem) footerElem.textContent = data.contractsNote;
            break;

          case 'revenue':
            valElem.textContent = data.revenueFormatted;
            if (trendElem) trendElem.textContent = data.revenueChange;
            if (footerElem) footerElem.textContent = data.revenueNote;
            break;
        }
      });
    }
  };

  // =====================================================
  // Property Interactions & Favorites State Sync
  // =====================================================
  const PropertyInteractions = {
    init() {
      this.syncSavedFavorites();
      this.bindCardInteractions();
    },

    getFavorites() {
      return LocalStorage.get(CONFIG.storageKeys.favorites, []);
    },

    saveFavorites(favoritesList) {
      LocalStorage.set(CONFIG.storageKeys.favorites, favoritesList);
    },

    syncSavedFavorites() {
      const favorites = this.getFavorites();
      DOM.propertyCards.forEach((card) => {
        const id = card.dataset.propertyId;
        const favBtn = card.querySelector('.property-favorite-btn');
        if (!id || !favBtn) return;

        const isFav = favorites.includes(id);
        favBtn.classList.toggle('active', isFav);
        const icon = favBtn.querySelector('.fav-icon');
        if (icon) {
          icon.textContent = isFav ? '♥' : '♡';
        }
      });
    },

    bindCardInteractions() {
      DOM.propertyCards.forEach((card) => {
        // Favorite Button persistence handler
        const favBtn = card.querySelector('.property-favorite-btn');
        if (favBtn) {
          favBtn.addEventListener('click', (e) => {
            const propertyId = card.dataset.propertyId;
            if (!propertyId) return;

            let favs = this.getFavorites();
            if (favs.includes(propertyId)) {
              favs = favs.filter((item) => item !== propertyId);
              if (window.showToast) window.showToast(`ملک ${propertyId} از علاقه‌مندی‌ها حذف شد`, 'info');
            } else {
              favs.push(propertyId);
              if (window.showToast) window.showToast(`ملک ${propertyId} به علاقه‌مندی‌ها افزوده شد`, 'success');
            }
            this.saveFavorites(favs);
          });
        }

        // 3D subtle tilt on desktop when supported
        if (!prefersReducedMotion() && window.innerWidth > 992) {
          card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -3;
            const rotateY = ((x - centerX) / centerX) * 3;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
          });

          card.addEventListener('mouseleave', () => {
            card.style.transform = '';
          });
        }
      });
    }
  };

  // =====================================================
  // Analytics & Chart Visualization
  // =====================================================
  const AnalyticsSystem = {
    currentPeriod: 'month',

    init() {
      const savedPeriod = LocalStorage.get(CONFIG.storageKeys.chartPeriod, 'month');
      this.currentPeriod = savedPeriod;
      this.bindPeriodTabs();
      this.renderChart(this.currentPeriod);
    },

    bindPeriodTabs() {
      DOM.chartPeriodTabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const period = tab.dataset.chartPeriod;
          if (!period || period === this.currentPeriod) return;

          DOM.chartPeriodTabs.forEach((t) => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });

          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');

          this.currentPeriod = period;
          LocalStorage.set(CONFIG.storageKeys.chartPeriod, period);
          this.renderChart(period);
        });
      });
    },

    renderChart(periodKey) {
      const data = DashboardData.analytics[periodKey];
      if (!data || !DOM.chartSvg) return;

      if (DOM.chartLine) DOM.chartLine.setAttribute('d', data.pathD);
      if (DOM.chartArea) DOM.chartArea.setAttribute('d', data.areaD);

      // Re-position or create data nodes safely
      if (DOM.chartNodes.length > 0 && data.points) {
        DOM.chartNodes.forEach((node, index) => {
          const point = data.points[index];
          if (point) {
            node.setAttribute('cx', point.x);
            node.setAttribute('cy', point.y);
            node.style.display = '';
          } else {
            node.style.display = 'none';
          }
        });
      }

      // Update Horizontal Axis Labels using safe DOM creation
      if (DOM.chartLabelsWrapper && data.labels) {
        while (DOM.chartLabelsWrapper.firstChild) {
          DOM.chartLabelsWrapper.removeChild(DOM.chartLabelsWrapper.firstChild);
        }
        data.labels.forEach((label) => {
          const span = document.createElement('span');
          span.textContent = label;
          DOM.chartLabelsWrapper.appendChild(span);
        });
      }
    }
  };

  // =====================================================
  // Filters & Location Scope
  // =====================================================
  const FilterSystem = {
    init() {
      if (!DOM.locationSelect) return;

      const savedScope = LocalStorage.get(CONFIG.storageKeys.locationScope, 'all');
      DOM.locationSelect.value = savedScope;

      DOM.locationSelect.addEventListener('change', (e) => {
        const scope = e.target.value;
        LocalStorage.set(CONFIG.storageKeys.locationScope, scope);
        KPISystem.renderScopeData(scope, true);

        const scopeLabel = e.target.selectedOptions[0]?.text || scope;
        if (window.showToast) {
          window.showToast(`حوزه آماری به «${scopeLabel}» تغییر کرد`, 'info');
        }
      });
    }
  };

  // =====================================================
  // AI Mock Interactions
  // =====================================================
  const AIMockInteractions = {
    init() {
      if (!DOM.aiFeed) return;

      DOM.aiFeed.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('button');
        if (!actionBtn) return;

        const matchItem = actionBtn.closest('.ai-match-item');
        const descElem = matchItem?.querySelector('.match-desc');
        const descText = descElem ? descElem.textContent.trim() : 'پیشنهاد هوش مصنوعی';

        if (window.KoroshComponents?.setButtonLoading) {
          window.KoroshComponents.setButtonLoading(actionBtn, true);
        } else {
          actionBtn.disabled = true;
        }

        setTimeout(() => {
          if (window.KoroshComponents?.setButtonLoading) {
            window.KoroshComponents.setButtonLoading(actionBtn, false);
          } else {
            actionBtn.disabled = false;
          }

          if (window.showToast) {
            window.showToast('درخواست توسط دستیار هوشمند کوروش پردازش شد', 'success');
          }

          if (window.KoroshApp?.ModalManager) {
            window.KoroshApp.ModalManager.open('اقدام هوشمند KOROSH AI', `
              <div style="font-size: 0.88rem; line-height: 1.7; color: var(--text-secondary);">
                <p><strong>جزییات پردازش شده:</strong></p>
                <p style="margin: 8px 0;">${descText}</p>
                <div style="background: var(--surface-sunken); padding: 10px; border-radius: 8px; border: 1px solid var(--surface-border); margin-top: 10px;">
                  پیام خودکار و پیش‌نویس توافق‌نامه با موفقیت برای مشتری ارسال گردید.
                </div>
              </div>
            `, `
              <button class="btn btn-primary btn-sm" onclick="window.KoroshApp.ModalManager.close();">متوجه شدم</button>
            `);
          }
        }, 800);
      });
    }
  };

  // =====================================================
  // Quick Actions & Table Buttons
  // =====================================================
  const QuickActions = {
    init() {
      // Contract PDF downloads
      const contractsTable = DOM.contractsTable;
      if (contractsTable) {
        contractsTable.addEventListener('click', (e) => {
          const downloadBtn = e.target.closest('[data-action="download-pdf"]');
          if (!downloadBtn) return;

          const row = downloadBtn.closest('tr');
          const contractId = row?.dataset.contractId || '#CTR';

          if (window.showToast) {
            window.showToast(`دریافت نسخه چاپی قرارداد ${contractId} آغاز شد`, 'info');
          }
        });
      }

      // Customer Filter action
      const filterCustBtn = document.getElementById('btnFilterCustomers');
      if (filterCustBtn) {
        filterCustBtn.addEventListener('click', () => {
          if (window.KoroshApp?.ModalManager) {
            window.KoroshApp.ModalManager.open('فیلتر پیشرفته متقاضیان', `
              <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.88rem;">
                <label>نوع معامله:
                  <select class="form-select-glass" style="width:100%; margin-top:4px;">
                    <option>همه متقاضیان</option>
                    <option>خرید مسکونی</option>
                    <option>رهن و اجاره</option>
                    <option>مشارکت در ساخت</option>
                  </select>
                </label>
                <label>وضعیت پرونده:
                  <select class="form-select-glass" style="width:100%; margin-top:4px;">
                    <option>آماده معامله</option>
                    <option>در حال پیگیری</option>
                    <option>جدید</option>
                  </select>
                </label>
              </div>
            `, `
              <button class="btn btn-outline btn-sm" onclick="window.KoroshApp.ModalManager.close();">انصراف</button>
              <button class="btn btn-primary btn-sm" onclick="window.KoroshApp.ModalManager.close(); window.showToast('فیلترها با موفقیت اعمال شدند', 'success');">اعمال فیلتر</button>
            `);
          }
        });
      }
    }
  };

  // =====================================================
  // Refresh System
  // =====================================================
  const RefreshSystem = {
    isRefreshing: false,

    async refresh() {
      if (this.isRefreshing) return;
      this.isRefreshing = true;

      if (window.showLoading) window.showLoading();

      try {
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Re-read current location scope and refresh KPIs
        const currentScope = LocalStorage.get(CONFIG.storageKeys.locationScope, 'all');
        KPISystem.renderScopeData(currentScope, true);

        // Re-sync favorites
        PropertyInteractions.syncSavedFavorites();

        // Refresh Chart
        const currentPeriod = LocalStorage.get(CONFIG.storageKeys.chartPeriod, 'month');
        AnalyticsSystem.renderChart(currentPeriod);

        if (window.showToast) {
          window.showToast('داده‌های داشبورد با موفقیت به‌روزرسانی شدند', 'success');
        }
      } finally {
        if (window.hideLoading) window.hideLoading();
        this.isRefreshing = false;
      }
    }
  };

  // =====================================================
  // Initialization
  // =====================================================
  const initDashboard = () => {
    if (!DOM.init()) return;

    KPISystem.init();
    PropertyInteractions.init();
    AnalyticsSystem.init();
    FilterSystem.init();
    AIMockInteractions.init();
    QuickActions.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }

  // =====================================================
  // Public API
  // =====================================================
  window.KoroshDashboard = {
    refresh: () => RefreshSystem.refresh(),
    getData: () => ({ ...DashboardData })
  };

})();