export function setItemToLocalStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getItemFromLocalStorage<T>(key: string): T | null {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : null;
}

export function removeItemFromLocalStorage(key: string) {
  localStorage.removeItem(key);
}

export function clearLocalStorage() {
  localStorage.clear();
}

export function useLocalStorage() {
  return {
    setItemToLocalStorage,
    getItemFromLocalStorage,
    removeItemFromLocalStorage,
    clearLocalStorage,
  };
}
