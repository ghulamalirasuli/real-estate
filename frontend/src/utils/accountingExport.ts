import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TFunction } from 'i18next';
import { formatMoney } from './formatMoney';
import type { AccountingLedgerEntry } from './accounting';
import { buildAccountingEntryTableRows, formatReferenceNo } from './accountingEntryTable';

export interface ExportMeta {
  title: string;
  subtitle?: string;
  filterSummary?: string;
}

export interface ExportOptions {
  partyUserId?: number;
  cashboxMode?: boolean;
  defaultSymbol?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildExportRows(entries: AccountingLedgerEntry[], options: ExportOptions, t: TFunction) {
  const defaultSymbol = options.defaultSymbol || '$';
  return buildAccountingEntryTableRows(entries, {
    partyUserId: options.partyUserId,
    cashboxMode: options.cashboxMode,
  }).map(({ entry, rowNumber, line, runningBalance }) => ({
    rowNumber: String(rowNumber),
    date: String(entry.entry_date).slice(0, 10),
    insertedBy: entry.creator?.name || '—',
    referenceNo: formatReferenceNo(entry),
    description: entry.description?.trim() || t('accounting.noDescription'),
    debit: Number(line?.debit) > 0 ? formatMoney(Number(line?.amount), line?.currency?.symbol || defaultSymbol) : '—',
    credit: Number(line?.credit) > 0 ? formatMoney(Number(line?.amount), line?.currency?.symbol || defaultSymbol) : '—',
    balance: formatMoney(runningBalance, defaultSymbol),
  }));
}

function buildPrintHtml(meta: ExportMeta, entries: AccountingLedgerEntry[], t: TFunction, options: ExportOptions): string {
  const rows = buildExportRows(entries, options, t);

  const rowHtml = rows.length > 0
    ? rows.map((row) => `<tr>
        <td>${escapeHtml(row.rowNumber)}</td>
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(row.insertedBy)}</td>
        <td>${escapeHtml(row.referenceNo)}</td>
        <td>${escapeHtml(row.description)}</td>
        <td>${escapeHtml(row.debit)}</td>
        <td>${escapeHtml(row.credit)}</td>
        <td>${escapeHtml(row.balance)}</td>
      </tr>`).join('')
    : `<tr><td colspan="8">${escapeHtml(t('accounting.noEntries'))}</td></tr>`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(meta.title)}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p { margin: 0 0 16px; color: #555; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f3f4f6; }
      td:nth-child(6), td:nth-child(7), td:nth-child(8) { text-align: right; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(meta.title)}</h1>
    ${meta.subtitle ? `<p>${escapeHtml(meta.subtitle)}</p>` : ''}
    ${meta.filterSummary ? `<p>${escapeHtml(meta.filterSummary)}</p>` : ''}
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${escapeHtml(t('accounting.entryDate'))}</th>
          <th>${escapeHtml(t('accounting.insertedBy'))}</th>
          <th>${escapeHtml(t('accounting.referenceNo'))}</th>
          <th>${escapeHtml(t('accounting.description'))}</th>
          <th>${escapeHtml(t('accounting.debit'))}</th>
          <th>${escapeHtml(t('accounting.credit'))}</th>
          <th>${escapeHtml(t('accounting.balance'))}</th>
        </tr>
      </thead>
      <tbody>${rowHtml}</tbody>
    </table>
  </body>
</html>`;
}

export function printAccountingRecords(
  meta: ExportMeta,
  entries: AccountingLedgerEntry[],
  t: TFunction,
  _lang: string,
  options: ExportOptions = {},
): void {
  const html = buildPrintHtml(meta, entries, t, options);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow?.document;
  if (!frameWindow || !frameDoc) {
    document.body.removeChild(iframe);
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  const triggerPrint = () => {
    frameWindow.focus();
    frameWindow.print();
    frameWindow.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 2000);
  };

  if (frameDoc.readyState === 'complete') {
    window.setTimeout(triggerPrint, 100);
  } else {
    iframe.onload = () => window.setTimeout(triggerPrint, 100);
  }
}

export function exportAccountingRecordsPdf(
  meta: ExportMeta,
  entries: AccountingLedgerEntry[],
  t: TFunction,
  _lang: string,
  options: ExportOptions = {},
): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text(meta.title, 14, 18);
  let y = 26;
  doc.setFontSize(10);
  if (meta.subtitle) {
    doc.text(meta.subtitle, 14, y);
    y += 6;
  }
  if (meta.filterSummary) {
    doc.text(meta.filterSummary, 14, y);
    y += 8;
  }

  const body = buildExportRows(entries, options, t).map((row) => [
    row.rowNumber,
    row.date,
    row.insertedBy,
    row.referenceNo,
    row.description,
    row.debit,
    row.credit,
    row.balance,
  ]);

  autoTable(doc, {
    startY: y,
    head: [[
      '#',
      t('accounting.entryDate'),
      t('accounting.insertedBy'),
      t('accounting.referenceNo'),
      t('accounting.description'),
      t('accounting.debit'),
      t('accounting.credit'),
      t('accounting.balance'),
    ]],
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`${meta.title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.pdf`);
}
