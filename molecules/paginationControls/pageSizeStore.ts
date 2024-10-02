import { makeAutoObservable } from 'mobx';

class PageSizeStore {
    pS: number = Number(localStorage.getItem('pageSize')) || 10;
    constructor() {
        makeAutoObservable(this);
    }

    changePS = (value: number) => {
        this.pS = value;
        localStorage.setItem('pageSize', value.toString());
    };
}

const store = new PageSizeStore();

export { store };
