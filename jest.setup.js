import "@testing-library/jest-dom";

// Polyfill for Web APIs in Jest environment
if (typeof global.Request === "undefined") {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === "string" ? input : input?.url || "";
      this.method = init.method || "GET";
      this.headers = new Headers(init.headers);
      this.body = init.body;
    }
  };
}

if (typeof global.Headers === "undefined") {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.map = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value);
        });
      }
    }

    get(name) {
      return this.map.get(name.toLowerCase());
    }

    set(name, value) {
      this.map.set(name.toLowerCase(), value);
    }

    has(name) {
      return this.map.has(name.toLowerCase());
    }
  };
}

// Polyfill for ResizeObserver (needed for Headless UI components)
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};
