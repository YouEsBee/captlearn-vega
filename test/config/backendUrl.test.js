const {backendUrl} = require('../../backendUrl');

describe('the backend address the app is built with', () => {
  it('comes from BACKEND_URL in the environment first', () => {
    const dotenv = 'BACKEND_URL=https://from-file.example.com\n';
    expect(backendUrl({BACKEND_URL: 'https://captlearn.example.com'}, dotenv)).toBe(
      'https://captlearn.example.com',
    );
  });

  it('otherwise comes from the .env file', () => {
    const dotenv = '# where the TV finds the backend\r\nOTHER=1\r\nBACKEND_URL = "http://192.168.1.10:8080"\r\n';
    expect(backendUrl({}, dotenv)).toBe('http://192.168.1.10:8080');
  });

  it('loses a trailing slash, so paths join on cleanly', () => {
    expect(backendUrl({BACKEND_URL: 'https://captlearn.example.com/ '}, '')).toBe(
      'https://captlearn.example.com',
    );
  });

  it('is empty when neither sets it', () => {
    expect(backendUrl({}, '')).toBe('');
    expect(backendUrl({BACKEND_URL: ''}, '# BACKEND_URL=http://old.example.com')).toBe('');
  });
});
