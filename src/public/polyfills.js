import 'core-js/features/promise';

if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        const matches = (this.document || this.ownerDocument).querySelectorAll(s);
        let el = this;
        let i;

        do {
            i = matches.length;
            while (--i >= 0 && matches.item(i) !== el) {};
        } while ((i < 0) && (el = el.parentElement));

        return el;
    };
}
