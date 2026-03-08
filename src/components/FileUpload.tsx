import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import { parseCSV } from '@/lib/fraud-detection';
import { Transaction } from '@/lib/types';

interface FileUploadProps {
  onDataLoaded: (transactions: Transaction[]) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Transaction[]>([]);

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File too large (max 50MB)');
      return;
    }
    setError('');
    setFile(f);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const transactions = parseCSV(e.target?.result as string);
        setPreview(transactions.slice(0, 5));
        onDataLoaded(transactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      }
    };
    reader.readAsText(f);
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFile(f);
            };
            input.click();
          }}
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop a CSV file or <span className="text-primary font-medium">click to browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Max 50MB • CSV format only</p>
        </div>

        {error && <p className="text-destructive text-sm mt-3">{error}</p>}

        {file && !error && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium">{file.name}</span>
            <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
            <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview([]); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {preview.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <p className="text-xs text-muted-foreground mb-2">Preview (first 5 rows):</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-1 text-muted-foreground">ID</th>
                  <th className="text-left p-1 text-muted-foreground">Amount</th>
                  <th className="text-left p-1 text-muted-foreground">Category</th>
                  <th className="text-left p-1 text-muted-foreground">Location</th>
                  <th className="text-left p-1 text-muted-foreground">Label</th>
                </tr>
              </thead>
              <tbody>
                {preview.map(t => (
                  <tr key={t.transaction_id} className="border-b border-border/50">
                    <td className="p-1 font-mono">{t.transaction_id}</td>
                    <td className="p-1 font-mono">${t.transaction_amount.toFixed(2)}</td>
                    <td className="p-1">{t.merchant_category}</td>
                    <td className="p-1">{t.location}</td>
                    <td className="p-1">{t.fraud_label === 1 ? '🔴 Fraud' : '🟢 Legit'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
