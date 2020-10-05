import Home from './pages/home.js';
import homeTemplate from './pages/index.html';
import Process from './pages/process/process.js';
import processTemplate from './pages/process/index.html';
import Design from './pages/process/design/design.js';
import designTemplate from './pages/process/design/index.html';

const routerView = document.querySelector('#content');
const routes = [
    {
        path: '/',
        component: Home,
        template: homeTemplate,
    },
    {
        path: '/process',
        component: Process,
        template: processTemplate,
    },
    {
        path: '/process/design',
        component: Design,
        template: designTemplate,
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
