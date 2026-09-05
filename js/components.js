// =====================================================
// KOROSH CRM — Reusable UI Components
// KOROSH BOZORG IRAN HAST
// =====================================================

(() => {
  'use strict';

  // =====================================================
  // DOM Utilities
  // =====================================================
  const DOM = {
    $(selector, context = document) {
      return context?.querySelector(selector) ?? null;
    },

    $$(selector, context = document) {
      return Array.from(context?.querySelectorAll(selector) ?? []);
    },

    createElement(tag, { className = '', attributes = {}, text = '', html = '' } = {}) {
      const el = document.createElement(tag);
      if (className) el.className = className;
      Object.entries(attributes).forEach(([key, val]) => {
        if (val !== null && val !== undefined) el.setAttribute(key, String(val));
      });
      if (text) el.textContent = text;
      if (html) el.innerHTML = html;
      return el;
    },

    setText(element, text = '') {
      if (element) element.textContent = text;
    },

    toggleClass(element, className, force) {
      if (!element || !className) return;
      element.classList.toggle(className, force);
    },

    show(element, displayValue = '') {
      if (!element) return;
      element.hidden = false;
      element.removeAttribute('aria-hidden');
      if (displayValue) element.style.display = displayValue;
    },

    hide(element) {
      if (!element) return;
      element.hidden = true;
      element.setAttribute('aria-hidden', 'true');
    }
  };

  // =====================================================
  // Dropdowns (Generic Component System)
  // =====================================================
  const DropdownManager = {
    init() {
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-dropdown-toggle]');
        if (trigger) {
          e.preventDefault();
          e.stopPropagation();
          const targetSelector = trigger.dataset.dropdownToggle;
          const targetMenu = DOM.$(targetSelector) || trigger.nextElementSibling;
          if (targetMenu) this.toggle(targetMenu, trigger);
          return;
        }

        // Close on outside click
        const activeDropdown = DOM.$('.popover-dropdown:not([hidden]):not(#notificationPanel):not(.profile-dropdown-menu)');
        if (activeDropdown && !activeDropdown.contains(e.target)) {
          this.close(activeDropdown);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.code === 'Escape') {
          const activeDropdown = DOM.$('.popover-dropdown:not([hidden]):not(#notificationPanel):not(.profile-dropdown-menu)');
          if (activeDropdown) this.close(activeDropdown);
        }
      });
    },

    toggle(menu, trigger) {
      menu.hidden ? this.open(menu, trigger) : this.close(menu, trigger);
    },

    open(menu, trigger) {
      if (!menu) return;
      DOM.show(menu);
      trigger?.setAttribute('aria-expanded', 'true');
    },

    close(menu, trigger) {
      if (!menu) return;
      DOM.hide(menu);
      trigger?.setAttribute('aria-expanded', 'false');
    }
  };

  // =====================================================
  // Tabs Component
  // =====================================================
  const TabManager = {
    init() {
      document.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('[role="tab"], .tab-pill, [data-tab]');
        if (!tabBtn) return;

        const tabList = tabBtn.closest('[role="tablist"], .chart-action-tabs');
        if (!tabList) return;

        e.preventDefault();
        const tabs = DOM.$$('[role="tab"], .tab-pill, [data-tab]', tabList);
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });

        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');

        const targetPaneSelector = tabBtn.dataset.tabTarget || tabBtn.getAttribute('aria-controls');
        if (targetPaneSelector) {
          const targetPane = DOM.$(targetPaneSelector);
          if (targetPane) {
            const parentContainer = targetPane.parentElement;
            DOM.$$('[role="tabpanel"], .tab-pane', parentContainer).forEach(pane => {
              DOM.hide(pane);
            });
            DOM.show(targetPane);
          }
        }
      });
    }
  };

  // =====================================================
  // Accordions Component
  // =====================================================
  const AccordionManager = {
    init() {
      document.addEventListener('click', (e) => {
        const header = e.target.closest('[data-accordion-trigger]');
        if (!header) return;

        e.preventDefault();
        const content = header.nextElementSibling || DOM.$(header.dataset.accordionTrigger);
        if (!content) return;

        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', String(!isExpanded));
        content.classList.toggle('collapsed', isExpanded);
        content.hidden = isExpanded;
      });
    }
  };

  // =====================================================
  // Tooltips (Lightweight Native Popover)
  // =====================================================
  const TooltipManager = {
    activeTooltip: null,

    init() {
      document.addEventListener('mouseenter', (e) => {
        const target = e.target.closest?.('[data-tooltip]');
        if (!target) return;
        this.show(target);
      }, true);

      document.addEventListener('mouseleave', (e) => {
        const target = e.target.closest?.('[data-tooltip]');
        if (!target) return;
        this.hide();
      }, true);
    },

    show(element) {
      this.hide();
      const text = element.getAttribute('data-tooltip');
      if (!text) return;

      const tooltip = DOM.createElement('div', {
        className: 'korosh-tooltip',
        text
      });

      Object.assign(tooltip.style, {
        position: 'fixed',
        zIndex: '1300',
        padding: '5px 10px',
        fontSize: '0.74rem',
        fontWeight: '500',
        color: 'var(--text, #fff)',
        background: 'var(--surface-elevated, #1c2330)',
        border: '1px solid var(--surface-border, rgba(255,255,255,0.1))',
        borderRadius: 'var(--radius-xs, 6px)',
        boxShadow: 'var(--shadow-md, 0 8px 16px rgba(0,0,0,0.3))',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.15s ease'
      });

      document.body.appendChild(tooltip);
      this.activeTooltip = tooltip;

      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let top = rect.top - tooltipRect.height - 8;
      let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

      if (top < 10) top = rect.bottom + 8;
      if (left < 10) left = 10;
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
      requestAnimationFrame(() => {
        if (this.activeTooltip) this.activeTooltip.style.opacity = '1';
      });
    },

    hide() {
      if (this.activeTooltip) {
        this.activeTooltip.remove();
        this.activeTooltip = null;
      }
    }
  };

  // =====================================================
  // Clipboard
  // =====================================================
  const Clipboard = {
    async copy(text) {
      if (!text) return false;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          textArea.remove();
        }
        window.showToast?.('متن با موفقیت کپی شد', 'success');
        return true;
      } catch {
        window.showToast?.('خطا در کپی متن', 'error');
        return false;
      }
    }
  };

  // =====================================================
  // Confirmation System (Modal-Driven)
  // =====================================================
  const Confirmation = {
    confirm(message, onConfirm, onCancel) {
      if (window.KoroshApp?.ModalManager) {
        window.KoroshApp.ModalManager.open('تایید اقدام', `
          <div style="padding: 8px 0; font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary);">
            ${message}
          </div>
        `, `
          <button class="btn btn-outline btn-sm" id="koroshConfirmCancel">انصراف</button>
          <button class="btn btn-primary btn-sm" id="koroshConfirmOk">تایید و ادامه</button>
        `);

        const okBtn = DOM.$('#koroshConfirmOk');
        const cancelBtn = DOM.$('#koroshConfirmCancel');

        okBtn?.addEventListener('click', () => {
          window.KoroshApp.ModalManager.close();
          if (typeof onConfirm === 'function') onConfirm();
        }, { once: true });

        cancelBtn?.addEventListener('click', () => {
          window.KoroshApp.ModalManager.close();
          if (typeof onCancel === 'function') onCancel();
        }, { once: true });
      } else {
        // Direct safe fallback if modal is unavailable
        if (window.confirm(message)) {
          if (typeof onConfirm === 'function') onConfirm();
        } else {
          if (typeof onCancel === 'function') onCancel();
        }
      }
    }
  };

  // =====================================================
  // Formatters (Persian & Multi-Currency)
  // =====================================================
  const Formatters = {
    formatNumber(value) {
      const num = Number(value);
      if (isNaN(num)) return '۰';
      try {
        return new Intl.NumberFormat('fa-IR').format(num);
      } catch {
        return String(value);
      }
    },

    formatCurrency(value, currency = 'IRT') {
      const num = Number(value);
      if (isNaN(num)) return '۰';

      const units = {
        IRT: 'تومان',
        IRR: 'ریال',
        USD: '$ دلار',
        EUR: '€ یورو',
        AED: 'درهم'
      };

      try {
        const formatted = new Intl.NumberFormat('fa-IR').format(num);
        return `${formatted} ${units[currency] || currency}`;
      } catch {
        return `${num} ${currency}`;
      }
    }
  };

  // =====================================================
  // Status Badges
  // =====================================================
  const StatusBadges = {
    getStatusMeta(status) {
      const map = {
        'فعال': { className: 'chip-ready', label: 'فعال' },
        'آماده معامله': { className: 'chip-ready', label: 'آماده معامله' },
        'در حال پیگیری': { className: 'chip-following', label: 'در حال پیگیری' },
        'در انتظار': { className: 'chip-pending', label: 'در انتظار استعلام' },
        'تکمیل شده': { className: 'chip-completed', label: 'تکمیل شده' },
        'معامله انجام شد': { className: 'chip-completed', label: 'معامله انجام شد' },
        'جدید': { className: 'chip-new', label: 'جدید' },
        'غیرفعال': { className: 'chip-pending', label: 'غیرفعال' },
        'لغو شده': { className: 'chip-pending', label: 'لغو شده' },
        'فروخته شد': { className: 'chip-completed', label: 'فروخته شد' },
        'اجاره داده شد': { className: 'chip-completed', label: 'اجاره داده شد' }
      };
      return map[status] || { className: 'chip-following', label: status };
    },

    renderChip(status) {
      const meta = this.getStatusMeta(status);
      return `<span class="status-chip ${meta.className}">${meta.label}</span>`;
    }
  };

  // =====================================================
  // Property Cards Helper
  // =====================================================
  const PropertyCards = {
    init() {
      // Delegate property card actions (Details inspection)
      document.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-property-btn');
        if (!viewBtn) return;

        const propertyId = viewBtn.dataset.targetId;
        const card = viewBtn.closest('.property-card');
        const title = DOM.$('.property-title', card)?.textContent?.trim() || propertyId;

        if (window.KoroshApp?.ModalManager) {
          window.KoroshApp.ModalManager.open(`پرونده ملک ${propertyId}`, `
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <h4 style="font-size: 1rem; color: var(--text);">${title}</h4>
              <p style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.6;">
                این پرونده با سند رسمی در سامانه کوروش بررسی و تایید شده است. جهت ارجاع به مشاور مسئول یا تهیه فایل چاپی از گزینه‌های ذیل استفاده نمایید.
              </p>
            </div>
          `, `
            <button class="btn btn-outline btn-sm" onclick="KoroshComponents.copyToClipboard('${propertyId}')">کپی کد ملک</button>
            <button class="btn btn-primary btn-sm" onclick="window.KoroshApp.ModalManager.close(); window.showToast('درخواست ارجاع ثبت شد', 'success');">ثبت درخواست بازدید</button>
          `);
        }
      });
    }
  };

  // =====================================================
  // Table Interactions
  // =====================================================
  const TableManager = {
    init() {
      document.addEventListener('change', (e) => {
        const selectAll = e.target.closest('[data-select-all-table]');
        if (!selectAll) return;

        const table = selectAll.closest('table');
        if (!table) return;

        const checkboxes = DOM.$$('tbody input[type="checkbox"]', table);
        checkboxes.forEach(cb => {
          cb.checked = selectAll.checked;
          const tr = cb.closest('tr');
          if (tr) tr.classList.toggle('row-selected', selectAll.checked);
        });
      });

      document.addEventListener('change', (e) => {
        const rowCheckbox = e.target.closest('tbody input[type="checkbox"]');
        if (!rowCheckbox) return;

        const tr = rowCheckbox.closest('tr');
        if (tr) tr.classList.toggle('row-selected', rowCheckbox.checked);
      });
    }
  };

  // =====================================================
  // Form Helpers
  // =====================================================
  const FormHelpers = {
    getFormData(form) {
      if (!form) return {};
      const formData = new FormData(form);
      const data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      return data;
    },

    resetForm(form) {
      if (form && typeof form.reset === 'function') {
        form.reset();
      }
    },

    validate(form) {
      if (!form) return true;
      const requiredInputs = DOM.$$('input[required], select[required], textarea[required]', form);
      let isValid = true;

      requiredInputs.forEach(input => {
        const isEmpty = !input.value || !input.value.trim();
        if (isEmpty) {
          isValid = false;
          input.style.borderColor = 'var(--danger, #f43f5e)';
        } else {
          input.style.borderColor = 'var(--surface-border, rgba(255,255,255,0.1))';
        }
      });

      if (!isValid) {
        window.showToast?.('لطفاً فیلدهای الزامی را تکمیل کنید', 'error');
      }

      return isValid;
    }
  };

  // =====================================================
  // Empty State Render Helper
  // =====================================================
  const EmptyState = {
    render(container, { icon = '📂', title = 'موردی یافت نشد', text = 'هیچ اطلاعاتی برای نمایش در این بخش وجود ندارد.' } = {}) {
      if (!container) return;
      container.innerHTML = `
        <div class="empty-state-card">
          <span class="empty-icon">${icon}</span>
          <h3>${title}</h3>
          <p>${text}</p>
        </div>
      `;
    }
  };

  // =====================================================
  // Loading States for Buttons
  // =====================================================
  const ButtonLoading = {
    setLoading(button, isLoading = true) {
      if (!button) return;

      if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = `
          <span class="btn-spinner" style="display:inline-block; width:14px; height:14px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; vertical-align:middle; margin-left:6px;"></span>
          <span>در حال پردازش...</span>
        `;
      } else {
        if (button.dataset.originalText) {
          button.innerHTML = button.dataset.originalText;
          delete button.dataset.originalText;
        }
        button.disabled = false;
        button.classList.remove('loading');
      }
    }
  };

  // =====================================================
  // Initialization
  // =====================================================
  document.addEventListener('DOMContentLoaded', () => {
    DropdownManager.init();
    TabManager.init();
    AccordionManager.init();
    TooltipManager.init();
    PropertyCards.init();
    TableManager.init();
  });

  // =====================================================
  // Public API
  // =====================================================
  window.KoroshComponents = {
    createElement: DOM.createElement,
    formatNumber: Formatters.formatNumber,
    formatCurrency: Formatters.formatCurrency,
    copyToClipboard: Clipboard.copy,
    confirmAction: Confirmation.confirm,
    setButtonLoading: ButtonLoading.setLoading,
    validateForm: FormHelpers.validate,
    getFormData: FormHelpers.getFormData,
    resetForm: FormHelpers.resetForm,
    renderStatusChip: StatusBadges.renderChip.bind(StatusBadges),
    renderEmptyState: EmptyState.render
  };

})();