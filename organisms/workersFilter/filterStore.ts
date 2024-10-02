import { makeAutoObservable } from 'mobx';
import { WorkerFilter } from 'types/filters';


class FilterStore {
    filter: WorkerFilter = {
        query: '',
        sortBy: 'name',
        sortDirection: 'asc',
        createdDates: ['', ''],
        updatedDates: ['', ''],
        balance: ['0', '99999'],
        deleted: 'null',
    };
    constructor() {
        makeAutoObservable(this);
    }

    changeQuery = (query: string) => {
        this.filter.query = query;
    }

    changeBy = (sort: WorkerFilter["sortBy"]) => {
        this.filter.sortBy = sort;
    };
    changeDir = (dir: 'asc' | 'desc') => {
        this.filter.sortDirection = dir;
    };

    changeCreatedDates = (start: string, end: string) => {
        this.filter.createdDates = [start, end];
    };

    changeUpdatedDates = (start: string, end: string) => {
        this.filter.updatedDates = [start, end];
    };

    changeDeleted = (value: WorkerFilter["deleted"]) => {
        this.filter.deleted = value;
    };

    changeBalance = (min: number, max: number) => {
        this.filter.balance = [min.toString(), max.toString()];
    }
}

export { FilterStore };
