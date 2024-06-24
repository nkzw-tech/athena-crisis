const namespace = '$$AC$$';

export default {
  clear() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(namespace)) {
        localStorage.removeItem(key);
      }
    }
  },

  get(key: string) {
    return localStorage.getItem(`${namespace}${key}`);
  },

  set(key: string, value: string) {
    if (value === null) {
      localStorage.removeItem(`${namespace}${key}`);
    } else {
      localStorage.setItem(`${namespace}${key}`, value);
    }
  },
};
