import { useState, useCallback } from 'react';
import { Transaction, AnalysisResult } from '@/lib/types';
import { generateSampleData, detectFraud, transactionsToCSV } from '@/lib/fraud-detection';
import { FileUpload } from '@/components/FileUpload';
import { StatsCards } from '@/components/StatsCards';
import { Charts } from '@/components/Charts';
import { ResultsTable } from '@/components/ResultsTable';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Database, Play, Download, Loader2 } from 'lucide-react';

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'done'>('upload');

  const handleDataLoaded = useCallback((data: Transaction[]) => {
    setTransactions(data);
    setResult(null);
    setStep('upload');
  }, []);

  const handleGenerateSample = useCallback(() => {
    const data = generateSampleData(10000);
    setTransactions(data);
    setResult(null);
    setStep('upload');
  }, []);

  const handleDownloadSample = useCallback(() => {
    const data = generateSampleData(10000);
    const csv = transactionsToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleRunAnalysis = useCallback(async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    setStep('analyzing');
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1500));
    const analysisResult = detectFraud(transactions);
    setResult(analysisResult);
    setLoading(false);
    setStep('done');
  }, [transactions]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">FraudShield</h1>
              <p className="text-xs text-muted-foreground">Credit Card Fraud Detection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadSample}>
              <Download className="h-4 w-4 mr-1" /> Sample CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero section */}
        {step === 'upload' && !result && (
          <div className="text-center space-y-3 py-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Detect Fraudulent <span className="text-primary">Transactions</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Upload your credit card transaction dataset or generate sample data. Our ML-powered engine analyzes patterns to identify fraud.
            </p>
          </div>
        )}

        {/* Upload + Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={handleGenerateSample}>
              <Database className="h-5 w-5" />
              <span className="text-sm font-medium">Generate 10K Sample</span>
              <span className="text-xs text-muted-foreground">Create synthetic dataset</span>
            </Button>
            <Button
              className="h-auto py-4 flex-col gap-2"
              disabled={transactions.length === 0 || loading}
              onClick={handleRunAnalysis}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              <span className="text-sm font-medium">{loading ? 'Analyzing...' : 'Run Fraud Detection'}</span>
              <span className="text-xs opacity-80">
                {transactions.length > 0 ? `${transactions.length.toLocaleString()} transactions loaded` : 'Load data first'}
              </span>
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <StatsCards result={result} />
            <Charts result={result} />
            <ResultsTable transactions={result.transactions} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6 text-center text-xs text-muted-foreground">
        FraudShield — Client-side fraud detection simulation • No data leaves your browser
      </footer>
    </div>
  );
};

export default Index;
