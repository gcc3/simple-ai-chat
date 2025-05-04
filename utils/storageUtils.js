// Utilities for localStorage and sessionStorage management

export function initializeStorage() {
  // Set default localStorage values
  if (localStorage.getItem("_up") === null) localStorage.setItem("_up", Date.now());
  if (localStorage.getItem("lang") === null) localStorage.setItem("lang", "en-US");  // by default use English
  if (localStorage.getItem("useStats") === null) localStorage.setItem("useStats", false);
  if (localStorage.getItem("useEval") === null) localStorage.setItem("useEval", false);
  if (localStorage.getItem("useStream") === null) localStorage.setItem("useStream", true);
  if (localStorage.getItem("useSpeak") === null) localStorage.setItem("useSpeak", false);
  if (localStorage.getItem("useLocation") === null) localStorage.setItem("useLocation", false);
  if (localStorage.getItem("fullscreen") === null) localStorage.setItem("fullscreen", "off");
  if (localStorage.getItem("theme") === null) localStorage.setItem("theme", "light");
  if (localStorage.getItem("passMask") === null) localStorage.setItem("passMask", true);
  if (localStorage.getItem("useSystemRole") === null) localStorage.setItem("useSystemRole", true);
  if (localStorage.getItem("history") === null) localStorage.setItem("history", JSON.stringify([]));  // command history

  // Set default sessionStorage values
  if (sessionStorage.getItem("memLength") === null) sessionStorage.setItem("memLength", 7);
  if (sessionStorage.getItem("model") === null) sessionStorage.setItem("model", "");
  if (sessionStorage.getItem("baseUrl") === null) sessionStorage.setItem("baseUrl", "");
  if (sessionStorage.getItem("historyIndex") === null) sessionStorage.setItem("historyIndex", -1);  // command history index
}

export function addStoreToSessionStorage(storeName) {
  const storeLocalStorage = sessionStorage.getItem("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  if (!localStorageStores.includes(storeName)) {
    sessionStorage.setItem("stores", localStorageStores.concat(storeName).join(","));
  }
}

export function removeStoreFromSessionStorage(storeName) {
  const storeLocalStorage = sessionStorage.getItem("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  if (localStorageStores.includes(storeName)) {
    sessionStorage.setItem("stores", localStorageStores.filter((store) => store !== storeName).join(","));
  }
}

export function isStoreActive(storeName) {
  const storeLocalStorage = sessionStorage.getItem("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  return localStorageStores.includes(storeName);
}

export function countStoresInSessionStorage() {
  const storeLocalStorage = sessionStorage.getItem("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  return localStorageStores.length;
}

export function getActiveStores() {
  const storeLocalStorage = sessionStorage.getItem("stores");
  const localStorageStores = storeLocalStorage.split(",").filter((store) => store !== "");
  return localStorageStores;
}
