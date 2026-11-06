import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export type GroupChannelType = 'TEXTE' | 'ANNONCES' | 'RESSOURCES' | 'AIDE_CODE';

export interface GroupChannel {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  type: GroupChannelType;
  isDefault: boolean;
  position: number;
  createdAt: string;
}

export interface GroupChatMessage {
  id: string;
  channelId: string;
  groupId: string;
  sender: User;
  content: string;
  attachmentUrl?: string;
  parentMessageId?: string;
  isPinned: boolean;
  createdAt: string;
  isOwnMessage?: boolean;
}

export interface GroupChannelCreateRequest {
  name: string;
  description?: string;
  type: GroupChannelType;
  isDefault?: boolean;
}

export interface GroupChatMessageRequest {
  content: string;
  attachmentUrl?: string;
  parentMessageId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupChatService {
  private http = inject(HttpClient);

  getChannels(groupId: string): Observable<ApiResponse<GroupChannel[]>> {
    return this.http.get<ApiResponse<GroupChannel[]>>(`/api/v1/groups/${groupId}/chat/channels`);
  }

  createChannel(groupId: string, data: GroupChannelCreateRequest): Observable<ApiResponse<GroupChannel>> {
    return this.http.post<ApiResponse<GroupChannel>>(`/api/v1/groups/${groupId}/chat/channels`, data);
  }

  deleteChannel(groupId: string, channelId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`/api/v1/groups/${groupId}/chat/channels/${channelId}`);
  }

  getMessages(groupId: string, channelId: string, page = 0, size = 30): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`/api/v1/groups/${groupId}/chat/channels/${channelId}/messages`, { params });
  }

  sendMessage(groupId: string, channelId: string, data: GroupChatMessageRequest): Observable<ApiResponse<GroupChatMessage>> {
    return this.http.post<ApiResponse<GroupChatMessage>>(`/api/v1/groups/${groupId}/chat/channels/${channelId}/messages`, data);
  }

  deleteMessage(groupId: string, messageId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`/api/v1/groups/${groupId}/chat/messages/${messageId}`);
  }
}

