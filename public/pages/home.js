export default function home() {
    let activeItemIndex = 0;
    let prevItemIndex = 0;
    const transitionDelay = 1200;
    const nextWord = function displayNextWordInCarousel() {
        prevItemIndex = activeItemIndex;
        activeItemIndex = (prevItemIndex + 1) % adjectivesCount;
        const previousItem = adjectives[prevItemIndex];
        const activeItem = adjectives[activeItemIndex];
        previousItem.classList.add('leaving');
        activeItem.classList.add('entering');
    };
    const afterTransition = function afterTransitionComplete({ target }) {
        if (target.classList.contains('leaving')) {
            target.classList.remove('in', 'leaving');
        } else if (target.classList.contains('entering')) {
            target.classList.add('in');
            target.classList.remove('entering');
            setTimeout(nextWord, transitionDelay);
        }
    };
    const adjCarousel = document.querySelector('[data-adjectives]');
    const adjectives = adjCarousel.dataset.adjectives.split(',').map((adj, i) => {
        const adjEl = document.createElement('span');

        adjEl.innerText = adj;
        adjEl.classList.add('carousel-item');

        if (i === 0) adjEl.classList.add('in');

        adjEl.addEventListener('transitionend', afterTransition);
        adjEl.addEventListener('animationend', afterTransition);

        return adjEl;
    });
    const adjectivesCount = adjectives.length;

    prevItemIndex = adjectivesCount;
    adjCarousel.classList.add('active');
    adjCarousel.innerHTML = '';
    adjectives.forEach((adjEl) => {
        adjCarousel.appendChild(adjEl);
    });

    setTimeout(nextWord, transitionDelay);
}
