document.addEventListener('DOMContentLoaded', () => {
    // Переключение языков
    const langSwitchers = document.querySelectorAll('.lang');
    langSwitchers.forEach(lang => {
        lang.addEventListener('click', () => {
            langSwitchers.forEach(l => l.classList.remove('active'));
            lang.classList.add('active');
        });
    });

    // Функция подстветки активного пункта персональным цветом
    const navLinks = document.querySelectorAll('.nav-link');

    function setActiveLink(activeLink) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            link.style.color = ''; // Возвращаем дефолтный цвет из CSS
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
});