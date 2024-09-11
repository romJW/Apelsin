function throttle(fn, timeout) {
    let timer = null;

    return function perform(...args) {
        if (timer) return;

        timer = setTimeout(() => {
            fn(...args);

            clearTimeout(timer);
            timer = null;
        }, timeout);
    };
}

function debounce(fn: (...args: unknown[]) => void, ms: number) {
    let timer: NodeJS.Timeout | null = null;

    return (...args: any[]) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn(...args);
        }, ms);
    };
}

export { throttle, debounce };