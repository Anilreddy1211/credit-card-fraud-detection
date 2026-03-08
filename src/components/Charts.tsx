import { AnalysisResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface ChartsProps {
  result: AnalysisResult;
}

const COLORS = {
  fraud: 'hsl(0, 72%, 51%)',
  legit: 'hsl(165, 60%, 40%)',
  primary: 'hsl(250, 65%, 55%)',
  accent: 'hsl(35, 92%, 55%)',
};

export function Charts({ result }: ChartsProps) {
  const pieData = [
    { name: 'Legitimate', value: result.legitimateCount },
    { name: 'Fraud', value: result.fraudCount },
  ];

  // Amount distribution buckets
  const buckets = [
    { range: '$0-50', min: 0, max: 50 },
    { range: '$50-200', min: 50, max: 200 },
    { range: '$200-500', min: 200, max: 500 },
    { range: '$500-1K', min: 500, max: 1000 },
    { range: '$1K-5K', min: 1000, max: 5000 },
    { range: '$5K+', min: 5000, max: Infinity },
  ];

  const amountData = buckets.map(b => {
    const inRange = result.transactions.filter(t => t.transaction_amount >= b.min && t.transaction_amount < b.max);
    return {
      range: b.range,
      legitimate: inRange.filter(t => t.fraud_prediction === 0).length,
      fraud: inRange.filter(t => t.fraud_prediction === 1).length,
    };
  });

  // Daily fraud trend (last 30 days)
  const now = new Date();
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayTxns = result.transactions.filter(t => t.transaction_time.startsWith(dateStr));
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      total: dayTxns.length,
      fraud: dayTxns.filter(t => t.fraud_prediction === 1).length,
    };
  }).filter(d => d.total > 0);

  // Confusion Matrix
  const cm = result.confusionMatrix;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Fraud vs Legitimate</CardTitle></CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                <Cell fill={COLORS.legit} />
                <Cell fill={COLORS.fraud} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Amount Distribution */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Amount Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={amountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="legitimate" fill={COLORS.legit} name="Legitimate" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fraud" fill={COLORS.fraud} name="Fraud" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fraud Trend */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Fraud Trend (Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke={COLORS.primary} strokeWidth={2} name="Total" dot={false} />
              <Line type="monotone" dataKey="fraud" stroke={COLORS.fraud} strokeWidth={2} name="Fraud" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Confusion Matrix */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Confusion Matrix</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-muted-foreground mb-1">Predicted →</div>
            <div className="grid grid-cols-3 gap-1 text-center font-mono text-sm w-fit">
              <div />
              <div className="px-4 py-2 text-xs text-muted-foreground font-semibold">Legit</div>
              <div className="px-4 py-2 text-xs text-muted-foreground font-semibold">Fraud</div>
              <div className="px-4 py-2 text-xs text-muted-foreground font-semibold rotate-0">Actual Legit</div>
              <div className="px-6 py-4 rounded-md bg-accent/20 text-accent font-bold text-lg">{cm.tn}</div>
              <div className="px-6 py-4 rounded-md bg-destructive/15 text-destructive font-bold text-lg">{cm.fp}</div>
              <div className="px-4 py-2 text-xs text-muted-foreground font-semibold">Actual Fraud</div>
              <div className="px-6 py-4 rounded-md bg-destructive/15 text-destructive font-bold text-lg">{cm.fn}</div>
              <div className="px-6 py-4 rounded-md bg-accent/20 text-accent font-bold text-lg">{cm.tp}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-muted-foreground">
              <div>Precision: <span className="font-mono font-semibold text-foreground">{result.precision}%</span></div>
              <div>Recall: <span className="font-mono font-semibold text-foreground">{result.recall}%</span></div>
              <div>F1: <span className="font-mono font-semibold text-foreground">{result.f1Score}%</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
