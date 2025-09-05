import { useToast } from '../context/ToastContext';

const SERVERS = [
    { name: 'Server-1 (Cepat)', latency: [200, 400] },
    { name: 'Server-2 (Optimal)', latency: [400, 700] },
    { name: 'Server-3 (Beban Tinggi)', latency: [700, 1200] },
];

export const useApi = () => {
    const { addToast } = useToast();

    const simulateApiCall = async <T>(
        action: () => Promise<T> | T,
        loadingMessage: string,
        successMessage?: string
    ): Promise<T> => {
        const server = SERVERS[Math.floor(Math.random() * SERVERS.length)];
        const delay = Math.random() * (server.latency[1] - server.latency[0]) + server.latency[0];

        addToast(`Menghubungkan ke ${server.name}...`, 'info');

        await new Promise(resolve => setTimeout(resolve, 200)); // Short delay before showing loading
        addToast(loadingMessage, 'info');

        try {
            await new Promise(resolve => setTimeout(resolve, delay));
            const result = await action();
            addToast(successMessage || 'Operasi berhasil', 'success');
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
            addToast(`Error: ${errorMessage}`, 'error');
            throw error;
        }
    };

    return { simulateApiCall };
};
