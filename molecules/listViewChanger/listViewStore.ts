import { makeAutoObservable } from 'mobx';

class ViewStore {
    col: number = Number(localStorage.getItem('listViewMode')) || 1;
    constructor() {
        makeAutoObservable(this);
    }

    changeCol = (value: number) => {
        this.col = value;
        localStorage.setItem('listViewMode', value.toString());
    };
}

const columnViewStore = new ViewStore();


export { columnViewStore };