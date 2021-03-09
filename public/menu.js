import { getScrollbarWidth } from "./utils";

const $menuToggle = document.querySelector('#menuToggle');
const isMenuOpen = () => document.body.classList.contains('menu-open');
const openNavMenu = () => {
    const scrollBarWidth = getScrollbarWidth();
    if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.classList.remove('menu-closing');
    document.body.classList.add('menu-open');
    $menuToggle.setAttribute('aria-label', 'Close Menu');
    $menuToggle.setAttribute('aria-expanded', true);
}
const closeNavMenu = () => {
    document.body.classList.add('menu-closing');
    document.body.classList.remove('menu-open');
    document.body.style.paddingRight = null;
    setTimeout(() => {
        document.body.classList.remove('menu-closing');
        $menuToggle.setAttribute('aria-label', 'Open Menu');
        $menuToggle.setAttribute('aria-expanded', false);
    }, 2500);
};
const toggleNavMenu = () => {
    if (isMenuOpen()) closeNavMenu();
    else openNavMenu();
};

$menuToggle.addEventListener('click', toggleNavMenu);
document.querySelector('#mainNav').addEventListener('click', ({ target: { id, href } }) => {
    if ((id === 'mainNav' || href === '#contact') && isMenuOpen()) closeNavMenu();
});

export { closeNavMenu };
