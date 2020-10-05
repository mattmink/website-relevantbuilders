import axios from "axios";
import { goTo } from './routes';

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

    e.preventDefault();

    goTo(pathname);
});

document.querySelector('#footerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const response = await axios.post('/api/message/send', new FormData(e.target));
    alert('thank you for your message! we will respond soon!');
});
