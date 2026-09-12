const MEDIA_BASE_BASE = 'https://vmzgchqxuyibqxltkigu.supabase.co/storage/v1/object/public/venue-media/';
const API_BASE = '';

const CART_LABELS = {
    ru: { total: "Итого", clear: "Очистить", finalLabel: "Итоговая стоимость" },
    en: { total: "Total", clear: "Clear", finalLabel: "Total cost" },
    vn: { total: "Tổng", clear: "Xóa", finalLabel: "Tổng chi phí" }
};

const CART_MAX_ITEMS = 50;
const CART_MAX_COUNT = 100;
const CART_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let categoryColorMap = {};
let currentSlug = '';
let MEDIA_BASE = '';
let currentMenu = {};
let currentLang = 'ru';
let cartState = { version: 1, items: {}, updatedAt: Date.now() };

function getCurrentSlug() {
    return new URLSearchParams(window.location.search).get('slug');
}

function getMediaBase(slug) {
    return `${MEDIA_BASE_BASE}${slug}/`;
}

function loadVenueCss(slug) {
    if (!slug) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${MEDIA_BASE}${slug}.css`;
    document.head.appendChild(link);
}

function loadVenueConfig(slug) {
    return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = `${MEDIA_BASE}${slug}.config.js`;
        script.onload = () => {
            if (window.VENUE_CONFIG && window.VENUE_CONFIG.categoryColorMap) {
                categoryColorMap = window.VENUE_CONFIG.categoryColorMap;
            }
            if (window.VENUE_CONFIG && window.VENUE_CONFIG.footer_text) {
                const footer = document.getElementById('venue-footer');
                footer.innerHTML = window.VENUE_CONFIG.footer_text;
                footer.hidden = false;
            }
            resolve();
        };
        script.onerror = () => resolve();
        document.head.appendChild(script);
    });
}

function setImageSources(container = document) {
    container.querySelectorAll('img[data-src]').forEach(img => {
        img.src = MEDIA_BASE + img.getAttribute('data-src');
        img.removeAttribute('data-src');
    });
}

function formatPrice(price) {
    return (price / 1000).toFixed(0).replace(/\.0$/, '') + 'K';
}

function showSkeleton() {
    const skeleton = document.getElementById('menu-skeleton');
    const error = document.getElementById('menu-error');
    if (skeleton) skeleton.style.display = 'block';
    if (error) error.style.display = 'none';
}

function hideSkeleton() {
    const skeleton = document.getElementById('menu-skeleton');
    if (skeleton) skeleton.style.display = 'none';
}

function showError(message) {
    hideSkeleton();
    const error = document.getElementById('menu-error');
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) errorMessage.textContent = message;
    if (error) error.style.display = 'block';
}

function hideError() {
    const error = document.getElementById('menu-error');
    if (error) error.style.display = 'none';
}

/* ========== КОРЗИНА: localStorage ========== */

function getCartKey(slug) {
    return `venuekit_cart_${slug}`;
}

function emptyCart() {
    return { version: 1, items: {}, updatedAt: Date.now() };
}

function sanitizeCart(cart) {
    if (!cart || typeof cart !== 'object') return emptyCart();
    if (!cart.items || typeof cart.items !== 'object') return emptyCart();

    const cleanItems = {};
    let count = 0;

    for (const [id, value] of Object.entries(cart.items)) {
        if (count >= CART_MAX_ITEMS) break;
        if (typeof id !== 'string' || !id) continue;

        let n = Number(value);
        if (!Number.isFinite(n)) n = 0;
        n = Math.max(0, Math.min(CART_MAX_COUNT, Math.floor(n)));

        if (n > 0) {
            cleanItems[id] = n;
            count++;
        }
    }

    return {
        version: 1,
        items: cleanItems,
        updatedAt: cart.updatedAt || Date.now()
    };
}

function loadCart(slug) {
    try {
        const raw = localStorage.getItem(getCartKey(slug));
        if (!raw) return emptyCart();

        const parsed = JSON.parse(raw);
        const clean = sanitizeCart(parsed);

        if (clean.updatedAt && Date.now() - clean.updatedAt > CART_MAX_AGE_MS) {
            localStorage.removeItem(getCartKey(slug));
            return emptyCart();
        }

        return clean;
    } catch (e) {
        try {
            localStorage.removeItem(getCartKey(slug));
        } catch (_) {}
        return emptyCart();
    }
}

function saveCart(slug, cart) {
    try {
        cart.updatedAt = Date.now();
        localStorage.setItem(getCartKey(slug), JSON.stringify(cart));
    } catch (e) {
        // localStorage недоступен — тихо игнорируем
    }
}

function clearCartStorage(slug) {
    try {
        localStorage.removeItem(getCartKey(slug));
    } catch (e) {}
}

/* ========== КОРЗИНА: логика ========== */

function getItemById(id) {
    for (const items of Object.values(currentMenu)) {
        const found = items.find(item => item.id === id);
        if (found) return found;
    }
    return null;
}

function getCartTotal() {
    let total = 0;
    for (const [id, count] of Object.entries(cartState.items)) {
        const item = getItemById(id);
        if (!item) continue;
        total += item.priceVnd * count;
    }
    return total;
}

function getCartCount() {
    let total = 0;
    for (const count of Object.values(cartState.items)) {
        total += count;
    }
    return total;
}

function addToCart(itemId) {
    if (!itemId) return;

    const current = cartState.items[itemId] || 0;
    if (current >= CART_MAX_COUNT) return;

    cartState.items[itemId] = current + 1;
    saveCart(currentSlug, cartState);

    renderCartCounter(itemId);
    renderCartSummary();
    expandCartSummary();
}

function removeFromCart(itemId) {
    if (!itemId) return;

    const current = cartState.items[itemId] || 0;
    const next = Math.max(0, current - 1);

    if (next === 0) {
        delete cartState.items[itemId];
    } else {
        cartState.items[itemId] = next;
    }

    saveCart(currentSlug, cartState);

    renderCartCounter(itemId);
    renderCartSummary();
}

function clearCart() {
    const ids = Object.keys(cartState.items);
    cartState = emptyCart();
    clearCartStorage(currentSlug);

    ids.forEach(id => renderCartCounter(id));
    renderCartSummary();
    collapseCartSummary();
}

/* ========== КОРЗИНА: UI ========== */

function renderCartCounter(itemId) {
    const counter = document.querySelector(`.drink-counter[data-item-id="${itemId}"]`);
    if (!counter) return;

    const count = cartState.items[itemId] || 0;
    const valueEl = counter.querySelector('.counter-value');

    if (count === 0) {
        counter.hidden = true;
    } else {
        counter.hidden = false;
        valueEl.textContent = count;
    }
}

function renderCartSummary() {
    const summary = document.getElementById('cart-summary');
    const totalEl = document.getElementById('cart-summary-total');
    const totalFinalEl = document.getElementById('cart-total-final');
    const itemsEl = document.getElementById('cart-items');
    const labelEl = document.getElementById('cart-summary-label');
    const finalLabelEl = document.getElementById('cart-final-label');
    const clearBtn = document.getElementById('cart-clear');

    const labels = CART_LABELS[currentLang] || CART_LABELS.ru;
    labelEl.textContent = labels.total;
    finalLabelEl.textContent = labels.finalLabel;
    clearBtn.textContent = labels.clear;

    const total = getCartTotal();
    const count = getCartCount();

    if (count === 0) {
        summary.hidden = true;
        document.body.classList.remove('cart-active');
        itemsEl.innerHTML = '';
        return;
    }

    summary.hidden = false;
    document.body.classList.add('cart-active');

    totalEl.textContent = formatPrice(total);
    totalFinalEl.textContent = formatPrice(total);

    // Пересобираем строки с нуля — чтобы не было визуальных разрывов
    itemsEl.innerHTML = '';

    for (const [id, itemCount] of Object.entries(cartState.items)) {
        if (itemCount <= 0) continue;

        const item = getItemById(id);
        if (!item) {
            // Позиция удалена из меню — чистим
            delete cartState.items[id];
            continue;
        }

        const line = document.createElement('div');
        line.className = 'cart-item';

        const sum = item.priceVnd * itemCount;
        line.textContent = `${itemCount} x ${item.name.toUpperCase()} = ${formatPrice(sum)}`;

        itemsEl.appendChild(line);
    }

    // Если после очистки удалённых позиций корзина опустела
    if (Object.keys(cartState.items).length === 0) {
        summary.hidden = true;
        document.body.classList.remove('cart-active');
    }
}

function expandCartSummary() {
    const summary = document.getElementById('cart-summary');
    if (summary.hidden) return;
    summary.classList.add('expanded');
}

function collapseCartSummary() {
    const summary = document.getElementById('cart-summary');
    summary.classList.remove('expanded');
}

function toggleCartSummary() {
    const summary = document.getElementById('cart-summary');
    if (summary.hidden) return;
    summary.classList.toggle('expanded');
}

/* ========== НАВИГАЦИЯ ========== */

function buildNav(menu) {
    const nav = document.getElementById('categories-nav');
    nav.innerHTML = '';

    Object.entries(menu).forEach(([category], index) => {
        const link = document.createElement('a');
        link.href = `#${category.toLowerCase()}`;
        link.className = 'nav-link' + (index === 0 ? ' active' : '');
        link.textContent = category.toUpperCase();
        link.dataset.color = categoryColorMap[category] || '#3E751D';
        link.dataset.category = category.toLowerCase();
        nav.appendChild(link);
    });

    const first = nav.querySelector('.nav-link.active');
    if (first) {
        const color = first.dataset.color;
        first.style.color = color;
        first.style.borderColor = color;
    }

    initNavObserver();
}

function initNavObserver() {
    function updateActive() {
        const sections = document.querySelectorAll('.category-section');
        const links = document.querySelectorAll('.nav-link');

        if (!sections.length || !links.length) return;

        const scrollPos = window.scrollY + 160;
        let activeId = sections[0]?.id;

        sections.forEach(section => {
            if (section.offsetTop <= scrollPos) {
                activeId = section.id;
            }
        });

        links.forEach(link => {
            const isActive = link.dataset.category === activeId;
            link.classList.toggle('active', isActive);

            if (isActive) {
                const color = link.dataset.color || '#3E751D';
                link.style.color = color;
                link.style.borderColor = color;
            } else {
                link.style.color = '';
                link.style.borderColor = 'transparent';
            }
        });
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
}

/* ========== СЕКЦИИ ========== */

function buildSections(menu) {
    const content = document.getElementById('menu-content');
    content.innerHTML = '';

    Object.entries(menu).forEach(([category, items]) => {
        const section = document.createElement('section');
        section.id = category.toLowerCase();
        section.className = 'category-section';

        const title = document.createElement('h2');
        title.className = 'category-title';
        title.style.color = categoryColorMap[category] || '#3E751D';
        title.textContent = category.toUpperCase();

        const carousel = document.createElement('div');
        carousel.className = 'carousel-container';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-btn prev-btn';
        prevBtn.type = 'button';
        prevBtn.setAttribute('aria-label', 'Предыдущее блюдо');
        prevBtn.innerHTML = '&#10092;';

        const slidesWrapper = document.createElement('div');
        slidesWrapper.className = 'carousel-slides';

        items.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'drink-card' + (index === 0 ? ' active' : '');
            card.dataset.itemId = item.id || '';

            const bgSrc = item.cardBgUrl || '';
            const drinkSrc = item.photoUrl || '';
            const ingredientsHtml = (item.ingredients || []).map(ing => {
                return `<img data-src="${ing.imageUrl}" alt="" class="ingredient ${ing.cssClass || ''}">`;
            }).join('');

            const hasId = Boolean(item.id);

            card.innerHTML = `
                ${bgSrc ? `<img data-src="${bgSrc}" alt="" class="card-bg">` : ''}
                ${ingredientsHtml ? `<div class="ingredients-container">${ingredientsHtml}</div>` : ''}
                ${drinkSrc ? `<img data-src="${drinkSrc}" alt="${item.name}" class="drink-image">` : ''}
                <div class="drink-info">
                    <h3 class="drink-name">${item.name.toUpperCase()}</h3>
                    <div class="drink-info-bottom">
                        <p class="drink-price">${formatPrice(item.priceVnd)}</p>
                        ${hasId ? `
                            <div class="drink-counter" data-item-id="${item.id}" hidden>
                                <button class="counter-btn counter-minus" type="button" aria-label="Убрать">−</button>
                                <span class="counter-value">0</span>
                                <button class="counter-btn counter-plus" type="button" aria-label="Добавить">+</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            slidesWrapper.appendChild(card);
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-btn next-btn';
        nextBtn.type = 'button';
        nextBtn.setAttribute('aria-label', 'Следующее блюдо');
        nextBtn.innerHTML = '&#10093;';

        carousel.appendChild(prevBtn);
        carousel.appendChild(slidesWrapper);
        carousel.appendChild(nextBtn);

        const dotsWrapper = document.createElement('div');
        dotsWrapper.className = 'carousel-dots';

        items.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
            dot.type = 'button';
            dot.dataset.index = index;
            dot.setAttribute('aria-label', `Блюдо ${index + 1}`);
            dotsWrapper.appendChild(dot);
        });

        const counter = document.createElement('div');
        counter.className = 'carousel-counter';
        counter.textContent = `1 / ${items.length}`;

        carousel.appendChild(dotsWrapper);
        carousel.appendChild(counter);

        section.appendChild(title);
        section.appendChild(carousel);
        content.appendChild(section);
    });

    setImageSources();
    initCarousels();
    initCartButtons();
}

function initCarousels() {
    document.querySelectorAll('.carousel-container').forEach(container => {
        const slides = container.querySelectorAll('.drink-card');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');
        const dots = container.querySelectorAll('.carousel-dot');
        const counter = container.querySelector('.carousel-counter');
        const slidesWrapper = container.querySelector('.carousel-slides');

        if (!slides.length) return;

        let currentIndex = 0;

        function updateUI() {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === currentIndex);
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });

            if (counter) {
                counter.textContent = `${currentIndex + 1} / ${slides.length}`;
            }
        }

        function showSlide(index) {
            currentIndex = (index + slides.length) % slides.length;
            updateUI();
        }

        nextBtn.addEventListener('click', () => {
            showSlide(currentIndex + 1);
        });

        prevBtn.addEventListener('click', () => {
            showSlide(currentIndex - 1);
        });

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                showSlide(Number(dot.dataset.index));
            });
        });

        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;

        slidesWrapper.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = false;
        }, { passive: true });

        slidesWrapper.addEventListener('touchmove', e => {
            if (!touchStartX) return;

            const dx = e.touches[0].clientX - touchStartX;
            const dy = e.touches[0].clientY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                isSwiping = true;
            }
        }, { passive: true });

        slidesWrapper.addEventListener('touchend', e => {
            if (!isSwiping) {
                touchStartX = 0;
                return;
            }

            const dx = e.changedTouches[0].clientX - touchStartX;

            if (Math.abs(dx) > 50) {
                if (dx < 0) {
                    showSlide(currentIndex + 1);
                } else {
                    showSlide(currentIndex - 1);
                }
            }

            touchStartX = 0;
            isSwiping = false;
        });
    });
}

/* ========== КОРЗИНА: обработчики на карточках ========== */

function initCartButtons() {
    document.querySelectorAll('.drink-counter').forEach(counter => {
        const itemId = counter.dataset.itemId;
        const minusBtn = counter.querySelector('.counter-minus');
        const plusBtn = counter.querySelector('.counter-plus');

        if (!itemId || !minusBtn || !plusBtn) return;

        plusBtn.addEventListener('click', e => {
            e.stopPropagation();
            plusBtn.classList.add('pressed');
            setTimeout(() => plusBtn.classList.remove('pressed'), 150);
            addToCart(itemId);
        });

        minusBtn.addEventListener('click', e => {
            e.stopPropagation();
            minusBtn.classList.add('pressed');
            setTimeout(() => minusBtn.classList.remove('pressed'), 150);
            removeFromCart(itemId);
        });

        // Показываем счётчик, если он уже не пуст
        renderCartCounter(itemId);
    });
}

/* ========== ПРОЧЕЕ ========== */

function initScrollTop() {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initRetry() {
    const retry = document.getElementById('error-retry');
    if (!retry) return;

    retry.addEventListener('click', () => {
        loadMenu();
    });
}

function initCartSummaryUI() {
    const toggle = document.getElementById('cart-summary-toggle');
    const clear = document.getElementById('cart-clear');

    if (toggle) {
        toggle.addEventListener('click', toggleCartSummary);
    }

    if (clear) {
        clear.addEventListener('click', e => {
            e.stopPropagation();
            clearCart();
        });
    }
}

function initLangSwitchers() {
    const langSwitchers = document.querySelectorAll('.lang');
    const current = langSwitchers[0];
    if (current && current.dataset.lang) {
        currentLang = current.dataset.lang;
    }

    langSwitchers.forEach(lang => {
        lang.addEventListener('click', () => {
            const newLang = lang.dataset.lang || 'ru';
            if (newLang === currentLang) return;

            currentLang = newLang;
            localStorage.setItem('venuekit_lang', newLang);

            // Перезагрузка страницы — как договорились
            window.location.reload();
        });
    });
}

/* ========== ЗАГРУЗКА ========== */

async function loadMenu() {
    const slug = getCurrentSlug();

    if (!slug) {
        hideSkeleton();
        showError('Укажите slug заведения');
        return;
    }

    currentSlug = slug;
    MEDIA_BASE = getMediaBase(slug);

    showSkeleton();
    hideError();

    const logo = document.querySelector('img[data-src="logo.png"]');
    if (logo) {
        logo.src = MEDIA_BASE + 'logo.png';
        logo.removeAttribute('data-src');
    }

    loadVenueCss(slug);
    await loadVenueConfig(slug);

    try {
        const res = await fetch(`${API_BASE}/api/venue?slug=${encodeURIComponent(slug)}`);

        if (!res.ok) {
            throw new Error('Ошибка загрузки меню');
        }

        const data = await res.json();

        if (data.venue && data.venue.customCss) {
            const style = document.createElement('style');
            style.textContent = data.venue.customCss;
            document.head.appendChild(style);
        }

        currentMenu = data.menu || {};
        cartState = loadCart(slug);

        hideSkeleton();
        buildNav(data.menu);
        buildSections(data.menu);
        renderCartSummary();
    } catch (error) {
        showError(error.message || 'Ошибка загрузки меню');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('venuekit_lang');
    if (savedLang && CART_LABELS[savedLang]) {
        currentLang = savedLang;
    }

    initLangSwitchers();
    initScrollTop();
    initRetry();
    initCartSummaryUI();
    loadMenu();
});