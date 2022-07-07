import './polyfills';
import { goTo } from './routes';
import './assets/scss/style.scss';
import { error, success } from "./toast";
import icons from './icons';

const loadedTime = Date.now();
const footerForm = document.querySelector('#footerForm');
let antiSpamField;
let antiSpamAnswer;

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
    if (input.prevVal === input.value || !input.prevVal && input.value === '') return;
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

const randomInt = function randomIntFromInterval(min = 0, max = 10) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const addAntiSpamField = function addAntiSpamField() {
    const submitButton = footerForm.querySelector('button[type="submit"]');
    const a = randomInt();
    const b = randomInt();
    const container = document.createElement('div');

    antiSpamAnswer = a + b;

    container.classList.add('form-group');
    container.innerHTML = `
        <label for="footerFormSpamCheck" class="control-label">Please verify you're human. ${a} + ${b} = [?]</label>
        <input class="form-control"
                name="footerFormSpamCheck"
                id="footerFormSpamCheck"
                required />
    `;

    footerForm.insertBefore(container, submitButton);
    antiSpamField = container.querySelector('#footerFormSpamCheck');
};

let isSubmitting = false;
const handleFormSubmit = function handleContactFormSubmitEvent(e) {
    const submitTime = Date.now();
    e.preventDefault();

    if (submitTime - loadedTime <= 3000 && !antiSpamField) {
        addAntiSpamField();
        antiSpamField.scrollIntoView({ behavior: "smooth" });
        return;
    }

    if (antiSpamField) {
        const userAnswer = antiSpamField.value ? Number(antiSpamField.value) : undefined;
        if (antiSpamAnswer !== userAnswer) {
            antiSpamField.scrollIntoView({ behavior: "smooth" });
            return;
        }
    }

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

    fetch('/api/message/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
    })
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

footerForm.addEventListener('submit', handleFormSubmit);
