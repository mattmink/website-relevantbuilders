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


    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            console.log(entry);
            // if (entry.intersectionRatio > prevRatio) {
            //     entry.target.style.backgroundColor = increasingColor.replace("ratio", entry.intersectionRatio);
            // } else {
            //     entry.target.style.backgroundColor = decreasingColor.replace("ratio", entry.intersectionRatio);
            // }

            // prevRatio = entry.intersectionRatio;
        });
    });
    observer.observe(document.querySelector('.home-section-3 .featured-section-image'));

    prepareNextWord();
}
