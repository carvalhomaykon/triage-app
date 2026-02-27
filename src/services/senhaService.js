import api from "./api";

export const senhaService = {
    async gerarSenha(dados) {
        try {
            const response = await api.post('/distribui', dados);
            return response.data;
        } catch (error) {
            console.error("Erro ao gerar senha:", error);
            return null;
        }
    },

    async exibirSenha(ticket) {
        try {
            const response = await api.get(`/print/${ticket.id}`, {
                headers: {
                    'X-Hash': ticket.hash
                }
            });
            return response.data;
        } catch (error) {
            console.error("Erro ao exibir senha:", error);
            return null;
        }
    }
}