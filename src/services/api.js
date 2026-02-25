import axios from "axios";
import moment from "moment";

const accessTokenKey = 'access_token';
const refreshTokenKey = 'refresh_token';
const expireDateKey = 'expire_date';

const getConfig = () => JSON.parse(localStorage.getItem('dadosConexao') || '{}');

const api = axios.create();

// Interceptor para injetar o Token em cada requisição
api.interceptors.request.use(async (config) => {
    const server = getConfig().servidor;
    if (server) {
        config.baseURL = `${server}/api`;
    }

    let token = localStorage.getItem(accessTokenKey);
    const expireDate = localStorage.getItem(expireDateKey);

    // Lógica de expiração do legado: se expirou, tenta o refresh
    if (token && expireDate && moment(expireDate).isBefore(moment())) {
        console.log("Token expirado, tentando refresh...");
        token = await authService.refresh();
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
});

export const authService = {
    // Gerar novo Token (Login/Auth inicial)
    async getToken() {
        const config = getConfig();
        
        if (!config.servidor || !config.clienteId || !config.usuario) {
            throw new Error('Configurações de conexão incompletas.');
        }

        const url = config.servidor.endsWith('/') 
            ? `${config.servidor}api/token` 
            : `${config.servidor}/api/token`;
        const params = new URLSearchParams();

        params.append('grant_type', 'password');
        params.append('client_id', config.clienteId);
        params.append('client_secret', config.clienteSecret);
        params.append('username', config.usuario);
        params.append('password', config.senha);

        try {
            const response = await axios.post(url, params);
            this.updateToken(response.data);
            return response.data;
        } catch (error) {
            console.error("Erro ao obter token:", error);
            throw error;
        }
    },

    // Refresh Token
    async refresh() {
        const config = getConfig();
        const refreshToken = localStorage.getItem(refreshTokenKey);

        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('client_id', config.clienteId);
        params.append('client_secret', config.clienteSecret);
        params.append('refresh_token', refreshToken);

        try {
            const response = await axios.post(url, params);
            this.updateToken(response.data);
            return response.data.access_token;
        } catch (error) {
            // Se o refresh falhar, limpa tudo e desloga
            this.updateToken(null);
            throw error;
        }
    },

    // Migração da "Mutation" para persistência no React
    updateToken(data) {
        if (!data) {
            localStorage.removeItem(accessTokenKey);
            localStorage.removeItem(refreshTokenKey);
            localStorage.removeItem(expireDateKey);
            return;
        }

        localStorage.setItem(accessTokenKey, data.access_token);
        localStorage.setItem(refreshTokenKey, data.refresh_token);

        if (data.expires_in) {
            const secs = 5 * 60; // margem de segurança de 5 min
            const expireDate = moment().add(data.expires_in - secs, 's').format();
            localStorage.setItem(expireDateKey, expireDate);
        }
    }
};

export default api;