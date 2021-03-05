import Home from './pages/home';
import homeTemplate from './pages/index.html';
import constructionTemplate from './pages/construction/index.html';
import Design from './pages/construction/design/design';
import designTemplate from './pages/construction/design/index.html';
import Contracting from './pages/construction/contracting/contracting';
import contractingTemplate from './pages/construction/contracting/index.html';
import processTemplate from './pages/process/index.html';
import additionsTemplate from './pages/additions/index.html';

const getBodyClassFromPath = path => `page-${path === '/' ? 'home' : path.slice(1).split('/').join('-')}`;
const routerView = document.querySelector('#content');
const routes = [
    {
        path: '/',
        component: Home,
        template: homeTemplate,
    },
    {
        path: '/construction',
        template: constructionTemplate,
    },
    {
        path: '/construction/design',
        component: Design,
        template: designTemplate
    },
    {
        path: '/construction/contracting',
        component: Contracting,
        template: contractingTemplate
    },
    {
        path: '/process',
        template: processTemplate
    },
    {
        path: '/additions',
        template: additionsTemplate
    },
];

function getRoute(path) {
    return routes.find(route => route.path === path);
}

function goToRoute(route) {
    if (!route) return;

    const { template, component = () => {}, path } = route;

    routerView.innerHTML = template;

    document.body.classList.remove(getBodyClassFromPath(location.pathname));
    document.body.classList.add(getBodyClassFromPath(path));

    // TODO: Update title tag and meta description

    // FIXME: Handle back/forward navigation from browser controls
    history.pushState(null, null, path);
    document.body.scrollIntoView();
    component();
}

export function goTo(path) {
    goToRoute(getRoute(path));
}

// FIXME: Need to find a way to close the menu when navigating or scrolling to a hash
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

    const route = getRoute(pathname);

    if (!route) return;

    e.preventDefault();

    if (pathname === location.pathname) return;

    link.blur();
    goTo(pathname);
}

// FIXME: This results in loading components twice. Find a way to keep track of the current route and do this dynamically.
goTo(location.pathname);

document.addEventListener('click', (e) => {
    const { target } = e;
    const link = target.tagName.toLowerCase() === 'A' ? target : target.closest('a');

    if (!link) return;

    handleLinkClick(e, link);
});
