// TODO: Check cross browser JS
import './polyfills';
import './router';
import './assets/scss/style.scss';
import { error, success } from "./toast";
import icons from './icons';
import http from './http';

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
    loadingContainer.innerHTML = icons.refreshCw({ class: 'icon spinner ml-2' });

    const $loading = loadingContainer.firstChild;
    const $submit = e.target.querySelector('button');

    $submit.appendChild($loading);
    $submit.disabled = true;

    // email is a honeypot field to catch most spam
    const formData = {
        name: '',
        email: '',
        contactInfo: '',
        location: '',
        description: '',
    };

    Object.keys(formData).forEach((dataKey) => {
        formData[dataKey] = e.target.querySelector(`[name="${dataKey}"]`).value;
    });

    const afterSuccess = () => {
        success('Thank you for your message. We look forward to speaking with you soon.', { autoClose: false });
        e.target.reset();
    };

    const afterSubmit = () => {
        isSubmitting = false;
        $submit.removeChild($loading);
        $submit.disabled = false;
    };

    // email is a honeypot field to catch most spam
    if (formData.email !== '') {
        afterSuccess();
        afterSubmit();
        return;
    }

    http.post('/message/send', formData)
        .then((response) => {
            if (!response.ok) throw new Error();
            afterSuccess();
        })
        .catch(() => {
            error('Hmmm. That didn\'t work. Please try sending your message again.')
        })
        .finally(() => {
            afterSubmit();
        });
}

document.querySelector('#footerForm').addEventListener('submit', handleFormSubmit);


const getScrollbarWidth = () => {
    if (document.body.scrollHeight <= window.innerHeight) return 0;

    const outer = document.createElement('div');
    const inner = document.createElement('div');

    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);
    outer.appendChild(inner);
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
}

const $menuToggle = document.querySelector('#menuToggle');
const isMenuOpen = () => document.body.classList.contains('menu-open');
const openNavMenu = () => {
    const scrollBarWidth = getScrollbarWidth();
    if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.classList.remove('menu-closing');
    document.body.classList.add('menu-open');
    $menuToggle.setAttribute('aria-label', 'Close Menu');
}
const closeNavMenu = () => {
    document.body.classList.add('menu-closing');
    document.body.classList.remove('menu-open');
    document.body.style.paddingRight = null;
    setTimeout(() => {
        document.body.classList.remove('menu-closing');
        $menuToggle.setAttribute('aria-label', 'Open Menu');
    }, 2500);
};
const toggleNavMenu = () => {
    if (isMenuOpen()) closeNavMenu();
    else openNavMenu();
};

$menuToggle.addEventListener('click', toggleNavMenu);
document.querySelector('#mainNav').addEventListener('click', ({ target: { id, href } }) => {
    if ((id === 'mainNav' || href === '#contact') && isMenuOpen()) closeNavMenu();
});
