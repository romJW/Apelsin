import { makeAutoObservable } from 'mobx';
import { NotificationFilter } from 'types/filters';


class FilterStore {
    filter: NotificationFilter = {
        sortBy: 'name',
        sortDirection: 'asc',
        createdDates: ['', ''],
        deleted: 'null',
    };
    constructor() {
        makeAutoObservable(this);
    }


    changeBy = (sort: NotificationFilter["sortBy"]) => {
        this.filter.sortBy = sort;
    };
    changeDir = (dir: 'asc' | 'desc') => {
        this.filter.sortDirection = dir;
    };


    changeDeleted = (value: NotificationFilter["deleted"]) => {
        this.filter.deleted = value;
    };

}

export { FilterStore };