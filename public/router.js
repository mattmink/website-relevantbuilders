import Home from './pages/home.js';
import homeTemplate from './pages/index.html';

const routerView = document.querySelector('#content');
const routes = [
    {
        path: '/',
        component: Home,
        template: homeTemplate,
    }
];

export function goTo(path) {
    const route = routes.find(route => route.path === path);

    if (!route) return;

    const { template, component } = route;

    routerView.innerHTML = template;

    history.pushState(null, null, path);
    component();
}

const handleLinkClick = function handleLinkClick(e, link) {
    const { pathname, hash } = link;

    if (Boolean(hash)) {
        e.preventDefault();
        const scrollTo = document.querySelector(hash);
        if (scrollTo) {
            scrollTo.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }

    if (!pathname) return;

    e.preventDefault();

    if (pathname === location.pathname) return;

    goTo(pathname);
}

document.addEventListener('click', (e) => {
    const { target } = e;
    const link = target.tagName.toLowerCase() === 'A' ? target : target.closest('a');

    if (!link) return;

    handleLinkClick(e, link);
});
