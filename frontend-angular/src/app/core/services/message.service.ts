import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export interface DirectMessage {
  id: string;
  sender: User;
  recipient: User;
  content: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/messages';

  sendMessage(recipientId: string, content: string): Observable<ApiResponse<DirectMessage>> {
    return this.http.post<ApiResponse<DirectMessage>>(this.apiUrl, { recipientId, content });
  }

  getConversation(targetUserId: string): Observable<ApiResponse<DirectMessage[]>> {
    return this.http.get<ApiResponse<DirectMessage[]>>(`${this.apiUrl}/with/${targetUserId}`);
  }

  getRecentConversations(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/conversations`);
  }
}
