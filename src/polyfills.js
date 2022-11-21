if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest = function (s) {
        const matches = (this.document || this.ownerDocument).querySelectorAll(s);
        let el = this;
        let i;

        do {
            i = matches.length;
            while (--i >= 0 && matches.item(i) !== el) { };
        } while ((i < 0) && (el = el.parentElement));

        return el;
    };
}

const validateArray = (t, p) => {
    if (t == null) throw new TypeError('"this" is null or not defined');
    if (typeof p !== 'function') throw new TypeError('predicate must be a function');
    const o = Object(this);
    const len = o.length >>> 0;
    return { o, len };
}

if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value(predicate) {
            const { o, len } = validateArray(this, predicate);
            const thisArg = arguments[1];
            let k = 0;

            while (k < len) {
                const kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) return kValue;
                k++;
            }
            return undefined;
        },
        configurable: true,
        writable: true
    });
}

if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
        value(predicate) {
            const { o, len } = validateArray(this, predicate);
            const thisArg = arguments[1];
            let k = 0;

            while (k < len) {
                const kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) return k;
                k++;
            }

            return -1;
        },
        configurable: true,
        writable: true
    });
}

if (!Array.prototype.from) {
    Object.defineProperty(Array.prototype, 'from', {
        value(predicate) {
            validateArray(this, predicate);
            return Array.prototype.slice.call(this);
        },
        configurable: true,
        writable: true
    });
}
