const GetFromBack = true; // true — бэкенд, false — локальный menu.json

document.addEventListener('DOMContentLoaded', () => {
    const menuContainer = document.getElementById('menu-container');

    // =============================================
    // ПЕРЕКЛЮЧЕНИЕ ЯЗЫКОВ
    // =============================================
    const langSwitchers = document.querySelectorAll('.lang');
    langSwitchers.forEach(lang => {
        lang.addEventListener('click', () => {
            langSwitchers.forEach(l => l.classList.remove('active'));
            lang.classList.add('active');
        });
    });

    // =============================================
    // ПОДСВЕТКА АКТИВНОГО ПУНКТА ПЕРСОНАЛЬНЫМ ЦВЕТОМ
    // =============================================
    const navLinks = document.querySelectorAll('.nav-link');

    function setActiveLink(activeLink) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            link.style.color = '';
            link.style.borderColor = 'transparent';
        });

        activeLink.classList.add('active');
        const color = activeLink.getAttribute('data-color');
        activeLink.style.color = color;
        activeLink.style.borderColor = color;
    }

    // =============================================
    // ЗАГРУЗКА ДАННЫХ
    // =============================================
    if (GetFromBack) {
        loadFromBackend();
    } else {
        loadFromLocalJson();
    }

    /**
     * Получение данных с бэкенда
     */
    async function loadFromBackend() {
        const slug = new URLSearchParams(window.location.search).get('slug') || 'matcha-house';
        try {
            const res = await fetch(`/api/venue?slug=${encodeURIComponent(slug)}`);
            const data = await res.json();

            if (!res.ok) {
                menuContainer.innerHTML = `<p style="text-align:center;padding:40px;">Ошибка загрузки меню</p>`;
                return;
            }

            renderNav(data.menu);
            renderSections(data.menu);
        } catch (err) {
            menuContainer.innerHTML = `<p style="text-align:center;padding:40px;">Ошибка соединения с сервером</p>`;
        }
    }

    /**
     * Получение данных из локального JSON (для тестирования)
     */
    async function loadFromLocalJson() {
        try {
            const res = await fetch('menu.json');
            const data = await res.json();

            if (!res.ok) {
                menuContainer.innerHTML = `<p style="text-align:center;padding:40px;">Ошибка загрузки локального меню</p>`;
                return;
            }

            renderNav(data.menu);
            renderSections(data.menu);
        } catch (err) {
            menuContainer.innerHTML = `<p style="text-align:center;padding:40px;">Ошибка чтения локального JSON</p>`;
        }
    }

    /**
     * Отрисовка навигации по категориям
     */
    function renderNav(menu) {
        const nav = document.querySelector('.categories-nav');
        if (!nav) return;

        nav.innerHTML = '';
        Object.entries(menu).forEach(([category], index) => {
            const link = document.createElement('a');
            link.href = `#${transliterate(category)}`;
            link.className = 'nav-link' + (index === 0 ? ' active' : '');
            link.textContent = category.toUpperCase();
            link.dataset.color = getCategoryColor(category);
            nav.appendChild(link);
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function () {
                setActiveLink(this);
            });
        });

        const first = document.querySelector('.nav-link.active');
        if (first) setActiveLink(first);
    }

    /**
     * Отрисовка секций и карточек напитков
     */
    function renderSections(menu) {
        if (!menuContainer) return;

        let html = '';
        for (const [category, items] of Object.entries(menu)) {
            const sectionId = transliterate(category);
            const titleColor = getCategoryColor(category);
            html += `<section id="${sectionId}" class="category-section">`;
            html += `<h2 class="category-title" style="color: ${titleColor};">${category.toUpperCase()}</h2>`;

            items.forEach(item => {
                html += `
                    <div class="drink-card">
                        ${item.photoUrl ? `<img src="${item.photoUrl}" alt="" class="card-bg">` : ''}
                        ${item.photoUrl ? `<img src="${item.photoUrl}" alt="${item.name}" class="drink-image">` : ''}
                        <div class="drink-info">
                            <h3 class="drink-name">${item.name.toUpperCase()}</h3>
                            <p class="drink-price">${(item.priceVnd / 1000).toFixed(0)}K</p>
                        </div>
                    </div>
                `;
            });

            html += `</section>`;
        }

        menuContainer.innerHTML = html;
    }

    // =============================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // =============================================

    function transliterate(text) {
        const map = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
            'е': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y',
            'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh',
            'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e',
            'ю': 'yu', 'я': 'ya'
        };
        return text.toLowerCase().split('').map(ch => map[ch] || ch).join('').replace(/\s+/g, '-');
    }

    function getCategoryColor(category) {
        const colors = {
            'Матча': '#3E751D',
            'Какао': '#764C18',
            'Таро': '#924AD6',
            'Мята': '#519672',
            'Кофе': '#A67F5B'
        };
        return colors[category] || '#3E751D';
    }
});