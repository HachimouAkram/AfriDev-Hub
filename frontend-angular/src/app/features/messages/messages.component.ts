import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { MessageService, DirectMessage, ConversationSummary } from '../../core/services/message.service';
import { NetworkService, UserNetwork } from '../../core/services/network.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatHistoryContainer') private chatHistoryContainer!: ElementRef;

  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private networkService = inject(NetworkService);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  isLoggedIn = () => this.authService.isLoggedIn();

  conversations: ConversationSummary[] = [];
  filteredConversations: ConversationSummary[] = [];
  searchQuery = '';

  activePartner: User | null = null;
  activeMessages: DirectMessage[] = [];
  newMessageContent = '';
  replyingToMessage: DirectMessage | null = null;

  isLoadingConversations = false;
  isLoadingMessages = false;
  isSending = false;

  // New Chat Modal
  showNewChatModal = false;
  allMembers: UserNetwork[] = [];
  filteredMembers: UserNetwork[] = [];
  memberSearchQuery = '';
  isLoadingMembers = false;

  private pollingInterval: any = null;
  private shouldScrollToBottom = false;

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadSummaries();

    // Check if URL has ?user=ID or ?userId=ID
    this.route.queryParams.subscribe(params => {
      const targetId = params['user'] || params['userId'];
      if (targetId) {
        this.openChatWithUserId(targetId);
      }
    });

    // Real-time polling every 3 seconds for live Messenger updates
    this.pollingInterval = setInterval(() => {
      this.pollUpdates();
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadSummaries(): void {
    this.isLoadingConversations = true;
    this.messageService.getConversationSummaries().subscribe({
      next: (res) => {
        this.isLoadingConversations = false;
        if (res.success && res.data) {
          this.conversations = res.data;
          this.applyFilter();

          // Auto-select first conversation on desktop if no active partner selected yet
          if (!this.activePartner && this.conversations.length > 0) {
            if (typeof window !== 'undefined' && window.innerWidth > 850) {
              this.selectConversation(this.conversations[0].partner);
            }
          }
        }
      },
      error: () => this.isLoadingConversations = false
    });
  }

  pollUpdates(): void {
    if (this.activePartner) {
      this.messageService.getConversation(this.activePartner.id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            if (res.data.length > this.activeMessages.length) {
              this.activeMessages = res.data;
              this.shouldScrollToBottom = true;
            }
          }
        }
      });
    }

    // Refresh conversation list summaries in background
    this.messageService.getConversationSummaries().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.conversations = res.data;
          this.applyFilter();
        }
      }
    });
  }

  applyFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredConversations = [...this.conversations];
    } else {
      const q = this.searchQuery.toLowerCase().trim();
      this.filteredConversations = this.conversations.filter(c => 
        (c.partner.profile?.fullName || c.partner.email).toLowerCase().includes(q) ||
        (c.partner.profile?.title || '').toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }
  }

  deselectPartner(): void {
    this.activePartner = null;
  }

  selectConversation(partner: User): void {
    this.activePartner = partner;
    this.isLoadingMessages = true;
    this.activeMessages = [];

    this.messageService.getConversation(partner.id).subscribe({
      next: (res) => {
        this.isLoadingMessages = false;
        if (res.success && res.data) {
          this.activeMessages = res.data;
          this.shouldScrollToBottom = true;
        }
      },
      error: () => this.isLoadingMessages = false
    });
  }

  openChatWithUserId(targetUserId: string): void {
    this.isLoadingMessages = true;

    // Fetch target profile info so activePartner is set even if 0 messages exist
    this.profileService.getProfileById(targetUserId).subscribe({
      next: (profRes) => {
        if (profRes.success && profRes.data) {
          const prof = profRes.data;
          const resolvedUserId = prof.userId || (prof as any).userId || targetUserId;
          this.activePartner = {
            id: resolvedUserId,
            email: (prof as any).email || '',
            emailVerified: true,
            role: 'DEVELOPER',
            status: 'ACTIVE',
            profile: prof
          };
        }
      }
    });

    this.messageService.getConversation(targetUserId).subscribe({
      next: (res) => {
        this.isLoadingMessages = false;
        if (res.success && res.data) {
          this.activeMessages = res.data;
          if (res.data.length > 0) {
            const first = res.data[0];
            this.activePartner = first.sender.id === this.currentUser()?.id ? first.recipient : first.sender;
          }
          this.shouldScrollToBottom = true;
        }
      },
      error: () => this.isLoadingMessages = false
    });
  }

  setReplyTo(msg: DirectMessage): void {
    this.replyingToMessage = msg;
  }

  cancelReply(): void {
    this.replyingToMessage = null;
  }

  isReplyMessage(content: string | undefined): boolean {
    if (!content) return false;
    return content.startsWith('[reply:') && content.includes(']\n');
  }

  parseReplySender(content: string | undefined): string {
    if (!content || !this.isReplyMessage(content)) return '';
    const endHeader = content.indexOf(']\n');
    const header = content.substring(7, endHeader);
    const parts = header.split('|');
    return parts[0] || 'Message';
  }

  parseReplyQuote(content: string | undefined): string {
    if (!content || !this.isReplyMessage(content)) return '';
    const endHeader = content.indexOf(']\n');
    const header = content.substring(7, endHeader);
    const pipeIndex = header.indexOf('|');
    return pipeIndex !== -1 ? header.substring(pipeIndex + 1) : '';
  }

  parseReplyText(content: string | undefined): string {
    if (!content) return '';
    if (!this.isReplyMessage(content)) return content;
    const endHeader = content.indexOf(']\n');
    return content.substring(endHeader + 2);
  }

  cleanText(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/\?\?/g, 'é').replace(/S\?\?n\?\?gal/gi, 'Sénégal');
  }

  onTextareaKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.shiftKey || event.ctrlKey) {
        // Shift+Enter or Ctrl+Enter -> Newline
        return;
      } else {
        // Enter -> Send Message
        event.preventDefault();
        this.sendMessage();
      }
    }
  }

  sendMessage(): void {
    if (!this.activePartner || !this.newMessageContent.trim() || this.isSending) return;

    let content = this.newMessageContent.trim();
    if (this.replyingToMessage) {
      const senderName = this.replyingToMessage.sender.profile?.fullName || this.replyingToMessage.sender.email;
      const quoteSnippet = this.parseReplyText(this.replyingToMessage.content).replace(/\n/g, ' ').substring(0, 80);
      content = `[reply:${senderName}|${quoteSnippet}]\n${content}`;
    }

    this.isSending = true;

    this.messageService.sendMessage(this.activePartner.id, content).subscribe({
      next: (res) => {
        this.isSending = false;
        if (res.success && res.data) {
          this.activeMessages.push(res.data);
          this.newMessageContent = '';
          this.replyingToMessage = null;
          this.shouldScrollToBottom = true;
          this.loadSummaries();
        }
      },
      error: () => {
        this.isSending = false;
      }
    });
  }

  insertEmoji(emoji: string): void {
    this.newMessageContent += emoji;
  }

  openNewChatModal(): void {
    this.showNewChatModal = true;
    this.isLoadingMembers = true;
    this.memberSearchQuery = '';
    this.allMembers = [];
    this.filteredMembers = [];

    this.networkService.getNetworkUsers({ role: 'ALL' }).subscribe({
      next: (res: any) => {
        this.isLoadingMembers = false;
        if (res.success && res.data) {
          // Exclude self from members list
          this.allMembers = res.data.filter((u: UserNetwork) => u.id !== this.currentUser()?.id);
          this.applyMemberFilter();
        }
      },
      error: () => this.isLoadingMembers = false
    });
  }

  closeNewChatModal(): void {
    this.showNewChatModal = false;
  }

  applyMemberFilter(): void {
    if (!this.memberSearchQuery.trim()) {
      this.filteredMembers = [...this.allMembers];
    } else {
      const q = this.memberSearchQuery.toLowerCase().trim();
      this.filteredMembers = this.allMembers.filter((m: UserNetwork) =>
        (m.fullName || m.email).toLowerCase().includes(q) ||
        (m.title || '').toLowerCase().includes(q) ||
        (m.skills || []).some((s: string) => s.toLowerCase().includes(q))
      );
    }
  }

  startChatWithMember(member: UserNetwork): void {
    const partnerUser: User = {
      id: member.id,
      email: member.email,
      emailVerified: true,
      role: member.role,
      status: 'ACTIVE',
      profile: {
        id: member.id,
        fullName: member.fullName,
        country: member.country,
        city: member.city,
        title: member.title,
        skills: member.skills
      } as any
    };

    this.closeNewChatModal();
    this.selectConversation(partnerUser);
  }

  private scrollToBottom(): void {
    try {
      if (this.chatHistoryContainer) {
        this.chatHistoryContainer.nativeElement.scrollTop = this.chatHistoryContainer.nativeElement.scrollHeight;
      }
    } catch {}
  }
}
