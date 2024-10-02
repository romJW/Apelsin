import { makeAutoObservable } from 'mobx';
import { OrderFilter } from 'types/filters';

class FilterStore {
    filter: OrderFilter = {
        query: '',
        sortBy: 'name',
        sortDirection: 'asc',
        createdDates: ['', ''],
        updatedDates: ['', ''],
        deleted: 'null',
    };
    constructor() {
        makeAutoObservable(this);
    }

    changeBy = (sort: OrderFilter['sortBy']) => {
        this.filter.sortBy = sort;
    };

    changeQuery = (query: string) => {
        this.filter.query = query;
    }

    changeDir = (dir: OrderFilter['sortDirection']) => {
        this.filter.sortDirection = dir;
    };

    changeCreatedDates = (start: string, end: string) => {
        this.filter.createdDates = [start, end];
    };

    changeUpdatedDates = (start: string, end: string) => {
        this.filter.updatedDates = [start, end];
    };

    changeDeleted = (value: OrderFilter['deleted']) => {
        this.filter.deleted = value;
    };
}

export { FilterStore };