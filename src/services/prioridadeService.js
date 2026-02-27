import api from "./api";

export const prioridadeService = {
    async getPrioridades() {
        try {
            const response = await api.get('/prioridades');
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar prioridades:", error);
            return null;
        }
    }
}