// TODO: Figure out a better pattern for components and the router, to allow a "hooks" approach
//      * This would solve the problem where event listeners persist after being called the first time
//      * This would also keep the router logic clean and focused, allowing other components to "subscribe" to router events and do custom things
import { closeNavMenu } from "./menu";
import seo from './data/seo.json';
import Home from './pages/home';
import homeTemplate from './pages/index.html';
import constructionTemplate from './pages/construction/index.html';
import Design from './pages/construction/design/design';
import designTemplate from './pages/construction/design/index.html';
import Contracting from './pages/construction/contracting/contracting';
import contractingTemplate from './pages/construction/contracting/index.html';
import processTemplate from './pages/process/index.html';
import additionsTemplate from './pages/additions/index.html';

const addRouteMeta = (route) => {
    const {
        title = seo.defaultTitle,
        description = seo.defaultDescription
    } = seo.pages[route.path] || {};

    return {
        ...route,
        meta: {
            title: `${title}${seo.baseTitle}`,
            description
        }
    };
}
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
].map(addRouteMeta);
let currentRoute;

function getRoute(path) {
    return routes.find(route => route.path === path);
}

function loadRoute(route) {
    if (!route) return;

    const previousRoute = currentRoute;
    currentRoute = route;

    const { template, component = () => { }, path } = route;

    closeNavMenu();

    document.title = route.meta.title;
    document.querySelector('meta[name="description"]').setAttribute("content", route.meta.description);

    // TODO: Investigate whether a functional approach could improve performance with the help of caching route elements
    routerView.innerHTML = template;

    if (previousRoute) {
        document.body.classList.remove(getBodyClassFromPath(previousRoute.path));
    }
    document.body.classList.add(getBodyClassFromPath(path));

    document.body.scrollIntoView();
    component();
}

export function goTo(path) {
    const route = getRoute(path);
    history.pushState(null, null, path);
    loadRoute(route);
}

const handleLinkClick = function handleLinkClick(e, link) {
    const { pathname, hash } = link;

    if (Boolean(hash)) {
        e.preventDefault();
        const scrollTo = document.querySelector(hash);
        if (scrollTo) {
            closeNavMenu();
            scrollTo.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }

    if (!pathname) return;

    const route = getRoute(pathname);

    if (!route) return;

    e.preventDefault();

    link.blur();

    if (pathname === location.pathname) return;

    goTo(pathname);
}

document.addEventListener('click', (e) => {
    const { target } = e;
    const link = target.tagName.toLowerCase() === 'A' ? target : target.closest('a');

    if (!link) return;

    handleLinkClick(e, link);
});

window.addEventListener('popstate', () => {
    loadRoute(getRoute(location.pathname));
});

currentRoute = getRoute(location.pathname);
