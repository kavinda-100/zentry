export function useLocalStorage() {
  function setItemToLocalStorage<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getItemFromLocalStorage<T>(key: string): T | null {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  }

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
