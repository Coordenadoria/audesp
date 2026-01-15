
/**
 * DATA SANITIZER SERVICE
 * Normalizes AI/OCR output into strict Audesp formats.
 */

export const Patterns = {
    CPF: /(\d{3})\.?(\d{3})\.?(\d{3})-?(\d{2})/g,
    CNPJ: /(\d{2})\.?(\d{3})\.?(\d{3})\/?(\d{4})-?(\d{2})/g,
    DATE_BR: /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g,
    MONEY: /R\$\s?([\d.,]+)/g
};

export const Sanitizers = {
    /**
     * Removes non-digits. Returns 11 chars for CPF or 14 for CNPJ.
     */
    cleanDoc: (value: string | number | undefined): string => {
        if (!value) return "";
        const str = String(value).replace(/\D/g, "");
        return str;
    },

    /**
     * Tries to parse date from DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD
     */
    cleanDate: (value: string | undefined): string => {
        if (!value) return "";
        
        // If already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

        // Try DD/MM/YYYY
        const matchBR = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (matchBR) {
            const day = matchBR[1].padStart(2, '0');
            const month = matchBR[2].padStart(2, '0');
            const year = matchBR[3];
            return `${year}-${month}-${day}`;
        }

        return value; // Return original if unknown format (let validation catch it)
    },

    /**
     * Converts "R$ 1.234,56" or "1234.56" to float
     */
    cleanNumber: (value: string | number | undefined): number => {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        let str = String(value);
        
        // If format is Brazilian (1.234,56)
        if (str.includes(',') && !str.includes('US')) {
            str = str.replace(/\./g, '').replace(',', '.');
        } 
        // If contains currency symbol
        str = str.replace(/[^\d.-]/g, '');

        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }
};

/**
 * Recursive function to traverse the object and sanitize specific keys
 */
export function sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const key in obj) {
            const value = obj[key];
            
            if (key.includes('cpf') || key.includes('cnpj') || key.includes('documento_numero')) {
                newObj[key] = Sanitizers.cleanDoc(value);
            } else if (key.includes('data') || key === 'vigencia_data_inicial' || key === 'vigencia_data_final') {
                newObj[key] = Sanitizers.cleanDate(value);
            } else if (key.includes('valor') || key.includes('saldo') || key.includes('remuneracao') || key.includes('montante')) {
                newObj[key] = Sanitizers.cleanNumber(value);
            } else if (typeof value === 'object') {
                newObj[key] = sanitizeObject(value);
            } else {
                newObj[key] = value;
            }
        }
        return newObj;
    }
    return obj;
}
