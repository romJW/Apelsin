import { makeAutoObservable } from 'mobx';
import { CustomerFilter } from 'types/filters';

class FilterStore {
    filter: CustomerFilter = {
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

    changeBy = (sort: CustomerFilter['sortBy']) => {
        this.filter.sortBy = sort;
    };

    changeQuery = (query: string) => {
        this.filter.query = query;
    }

    changeDir = (dir: CustomerFilter['sortDirection']) => {
        this.filter.sortDirection = dir;
    };

    changeCreatedDates = (start: string, end: string) => {
        this.filter.createdDates = [start, end];
    };

    changeUpdatedDates = (start: string, end: string) => {
        this.filter.updatedDates = [start, end];
    };

    changeDeleted = (value: CustomerFilter['deleted']) => {
        this.filter.deleted = value;
    };
}

export { FilterStore };