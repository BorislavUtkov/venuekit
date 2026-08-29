const MEDIA_BASE = 'https://vmzgchqxuyibqxltkigu.supabase.co/storage/v1/object/public/venue-media/REU/';
const API_BASE = 'http://localhost:3001';
// const DEFAULT_SLUG = 'REU_Coffee';

function getCurrentSlug() {
    return new URLSearchParams(window.location.search).get('slug') || DEFAULT_SLUG;
}

function loadVenueCss(slug) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${slug}.css`;
    document.head.appendChild(link);
}

function setImageSources(container = document) {
    container.querySelectorAll('img[data-src]').forEach(img => {
        img.src = MEDIA_BASE + img.getAttribute('data-src');
    });
}

function formatPrice(price) {
    return (price / 1000).toFixed(0).replace(/\.0$/, '') + 'K';
}

function buildNav(menu) {
    const nav = document.getElementById('categories-nav');
    nav.innerHTML = '';

    Object.entries(menu).forEach(([category], index) => {
        const link = document.createElement('a');
        link.href = `#${category.toLowerCase()}`;
        link.className = 'nav-link' + (index === 0 ? ' active' : '');
        link.textContent = category.toUpperCase();
        nav.appendChild(link);
    });

    const links = nav.querySelectorAll('.nav-link');

    function setActiveLink(activeLink) {
        links.forEach(link => {
            link.classList.remove('active');
            link.style.color = '';
            link.style.borderColor = 'transparent';
        });

        activeLink.classList.add('active');
    }

    links.forEach(link => {
        link.addEventListener('click', function () {
            setActiveLink(this);
        });
    });

    const first = nav.querySelector('.nav-link.active');
    if (first) setActiveLink(first);
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
        title.textContent = category.toUpperCase();

        const carousel = document.createElement('div');
        carousel.className = 'carousel-container';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-btn prev-btn';
        prevBtn.innerHTML = '&#10092;';

        const slidesWrapper = document.createElement('div');
        slidesWrapper.className = 'carousel-slides';

        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'drink-card' + (index === 0 ? ' active' : '');

            const bgSrc = item.cardBgUrl || '';
            const drinkSrc = item.photoUrl || '';
            const ingredientsHtml = (item.ingredients || []).map(ing => {
                return `<img data-src="${ing.imageUrl}" alt="" class="ingredient ${ing.cssClass}">`;
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
        nextBtn.innerHTML = '&#10093;';

        carousel.appendChild(prevBtn);
        carousel.appendChild(slidesWrapper);
        carousel.appendChild(nextBtn);

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
        let currentIndex = 0;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                if (i === index) slide.classList.add('active');
            });
        }

        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % slides.length;
            showSlide(currentIndex);
        });

        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(currentIndex);
        });
    });
}

async function loadMenu() {
    const slug = getCurrentSlug();

    loadVenueCss(slug);

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
        buildNav(data.menu);
        buildSections(data.menu);
    } catch (error) {
        const content = document.getElementById('menu-content');
        content.innerHTML = `<p style="text-align:center;padding:40px;">${error.message}</p>`;
    }
}

const langSwitchers = document.querySelectorAll('.lang');
langSwitchers.forEach(lang => {
    lang.addEventListener('click', () => {
        langSwitchers.forEach(l => l.classList.remove('active'));
        lang.classList.add('active');
    });
});

document.documentElement.style.scrollBehavior = 'smooth';

loadMenu();