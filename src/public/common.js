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
    const formData = {
        name: '',
        email: '',
        description: '',
    };

    Object.keys(formData).forEach((dataKey) => {
        formData[dataKey] = e.target.querySelector(`[name="${dataKey}"]`).value;
    });

    await axios.post('/api/message/send', formData);
    alert('thank you for your message! we will respond soon!');
});
