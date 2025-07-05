const request = indexedDB.open('ShopDB', 1);
request.onupgradeneeded = e => {
  db = e.target.result;
  if (!db.objectStoreNames.contains('users')) {
    db.createObjectStore('users', { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains('products')) {
    db.createObjectStore('products', { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains('stores')) {
    db.createObjectStore('stores', { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains('campaigns')) {
    db.createObjectStore('campaigns', { keyPath: 'id' });
  }
};
request.onsuccess = e => {
  db = e.target.result;
  loadProducts();
  showSection('shop'); // default to profile on load
};

function loadDbVals(dbName, filter = '', value = '') {
  const tx = db.transaction(dbName, 'readonly');
  const data = tx.objectStore(dbName);
  const request = data.getAll() 

  request.onsuccess = () => {
    let items = request.result;
    if (filter && value !== null) {
      items = items.filter(item => item[filter] === value || item[filter] === '');
    }
    const tbody = document.querySelector('#' + dbName + '-table tbody');
    tbody.innerHTML = '';
    items.forEach(u => {
      const tr = document.createElement('tr');
      const ky = Object.keys(u);

      let tblFields = "";
      Object.entries(u).forEach(([key,val]) => {
        tblFields += `<td data-field="${key}">${val}</td>`;
      });
      tr.innerHTML = tblFields + `<td>
          <button class="action-btn save-btn" onclick="setItems(this,'${dbName}')">Select</button>
          <button class="action-btn edit-btn" onclick="setItems(this,'${dbName}')">Edit</button>
          <button class="action-btn delete-btn" onclick="setItems(this,'${dbName}')">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }
  request.onerror = () => {
    console.log("No Stores to populate");
  }
}

function setItems(button,dbName) {
  const tr = button.parentElement.parentElement;
  const btnText = button.innerText;
  const cmpnNam = (currentCampaign === null) ? '' : 'campaign';
  const cmpnVal = (currentCampaign === null) ? '' : currentCampaign.id;
  

  for (let i=1; i<tr.children.length-1; i++) {
    let idCell = tr.children[0];
    let nameCell = tr.children[i];
    if (btnText === "Edit") { 
      button.innerText = "Save" 
      nameCell.contentEditable = "true";
      if (i === 1) { nameCell.focus(); }
    } else if (btnText === "Save") {  
      nameCell.contentEditable = "false";
      button.innerText = "Edit"
      
      let bulkArray = `{`;
      for (let j=0; j<tr.children.length-1; j++) {
          if (j !== 0) { bulkArray += ','; }
          if (!isNaN(Number(tr.children[j].innerText)) && tr.children[j].innerText.trim() !== '') {
            bulkArray += `"${tr.children[j].attributes[0].nodeValue}":"${Number(tr.children[j].innerText).toFixed(2)}"`;
          } else {
            bulkArray += `"${tr.children[j].attributes[0].nodeValue}":"${tr.children[j].innerText.trim()}"`;
          }
      }
      bulkArray += "}";

      updateToDb(dbName, tr.children[0].innerText, JSON.parse(bulkArray));
      loadDbVals(dbName, cmpnNam, cmpnVal);
      return;
    } else if (btnText === "Delete" && i===1) {  
      delFromDb(dbName, tr.children[0].innerText);
      loadDbVals(dbName, cmpnNam, cmpnVal);
      return;
    } else if (btnText === "Select") {  
      let id = idCell.innerText;
      getItem(dbName,id); 
      let fieldName = 'campaign';
      if (dbName === 'campaigns') { fieldName = 'id'; }
      let cmpgnVal = tr.querySelectorAll(`[data-field="${fieldName}"]`)[0].innerText;
      //loadDbVals('campaigns', 'id', cmpgnVal); 
      loadDbVals('stores', 'campaign', cmpgnVal);
      loadDbVals('users', 'campaign', cmpgnVal); 
      if (dbName === 'stores') { 
        loadDbVals('products', 'store', id); 
        loadProducts('products', 'store', id);
      }
      renderStoreProducts();
      return;
    }
  }
}
function getItem(dbName,id) {
  const tx = db.transaction(dbName, 'readonly');
  tx.objectStore(dbName).get(id).onsuccess = e => {
    if (dbName === 'users') { 
      selectUser(dbName
        , e.target.result.id
        , e.target.result.name
        , e.target.result.balance
        , e.target.result.currency
        , e.target.result.campaign
      ); 
    } else if (dbName === 'campaigns') { 
      selectCampaign(dbName
        , e.target.result.id
        , e.target.result.name
      );
    } else if (dbName === 'stores') { 
      selectStore(dbName
        , e.target.result.id
        , e.target.result.name
      );
    }
  }
}
function getAllItems(dbName) {
  const tx = db.transaction(dbName, 'readonly');
  tx.objectStore(dbName).getAll().onsuccess = e => { return e.target.result }
}
function getSelectItems(dbName, field = null, value = null) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(dbName, 'readonly');
    const store = tx.objectStore(dbName);
    const request = store.getAll();

    request.onsuccess = e => {
      let results = e.target.result;
      if (field && value !== null) {
        results = results.filter(item => item[field] === value);
      }
      resolve(results);
    };

    request.onerror = e => {
      reject(e.target.error);
    };
  });
}
function delFromDb(dbName, id) {
  const tx = db.transaction(dbName, 'readwrite');
  const store = tx.objectStore(dbName);
  const request = store.delete(id);
  request.onsuccess = () => {
    console.log('Item deleted successfully!');
  };
  request.onerror = (err) => {
    console.error('Error deleting item:', err);
  };

}

function updateToDb(dbName, id, bulkArray) {
  const tx = db.transaction(dbName, 'readwrite');
  const store = tx.objectStore(dbName);
  const request = store.get(id);

  request.onsuccess = (event) => {
    const data = event.target.result; // Get the item data

    if (data) { // Check if the item was found
      // Modify the data properties (replace with your actual changes)
      for (const key in bulkArray) {
        if (bulkArray.hasOwnProperty(key)) {
          const currVal = bulkArray[key].toString().trim();
          if (!isNaN(Number(bulkArray[key])) && currVal !== '') {
            data[key] = Number(bulkArray[key]).toFixed(2);
          } else {
            data[key] = bulkArray[key].trim();
          }
        }
      }
      const putRequest = store.put(data); // Put the modified item back

      putRequest.onerror = (event) => {
        console.error("Error updating item:", event.target.error); // Handle errors
      };

      putRequest.onsuccess = (event) => {
        console.log("Item updated successfully!");
      };
    } else {
      console.warn("Item not found with key:", itemKeyToUpdate);
    }
  };
  request.onerror = (err) => {
    console.error('Error retrieving item:', err);
  };

}

function addToDb(dbName, bulkArray) {
  const tx = db.transaction(dbName, 'readwrite');
  const store = tx.objectStore(dbName);
  bulkArray.forEach(p => {
    const id = generateId();
      if (dbName === 'products') {
        if (p.name !== '' && p.category !== '' && (typeof Number(p.price) === 'number' || Number(p.price) % 1 !== 0)) {
          store.put({
            id: id,
            name: p.name,
            description: p.description,
            category: p.category,
            frequency: p.frequency || '',
            price: Number(p.price).toFixed(2),
            store: p.store || '',
            url: p.url || ''
          });
      }
      } else if (dbName === 'users') {
        store.put({
          id: p.id,
          name: p.name,
          balance: Number(p.balance).toFixed(2),
          currency: p.currency,
          campaign: p.campaign
        });
      } else if (dbName === 'stores') {
        store.put({
          id: p.id,
          name: p.name,
          ownerId: p.owner,
          campaign: p.campaign
        });
      } else if (dbName === 'campaigns') {
        store.put({
          id: p.id,
          name: p.name,
          ownerId: p.owner
        });
      }
  });
  tx.oncomplete = () => {
    loadDbVals(dbName);
    document.getElementById('bulk-input').value = '';
  };
}
