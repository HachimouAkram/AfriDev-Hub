import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from './auth.service';

export interface AIAuditResult {
  overall_score: number;
  security_score: number;
  architecture_score: number;
  documentation_score: number;
  strengths: string[];
  improvements: string[];
  summary: string;
  commercial_viability: string;
}

export interface AIPitchResult {
  catchy_title: string;
  enhanced_description: string;
  suggested_tags: string[];
  recommended_price_xof: number;
  recommended_price_usd: number;
  target_audience: string;
  key_selling_points: string[];
}

export interface AIMatchResult {
  score: number;
  matched_skills: string[];
  explanation: string;
  recommended: boolean;
}

export interface AIInterviewResult {
  feedback_on_previous?: string;
  score_previous?: number;
  next_question: string;
  question_category: string;
  hint: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/ai';

  auditProject(repoUrl: string, title: string, description: string, stack: string[], readme?: string): Observable<AIAuditResult> {
    return this.http.post<ApiResponse<AIAuditResult>>(`${this.baseUrl}/audit-project`, {
      repo_url: repoUrl,
      title,
      description,
      stack,
      readme
    }).pipe(map(res => res.data));
  }

  generatePitch(title: string, description: string, stack: string[], projectType: string = 'FOR_SALE'): Observable<AIPitchResult> {
    return this.http.post<ApiResponse<AIPitchResult>>(`${this.baseUrl}/project-pitch`, {
      title,
      description,
      stack,
      project_type: projectType
    }).pipe(map(res => res.data));
  }

  translate(text: string, targetLang: 'fr' | 'en' | 'wo' | 'sw'): Observable<string> {
    return this.http.post<ApiResponse<{ translated_text: string }>>(`${this.baseUrl}/translate`, {
      text,
      target_lang: targetLang
    }).pipe(map(res => res.data.translated_text));
  }

  matchCandidate(candidate: any, opportunity: any): Observable<AIMatchResult> {
    return this.http.post<ApiResponse<AIMatchResult>>(`${this.baseUrl}/match`, {
      candidate,
      opportunity
    }).pipe(map(res => res.data));
  }

  interviewStep(role: string, techStack: string[], questionIndex: number, previousAnswer?: string): Observable<AIInterviewResult> {
    return this.http.post<ApiResponse<AIInterviewResult>>(`${this.baseUrl}/interview`, {
      role,
      tech_stack: techStack,
      question_index: questionIndex,
      previous_answer: previousAnswer
    }).pipe(map(res => res.data));
  }

  chat(message: string, imageBase64?: string, imageMime?: string, history?: { role: string; content: string }[], lang?: string): Observable<{ reply: string; lang: string }> {
    return this.http.post<ApiResponse<{ reply: string; lang: string }>>(`${this.baseUrl}/chat`, {
      message,
      image_base64: imageBase64,
      image_mime: imageMime,
      history,
      lang: lang || 'fr'
    }).pipe(map(res => res.data));
  }
}
