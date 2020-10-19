import icons from './icons';
import { arrayFindIndex } from './utils';

const toastMessages = [];
const $toaster = document.createElement('div');

$toaster.classList.add('toaster');
document.body.appendChild($toaster);

const toastTemplate = (message, messageType) => `<div class="toast-message toast-${messageType} d-flex mb-3 py-2">
    <div class="px-3 py-1 flex-fill">${message}</div>
    <div>
        <button class="close-toast px-2 py-2 js-close-toast" type="button">${icons.x()}</button>
    </div>
</div>`;

class Toast {
    constructor(message = '', { messageType = 'error', autoClose = true, displayDuration = 5000 } = {}) {
        const toastWrapper = document.createElement('div');
        toastWrapper.innerHTML = toastTemplate(message, messageType);

        this.$el = toastWrapper.firstChild;
        this.$el.classList.add('toast-enter');

        this.$close = this.$el.querySelector('.js-close-toast');
        this.$close.classList.remove('js-close-toast');
        this.$close.addEventListener('click', () => {
            this.close();
        });

        if (autoClose) {
            setTimeout(() => {
                this.close();
            }, displayDuration);
        }

        toastMessages.push(this);
        $toaster.appendChild(this.$el);

        setTimeout(() => {
            this.$el.classList.remove('toast-enter');
        }, 100)
    }

    close() {
        const index = arrayFindIndex(toastMessages, toast => toast === this);
        this.$el.classList.add('toast-leave');
        setTimeout(() => {
            $toaster.removeChild(this.$el);
            toastMessages.splice(index, 1);
        }, 600);
    }
}

const show = function showToastMessage(message, { messageType, autoClose, displayDuration } = {}) {
    return new Toast(message, { messageType, autoClose, displayDuration });
};

export const success = (message, options = {}) => show(message, { ...options, messageType: 'success' });
export const warning = (message, options = {}) => show(message, { ...options, messageType: 'warning' });
export const error = (message, options = {}) => show(message, { ...options, messageType: 'error' });
export const closeAll = () => {
    toastMessages.forEach((message) => {
        message.close();
    });
};
