export type User={
    id:number;
    name:string;
    username:string;
    email:string;

    address:{
        street:string;
        suite:string;
        city:string;
        zipcode:string;
        geo:{
            lat:string;
            lng:string;
        };
    };
    phone: string | null;
    website: string | null;

    company:{
        name: string;
        catchPhrase: string;
        bs: string;
    };
};