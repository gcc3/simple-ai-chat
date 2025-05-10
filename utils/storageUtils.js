import { getSetting } from "../utils/settingsUtils.js";


export function addStoreToSessionStorage(storeName) {
  const storeLocalStorage = getSetting("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  if (!localStorageStores.includes(storeName)) {
    sessionStorage.setItem("stores", localStorageStores.concat(storeName).join(","));
  }
}

export function removeStoreFromSessionStorage(storeName) {
  const storeLocalStorage = getSetting("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  if (localStorageStores.includes(storeName)) {
    sessionStorage.setItem("stores", localStorageStores.filter((store) => store !== storeName).join(","));
  }
}

export function isStoreActive(storeName) {
  const storeLocalStorage = getSetting("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  return localStorageStores.includes(storeName);
}

export function countStoresInSessionStorage() {
  const storeLocalStorage = getSetting("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  return localStorageStores.length;
}

export function getActiveStores() {
  const storeLocalStorage = getSetting("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  return localStorageStores;
}
