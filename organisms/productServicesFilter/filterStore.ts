import { makeAutoObservable } from 'mobx';
import { ProductFilter } from 'types/filters';

class FilterStore {
    private _filter: ProductFilter = {
        query: '',
        sortBy: 'name',
        sortDirection: 'asc',
        createdDates: ['', ''],
        updatedDates: ['', ''],
        price: ['0', '99999'],
        deleted: 'null',
    };

    constructor() {
        makeAutoObservable(this);
    }

    get filter() {
        return this._filter;
    }

    changeBy = (sort: ProductFilter['sortBy']) => {
        this._filter.sortBy = sort;
    };

    changeDir = (dir: ProductFilter['sortDirection']) => {
        this._filter.sortDirection = dir;
    };

    changeCreatedDates = (start: string, end: string) => {
        this._filter.createdDates = [start, end];
    };

    changeUpdatedDates = (start, end) => {
        this._filter.updatedDates = [start, end];
    };

    changeDeleted = (value: ProductFilter['deleted']) => {
        this._filter.deleted = value;
    };

    changePrice = (min: number, max: number) => {
        this._filter.price = [min.toString(), max.toString()];
    };

    changeQuery = (value: string) => {
        this._filter.query = value;
    };
}

export { FilterStore };
