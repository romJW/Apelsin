import { makeAutoObservable } from 'mobx';

class Store {
    lastOrderId: number = null;
    lastProductId: number = null;
    lastProductCategoryId: number = null;
    lastServiceId: number = null;
    lastServiceCategoryId: number = null;
    lastSpecialtyId: number = null;
    lastUserId: number = null;
    
    constructor() {
        makeAutoObservable(this);
    }

    setLastOrderId = (id: number | null) => {
       this.lastOrderId = id;
    };

    setLastProductId = (id: number | null) => {
       this.lastProductId = id;
    };

    setLastProductCategoryId = (id: number | null) => {
       this.lastProductCategoryId = id;
    };

    setLastServiceId = (id: number | null) => {
       this.lastServiceId = id;
    };

    setLastServiceCategoryId = (id: number | null) => {
       this.lastServiceCategoryId = id;
    };

    setLastSpecialtyId = (id: number | null) => {
       this.lastSpecialtyId = id;
    };
    
    setLastUserId = (id: number | null) => {
       this.lastUserId = id;
    };
}

const LastIdStore = new Store();

export { LastIdStore };
