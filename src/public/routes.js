import Home from './pages/home.js';
import homeTemplate from './pages/index.html';
import { arrayFind } from './utils.js';

const routerView = document.querySelector('#content');
const routes = [
    {
        path: '/',
        component: Home,
        template: homeTemplate,
    }
];

export function goTo(path) {
    const route = arrayFind(routes, route => route.path === path);

    if (!route) return;

    const { template, component } = route;

    routerView.innerHTML = template;

    history.pushState(null, null, path);
    component();
}
