import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export interface Collaboration {
  id: string;
  initiator: User;
  partner: User;
  type: string;
  proofUrl: string;
  verified: boolean;
  evaluatedByCurrentUser?: boolean;
  createdAt: string;
}

export interface Evaluation {
  id: string;
  evaluator: User;
  evaluatee: User;
  collaboration: Collaboration;
  codeQuality: number;
  collaborationRating: number;
  technicalDepth: number;
  reliability: number;
  feedback?: string;
  isPublic: boolean;
  weight: number;
  createdAt: string;
}

export interface DimensionScore {
  dimension: string;
  score: number;
}

export interface ReputationScore {
  evaluateeId: string;
  totalEvaluations: number;
  overallReputationScore: number;
  codeQualityAvg: number;
  collaborationAvg: number;
  technicalDepthAvg: number;
  reliabilityAvg: number;
  dimensions: DimensionScore[];
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private http = inject(HttpClient);
  private evalApi = '/api/v1/evaluations';
  private collabApi = '/api/v1/collaborations';

  declareCollaboration(partnerId: string, type: string, proofUrl: string): Observable<ApiResponse<Collaboration>> {
    return this.http.post<ApiResponse<Collaboration>>(this.collabApi, { partnerId, type, proofUrl });
  }

  getMyCollaborations(): Observable<ApiResponse<Collaboration[]>> {
    return this.http.get<ApiResponse<Collaboration[]>>(`${this.collabApi}/my`);
  }

  verifyCollaboration(id: string): Observable<ApiResponse<Collaboration>> {
    return this.http.post<ApiResponse<Collaboration>>(`${this.collabApi}/${id}/verify`, {});
  }

  submitEvaluation(data: any): Observable<ApiResponse<Evaluation>> {
    return this.http.post<ApiResponse<Evaluation>>(this.evalApi, data);
  }

  getReceivedEvaluations(evaluateeId: string): Observable<ApiResponse<Evaluation[]>> {
    return this.http.get<ApiResponse<Evaluation[]>>(`${this.evalApi}/received/${evaluateeId}`);
  }

  getReputationScore(evaluateeId: string): Observable<ApiResponse<ReputationScore>> {
    return this.http.get<ApiResponse<ReputationScore>>(`${this.evalApi}/score/${evaluateeId}`);
  }
}
