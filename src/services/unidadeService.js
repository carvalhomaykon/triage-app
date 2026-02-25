import api from "./api";

export const unidadeService = {
    async listarUnidades() {
        try {
            const response = await api.get('/unidades');
            return response.data;
        } catch (error) {
            console.error("Erro ao listar unidades e serviços:", error);
            return [];
        }
    },

    async listarServicosAtivos(unidadeId) {
        try {
            const response = await api.get(`/unidades/${unidadeId}/servicos`);
            return response.data;
        } catch (error) {
            console.error("Erro ao listar serviços ativos:", error);
            return [];
        }
    },

    async salvarServicosAtivos(servicosIds) {
        return await api.post('/configuracao/servicos-ativos', { servicosIds });
    }
}