

document.addEventListener('DOMContentLoaded', function() {
    
    initTooltips();
    
    
    initPopovers();
    
    
    initScrollAnimations();
    
    
    initAlertDismiss();
    
    
    initDeleteConfirmations();
    
    
    initPaymentInputFormatting();
    
    
    initCountdowns();
    
    
    initEventFilters();
    
    
    fixModalTwitching();
    
    
    initDateInputsLanguage();
    
    
    const toggleSwitch = document.querySelector('#checkbox');
    
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        
        if (toggleSwitch) {
            toggleSwitch.checked = (theme === 'dark');
        }
        
        
        const themeChangeEvent = new CustomEvent('themechange', { 
            detail: { theme: theme } 
        });
        document.dispatchEvent(themeChangeEvent);
    }
    
    
    function switchTheme(e) {
        if (e.target.checked) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }
    
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    
    setTheme(currentTheme);
    
    
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', switchTheme);
    }

    
    if (!localStorage.getItem('theme')) {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            setTheme('dark');
        }
    }
});


function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}


function initPopovers() {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}


function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    if (animatedElements.length === 0) return;
    
    
    const isElementInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8
        );
    };
    
    
    const handleScroll = () => {
        animatedElements.forEach(element => {
            if (isElementInViewport(element)) {
                element.classList.add('visible');
            }
        });
    };
    
    
    handleScroll();
    
    
    window.addEventListener('scroll', handleScroll);
}


function initAlertDismiss() {
    const alertList = document.querySelectorAll('.alert:not(.alert-persistent)');
    alertList.forEach(function(alert) {
        const bsAlert = new bootstrap.Alert(alert);
        setTimeout(function() {
            bsAlert.close();
        }, 5000);
    });
}


function initDeleteConfirmations() {
    const confirmDeleteBtns = document.querySelectorAll('.confirm-delete');
    confirmDeleteBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm-message') || 'Вы уверены, что хотите выполнить это действие?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
}


function initPaymentInputFormatting() {
    
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            
            let value = this.value.replace(/\D/g, '');
            
            
            if (value.length > 16) {
                value = value.slice(0, 16);
            }
            
            
            if (value.length > 0) {
                value = value.match(/.{1,4}/g).join(' ');
            }
            
            
            this.value = value;
        });
    }
    
    
    const expiryDateInput = document.getElementById('expiryDate');
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function(e) {
            
            let value = this.value.replace(/\D/g, '');
            
            
            if (value.length > 4) {
                value = value.slice(0, 4);
            }
            
            
            if (value.length > 2) {
                value = value.slice(0, 2) + '/' + value.slice(2);
            }
            
            
            this.value = value;
        });
    }
    
    
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            
            let value = this.value.replace(/\D/g, '');
            
            
            if (value.length > 3) {
                value = value.slice(0, 3);
            }
            
            
            this.value = value;
        });
    }
}


function initCountdowns() {
    const countdownElements = document.querySelectorAll('[data-countdown]');
    
    countdownElements.forEach(element => {
        const targetDate = new Date(element.getAttribute('data-countdown')).getTime();
        
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;
            
            if (distance < 0) {
                element.innerHTML = element.getAttribute('data-countdown-expired') || 'Время истекло';
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            let countdownText = '';
            
            if (days > 0) {
                countdownText += `${days}д `;
            }
            
            countdownText += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            element.textContent = countdownText;
        };
        
        
        updateCountdown();
        setInterval(updateCountdown, 1000);
    });
}


function initEventFilters() {
    const filterForm = document.querySelector('.event-filter-form');
    if (!filterForm) return;
    
    
    const autoSubmitInputs = filterForm.querySelectorAll('.auto-submit');
    autoSubmitInputs.forEach(input => {
        input.addEventListener('change', () => {
            filterForm.submit();
        });
    });
    
    
    const resetButton = filterForm.querySelector('.reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            
            const inputs = filterForm.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
            
            
            filterForm.submit();
        });
    }
}


function showMessage(title, message, type = 'info') {
    
    let modalEl = document.getElementById('messageModal');
    
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.className = 'modal fade';
        modalEl.id = 'messageModal';
        modalEl.setAttribute('tabindex', '-1');
        modalEl.setAttribute('aria-hidden', 'true');
        
        modalEl.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalEl);
    }
    
    
    const titleEl = modalEl.querySelector('.modal-title');
    const bodyEl = modalEl.querySelector('.modal-body');
    const headerEl = modalEl.querySelector('.modal-header');
    
    titleEl.textContent = title;
    bodyEl.innerHTML = message;
    
    
    headerEl.className = 'modal-header';
    headerEl.classList.add(`bg-${type}`);
    
    if (type === 'success' || type === 'danger') {
        headerEl.classList.add('text-white');
    }
    
    
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}


function formatPrice(price, currency = 'PLN') {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: currency
    }).format(price);
}


function formatDate(dateString, includeTime = true) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return new Date(dateString).toLocaleDateString('pl-PL', options);
}


function fixModalTwitching() {
    
    document.body.style.paddingRight = '0px !important';
    
    
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        
        modal.addEventListener('shown.bs.modal', function() {
            this.style.transition = 'none';
            this.style.transform = 'none';
            
            
            const modalDialog = this.querySelector('.modal-dialog');
            if (modalDialog) {
                modalDialog.style.transform = 'none';
                modalDialog.style.transition = 'none';
            }
        });
        
        
        const actionButtons = modal.querySelectorAll('.modal-footer button');
        actionButtons.forEach(button => {
            button.style.position = 'relative';
        });
    });
    
    
    const originalPadding = window.getComputedStyle(document.body).paddingRight;
    document.addEventListener('show.bs.modal', function() {
        setTimeout(() => {
            document.body.style.paddingRight = originalPadding;
        }, 10);
    });
}


function initDateInputsLanguage() {
    
    document.documentElement.lang = 'pl';
    
    
    if (typeof flatpickr !== 'undefined' && typeof flatpickr.l10ns !== 'undefined' && flatpickr.l10ns.pl) {
        flatpickr.setDefaults({locale: 'pl'});
    }
    
    
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.lang = 'pl';
        
        
        if (!input.placeholder || input.placeholder === 'mm/dd/yyyy') {
            input.placeholder = 'dd.mm.rrrr';
        }
        
        
        if (typeof flatpickr !== 'undefined') {
            flatpickr(input, {
                locale: 'pl',
                dateFormat: 'Y-m-d',
                altInput: true,
                altFormat: 'd.m.Y'
            });
        } else {
            
            
            
            const polishContext = document.createElement('span');
            polishContext.lang = 'pl';
            polishContext.style.position = 'absolute';
            polishContext.style.visibility = 'hidden';
            input.parentNode.insertBefore(polishContext, input);
            polishContext.appendChild(input.cloneNode(true));
            
            
            input.addEventListener('click', function(e) {
                
                this.setAttribute('lang', 'pl');
                document.documentElement.lang = 'pl';
            });
        }
    });
    
    
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { 
                        
                        if (node.tagName === 'INPUT' && node.type === 'date') {
                            node.lang = 'pl';
                            if (!node.placeholder || node.placeholder === 'mm/dd/yyyy') {
                                node.placeholder = 'dd.mm.rrrr';
                            }
                            
                            
                            if (typeof flatpickr !== 'undefined') {
                                flatpickr(node, {
                                    locale: 'pl',
                                    dateFormat: 'Y-m-d',
                                    altInput: true,
                                    altFormat: 'd.m.Y'
                                });
                            }
                        }
                        
                        
                        const dateInputsInNode = node.querySelectorAll('input[type="date"]');
                        dateInputsInNode.forEach(input => {
                            input.lang = 'pl';
                            if (!input.placeholder || input.placeholder === 'mm/dd/yyyy') {
                                input.placeholder = 'dd.mm.rrrr';
                            }
                            
                            
                            if (typeof flatpickr !== 'undefined') {
                                flatpickr(input, {
                                    locale: 'pl',
                                    dateFormat: 'Y-m-d',
                                    altInput: true,
                                    altFormat: 'd.m.Y'
                                });
                            }
                        });
                    }
                });
            }
        });
    });
    
    
    observer.observe(document.body, { childList: true, subtree: true });
}