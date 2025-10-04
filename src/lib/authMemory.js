// src/lib/authMemory.js
let token = null;
let user = null;

export const AuthMemory = {
    setSession: (newToken, newUser) => {
        token = newToken;
        user = newUser;
    },

    getToken: () => token,
    getUser: () => user,

    clearSession: () => {
        token = null;
        user = null;
    },
};
