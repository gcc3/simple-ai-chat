export function addStoreToSessionStorage(storeName) {
  const storeLocalStorage = sessionStorage.getItem("store");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  if (!localStorageStores.includes(storeName)) {
    sessionStorage.setItem("store", localStorageStores.concat(storeName).join(","));
  }
}

export function removeStoreFromSessionStorage(storeName) {
  const storeLocalStorage = sessionStorage.getItem("store");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  if (localStorageStores.includes(storeName)) {
    sessionStorage.setItem("store", localStorageStores.filter((store) => store !== storeName).join(","));
  }
}

export function isStoreActive(storeName) {
  const storeLocalStorage = sessionStorage.getItem("store");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  return localStorageStores.includes(storeName);
}

export function countStoresInSessionStorage() {
  const storeLocalStorage = sessionStorage.getItem("store");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  return localStorageStores.length;
}
