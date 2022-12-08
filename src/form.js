import { error, success } from "./toast";
import icons from './icons';

const loadedTime = Date.now();
const footerForm = document.querySelector('#footerForm');
const emailRegex = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
const usPhoneRegex = /^(?:\+(?=1)){0,1}(1[ -]|1){0,1}(?:\((?=\d{3}\))[2-9](?!11)\d{2}\)|[2-9](?!11)\d{2})[ -]{0,1}[2-9](?!11)\d{2}[ -]{0,1}\d{4}$/;

let antiSpamField;
let antiSpamAnswer;

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

    const formData = {
        'form-name': '',
        name: '',
        contactInfo: '',
        location: '',
        description: '',
        honeypot: '',
    };

    Object.keys(formData).forEach((dataKey) => {
        formData[dataKey] = e.target.querySelector(`[name="${dataKey}"]`).value || '';
    });

    const contactInfoParts = formData.contactInfo.split(/[,\/: ]/).reduce((parts, part, i, original) => {
        const trimmed = part.trim();
        if (trimmed === '') return parts;

        // Check to see if we split up a phone number after the area code. If so, piece it back together.
        // Note: a negative lookbehind RegEx would solve this, but that's not fully supported yet...
        const previousIndex = parts.length - 1;
        const previous = parts[previousIndex] || '';
        const isSplitPhoneNumber = previous && previous.search(/^\(\d{3}\)$/) === 0;
        if(isSplitPhoneNumber) {
            parts[previousIndex] = `${previous} ${trimmed}`;
        } else {
            parts.push(trimmed);
        }
        return parts;
    }, []);
    const email = contactInfoParts.find(part => emailRegex.test(part));
    const phone = contactInfoParts.find(part => usPhoneRegex.test(part));
    const cleanPhone = !phone ? '' : phone.replace(/[^\d]/g, '');
    const formattedPhone = !phone ? '' : cleanPhone.slice(-10).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');

    formData.email = email;
    formData.phone = formattedPhone;

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
    if (formData.honeypot !== '') {
        afterSuccess();
        afterSubmit();
        return;
    }

    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(Object.entries(formData)).toString()
    })
        .then(({ status, statusText }) => {
            if (status >= 400) throw new Error(statusText);
            afterSuccess();
        })
        .catch((e) => {
            error('Hmmm. That didn\'t work. Please try sending your message again.')
        })
        .finally(() => {
            afterSubmit();
        });
}

footerForm.addEventListener('submit', handleFormSubmit);

