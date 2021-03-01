import Home from './pages/home';
import homeTemplate from './pages/index.html';
import Construction from './pages/construction/construction';
import constructionTemplate from './pages/construction/index.html';
import Design from './pages/construction/design/design';
import designTemplate from './pages/construction/design/index.html';
import Contracting from './pages/construction/contracting/contracting';
import contractingTemplate from './pages/construction/contracting/index.html';
import Process from './pages/process/process';
import processTemplate from './pages/process/index.html';
import Remodeling from './pages/remodeling/remodeling';
import remodelingTemplate from './pages/remodeling/index.html';

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
        component: Construction,
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
        component: Process,
        template: processTemplate
    },
    {
        path: '/remodeling',
        component: Remodeling,
        template: remodelingTemplate
    },
];

export function goTo(path) {
    const route = routes.find(route => route.path === path);

    if (!route) return;

    const { template, component } = route;

    routerView.innerHTML = template;

    document.body.classList.remove(getBodyClassFromPath(location.pathname));
    document.body.classList.add(getBodyClassFromPath(path));

    history.pushState(null, null, path);
    document.body.scrollIntoView({ behavior: 'smooth' });
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
