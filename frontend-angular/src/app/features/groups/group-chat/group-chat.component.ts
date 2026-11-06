import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GroupChatService,
  GroupChannel,
  GroupChatMessage,
  GroupChannelType,
  GroupChannelCreateRequest
} from '../../../core/services/group-chat.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="chat-container">
      <!-- SIDEBAR DES CANAUX / SALONS -->
      <aside class="channels-sidebar">
        <div class="sidebar-header">
          <h4>💬 Salons de discussion</h4>
          <button *ngIf="canManageChannels" (click)="showNewChannelModal = true" class="btn-add-channel" title="Créer un salon">
            +
          </button>
        </div>

        <div class="channels-list">
          <div *ngIf="isLoadingChannels" class="channels-loading">Chargement...</div>

          <button
            *ngFor="let ch of channels"
            class="channel-item"
            [class.active]="selectedChannel?.id === ch.id"
            (click)="selectChannel(ch)">
            <span class="channel-icon">{{ getChannelIcon(ch.type) }}</span>
            <span class="channel-name">{{ ch.name }}</span>
            <span *ngIf="ch.isDefault" class="channel-badge-default">Général</span>
            <button
              *ngIf="canManageChannels && !ch.isDefault"
              (click)="deleteChannel(ch, $event)"
              class="btn-del-channel"
              title="Supprimer le salon">
              ✕
            </button>
          </button>

          <div *ngIf="!isLoadingChannels && channels.length === 0" class="no-channels">
            Aucun salon disponible.
          </div>
        </div>
      </aside>

      <!-- FENÊTRE DE DISCUSSION DU SALON ACTIF -->
      <main class="chat-main" *ngIf="selectedChannel; else noChannelSelected">
        <!-- En-tête du salon -->
        <header class="channel-header">
          <div class="header-left">
            <span class="channel-hash">{{ getChannelIcon(selectedChannel.type) }}</span>
            <div>
              <h3>{{ selectedChannel.name }}</h3>
              <p *ngIf="selectedChannel.description" class="channel-desc">{{ selectedChannel.description }}</p>
            </div>
          </div>
          <div class="header-right">
            <button (click)="refreshMessages()" class="btn-refresh" title="Actualiser le fil">🔄</button>
          </div>
        </header>

        <!-- Liste des messages -->
        <div class="messages-container" #messagesScrollContainer>
          <div *ngIf="isLoadingMessages" class="messages-loading">
            <div class="spinner-small"></div>
            <span>Chargement des messages...</span>
          </div>

          <div *ngIf="!isLoadingMessages && messages.length === 0" class="empty-chat">
            <p>👋 C'est le début de ce salon ! Lancez la conversation avec les membres.</p>
          </div>

          <div
            *ngFor="let msg of messages"
            class="message-row"
            [class.own-message]="isCurrentUser(msg)">
            <div class="message-avatar">
              {{ getInitial(msg.sender?.profile?.fullName || msg.sender?.email) }}
            </div>
            <div class="message-bubble">
              <div class="message-meta">
                <span class="sender-name">{{ msg.sender?.profile?.fullName || msg.sender?.email }}</span>
                <span class="message-time">{{ msg.createdAt | date:'shortTime' }}</span>
                <button
                  *ngIf="isCurrentUser(msg) || canManageChannels"
                  (click)="deleteMessage(msg)"
                  class="btn-del-msg"
                  title="Supprimer">
                  ✕
                </button>
              </div>
              <div class="message-text">{{ msg.content }}</div>
            </div>
          </div>
        </div>

        <!-- Zone de saisie du message -->
        <footer class="chat-input-bar">
          <form (ngSubmit)="sendMessage()" class="chat-form">
            <input
              type="text"
              [(ngModel)]="messageContent"
              name="messageContent"
              [placeholder]="'Écrire dans #' + selectedChannel.name + '...'"
              [disabled]="isSending"
              class="chat-input"
              autocomplete="off"
            />
            <button
              type="submit"
              [disabled]="!messageContent.trim() || isSending"
              class="btn-send-message">
              Envoyer 🚀
            </button>
          </form>
        </footer>
      </main>

      <ng-template #noChannelSelected>
        <div class="no-channel-placeholder">
          <p>Sélectionnez un salon à gauche pour démarrer la discussion.</p>
        </div>
      </ng-template>

      <!-- MODALE CRÉATION DE CANAL -->
      <div class="modal-backdrop" *ngIf="showNewChannelModal" (click)="showNewChannelModal = false">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <h3>Créer un nouveau salon</h3>

          <div class="form-group">
            <label>Nom du salon (sans espaces)</label>
            <input
              type="text"
              [(ngModel)]="newChannel.name"
              placeholder="ex: astuces-react, entraide, projets"
              class="input-control"
            />
          </div>

          <div class="form-group">
            <label>Type de salon</label>
            <select [(ngModel)]="newChannel.type" class="input-control">
              <option value="TEXTE">💬 Discussion générale</option>
              <option value="AIDE_CODE">💻 Aide & Code</option>
              <option value="RESSOURCES">📚 Ressources & Docs</option>
              <option value="ANNONCES">📢 Annonces officielles</option>
            </select>
          </div>

          <div class="form-group">
            <label>Description (optionnel)</label>
            <input
              type="text"
              [(ngModel)]="newChannel.description"
              placeholder="Description courte de l'objectif de ce salon"
              class="input-control"
            />
          </div>

          <div class="modal-actions">
            <button (click)="showNewChannelModal = false" class="btn-cancel">Annuler</button>
            <button
              (click)="createChannel()"
              [disabled]="!newChannel.name.trim() || isCreatingChannel"
              class="btn-confirm">
              Créer le salon
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./group-chat.component.css']
})
export class GroupChatComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) groupId!: string;
  @Input() canManageChannels = false;

  @ViewChild('messagesScrollContainer') private scrollContainer?: ElementRef;

  private chatService = inject(GroupChatService);
  private authService = inject(AuthService);

  channels: GroupChannel[] = [];
  selectedChannel?: GroupChannel;
  messages: GroupChatMessage[] = [];

  isLoadingChannels = false;
  isLoadingMessages = false;
  isSending = false;
  isCreatingChannel = false;
  showNewChannelModal = false;

  messageContent = '';
  newChannel: GroupChannelCreateRequest = {
    name: '',
    description: '',
    type: 'TEXTE'
  };

  private pollInterval?: any;

  ngOnInit(): void {
    if (this.groupId) {
      this.loadChannels();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groupId'] && !changes['groupId'].firstChange) {
      this.loadChannels();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadChannels(): void {
    this.isLoadingChannels = true;
    this.chatService.getChannels(this.groupId).subscribe({
      next: (res) => {
        this.isLoadingChannels = false;
        if (res.success && res.data) {
          this.channels = res.data;
          if (this.channels.length > 0) {
            // Select default or first
            const defaultCh = this.channels.find(c => c.isDefault) || this.channels[0];
            this.selectChannel(defaultCh);
          }
        }
      },
      error: () => {
        this.isLoadingChannels = false;
      }
    });
  }

  selectChannel(channel: GroupChannel): void {
    this.selectedChannel = channel;
    this.messages = [];
    this.loadMessages();
    this.startPolling();
  }

  loadMessages(): void {
    if (!this.selectedChannel) return;
    this.isLoadingMessages = true;
    this.chatService.getMessages(this.groupId, this.selectedChannel.id).subscribe({
      next: (res) => {
        this.isLoadingMessages = false;
        if (res.success && res.data) {
          const list: GroupChatMessage[] = res.data.content || [];
          // reverse so chronological order (oldest to newest)
          this.messages = list.slice().reverse();
          this.scrollToBottom();
        }
      },
      error: () => {
        this.isLoadingMessages = false;
      }
    });
  }

  refreshMessages(): void {
    if (!this.selectedChannel) return;
    this.chatService.getMessages(this.groupId, this.selectedChannel.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const list: GroupChatMessage[] = res.data.content || [];
          const newMessages = list.slice().reverse();
          if (newMessages.length !== this.messages.length) {
            this.messages = newMessages;
            this.scrollToBottom();
          }
        }
      }
    });
  }

  sendMessage(): void {
    if (!this.selectedChannel || !this.messageContent.trim() || this.isSending) return;
    const content = this.messageContent.trim();
    this.isSending = true;

    this.chatService.sendMessage(this.groupId, this.selectedChannel.id, { content }).subscribe({
      next: (res) => {
        this.isSending = false;
        if (res.success && res.data) {
          this.messages.push(res.data);
          this.messageContent = '';
          this.scrollToBottom();
        }
      },
      error: () => {
        this.isSending = false;
      }
    });
  }

  createChannel(): void {
    if (!this.newChannel.name.trim() || this.isCreatingChannel) return;
    this.isCreatingChannel = true;
    // format name: remove spaces, lowercase
    this.newChannel.name = this.newChannel.name.trim().toLowerCase().replace(/\s+/g, '-');

    this.chatService.createChannel(this.groupId, this.newChannel).subscribe({
      next: (res) => {
        this.isCreatingChannel = false;
        this.showNewChannelModal = false;
        this.newChannel = { name: '', description: '', type: 'TEXTE' };
        if (res.success && res.data) {
          this.channels.push(res.data);
          this.selectChannel(res.data);
        }
      },
      error: () => {
        this.isCreatingChannel = false;
      }
    });
  }

  deleteChannel(channel: GroupChannel, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm(`Voulez-vous vraiment supprimer le salon #${channel.name} ?`)) {
      this.chatService.deleteChannel(this.groupId, channel.id).subscribe({
        next: () => {
          this.channels = this.channels.filter(c => c.id !== channel.id);
          if (this.selectedChannel?.id === channel.id && this.channels.length > 0) {
            this.selectChannel(this.channels[0]);
          }
        }
      });
    }
  }

  deleteMessage(message: GroupChatMessage): void {
    if (confirm('Supprimer ce message ?')) {
      this.chatService.deleteMessage(this.groupId, message.id).subscribe({
        next: () => {
          this.messages = this.messages.filter(m => m.id !== message.id);
        }
      });
    }
  }

  getChannelIcon(type: GroupChannelType): string {
    switch (type) {
      case 'ANNONCES': return '📢';
      case 'RESSOURCES': return '📚';
      case 'AIDE_CODE': return '💻';
      case 'TEXTE':
      default:
        return '💬';
    }
  }

  getInitial(name?: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : '?';
  }

  isCurrentUser(msg: GroupChatMessage): boolean {
    const current = this.authService.currentUser();
    return !!current && (msg.sender?.id === current.id || msg.sender?.email === current.email);
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      this.refreshMessages();
    }, 6000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}

