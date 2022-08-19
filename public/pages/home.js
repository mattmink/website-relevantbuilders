import icons from '../icons';

const makeCarouselElement = function mapStringToCarouselElement(string, i) {
    const el = document.createElement('span',);

    el.innerText = string;
    el.classList.add('carousel-item');

    if (i === 0) el.classList.add('in');

    return el;
};

export default function home() {
    const transitionDelay = 1200;
    const adjCarousel = document.querySelector('[data-adjectives]');
    const adjectives = adjCarousel.dataset.adjectives.split(',').map(makeCarouselElement);
    let activeItemIndex = 0;
    let prevItemIndex = 0;

    const nextWord = function displayNextWordInCarousel() {
        prevItemIndex = activeItemIndex;
        activeItemIndex = (prevItemIndex + 1) % adjectives.length;
        const previousItem = adjectives[prevItemIndex];
        const activeItem = adjectives[activeItemIndex];
        previousItem.classList.add('leaving');
        activeItem.classList.add('entering');
    };
    const prepareNextWord = function prepareNextWord() {
        setTimeout(nextWord, transitionDelay);
    };
    const afterTransition = function afterTransitionComplete({ target }) {
        if (target.classList.contains('leaving')) {
            target.classList.remove('in', 'leaving');
        } else if (target.classList.contains('entering')) {
            target.classList.add('in');
            target.classList.remove('entering');
            prepareNextWord();
        }
    };

    adjCarousel.addEventListener('transitionend', afterTransition);
    adjCarousel.addEventListener('animationend', afterTransition);
    adjCarousel.classList.add('active');
    adjCarousel.innerHTML = '';
    adjectives.forEach((adjEl) => {
        adjCarousel.appendChild(adjEl);
    });

    prepareNextWord();

    const testimonials = Array.from(document.querySelectorAll('.testimonial'));
    const testimonialsSection = document.querySelector('.home-testimonials');
    let areInitialShown = false;


    testimonials.forEach((testimonial) => {
        testimonial.classList.add('out');
    });

    const showTestimonials = () => {
        const itemsToShow = testimonials.splice(0, 3);
        itemsToShow.forEach((testimonial) => {
            testimonial.classList.add('entering');
            testimonial.classList.remove('out');
            setTimeout(() => {
                testimonial.classList.add('in');
                setTimeout(() => {
                    testimonial.classList.remove('entering');
                    testimonial.classList.remove('in');
                }, 500);
            }, 300);
        });
    };

    const observer = new IntersectionObserver(([{ isIntersecting }]) => {
        console.log(isIntersecting)
        if (isIntersecting && !areInitialShown) {
            showTestimonials();
            observer.disconnect();
        }
    }, { threshold: 1 });
    observer.observe(testimonialsSection);

    if (testimonials.length > 3) {
        const showMoreButton = document.createElement('button');
        showMoreButton.innerHTML = `${icons.plus({ class: 'icon' })} load more testimonials`;
        showMoreButton.classList.add('btn', 'mt-4');
        testimonialsSection.appendChild(showMoreButton);
        showMoreButton.addEventListener('click', () => {
            showTestimonials();
            if (testimonials.length === 0) {
                testimonialsSection.removeChild(showMoreButton);
            }
        });
    }
}
