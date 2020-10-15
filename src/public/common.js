import axios from "axios";
import './polyfills';
import { goTo } from './routes';
import './assets/scss/style.scss';
import { error, success } from "./toast";
import { icons } from 'feather-icons';

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

let isSubmitting = false;
const handleFormSubmit = function handleContactFormSubmitEvent(e) {
    e.preventDefault();

    if (isSubmitting) return;

    isSubmitting = true;

    const loadingContainer = document.createElement('div');
    loadingContainer.innerHTML = icons['refresh-cw'].toSvg({ class: 'icon spinner ml-2' });

    const $loading = loadingContainer.firstChild;
    const $submit = e.target.querySelector('button');

    $submit.appendChild($loading);
    $submit.disabled = true;

    const formData = {
        name: '',
        contactInfo: '',
        location: '',
        description: '',
    };

    Object.keys(formData).forEach((dataKey) => {
        formData[dataKey] = e.target.querySelector(`[name="${dataKey}"]`).value;
    });

    axios.post('/api/message/send', formData)
        .then(() => {
            success('Thank you for your message. We look forward to speaking with you soon.');
            e.target.reset();
        })
        .catch(() => {
            error('Hmmm. That didn\'t work. Please try sending your message again.')
        })
        .finally(() => {
            isSubmitting = false;
            $submit.removeChild($loading);
            $submit.disabled = false;
        });
}

document.querySelector('#footerForm').addEventListener('submit', handleFormSubmit);
