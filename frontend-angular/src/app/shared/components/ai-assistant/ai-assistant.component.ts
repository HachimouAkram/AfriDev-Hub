import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService } from '../../../core/services/ai.service';
import { TranslationService, Language } from '../../../core/services/translation.service';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.css'
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  private aiService = inject(AIService);
  public translationService = inject(TranslationService);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef;

  isOpen = false;
  inputMessage = '';
  isLoading = false;
  isListening = false;
  selectedImageBase64: string | null = null;
  selectedImageMime: string | null = null;
  recognition: any = null;
  speakingMessageId: string | null = null;

  messages: ChatMessageItem[] = [
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'Bonjour et bienvenue sur AfriDev Hub !\nJe suis votre Assistant IA panafricain propulsé par Google Gemini.\nJe peux vous aider à déboguer du code, analyser une capture d\'écran d\'erreur, vous expliquer comment monétiser vos projets avec Wave & Orange Money ou préparer un entretien technique.\n\nVous pouvez m\'écrire, me parler au micro ou m\'envoyer une capture d\'écran !',
      timestamp: new Date()
    }
  ];

  quickSuggestions = [
    { label: 'Monétiser mon projet', prompt: 'Comment vendre mon code source et configurer mon compte de réception Wave ou Orange Money sur AfriDev Hub ?' },
    { label: 'Déboguer une erreur', prompt: 'Aide-moi à diagnostiquer une erreur dans mon code ou mon architecture.' },
    { label: 'Paiement Wave & OM', prompt: 'Comment fonctionne la répartition des frais à la charge de l\'acheteur sur AfriDev Hub ?' },
    { label: 'Préparer un entretien', prompt: 'Simule un entretien technique pour un développeur Full-Stack africain.' },
    { label: 'Wax ma ci Wolof', prompt: 'Nanga def ! Wax ma ci Wolof lu jëm ci plateforme AfriDev Hub ak nuñuy gëne mën liggéey.' },
    { label: 'Eleza kwa Kiswahili', prompt: 'Habari ! Nieleze kwa Kiswahili jinsi ya kupata kazi na kushiriki miradi kwenye AfriDev Hub.' }
  ];

  ngOnInit(): void {
    this.initSpeechRecognition();
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 200);
    }
  }

  closeChat(): void {
    this.isOpen = false;
  }

  private initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.inputMessage = (this.inputMessage ? this.inputMessage + ' ' : '') + transcript;
        this.isListening = false;
      };

      this.recognition.onerror = () => {
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  toggleVoiceListening(): void {
    if (!this.recognition) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur (essayez Chrome ou Edge).');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      const currentCode = this.translationService.currentLang().code;
      const langMap: Record<string, string> = {
        fr: 'fr-FR',
        en: 'en-US',
        wo: 'fr-SN', // Fallback for Wolof speech
        sw: 'sw-KE'
      };
      this.recognition.lang = langMap[currentCode] || 'fr-FR';
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (_) {
        this.isListening = false;
      }
    }
  }

  onImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop volumineuse (max 5 Mo).');
      return;
    }

    this.selectedImageMime = file.type;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedImageBase64 = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImageBase64 = null;
    this.selectedImageMime = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  useSuggestion(prompt: string): void {
    this.inputMessage = prompt;
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.inputMessage.trim();
    if (!text && !this.selectedImageBase64) return;

    const userMsgId = 'user-' + Date.now();
    const userMessage: ChatMessageItem = {
      id: userMsgId,
      role: 'user',
      text: text || (this.selectedImageBase64 ? 'Analyse cette image pour moi.' : ''),
      image: this.selectedImageBase64 || undefined,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const sentImageBase64 = this.selectedImageBase64;
    const sentImageMime = this.selectedImageMime;

    // Reset input
    this.inputMessage = '';
    this.removeImage();
    this.isLoading = true;
    setTimeout(() => this.scrollToBottom(), 100);

    // Build history
    const historyPayload = this.messages.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.text
    }));

    const currentLang = this.translationService.currentLang().code;

    this.aiService.chat(
      userMessage.text,
      sentImageBase64 || undefined,
      sentImageMime || undefined,
      historyPayload,
      currentLang
    ).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.messages.push({
          id: 'asst-' + Date.now(),
          role: 'assistant',
          text: res.reply,
          timestamp: new Date()
        });
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: () => {
        this.isLoading = false;
        this.messages.push({
          id: 'asst-' + Date.now(),
          role: 'assistant',
          text: 'Désolé, une petite perturbation est survenue lors de la communication avec l\'IA. Veuillez réessayer dans quelques instants.',
          timestamp: new Date()
        });
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  speakMessage(msg: ChatMessageItem): void {
    if (!window.speechSynthesis) return;

    if (this.speakingMessageId === msg.id) {
      window.speechSynthesis.cancel();
      this.speakingMessageId = null;
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msg.text);
    const currentCode = this.translationService.currentLang().code;
    const langMap: Record<string, string> = {
      fr: 'fr-FR',
      en: 'en-US',
      wo: 'fr-FR',
      sw: 'sw'
    };
    utterance.lang = langMap[currentCode] || 'fr-FR';
    utterance.rate = 1.0;

    utterance.onend = () => {
      this.speakingMessageId = null;
    };
    utterance.onerror = () => {
      this.speakingMessageId = null;
    };

    this.speakingMessageId = msg.id;
    window.speechSynthesis.speak(utterance);
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch (_) {}
    }
  }
}
