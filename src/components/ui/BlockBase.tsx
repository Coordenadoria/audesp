
import React from 'react';
import { GeminiUploader } from '../GeminiUploader';

// --- Shared Styles ---
export const CLS = {
    INPUT: "w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500",
    CHECKBOX: "w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors",
    LABEL: "block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider",
    SECTION: "bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500",
    BTN_ADD: "h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2 cursor-pointer",
    BTN_REMOVE: "text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wide transition-colors px-2 py-1 rounded hover:bg-red-50 cursor-pointer",
    BTN_SUB: "h-7 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold",
    HEADER_TITLE: "text-xl font-bold text-slate-800",
    HEADER_DIVIDER: "flex justify-between items-center mb-6 pb-4 border-b border-slate-100",
    GRID_CONTAINER: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5",
    FLEX_ROW_CENTER: "flex items-center gap-3",
};

export const SectionHeader = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className={CLS.HEADER_DIVIDER}>
        <h2 className={CLS.HEADER_TITLE}>{title}</h2>
        <div className="flex gap-2">{children}</div>
    </div>
);

export const InputGroup = ({ label, error, children }: { label: string, error?: string, children?: React.ReactNode }) => (
    <div className="mb-1">
        <label className={CLS.LABEL}>{label}</label>
        {children}
        {error && <div className="text-red-600 text-[10px] font-bold uppercase mt-1 animate-pulse">{error}</div>}
    </div>
);

// --- Block Factory Props ---
interface ArrayBlockProps<T> {
    title: string;
    items: T[];
    newItemTemplate: T;
    onAdd: (item: T) => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: string, value: any) => void;
    renderItem: (item: T, index: number, update: (field: string, val: any) => void) => React.ReactNode;
    ocrSection?: string;
    onOcrData?: (data: any) => void;
    errors?: string[]; // Errors passed from parent validation logic
}

export function ArrayBlock<T>({ 
    title, 
    items, 
    newItemTemplate, 
    onAdd, 
    onRemove, 
    onUpdate, 
    renderItem, 
    ocrSection,
    onOcrData
}: ArrayBlockProps<T>) {

    const handleOcr = (data: any) => {
        if (!data) return;
        
        // Strategy: if data is array, add all. if object, add one.
        if (ocrSection === 'relacao_empregados' && data.empregados && Array.isArray(data.empregados)) {
            data.empregados.forEach((emp: any) => onAdd(emp));
        } else if (onOcrData) {
            onOcrData(data); // Custom handler
        } else {
            // Default generic merge
            onAdd({ ...newItemTemplate, ...data });
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader title={title}>
                <button onClick={() => onAdd(newItemTemplate)} className={CLS.BTN_ADD}>+ Adicionar Item</button>
            </SectionHeader>
            
            {ocrSection && <GeminiUploader section={ocrSection as any} onDataExtracted={handleOcr} />}
            
            {items && items.length > 0 ? (
                items.map((item, idx) => (
                    <div key={idx} className={CLS.SECTION + " relative border-l-4 border-l-slate-400"}>
                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={() => onRemove(idx)} className={CLS.BTN_REMOVE}>🗑 Remover</button>
                        </div>
                        <div className="pt-2">
                             {renderItem(item, idx, (field, val) => onUpdate(idx, field, val))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                    <p className="text-slate-400 text-sm font-medium">Nenhum registro adicionado.</p>
                </div>
            )}
        </div>
    );
}

// --- Simple Field Wrapper ---
export const Field = ({ label, value, onChange, type = "text", error, options }: any) => (
    <InputGroup label={label} error={error}>
        {options ? (
            <select className={CLS.INPUT} value={value} onChange={e => onChange(e.target.value)}>
                {options.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        ) : (
            <input 
                type={type} 
                className={CLS.INPUT} 
                value={value} 
                onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} 
                step={type === 'number' ? "0.01" : undefined}
            />
        )}
    </InputGroup>
);
