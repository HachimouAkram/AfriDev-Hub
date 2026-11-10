import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from './auth.service';

export type PaymentProvider = 'UNITECH_PAY' | 'STRIPE';
export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'MTN_MOMO' | 'MOOV' | 'TOGOCELL' | 'CARD' | 'BANK';
export type PaymentTargetType = 'PROJECT' | 'COURSE' | 'FREELANCE_ESCROW';

export interface PaymentInitiateRequest {
  targetType: PaymentTargetType;
  targetId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  customerPhone?: string;
  customerName?: string;
  country?: string;
  otp?: string;
}

export interface PaymentInitiateResponse {
  orderNumber: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: string;
  paymentUrl?: string;
  qrCodeData?: string;
  instructions?: string;
  netSellerAmount: number;
  platformFee: number;
  providerFee: number;
  totalBuyerAmount: number;
  currency: string;
}

export interface PaymentDto {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  sellerId?: string;
  sellerName?: string;
  targetType: PaymentTargetType;
  targetId: string;
  targetTitle: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  netSellerAmount: number;
  platformFee: number;
  providerFee: number;
  totalBuyerAmount: number;
  currency: string;
  status: string;
  paymentUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PayoutAccount {
  id?: string;
  country: string;
  method: PaymentMethod;
  phoneNumber: string;
  accountName?: string;
  isDefault?: boolean;
  isVerified?: boolean;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  pendingEscrowBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
  payoutAccounts: PayoutAccount[];
}

export interface WithdrawalRequest {
  amount: number;
  method: PaymentMethod;
  country?: string;
  operator?: string;
  account: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private paymentsUrl = '/api/v1/payments';
  private walletUrl = '/api/v1/wallet';

  initiatePayment(request: PaymentInitiateRequest): Observable<PaymentInitiateResponse> {
    return this.http.post<ApiResponse<PaymentInitiateResponse>>(`${this.paymentsUrl}/initiate`, request)
      .pipe(map(res => res.data));
  }

  getMyPurchases(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.paymentsUrl}/my-purchases`, { params })
      .pipe(map(res => res.data));
  }

  getMySales(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.paymentsUrl}/my-sales`, { params })
      .pipe(map(res => res.data));
  }

  getPaymentStatus(orderNumber: string): Observable<PaymentDto> {
    return this.http.get<ApiResponse<PaymentDto>>(`${this.paymentsUrl}/${orderNumber}/status`)
      .pipe(map(res => res.data));
  }

  // Wallet
  getMyWallet(): Observable<Wallet> {
    return this.http.get<ApiResponse<Wallet>>(this.walletUrl)
      .pipe(map(res => res.data));
  }

  savePayoutAccount(account: PayoutAccount): Observable<PayoutAccount> {
    return this.http.post<ApiResponse<PayoutAccount>>(`${this.walletUrl}/payout-accounts`, account)
      .pipe(map(res => res.data));
  }

  requestWithdrawal(request: WithdrawalRequest): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.walletUrl}/withdraw`, request)
      .pipe(map(res => res.data));
  }

  getWalletTransactions(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.walletUrl}/transactions`, { params })
      .pipe(map(res => res.data));
  }
}
