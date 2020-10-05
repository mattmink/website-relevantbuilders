import routes from './routes';

const $content = document.querySelector('#content');

document.addEventListener('click', (e) => {
    const { target } = e;
    const link = target.tagName === 'A' ? target : target.closest('a');

    if (!link) return;

    const { pathname } = link;

    if (!pathname) return;

    if (pathname === location.pathname) {
        e.preventDefault();
        return;
    }

    const route = routes.find(({ path }) => path === pathname);

    if (!route) return;

    e.preventDefault();
    const { template, component } = route;

    $content.innerHTML = template;

    history.pushState(null, null, pathname);
    component();
});
