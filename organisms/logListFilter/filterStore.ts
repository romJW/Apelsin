import { makeAutoObservable } from "mobx"

type TLogFilter = {
    subjectType: 
        null
        | 'App\\Models\\Api\\V1\\Crm'
        | 'App\\Models\\Api\\V1\\Invitation'
        | 'App\\Models\\Api\\V1\\CustomerProfile'
        | 'App\\Models\\Api\\V1\\WorkerProfile'
        | 'App\\Models\\Api\\V1\\Service'
        | 'App\\Models\\Api\\V1\\Product'
        | 'App\\Models\\Api\\V1\\File'
        | 'App\\Models\\Api\\V1\\Requisite', 
    createdDates: [string, string],
};

class FilterStore {
    private _filter: TLogFilter =  {
        subjectType: null,
        createdDates: ['', ''],
    }

    constructor() {
        makeAutoObservable(this);
    }

    get filter() {
        return this._filter;
    }

    changeCreatedDates = (start: string, end: string) => {
        this._filter.createdDates = [start, end];
    };

    changeSubjectType = (type: TLogFilter['subjectType']) => {
        this._filter.subjectType = type;
    };
}

export { TLogFilter, FilterStore };