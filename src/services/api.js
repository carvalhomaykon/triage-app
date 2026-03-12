import axios from "axios";
import moment from "moment";
import { useNavigate } from "react-router-dom";

const accessTokenKey = 'access_token';

const getConfig = () => JSON.parse(localStorage.getItem('dadosConexao') || '{}');

const api = axios.create();

api.interceptors.request.use(async (config) => {
    const server = getConfig().servidor;
    if (server) {
        config.baseURL = `${server}/api`;
    }

    let token = localStorage.getItem(accessTokenKey);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
});

export const authService = {
    async getToken() {
        const config = getConfig();

        if (!config.servidor || !config.clienteId || !config.usuario) {
            alert("Configurações incompletas. Faça login novamente.")
            return;
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
            localStorage.setItem(accessTokenKey, response.data.access_token)
            return response.data;
        } catch (error) {
            console.error("Erro ao obter token:", error);
            throw error;
        }
    },
};

export default api;