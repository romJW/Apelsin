import { makeAutoObservable } from "mobx"

type TTransactionFilter = {
    paymentMethodId: null | 1 | 2 | 3,
    createdDates: [string, string],
}

class FilterStore {
    private _filter: TTransactionFilter = {
        paymentMethodId: null,
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

    changePaymentMethodId = (id: TTransactionFilter['paymentMethodId']) => {
        this._filter.paymentMethodId = id;
    };
}

export { TTransactionFilter, FilterStore };