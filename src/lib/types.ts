export interface Transaction {
  transaction_id: string;
  transaction_time: string;
  transaction_amount: number;
  merchant_category: string;
  location: string;
  card_type: string;
  transaction_type: string;
  device_type: string;
  is_international: boolean;
  previous_fraud: boolean;
  fraud_label: number;
  fraud_prediction?: number;
  fraud_probability?: number;
}

export interface AnalysisResult {
  transactions: Transaction[];
  totalTransactions: number;
  fraudCount: number;
  legitimateCount: number;
  fraudPercentage: number;
  accuracy: number;
  confusionMatrix: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
  };
  precision: number;
  recall: number;
  f1Score: number;
}
