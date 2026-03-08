import { Transaction, AnalysisResult } from './types';

const MERCHANT_CATEGORIES = ['Electronics', 'Grocery', 'Gas Station', 'Restaurant', 'Online Shopping', 'Travel', 'ATM Withdrawal', 'Entertainment', 'Healthcare', 'Clothing'];
const LOCATIONS = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Seattle', 'Boston', 'Denver', 'Atlanta', 'London', 'Tokyo', 'Lagos', 'Dubai'];
const CARD_TYPES = ['Visa', 'Mastercard', 'Amex', 'Discover'];
const TRANSACTION_TYPES = ['In-Store', 'Online', 'Contactless', 'ATM'];
const DEVICE_TYPES = ['POS Terminal', 'Mobile App', 'Web Browser', 'ATM Machine'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateSampleData(count = 10000): Transaction[] {
  const transactions: Transaction[] = [];
  const fraudRate = 0.035 + Math.random() * 0.02; // 3.5-5.5%

  for (let i = 0; i < count; i++) {
    const isFraud = Math.random() < fraudRate;
    const isInternational = isFraud ? Math.random() < 0.6 : Math.random() < 0.15;
    const previousFraud = isFraud ? Math.random() < 0.4 : Math.random() < 0.02;

    const baseAmount = isFraud
      ? Math.random() < 0.7 ? 500 + Math.random() * 9500 : Math.random() * 50
      : 5 + Math.random() * 500;

    const daysAgo = Math.floor(Math.random() * 90);
    const hour = isFraud ? (Math.random() < 0.5 ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 24)) : Math.floor(6 + Math.random() * 16);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

    transactions.push({
      transaction_id: `TXN-${String(i + 1).padStart(6, '0')}`,
      transaction_time: date.toISOString(),
      transaction_amount: Math.round(baseAmount * 100) / 100,
      merchant_category: isFraud && Math.random() < 0.4 ? pick(['Electronics', 'Online Shopping', 'ATM Withdrawal']) : pick(MERCHANT_CATEGORIES),
      location: pick(LOCATIONS),
      card_type: pick(CARD_TYPES),
      transaction_type: isFraud && Math.random() < 0.5 ? pick(['Online', 'ATM']) : pick(TRANSACTION_TYPES),
      device_type: pick(DEVICE_TYPES),
      is_international: isInternational,
      previous_fraud: previousFraud,
      fraud_label: isFraud ? 1 : 0,
    });
  }

  return transactions;
}

export function detectFraud(transactions: Transaction[]): AnalysisResult {
  const analyzed = transactions.map(t => {
    let score = 0;
    if (t.transaction_amount > 2000) score += 0.3;
    else if (t.transaction_amount > 800) score += 0.15;
    else if (t.transaction_amount < 2) score += 0.1;
    if (t.is_international) score += 0.2;
    if (t.previous_fraud) score += 0.35;
    if (['Online', 'ATM'].includes(t.transaction_type)) score += 0.08;
    if (['Electronics', 'ATM Withdrawal'].includes(t.merchant_category)) score += 0.1;
    const hour = new Date(t.transaction_time).getHours();
    if (hour >= 0 && hour < 5) score += 0.15;

    // Add noise for realism
    score += (Math.random() - 0.5) * 0.15;
    const probability = Math.max(0, Math.min(1, score));
    const prediction = probability >= 0.45 ? 1 : 0;

    return { ...t, fraud_prediction: prediction, fraud_probability: Math.round(probability * 1000) / 1000 };
  });

  let tp = 0, tn = 0, fp = 0, fn = 0;
  analyzed.forEach(t => {
    if (t.fraud_label === 1 && t.fraud_prediction === 1) tp++;
    else if (t.fraud_label === 0 && t.fraud_prediction === 0) tn++;
    else if (t.fraud_label === 0 && t.fraud_prediction === 1) fp++;
    else fn++;
  });

  const accuracy = (tp + tn) / analyzed.length;
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const fraudCount = analyzed.filter(t => t.fraud_prediction === 1).length;

  return {
    transactions: analyzed,
    totalTransactions: analyzed.length,
    fraudCount,
    legitimateCount: analyzed.length - fraudCount,
    fraudPercentage: Math.round((fraudCount / analyzed.length) * 10000) / 100,
    accuracy: Math.round(accuracy * 10000) / 100,
    confusionMatrix: { tp, tn, fp, fn },
    precision: Math.round(precision * 10000) / 100,
    recall: Math.round(recall * 10000) / 100,
    f1Score: Math.round(f1Score * 10000) / 100,
  };
}

export function parseCSV(text: string): Transaction[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  return lines.slice(1).filter(l => l.trim()).map((line, idx) => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const get = (name: string) => {
      const i = headers.indexOf(name);
      return i >= 0 ? values[i] : '';
    };

    return {
      transaction_id: get('transaction_id') || `TXN-${String(idx + 1).padStart(6, '0')}`,
      transaction_time: get('transaction_time') || new Date().toISOString(),
      transaction_amount: parseFloat(get('transaction_amount')) || 0,
      merchant_category: get('merchant_category') || 'Unknown',
      location: get('location') || 'Unknown',
      card_type: get('card_type') || 'Unknown',
      transaction_type: get('transaction_type') || 'Unknown',
      device_type: get('device_type') || 'Unknown',
      is_international: get('is_international') === 'true' || get('is_international') === '1',
      previous_fraud: get('previous_fraud') === 'true' || get('previous_fraud') === '1',
      fraud_label: parseInt(get('fraud_label')) || 0,
    };
  });
}

export function transactionsToCSV(transactions: Transaction[]): string {
  const headers = ['transaction_id', 'transaction_time', 'transaction_amount', 'merchant_category', 'location', 'card_type', 'transaction_type', 'device_type', 'is_international', 'previous_fraud', 'fraud_label', 'fraud_prediction', 'fraud_probability'];
  const rows = transactions.map(t => headers.map(h => {
    const val = t[h as keyof Transaction];
    return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '');
  }).join(','));
  return [headers.join(','), ...rows].join('\n');
}
