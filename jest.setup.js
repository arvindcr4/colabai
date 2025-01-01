// Mock chrome API
global.chrome = {
  runtime: {
    getURL: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
};

// Mock document.querySelector and related functions
document.querySelector = jest.fn();
document.querySelectorAll = jest.fn();
document.getElementById = jest.fn();

// Mock window functions
window.scrollTo = jest.fn();
