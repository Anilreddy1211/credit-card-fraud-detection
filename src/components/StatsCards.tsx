import { AnalysisResult } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, ShieldCheck, Activity, Target, Crosshair, BarChart3 } from 'lucide-react';

interface StatsCardsProps {
  result: AnalysisResult;
}

export function StatsCards({ result }: StatsCardsProps) {
  const stats = [
    { label: 'Total Transactions', value: result.totalTransactions.toLocaleString(), icon: Activity, color: 'text-primary' },
    { label: 'Fraud Detected', value: result.fraudCount.toLocaleString(), icon: ShieldAlert, color: 'text-destructive' },
    { label: 'Legitimate', value: result.legitimateCount.toLocaleString(), icon: ShieldCheck, color: 'text-accent' },
    { label: 'Fraud Rate', value: `${result.fraudPercentage}%`, icon: BarChart3, color: 'text-primary' },
    { label: 'Accuracy', value: `${result.accuracy}%`, icon: Target, color: 'text-accent' },
    { label: 'F1 Score', value: `${result.f1Score}%`, icon: Crosshair, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="glass-card hover:shadow-xl transition-shadow">
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <Icon className={`h-6 w-6 ${color}`} />
            <span className="text-2xl font-bold font-mono">{value}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
