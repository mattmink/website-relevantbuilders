import icons from './icons';
import { getScrollbarWidth } from './utils';

// TODO: add previous/next navigation within gallery modal
document.addEventListener('click', (e) => {
    const galleryItem = e.target.closest('.gallery-item');

    if (!galleryItem) return;

    e.preventDefault();

    const galleryThumb = galleryItem.querySelector('.gallery-thumb');
    const fullImageSrc = galleryThumb.href;

    const galleryModal = document.createElement('div');
    galleryModal.classList.add('gallery-modal');
    galleryModal.setAttribute('tabindex', '-1');

    const galleryModalContent = document.createElement('div');
    galleryModalContent.classList.add('gallery-modal-content')

    const galleryModalLoading = document.createElement('div');
    galleryModalLoading.classList.add('gallery-modal-loading');
    galleryModalLoading.innerHTML = icons.refreshCw({ class: 'icon spinner' });

    const closeGalleryModal = () => {
        galleryModal.classList.add('leaving');
        setTimeout(() => {
            document.body.removeChild(galleryModal);
            document.body.style.paddingRight = '';
            document.body.classList.remove('gallery-modal-open');
            galleryItem.querySelector('.gallery-thumb').focus();
        }, 200);
    };
    const handleEscapeKey = ({ key }) => {
        if (key === 'Esc' || key === 'Escape') {
            closeGalleryModal();
            document.removeEventListener(handleEscapeKey);
        }
    };

    const galleryModalClose = document.createElement('button');
    galleryModalClose.classList.add('gallery-modal-close');
    galleryModalClose.innerHTML = icons.x({ class: 'icon' });
    galleryModalClose.addEventListener('click', closeGalleryModal);

    const galleryModalImage = document.createElement('img');
    galleryModalImage.src = fullImageSrc;
    galleryModalImage.addEventListener('load', () => {
        galleryModal.classList.add('gallery-modal-loaded');
    });

    const scrollBarWidth = getScrollbarWidth();
    if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.classList.add('gallery-modal-open');

    document.addEventListener('keydown', handleEscapeKey);
    galleryModal.addEventListener('click', ({ target }) => {
        if (target === galleryModal) closeGalleryModal();
    });

    galleryModalContent.appendChild(galleryModalClose);
    galleryModalContent.appendChild(galleryModalLoading);
    galleryModalContent.appendChild(galleryModalImage);
    galleryModal.appendChild(galleryModalContent);
    document.body.appendChild(galleryModal);
    galleryModal.focus();
});
