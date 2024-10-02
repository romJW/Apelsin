import { LoginAsOptions } from '@enums/loginAsOptions';
import { makeAutoObservable } from 'mobx';

class Store {
    loginAs: string = (localStorage.getItem('loginAs')) || null;
    
    constructor() {
        makeAutoObservable(this);
    }

    setLoginAs = (role: LoginAsOptions) => {
       this.loginAs = role;
       localStorage.setItem('loginAs', role.toString());
    };
}

const SecurityStore = new Store();

export { SecurityStore };
