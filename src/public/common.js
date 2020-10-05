import axios from "axios";
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

document.querySelector('#footerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const response = await axios.post('/api/message/send', new FormData(e.target));
    alert('thank you for your message! we will respond soon!');
});
