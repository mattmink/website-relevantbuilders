export const arrayFindIndex = (arr, condition) => {
    for (let i = 0; i < arr.length; i++) {
        if (condition(arr[i], i, arr)) return i;
    }
    return -1;
}

export const arrayFind = (arr, condition) => {
    return arr[arrayFindIndex(arr, condition)];
}

export const arrayFrom = list => Array.prototype.slice.call(list);
