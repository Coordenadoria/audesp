import React from 'react';
import { Download, FileText, BarChart3 } from 'lucide-react';

interface ReportData {
  descritor?: any;
  contratos: any[];
  documentos_fiscais: any[];
  pagamentos: any[];
  resumo?: any;
}

const ReportGenerator: React.FC<{ data: ReportData }> = ({ data }) => {
  const generateDemonstrativoFinanceiro = () => {
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Demonstrativo de Execução Financeira</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { text-align: center; color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; }
            h2 { color: #003366; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #003366; color: white; padding: 10px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .total { font-weight: bold; background-color: #f0f0f0; }
            .currency { text-align: right; }
            .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Demonstrativo de Execução Financeira</h1>
          
          <h2>Documentos Fiscais</h2>
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Data</th>
                <th class="currency">Valor Bruto</th>
                <th class="currency">Deduções</th>
                <th class="currency">Valor Líquido</th>
              </tr>
            </thead>
            <tbody>
    `;

    let totalBruto = 0;
    let totalDeducoes = 0;

    data.documentos_fiscais.forEach((doc: any) => {
      const bruto = doc.valor_bruto || 0;
      const deducoes = (doc.desconto || 0) + (doc.retencao_ir || 0) + (doc.retencao_inss || 0) + (doc.retencao_iss || 0);
      const liquido = bruto - deducoes;
      
      totalBruto += bruto;
      totalDeducoes += deducoes;

      html += `
        <tr>
          <td>${doc.numero || '-'}</td>
          <td>${doc.tipo || '-'}</td>
          <td>${doc.data_emissao || '-'}</td>
          <td class="currency">R$ ${bruto.toFixed(2)}</td>
          <td class="currency">R$ ${deducoes.toFixed(2)}</td>
          <td class="currency">R$ ${liquido.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
            <tr class="total">
              <td colspan="3">TOTAL</td>
              <td class="currency">R$ ${totalBruto.toFixed(2)}</td>
              <td class="currency">R$ ${totalDeducoes.toFixed(2)}</td>
              <td class="currency">R$ ${(totalBruto - totalDeducoes).toFixed(2)}</td>
            </tr>
            </tbody>
          </table>

          <h2>Pagamentos Realizados</h2>
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Data</th>
                <th>Forma de Pagamento</th>
                <th class="currency">Valor</th>
              </tr>
            </thead>
            <tbody>
    `;

    let totalPagamentos = 0;

    data.pagamentos.forEach((pag: any) => {
      const valor = pag.valor_pago || 0;
      totalPagamentos += valor;

      html += `
        <tr>
          <td>${pag.numero_documento || '-'}</td>
          <td>${pag.data_pagamento || '-'}</td>
          <td>${pag.forma_pagamento || '-'}</td>
          <td class="currency">R$ ${valor.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
            <tr class="total">
              <td colspan="3">TOTAL</td>
              <td class="currency">R$ ${totalPagamentos.toFixed(2)}</td>
            </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Relatório gerado automaticamente pelo sistema AUDESP</p>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;

    return html;
  };

  const generateContratos = () => {
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relação de Contratos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { text-align: center; color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #003366; color: white; padding: 10px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .total { font-weight: bold; background-color: #f0f0f0; }
            .currency { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Relação de Contratos</h1>
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Objeto</th>
                <th>Vigência Início</th>
                <th>Vigência Fim</th>
                <th class="currency">Valor Total</th>
              </tr>
            </thead>
            <tbody>
    `;

    let totalValor = 0;

    data.contratos.forEach((contrato: any) => {
      const valor = contrato.valor_total || 0;
      totalValor += valor;

      html += `
        <tr>
          <td>${contrato.numero || '-'}</td>
          <td>${contrato.objeto || '-'}</td>
          <td>${contrato.data_vigencia_inicio || '-'}</td>
          <td>${contrato.data_vigencia_fim || '-'}</td>
          <td class="currency">R$ ${valor.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
            <tr class="total">
              <td colspan="4">TOTAL</td>
              <td class="currency">R$ ${totalValor.toFixed(2)}</td>
            </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    return html;
  };

  const downloadReport = (html: string, filename: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadCSV = (filename: string, data: any[]) => {
    if (data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header =>
          typeof row[header] === 'string' && row[header].includes(',')
            ? `"${row[header]}"`
            : row[header]
        ).join(',')
      )
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={24} className="text-blue-600" />
        <h2 className="text-xl font-bold">Gerador de Relatórios</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => downloadReport(generateDemonstrativoFinanceiro(), 'Demonstrativo_Financeiro.html')}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition"
        >
          <Download size={18} /> Demonstrativo Financeiro
        </button>

        <button
          onClick={() => downloadReport(generateContratos(), 'Relacao_Contratos.html')}
          className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition"
        >
          <Download size={18} /> Relação de Contratos
        </button>

        <button
          onClick={() => downloadCSV('Documentos_Fiscais.csv', data.documentos_fiscais)}
          className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium transition"
        >
          <Download size={18} /> Documentos Fiscais (CSV)
        </button>

        <button
          onClick={() => downloadCSV('Pagamentos.csv', data.pagamentos)}
          className="flex items-center justify-center gap-2 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-medium transition"
        >
          <Download size={18} /> Pagamentos (CSV)
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Nota:</strong> Os relatórios são gerados em HTML e podem ser abertos em qualquer navegador para impressão em PDF.
          Use a função "Imprimir" do navegador para converter para PDF.
        </p>
      </div>
    </div>
  );
};

export default ReportGenerator;
