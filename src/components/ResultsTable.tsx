import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, Download } from 'lucide-react';
import { transactionsToCSV } from '@/lib/fraud-detection';

interface ResultsTableProps {
  transactions: Transaction[];
}

const PAGE_SIZE = 20;

export function ResultsTable({ transactions }: ResultsTableProps) {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'all' | 'fraud' | 'legit'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = transactions;
    if (filter === 'fraud') result = result.filter(t => t.fraud_prediction === 1);
    if (filter === 'legit') result = result.filter(t => t.fraud_prediction === 0);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.transaction_id.toLowerCase().includes(q) ||
        t.merchant_category.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [transactions, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const downloadResults = () => {
    const csv = transactionsToCSV(transactions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fraud_detection_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-lg">Detection Results</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 h-9 w-48" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
          <div className="flex gap-1">
            {(['all', 'fraud', 'legit'] as const).map(f => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" className="h-9 text-xs capitalize" onClick={() => { setFilter(f); setPage(0); }}>
                {f === 'all' ? `All (${transactions.length})` : f === 'fraud' ? `Fraud (${transactions.filter(t => t.fraud_prediction === 1).length})` : `Legit (${transactions.filter(t => t.fraud_prediction === 0).length})`}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={downloadResults}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-2 text-xs text-muted-foreground font-semibold">ID</th>
                <th className="p-2 text-xs text-muted-foreground font-semibold">Time</th>
                <th className="p-2 text-xs text-muted-foreground font-semibold">Amount</th>
                <th className="p-2 text-xs text-muted-foreground font-semibold">Category</th>
                <th className="p-2 text-xs text-muted-foreground font-semibold">Location</th>
                <th className="p-2 text-xs text-muted-foreground font-semibold">Prediction</th>
                <th className="p-2 text-xs text-muted-foreground font-semibold">Probability</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(t => (
                <tr key={t.transaction_id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="p-2 font-mono text-xs">{t.transaction_id}</td>
                  <td className="p-2 text-xs">{new Date(t.transaction_time).toLocaleDateString()}</td>
                  <td className="p-2 font-mono text-xs">${t.transaction_amount.toFixed(2)}</td>
                  <td className="p-2 text-xs">{t.merchant_category}</td>
                  <td className="p-2 text-xs">{t.location}</td>
                  <td className="p-2">
                    <Badge variant={t.fraud_prediction === 1 ? 'destructive' : 'secondary'} className="text-xs">
                      {t.fraud_prediction === 1 ? 'Fraud' : 'Legitimate'}
                    </Badge>
                  </td>
                  <td className="p-2 font-mono text-xs">{((t.fraud_probability ?? 0) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">{filtered.length} results</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
