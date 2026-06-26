import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
  Loader2, X, ChevronDown, ArrowRight, RotateCcw, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Collection } from '../../types';

// All possible Excel column names users might use
const FIELD_MAP: Record<string, string[]> = {
  name_en:          ['name_en', 'name', 'product name', 'english name', 'title', '英文名稱', '產品名稱(英)'],
  name_tc:          ['name_tc', 'chinese name', 'traditional chinese', '中文名稱', '產品名稱(中)', '名稱'],
  price:            ['price', 'selling price', '價格', '售價', 'hkd', 'price (hk$)'],
  compare_price:    ['compare_price', 'original price', 'compare price', 'was', 'mrp', '原價', '比較價格'],
  sku:              ['sku', 'item code', 'product code', 'barcode', '貨號', '產品編號', '條碼'],
  description_en:   ['description_en', 'description', 'desc', 'english description', '英文描述', '描述(英)'],
  description_tc:   ['description_tc', 'chinese description', '中文描述', '描述(中)', '產品描述'],
  images:           ['images', 'image', 'image url', 'photo', 'image urls', '圖片', '圖片網址'],
  collection:       ['collection', 'category', 'collection name', '系列', '類別', '產品系列'],
  inventory_qty:    ['inventory_qty', 'stock', 'qty', 'quantity', 'inventory', '庫存', '數量'],
  tags:             ['tags', 'tag', 'keywords', '標籤', '關鍵詞'],
  is_featured:      ['is_featured', 'featured', '精選', '推薦'],
};

interface ParsedRow {
  name_en: string;
  name_tc: string;
  price: number;
  compare_price: number | null;
  sku: string;
  description_en: string;
  description_tc: string;
  images: string[];
  collection_name: string;
  inventory_qty: number;
  tags: string[];
  is_featured: boolean;
  _row: number;
  _errors: string[];
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; name: string; error: string }[];
}

function detectField(header: string): string | null {
  const h = header.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(FIELD_MAP)) {
    if (aliases.some(a => a.toLowerCase() === h)) return field;
  }
  return null;
}

function parseBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  const s = String(val).toLowerCase().trim();
  return ['true', 'yes', '1', 'y', '是', '✓'].includes(s);
}

function parseImages(val: unknown): string[] {
  if (!val) return [];
  return String(val).split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
}

function parseTags(val: unknown): string[] {
  if (!val) return [];
  return String(val).split(/[,;，；]+/).map(s => s.trim()).filter(Boolean);
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') || 'product-' + Date.now();
}

export default function AdminImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'importing' | 'done'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);

  const PRODUCT_FIELDS = [
    { key: 'name_en', label: 'Product Name (EN)', required: true },
    { key: 'name_tc', label: '產品名稱 (TC)', required: false },
    { key: 'price', label: 'Price (MOP$)', required: true },
    { key: 'compare_price', label: 'Compare Price', required: false },
    { key: 'sku', label: 'SKU / Item Code', required: false },
    { key: 'description_en', label: 'Description (EN)', required: false },
    { key: 'description_tc', label: '描述 (TC)', required: false },
    { key: 'images', label: 'Image URLs', required: false },
    { key: 'collection', label: 'Collection / Category', required: false },
    { key: 'inventory_qty', label: 'Stock Qty', required: false },
    { key: 'tags', label: 'Tags', required: false },
    { key: 'is_featured', label: 'Featured (true/false)', required: false },
  ];

  async function loadCollections() {
    const { data } = await supabase.from('mt_collections').select('*').order('sort_order');
    setCollections(data ?? []);
  }

  function handleFile(file: File) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      if (rows.length === 0) return;
      const hdrs = Object.keys(rows[0]);
      setHeaders(hdrs);
      setRawRows(rows);

      // Auto-detect mapping
      const autoMap: Record<string, string> = {};
      hdrs.forEach(h => {
        const detected = detectField(h);
        if (detected) autoMap[detected] = h;
      });
      setMapping(autoMap);
      await loadCollections();
      setStep('map');
    };
    reader.readAsArrayBuffer(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function applyMapping() {
    const collectionMap: Record<string, string> = {};
    collections.forEach(c => {
      collectionMap[c.name_en.toLowerCase()] = c.id;
      collectionMap[c.name_tc.toLowerCase()] = c.id;
      collectionMap[c.slug.toLowerCase()] = c.id;
    });

    const rows: ParsedRow[] = rawRows.map((raw, i) => {
      const get = (field: string) => {
        const col = mapping[field];
        return col ? raw[col] : '';
      };

      const errors: string[] = [];
      const nameEn = String(get('name_en') || '').trim();
      const price = parseFloat(String(get('price') || '0').replace(/[^0-9.]/g, '')) || 0;

      if (!nameEn) errors.push('Missing product name');
      if (price <= 0) errors.push('Price must be > 0');

      return {
        name_en: nameEn,
        name_tc: String(get('name_tc') || '').trim(),
        price,
        compare_price: get('compare_price') ? parseFloat(String(get('compare_price')).replace(/[^0-9.]/g, '')) || null : null,
        sku: String(get('sku') || '').trim(),
        description_en: String(get('description_en') || '').trim(),
        description_tc: String(get('description_tc') || '').trim(),
        images: parseImages(get('images')),
        collection_name: String(get('collection') || '').trim(),
        inventory_qty: parseInt(String(get('inventory_qty') || '0').replace(/[^0-9]/g, '')) || 0,
        tags: parseTags(get('tags')),
        is_featured: parseBoolean(get('is_featured')),
        _row: i + 2,
        _errors: errors,
      };
    }).filter(r => r.name_en); // skip completely empty rows

    setParsedRows(rows);
    setStep('preview');
  }

  async function runImport() {
    setStep('importing');
    const collectionMap: Record<string, string> = {};
    collections.forEach(c => {
      collectionMap[c.name_en.toLowerCase()] = c.id;
      collectionMap[c.name_tc.toLowerCase()] = c.id;
      collectionMap[c.slug.toLowerCase()] = c.id;
    });

    const res: ImportResult = { total: parsedRows.length, success: 0, failed: 0, errors: [] };
    const validRows = parsedRows.filter(r => r._errors.length === 0);

    for (const row of validRows) {
      const colId = row.collection_name ? (collectionMap[row.collection_name.toLowerCase()] ?? null) : null;
      const slug = toSlug(row.name_en) + '-' + Math.random().toString(36).slice(2, 6);

      const { error } = await supabase.from('mt_products').insert({
        name_en: row.name_en,
        name_tc: row.name_tc || row.name_en,
        slug,
        description_en: row.description_en,
        description_tc: row.description_tc,
        price: row.price,
        compare_price: row.compare_price,
        images: row.images,
        collection_id: colId,
        inventory_qty: row.inventory_qty,
        sku: row.sku,
        tags: row.tags,
        is_featured: row.is_featured,
        is_active: true,
      });

      if (error) {
        res.failed++;
        res.errors.push({ row: row._row, name: row.name_en, error: error.message });
      } else {
        res.success++;
      }
    }

    // Count rows with parse errors as failed
    parsedRows.filter(r => r._errors.length > 0).forEach(r => {
      res.failed++;
      res.errors.push({ row: r._row, name: r.name_en || '(empty)', error: r._errors.join(', ') });
    });

    setResult(res);
    setStep('done');
  }

  function reset() {
    setStep('upload');
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setParsedRows([]);
    setResult(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  }

  const validCount = parsedRows.filter(r => r._errors.length === 0).length;
  const errorCount = parsedRows.filter(r => r._errors.length > 0).length;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Import Products from Excel</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Upload an .xlsx or .csv file to bulk import products</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8 text-xs font-medium">
        {[
          { key: 'upload', label: '1. Upload File' },
          { key: 'map', label: '2. Map Columns' },
          { key: 'preview', label: '3. Preview' },
          { key: 'done', label: '4. Done' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.key}>
            <span className={`px-3 py-1.5 rounded-full transition-colors ${step === s.key || (step === 'importing' && s.key === 'done') ? 'bg-neutral-900 text-white' : ['upload', 'map', 'preview', 'importing', 'done'].indexOf(step) > i ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
              {s.label}
            </span>
            {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-neutral-400 flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* ─── STEP 1: Upload ─── */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragging ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'}`}
          >
            <FileSpreadsheet className={`w-14 h-14 mx-auto mb-4 transition-colors ${dragging ? 'text-neutral-900' : 'text-neutral-400'}`} />
            <p className="text-base font-semibold text-neutral-700 mb-1">
              Drag & drop your Excel file here
            </p>
            <p className="text-sm text-neutral-500 mb-4">or click to browse</p>
            <span className="inline-block px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg">
              Choose File
            </span>
            <p className="text-xs text-neutral-400 mt-3">Supports .xlsx, .xls, .csv</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Template download */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-neutral-900 text-sm mb-1">Download Template</p>
                <p className="text-xs text-neutral-500 mb-3">Use this template to format your product data correctly. Fill in your products and upload.</p>
                <button
                  onClick={() => {
                    const template = [
                      {
                        name_en: 'Premium Watch', name_tc: '高級手錶',
                        price: 980, compare_price: 1280, sku: 'WT-001',
                        description_en: 'A beautiful premium watch', description_tc: '精美高級手錶',
                        images: 'https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg',
                        collection: 'Premium Series', inventory_qty: 50, tags: 'watch,premium', is_featured: true,
                      },
                      {
                        name_en: 'Classic Bag', name_tc: '經典手袋',
                        price: 680, compare_price: '', sku: 'BG-001',
                        description_en: 'A stylish classic bag', description_tc: '時尚經典手袋',
                        images: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg',
                        collection: 'Best Sellers', inventory_qty: 30, tags: 'bag,classic', is_featured: false,
                      },
                    ];
                    const ws = XLSX.utils.json_to_sheet(template);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Products');
                    XLSX.writeFile(wb, 'MT_Brand_Products_Template.xlsx');
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-white hover:border-neutral-300 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download MT_Brand_Products_Template.xlsx
                </button>
              </div>
            </div>
          </div>

          {/* Accepted columns */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <p className="font-semibold text-neutral-900 text-sm mb-3">Accepted Column Names</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRODUCT_FIELDS.map(f => (
                <div key={f.key} className="flex items-start gap-2">
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.required ? 'bg-red-500' : 'bg-neutral-300'}`} />
                  <div>
                    <span className="text-xs font-semibold text-neutral-700">{f.label}</span>
                    {f.required && <span className="text-xs text-red-500 ml-1">*required</span>}
                    <p className="text-xs text-neutral-400">{FIELD_MAP[f.key]?.slice(0, 3).join(' / ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Map Columns ─── */}
      {step === 'map' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-neutral-900">Map Your Columns</p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  <span className="font-medium text-neutral-700">{fileName}</span> — {rawRows.length} rows detected
                </p>
              </div>
              <button onClick={reset} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700">
                <RotateCcw className="w-3.5 h-3.5" /> Change file
              </button>
            </div>

            <div className="space-y-3">
              {PRODUCT_FIELDS.map(field => (
                <div key={field.key} className="flex items-center gap-4">
                  <div className="w-44 flex-shrink-0">
                    <p className="text-xs font-semibold text-neutral-700">{field.label}</p>
                    {field.required && <p className="text-xs text-red-500">required</p>}
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <select
                        value={mapping[field.key] ?? ''}
                        onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-neutral-900 ${mapping[field.key] ? 'border-emerald-300 bg-emerald-50' : 'border-neutral-200'}`}
                      >
                        <option value="">— skip this field —</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>
                  {mapping[field.key] && (
                    <div className="w-48 hidden lg:block">
                      <p className="text-xs text-neutral-400 truncate">
                        Preview: <span className="text-neutral-700">{String(rawRows[0]?.[mapping[field.key]] ?? '—')}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={reset} className="px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium hover:border-neutral-300 transition-colors">
              Back
            </button>
            <button
              onClick={applyMapping}
              disabled={!mapping.name_en || !mapping.price}
              className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              Preview Import <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Preview ─── */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-neutral-900">{parsedRows.length}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Total Rows</p>
            </div>
            <div className={`border rounded-xl p-4 text-center ${validCount > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-neutral-200'}`}>
              <p className="text-2xl font-bold text-emerald-600">{validCount}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Ready to Import</p>
            </div>
            <div className={`border rounded-xl p-4 text-center ${errorCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-200'}`}>
              <p className="text-2xl font-bold text-red-500">{errorCount}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Rows with Errors</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-neutral-500 font-semibold uppercase tracking-wider">Row</th>
                    <th className="text-left px-3 py-2.5 text-neutral-500 font-semibold uppercase tracking-wider">Name (EN)</th>
                    <th className="text-left px-3 py-2.5 text-neutral-500 font-semibold uppercase tracking-wider">名稱 (TC)</th>
                    <th className="text-left px-3 py-2.5 text-neutral-500 font-semibold uppercase tracking-wider">Price</th>
                    <th className="text-left px-3 py-2.5 text-neutral-500 font-semibold uppercase tracking-wider">SKU</th>
                    <th className="text-left px-3 py-2.5 text-neutral-500 font-semibold uppercase tracking-wider">Collection</th>
                    <th className="text-left px-3 py-2.5 text-neutral-500 font-semibold uppercase tracking-wider">Stock</th>
                    <th className="text-left px-3 py-2.5 text-neutral-500 font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {parsedRows.map(row => (
                    <tr key={row._row} className={`${row._errors.length > 0 ? 'bg-red-50' : 'hover:bg-neutral-50'}`}>
                      <td className="px-3 py-2.5 text-neutral-400">{row._row}</td>
                      <td className="px-3 py-2.5 font-medium text-neutral-900 max-w-[160px] truncate">{row.name_en || <span className="text-red-400 italic">missing</span>}</td>
                      <td className="px-3 py-2.5 text-neutral-600 max-w-[140px] truncate">{row.name_tc || '—'}</td>
                      <td className="px-3 py-2.5 font-medium text-neutral-900">
                        {row.price > 0 ? `MOP$${row.price}` : <span className="text-red-400">missing</span>}
                        {row.compare_price && <span className="text-neutral-400 ml-1 line-through">MOP${row.compare_price}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-neutral-500">{row.sku || '—'}</td>
                      <td className="px-3 py-2.5 text-neutral-500">{row.collection_name || '—'}</td>
                      <td className="px-3 py-2.5 text-neutral-500">{row.inventory_qty}</td>
                      <td className="px-3 py-2.5">
                        {row._errors.length === 0 ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle2 className="w-3 h-3" /> OK</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 font-medium" title={row._errors.join(', ')}>
                            <AlertCircle className="w-3 h-3" /> {row._errors[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {errorCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <p>{errorCount} row{errorCount > 1 ? 's' : ''} with errors will be skipped. Only the {validCount} valid rows will be imported.</p>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep('map')} className="px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium hover:border-neutral-300 transition-colors">
              Back
            </button>
            <button
              onClick={runImport}
              disabled={validCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              <Upload className="w-4 h-4" /> Import {validCount} Product{validCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ─── Importing ─── */}
      {step === 'importing' && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-12 h-12 text-neutral-900 animate-spin mb-5" />
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Importing Products...</h2>
          <p className="text-neutral-500 text-sm">Please wait, do not close this page.</p>
        </div>
      )}

      {/* ─── STEP 4: Done ─── */}
      {step === 'done' && result && (
        <div className="space-y-6">
          <div className="text-center py-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${result.failed === 0 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              {result.failed === 0 ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <AlertCircle className="w-8 h-8 text-amber-500" />}
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Import Complete</h2>
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">{result.success}</p>
                <p className="text-sm text-neutral-500">Imported</p>
              </div>
              {result.failed > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">{result.failed}</p>
                  <p className="text-sm text-neutral-500">Failed</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-3xl font-bold text-neutral-900">{result.total}</p>
                <p className="text-sm text-neutral-500">Total</p>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                <p className="text-sm font-semibold text-red-700">Import Errors</p>
              </div>
              <div className="divide-y divide-neutral-100 max-h-52 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                    <span className="text-neutral-400 font-mono">Row {e.row}</span>
                    <span className="font-medium text-neutral-700 truncate">{e.name}</span>
                    <span className="text-red-500 flex-shrink-0">{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium hover:border-neutral-300 transition-colors">
              <RotateCcw className="w-4 h-4" /> Import Another File
            </button>
            <a href="/admin/products" className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors">
              <ArrowRight className="w-4 h-4" /> View Products
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
