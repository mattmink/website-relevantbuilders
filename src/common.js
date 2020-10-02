import routes from './routes';

document.addEventListener('click', async (e) => {
    const { target } = e;
    const link = target.tagName === 'A' ? target : target.closest('a');

    if (!link) return;

    const { pathname } = link;

    if (!pathname || pathname === location.pathname) return;

    const route = routes.find(({ path }) => path === pathname);

    if (!route) return;

    e.preventDefault();
    const { default: component } = await route.component();
    history.pushState(null, null, pathname);
    component();
});
