import axios from "axios";

const accessTokenKey = 'access_token';

const getConfig = () => JSON.parse(localStorage.getItem('dadosConexao') || '{}');

const api = axios.create();

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now() - 30_000;
    } catch {
        return true;
    }
};

const renovarToken = async () => {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;

    try {
        const novoToken = await authService.getToken();
        processQueue(null, novoToken);
        return novoToken;
    } catch (error) {
        processQueue(error, null);
        throw error;
    } finally {
        isRefreshing = false;
    }
};

const AUTH_ERROR_CODES = new Set([401, 403]);

api.interceptors.request.use(async (config) => {
    const server = getConfig().servidor;
    if (server) {
        config.baseURL = `${server.replace(/\/$/, '')}/api`;
    }

    let token = localStorage.getItem(accessTokenKey);

    if (isTokenExpired(token)) {
        try {
            token = await renovarToken();
        } catch (error) {
            console.error("Não foi possível renovar o token antes da requisição:", error);
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const authService = {
    async getToken() {
        const config = getConfig();

        if (!config.servidor || !config.clienteId || !config.usuario || !config.senha || !config.clienteSecret) {
            alert("Configurações incompletas. Faça login novamente.");
            return null;
        }

        const url = `${config.servidor.replace(/\/$/, '')}/api/token`;

        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', config.clienteId);
        params.append('client_secret', config.clienteSecret);
        params.append('username', config.usuario);
        params.append('password', config.senha);

        try {
            const response = await axios.post(url, params);
            localStorage.setItem(accessTokenKey, response.data.access_token);
            return response.data.access_token;
        } catch (error) {
            console.error("Erro ao obter token:", error);
            throw error;
        }
    },
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        const deveRenovar =
            !originalRequest._retry &&
            (AUTH_ERROR_CODES.has(status) || !error.response);

        if (deveRenovar) {
            originalRequest._retry = true;

            try {
                const novoToken = await renovarToken();

                if (novoToken) {
                    originalRequest.headers.Authorization = `Bearer ${novoToken}`;
                    originalRequest.baseURL = `${getConfig().servidor.replace(/\/$/, '')}/api`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error("Falha ao renovar o token:", refreshError);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;