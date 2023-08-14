type PopulateEmbeddedDoc<T, K extends string, P> = K extends keyof T ?
    Omit<T, K> & { [k in K]: P } :
    T & { [k in K]: P }

type PopulateVirtualDoc<T, K extends string, P> = T & { [k in K]: P };

export {
    PopulateEmbeddedDoc,
    PopulateVirtualDoc
}