const MEDIA_BASE_BASE = 'https://vmzgchqxuyibqxltkigu.supabase.co/storage/v1/object/public/venue-media/';
const API_BASE = '';

let categoryColorMap = {};
let currentSlug = '';
let MEDIA_BASE = '';

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
    const sections = document.querySelectorAll('.category-section');
    const links = document.querySelectorAll('.nav-link');

    if (!sections.length || !links.length) return;

    function updateActive() {
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

            card.innerHTML = `
                ${bgSrc ? `<img data-src="${bgSrc}" alt="" class="card-bg">` : ''}
                ${ingredientsHtml ? `<div class="ingredients-container">${ingredientsHtml}</div>` : ''}
                ${drinkSrc ? `<img data-src="${drinkSrc}" alt="${item.name}" class="drink-image">` : ''}
                <div class="drink-info">
                    <h3 class="drink-name">${item.name.toUpperCase()}</h3>
                    <p class="drink-price">${formatPrice(item.priceVnd)}</p>
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

function initLangSwitchers() {
    const langSwitchers = document.querySelectorAll('.lang');
    langSwitchers.forEach(lang => {
        lang.addEventListener('click', () => {
            langSwitchers.forEach(l => l.classList.remove('active'));
            lang.classList.add('active');
        });
    });
}

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

        hideSkeleton();
        buildNav(data.menu);
        buildSections(data.menu);
    } catch (error) {
        showError(error.message || 'Ошибка загрузки меню');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initLangSwitchers();
    initScrollTop();
    initRetry();
    loadMenu();
});