import axios from "axios";
import './polyfills';
import { goTo } from './routes';
import './assets/scss/style.scss';

const handleLinkClick = function handleLinkClick(e, link) {
    const { pathname } = link;

    if (!pathname) return;

    e.preventDefault();

    if (pathname === location.pathname) return;

    goTo(pathname);
}

document.addEventListener('click', (e) => {
    const { target } = e;
    const link = target.tagName === 'A' ? target : target.closest('a');

    if (!link) return;

    handleLinkClick(e, link);
});

// This prevents falsely triggering the 'input' event in IE11 when the [placeholder] is toggled
const onInputWrapper = cb => (e) => {
    const { target: input } = e;
    if(input.prevVal === input.value || !input.prevVal && input.value === '') return;
    input.prevVal = input.value;
    cb(e);
}

Array.from(document.querySelectorAll('input, select, textarea')).forEach((input) => {
    // Input event
    input.addEventListener('input', onInputWrapper(() => {
        input.isDirty = true;
        if (input.isTouched && input.isValidated && input.checkValidity()) input.classList.remove('error');
    }), false);

    // Blur event
    input.addEventListener('blur', () => {
        input.isTouched = true;
        if (input.isDirty) input.checkValidity();
    }, false);

    // Invalid event
    input.addEventListener('invalid', () => {
        input.isValidated = true;
        input.classList.add('error')
    }, false);
});

const handleFormSubmit = function handleContactFormSubmitEvent(e) {
    e.preventDefault();
    const formData = {
        name: '',
        email: '',
        description: '',
    };

    Object.keys(formData).forEach((dataKey) => {
        formData[dataKey] = e.target.querySelector(`[name="${dataKey}"]`).value;
    });

    axios.post('/api/message/send', formData)
        .then(() => {
            alert('thank you for your message! we will respond soon!');
        });
}

document.querySelector('#footerForm').addEventListener('submit', handleFormSubmit);
