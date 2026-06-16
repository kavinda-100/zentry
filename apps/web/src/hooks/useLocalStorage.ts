export function useLocalStorage() {
  function setItemToLocalStorage(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  const getItemFromLocalStorage = (key: string) => {
    return localStorage.getItem(key);
  };

  function removeItemFromLocalStorage(key: string) {
    localStorage.removeItem(key);
  }

  function clearLocalStorage() {
    localStorage.clear();
  }

  return {
    setItemToLocalStorage,
    getItemFromLocalStorage,
    removeItemFromLocalStorage,
    clearLocalStorage,
  };
}
