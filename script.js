document.addEventListener('DOMContentLoaded', () => {
    // Переключение языков
    const langSwitchers = document.querySelectorAll('.lang');
    langSwitchers.forEach(lang => {
        lang.addEventListener('click', () => {
            langSwitchers.forEach(l => l.classList.remove('active'));
            lang.classList.add('active');
        });
    });

    // Переключение активной категории в меню
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});