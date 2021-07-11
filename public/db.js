let db;
let version = 1;

const req = indexedDB.open('budgetDb', version);

req.onupgradeneeded = function (event) {
    db = event.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('budgetStore', { autoIncrement: true });
    }
};

req.onerror = function (event) {
    console.log(`There was an error with your database request: ${event.target.errorCode}`);
}

function checkDb() {
    let transaction = db.transaction(['budgetStore'], 'readwrite');
    const store = transaction.objectStore('budgetStore');
    const getAllRecords = store.getAll();

    getAllRecords.onsuccess = async function () {
        if (getAllRecords.result.length > 0) {
            let data = await fetch('api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAllRecords.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                }
            });

            let res = await data.json();

            const clearStore = (e) => {
                if (e.length !== 0) {
                    transaction = db.transaction(['budgetStore'], 'readwrite');
                    const currentStore = transaction.objectStore('budgetStore');
                    currentStore.clear();
                    console.log('store cleared');
                }
            }

            clearStore(res);
        }        
    }
}

req.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        checkDb();
    }
}

const saveRecord = (entry) => { 
    const transaction = db.transaction(['budgetStore'], 'readwrite');
    const store = transaction.objectStore('budgetStore');
    store.add(entry);
}

window.addEventListener('online', checkDb);