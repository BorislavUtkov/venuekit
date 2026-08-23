const MEDIA_BASE = 'https://vmzgchqxuyibqxltkigu.supabase.co/storage/v1/object/public/venue-media/REU/';

// Подстановка пути к изображениям
document.querySelectorAll('img[data-src]').forEach(img => {
    img.src = MEDIA_BASE + img.getAttribute('data-src');
});

document.addEventListener('DOMContentLoaded', () => {
    // Переключение языков
    const langSwitchers = document.querySelectorAll('.lang');
    langSwitchers.forEach(lang => {
        lang.addEventListener('click', () => {
            langSwitchers.forEach(l => l.classList.remove('active'));
            lang.classList.add('active');
        });
    });

    // Функция подсветки активного пункта персональным цветом
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

    // Инициализация активной ссылки при загрузке страницы
    const initialActive = document.querySelector('.nav-link.active');
    if (initialActive) {
        setActiveLink(initialActive);
    }

    // Обработка клика по категориям
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            setActiveLink(this);
        });
    });

    // Инициализация независимых каруселей
    document.querySelectorAll('.carousel-container').forEach(container => {
        const slides = container.querySelectorAll('.drink-card');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');
        let currentIndex = 0;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                if (i === index) {
                    slide.classList.add('active');
                }
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

    // Плавный скролл
    document.documentElement.style.scrollBehavior = 'smooth';
});