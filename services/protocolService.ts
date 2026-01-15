
export interface ProtocoloRegistro {
    protocolo: string;
    dataHora: string;
    status: "Recebido" | "Rejeitado" | "Armazenado";
    tipoDocumento: string;
}

const STORAGE_KEY = "audesp_protocolos";

export function saveProtocol(registro: ProtocoloRegistro) {
    const current = getProtocols();
    current.unshift(registro);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function getProtocols(): ProtocoloRegistro[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}
