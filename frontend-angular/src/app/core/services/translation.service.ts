import { Injectable, signal, computed } from '@angular/core';

export interface Language {
  code: 'fr' | 'en' | 'wo' | 'sw';
  label: string;
  flag: string;
  voiceVoice?: string;
  greeting: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', greeting: 'Bienvenue sur AfriDev Hub !' },
  { code: 'en', label: 'English', flag: '🇬🇧', greeting: 'Welcome to AfriDev Hub!' },
  { code: 'wo', label: 'Wolof', flag: '🇸🇳', greeting: 'Dalal ak jàmm ci AfriDev Hub !' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿', greeting: 'Karibu kwenye AfriDev Hub!' }
];

export const DICTIONARIES: Record<string, Record<string, string>> = {
  fr: {
    // Nav
    'nav.home': 'Accueil',
    'nav.projects': 'Projets',
    'nav.opportunities': 'Opportunités',
    'nav.network': 'Réseau',
    'nav.events': 'Événements',
    'nav.communities': 'Communautés',
    'nav.leaderboard': 'Classement',
    'nav.resources': 'Ressources & Formations',
    'nav.messages': 'Messagerie',
    'nav.dashboard': 'Tableau de bord',
    'nav.profile': 'Mon Profil',
    'nav.admin': 'Administration',
    'nav.login': 'Connexion',
    'nav.register': "S'inscrire",
    'nav.logout': 'Se Déconnecter',
    'nav.choose_language': 'Choisir une langue',
    'nav.theme_dark': 'Passer au Mode Sombre',
    'nav.theme_light': 'Passer au Mode Clair',
    // Actions
    'action.contact_whatsapp': 'Discuter sur WhatsApp',
    'action.apply': 'Postuler',
    'action.buy': 'Acheter le projet',
    'action.enroll': "S'inscrire à la formation",
    'action.view_demo': 'Voir la démo',
    'action.view_code': 'Code source',
    'action.translate': 'Traduire ce contenu',
    'action.translating': 'Traduction en cours...',
    'action.audit_repo': 'Audit IA du projet',
    'action.share': 'Partager',
    'action.save': 'Enregistrer',
    'action.cancel': 'Annuler',
    'action.filter': 'Filtrer',
    'action.search': 'Rechercher...',
    'action.withdraw': 'Retirer mes fonds',
    // Payment
    'payment.free': 'Gratuit',
    'payment.paid': 'Payant',
    'payment.price': 'Prix',
    'payment.buyer_fee_note': 'Frais de transaction inclus (pris en charge par l’acheteur)',
    'payment.seller_receives': 'Vous recevrez exactement :',
    'payment.payout_account': 'Numéro de réception Mobile Money',
    'payment.methods': 'Moyens de paiement acceptés',
    'payment.wave': 'Wave',
    'payment.orange': 'Orange Money',
    'payment.momo': 'MTN / Moov Money',
    'payment.card': 'Carte Bancaire (Stripe)',
    'payment.success': 'Paiement effectué avec succès !',
    'payment.pending': 'En attente de validation du paiement...',
    // Offline
    'offline.banner': 'Mode Hors-ligne activé. Vos actions seront synchronisées au retour de la connexion.',
    'offline.pending': 'action(s) en attente de synchronisation.',
    'offline.synced': 'Toutes les données sont synchronisées ✓',
    'offline.reconnected': 'Connexion rétablie ! Synchronisation automatique...',
    // Resources
    'resources.title': 'Bibliothèque de Ressources & Formations',
    'resources.subtitle': 'Tutoriels vidéos, cours interactifs et guides techniques classés par niveau.',
    'resources.all': 'Toutes les ressources',
    'resources.beginner': 'Débutant',
    'resources.intermediate': 'Intermédiaire',
    'resources.advanced': 'Avancé',
    'resources.watch_video': 'Regarder la vidéo',
    // AI
    'ai.match_score': 'Score de compatibilité IA',
    'ai.smart_suggestion': 'Suggestion intelligente',
    'ai.interview_sim': 'Simulateur d’entretien technique',
    // Projects
    'projects.title': 'Projets de la Communauté',
    'projects.subtitle': 'Découvrez, testez et achetez des réalisations conçues par les meilleurs développeurs africains.',
    'projects.about': 'À propos du Projet',
    'projects.sale_terms': 'Modalités & Prix de Vente',
    'projects.tech_stack': 'Stack Technique & Frameworks',
    'projects.links_share': 'Liens & Partage',
    'projects.demo': 'Démo en Ligne',
    'projects.buy': 'Acheter ce projet',
    'projects.contact_author': 'Messagerie',
    // Footer
    'footer.mission': 'La première plateforme panafricaine certifiant la réputation, les projets réels et les compétences des développeurs africains.',
    'footer.active_countries': 'Réseau actif dans 54 pays africains',
    'footer.rights': 'AfriDev Hub. Conçu avec fierté pour les développeurs africains 🌍'
  },
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.opportunities': 'Opportunities',
    'nav.network': 'Network',
    'nav.events': 'Events',
    'nav.communities': 'Communities',
    'nav.leaderboard': 'Leaderboard',
    'nav.resources': 'Resources & Courses',
    'nav.messages': 'Messages',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'My Profile',
    'nav.admin': 'Admin',
    'nav.login': 'Sign In',
    'nav.register': 'Sign Up',
    'nav.logout': 'Sign Out',
    'nav.choose_language': 'Select language',
    'nav.theme_dark': 'Switch to Dark Mode',
    'nav.theme_light': 'Switch to Light Mode',
    // Actions
    'action.contact_whatsapp': 'Chat on WhatsApp',
    'action.apply': 'Apply Now',
    'action.buy': 'Buy Project',
    'action.enroll': 'Enroll Course',
    'action.view_demo': 'Live Demo',
    'action.view_code': 'Source Code',
    'action.translate': 'Translate content',
    'action.translating': 'Translating...',
    'action.audit_repo': 'AI Project Audit',
    'action.share': 'Share',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.filter': 'Filter',
    'action.search': 'Search...',
    'action.withdraw': 'Withdraw Funds',
    // Payment
    'payment.free': 'Free',
    'payment.paid': 'Paid',
    'payment.price': 'Price',
    'payment.buyer_fee_note': 'Processing fees included (paid by buyer)',
    'payment.seller_receives': 'You will receive exactly:',
    'payment.payout_account': 'Mobile Money Payout Number',
    'payment.methods': 'Accepted payment methods',
    'payment.wave': 'Wave',
    'payment.orange': 'Orange Money',
    'payment.momo': 'MTN / Moov Money',
    'payment.card': 'Credit Card (Stripe)',
    'payment.success': 'Payment successful!',
    'payment.pending': 'Waiting for payment confirmation...',
    // Offline
    'offline.banner': 'Offline mode active. Your actions will automatically sync once connected.',
    'offline.pending': 'action(s) pending sync.',
    'offline.synced': 'All data synchronized ✓',
    'offline.reconnected': 'Back online! Syncing now...',
    // Resources
    'resources.title': 'Resource Library & Learning',
    'resources.subtitle': 'Video tutorials, interactive courses and technical guides sorted by level.',
    'resources.all': 'All resources',
    'resources.beginner': 'Beginner',
    'resources.intermediate': 'Intermediate',
    'resources.advanced': 'Advanced',
    'resources.watch_video': 'Watch Video',
    // AI
    'ai.match_score': 'AI Compatibility Score',
    'ai.smart_suggestion': 'Smart Suggestion',
    'ai.interview_sim': 'Tech Interview Simulator',
    // Projects
    'projects.title': 'Community Projects',
    'projects.subtitle': 'Discover, test, and buy real-world projects built by top African developers.',
    'projects.about': 'About this Project',
    'projects.sale_terms': 'Terms & Sale Price',
    'projects.tech_stack': 'Tech Stack & Frameworks',
    'projects.links_share': 'Links & Sharing',
    'projects.demo': 'Live Demo',
    'projects.buy': 'Buy this project',
    'projects.contact_author': 'Direct Message',
    // Footer
    'footer.mission': 'The premier pan-African platform certifying reputation, real-world projects and skills of African developers.',
    'footer.active_countries': 'Active community across 54 African countries',
    'footer.rights': 'AfriDev Hub. Built with pride for African developers 🌍'
  },
  wo: {
    // Nav (Wolof)
    'nav.home': 'Dalal',
    'nav.projects': 'Sémb yi',
    'nav.opportunities': 'Xéwal yi',
    'nav.network': 'Mboolo mi',
    'nav.events': 'Xéw-xéw yi',
    'nav.communities': 'Mbooloo yi',
    'nav.leaderboard': 'Tànnéef gi',
    'nav.resources': 'Njàngum xam-xam',
    'nav.messages': 'Bataaxal yi',
    'nav.dashboard': 'Palaas bi',
    'nav.profile': 'Sama jëmm',
    'nav.admin': 'Njiit yi',
    'nav.login': 'Duggu',
    'nav.register': 'Bindu',
    'nav.logout': 'Génn',
    'nav.choose_language': 'Tànnal làkk',
    'nav.theme_dark': 'Def ko xool bu ñuul',
    'nav.theme_light': 'Def ko xool bu leer',
    // Actions
    'action.contact_whatsapp': 'Waxtaan ci WhatsApp',
    'action.apply': 'Wut liggéey bi',
    'action.buy': 'Jënd sémb bi',
    'action.enroll': 'Bokk ci njàng mi',
    'action.view_demo': 'Xool wone gi',
    'action.view_code': 'Xool kod bi',
    'action.translate': 'Tekki ci sama làkk',
    'action.translating': 'Tekkig gi ngi dox...',
    'action.audit_repo': 'Seet kod bi ak IA',
    'action.share': 'Seddo',
    'action.save': 'Denc',
    'action.cancel': 'Neenal',
    'action.filter': 'Séddale',
    'action.search': 'Seet...',
    'action.withdraw': 'Jëli sama xaalis',
    // Payment
    'payment.free': 'Amul fay',
    'payment.paid': 'Dafay fayiku',
    'payment.price': 'Njëg',
    'payment.buyer_fee_note': 'Fayug yoon wi borom jënd bi koy fay',
    'payment.seller_receives': 'Li ngay am dëgg-dëgg :',
    'payment.payout_account': 'Nimero Mobile Money bi ngay jële',
    'payment.methods': 'Pexe yi ngay faye',
    'payment.wave': 'Wave',
    'payment.orange': 'Orange Money',
    'payment.momo': 'MTN / Moov Money',
    'payment.card': 'Kàrt bang (Stripe)',
    'payment.success': 'Fay gi jàll na ci jàmm !',
    'payment.pending': 'Ñu ngi xaar fay gi...',
    // Offline
    'offline.banner': 'Internet buul dox. Lépp loo def dina duggu bu internet dellusee.',
    'offline.pending': 'jëf yu des ngir duggu.',
    'offline.synced': 'Lépp jàll na bu baax ✓',
    'offline.reconnected': 'Internet dellusi na ! Ñu ngi duggal li des...',
    // Resources
    'resources.title': 'Baraqu Njàng ak Xam-xam',
    'resources.subtitle': 'Widewo, njàng yu xóot ak tànnéef yu baax ci wàllu xarala.',
    'resources.all': 'Njàng yépp',
    'resources.beginner': 'Ku sàog door',
    'resources.intermediate': 'Ku yégg digg',
    'resources.advanced': 'Màngas ci xam-xam',
    'resources.watch_video': 'Xool widewo bi',
    // AI
    'ai.match_score': 'Tolloo ak xéwal gi (IA)',
    'ai.smart_suggestion': 'Xalaat bu baax',
    'ai.interview_sim': 'Tàggatu ci laccu liggéey',
    // Projects
    'projects.title': 'Sémb yi ci Mboolo mi',
    'projects.subtitle': 'Xoolal, seetal te jënd liggéey yu rafet yu xaralay Afrig defar.',
    'projects.about': 'Lu jëm ci sémb bi',
    'projects.sale_terms': 'Njëg ak pexe yi',
    'projects.tech_stack': 'Xarala yiñ ci jëfandikoo',
    'projects.links_share': 'Lëkkalekaay ak seddoo',
    'projects.demo': 'Xool wone gi ci internet',
    'projects.buy': 'Jënd sémb bi',
    'projects.contact_author': 'Bataaxal',
    // Footer
    'footer.mission': 'Mboolo mu mag miy takk ndam ak wone xam-xamu liggéeykatu xarala yu Afrig.',
    'footer.active_countries': '54 réewi Afrig ñoo ci bokk',
    'footer.rights': 'AfriDev Hub. Defar nañ ko ak mbég ngir xaralay Afrig 🌍'
  },
  sw: {
    // Nav (Kiswahili)
    'nav.home': 'Nyumbani',
    'nav.projects': 'Miradi',
    'nav.opportunities': 'Nafasi za Kazi',
    'nav.network': 'Mtandao',
    'nav.events': 'Matukio',
    'nav.communities': 'Jumuiya',
    'nav.leaderboard': 'Orodha ya Bora',
    'nav.resources': 'Rasilimali na Mafunzo',
    'nav.messages': 'Ujumbe',
    'nav.dashboard': 'Dashibodi',
    'nav.profile': 'Wasifu Wangu',
    'nav.admin': 'Usimamizi',
    'nav.login': 'Ingia',
    'nav.register': 'Jiunge',
    'nav.logout': 'Ondoka',
    'nav.choose_language': 'Chagua lugha',
    'nav.theme_dark': 'Washa Hali ya Giza',
    'nav.theme_light': 'Washa Hali ya Mwangaza',
    // Actions
    'action.contact_whatsapp': 'Wasiliana kupitia WhatsApp',
    'action.apply': 'Omba Sasa',
    'action.buy': 'Nunua Mradi',
    'action.enroll': 'Jiandikishe kwa Mafunzo',
    'action.view_demo': 'Tazama Onyesho',
    'action.view_code': 'Msimbo Chanzo',
    'action.translate': 'Tafsiri maudhui haya',
    'action.translating': 'Inatafsiri...',
    'action.audit_repo': 'Ukaguzi wa Mradi kwa AI',
    'action.share': 'Shiriki',
    'action.save': 'Hifadhi',
    'action.cancel': 'Ghairi',
    'action.filter': 'Chuja',
    'action.search': 'Tafuta...',
    'action.withdraw': 'Toa Pesa Zangu',
    // Payment
    'payment.free': 'Bure',
    'payment.paid': 'Ya Kulipia',
    'payment.price': 'Bei',
    'payment.buyer_fee_note': 'Ada za ununuzi zimejumuishwa (zinalipwa na mnunuzi)',
    'payment.seller_receives': 'Utapokea kiasi kamili cha:',
    'payment.payout_account': 'Namba ya Kupokelea Mobile Money',
    'payment.methods': 'Njia za malipo zinazokubalika',
    'payment.wave': 'Wave',
    'payment.orange': 'Orange Money',
    'payment.momo': 'MTN / Moov Money',
    'payment.card': 'Kadi ya Benki (Stripe)',
    'payment.success': 'Malipo yamekamilika kwa ufanisi!',
    'payment.pending': 'Inasubiri uthibitisho wa malipo...',
    // Offline
    'offline.banner': 'Hali ya nje ya mtandao inafanya kazi. Vitendo vyako vitahifadhiwa na kusawazishwa mtandao ukirudi.',
    'offline.pending': 'kitendo kinasubiri kusawazishwa.',
    'offline.synced': 'Data zote zimesawazishwa ✓',
    'offline.reconnected': 'Mtandao umerudi! Inasawazisha sasa...',
    // Resources
    'resources.title': 'Maktaba ya Rasilimali na Mafunzo',
    'resources.subtitle': 'Mafunzo ya video, kozi shirikishi na miongozo ya kiufundi kwa viwango vyote.',
    'resources.all': 'Rasilimali zote',
    'resources.beginner': 'Mwanzoni',
    'resources.intermediate': 'Kati na Kati',
    'resources.advanced': 'Mtaalamu',
    'resources.watch_video': 'Tazama Video',
    // AI
    'ai.match_score': 'Alama ya Utangamano wa AI',
    'ai.smart_suggestion': 'Pendekezo Mahiri',
    'ai.interview_sim': 'Kiigaji cha Mahojiano ya Kiufundi',
    // Projects
    'projects.title': 'Miradi ya Jamii',
    'projects.subtitle': 'Gundua, jaribu na nunua miradi iliyojengwa na wasanidi programu bora wa Kiafrika.',
    'projects.about': 'Kuhusu Mradi',
    'projects.sale_terms': 'Masharti na Bei ya Mauzo',
    'projects.tech_stack': 'Teknolojia na Mifumo',
    'projects.links_share': 'Viungo na Kushiriki',
    'projects.demo': 'Jaribio Mtandaoni',
    'projects.buy': 'Nunua mradi huu',
    'projects.contact_author': 'Ujumbe',
    // Footer
    'footer.mission': 'Jukwaa kuu la Afrika linalothibitisha sifa, miradi halisi na ujuzi wa watengenezaji programu wa Kiafrika.',
    'footer.active_countries': 'Mtandao unaofanya kazi katika nchi 54 za Afrika',
    'footer.rights': 'AfriDev Hub. Imeundwa kwa fahari kwa ajili ya watengenezaji wa Kiafrika 🌍'
  }
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'afridev_lang';
  
  languages = SUPPORTED_LANGUAGES;
  currentLang = signal<Language>(SUPPORTED_LANGUAGES[0]);

  // Dictionnaire réactif pour la langue active
  activeDictionary = computed(() => {
    const code = this.currentLang().code;
    return DICTIONARIES[code] || DICTIONARIES['fr'];
  });

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    if (typeof window === 'undefined') return;
    const savedCode = localStorage.getItem(this.STORAGE_KEY);
    if (savedCode) {
      const match = this.languages.find(l => l.code === savedCode);
      if (match) {
        this.currentLang.set(match);
      }
    }
  }

  setLanguage(lang: Language): void {
    if (typeof window === 'undefined') return;
    const previousCode = this.currentLang().code;
    this.currentLang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang.code);
    document.documentElement.lang = lang.code;

    // Déclencher la mise à jour des cookies de traduction
    this.triggerGoogleTranslate(lang.code);

    // Si la langue a changé, recharger la page pour garantir une traduction 100% propre de tout le DOM
    if (previousCode !== lang.code) {
      setTimeout(() => {
        window.location.reload();
      }, 80);
    }
  }

  /**
   * Déclenche la traduction automatique de TOUTE la page (DOM complet)
   */
  public triggerGoogleTranslate(targetCode: string): void {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;

    if (targetCode === 'fr') {
      // Revenir à la langue d'origine (Français)
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=/fr/fr; path=/;';
      if (hostname && hostname !== 'localhost') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.' + hostname + '; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=' + hostname + '; path=/;';
        document.cookie = 'googtrans=/fr/fr; domain=.' + hostname + '; path=/;';
        document.cookie = 'googtrans=/fr/fr; domain=' + hostname + '; path=/;';
      }
    } else {
      // Activer la langue cible
      const cookieValue = `/fr/${targetCode}`;
      document.cookie = `googtrans=${cookieValue}; path=/;`;
      if (hostname && hostname !== 'localhost') {
        document.cookie = `googtrans=${cookieValue}; domain=.${hostname}; path=/;`;
        document.cookie = `googtrans=${cookieValue}; domain=${hostname}; path=/;`;
      }
    }

    // Tenter la synchronisation immédiate du sélecteur Google s'il existe déjà
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      select.value = targetCode === 'fr' ? '' : targetCode;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Traduire une clé dans la langue active
   */
  t(key: string, fallback?: string): string {
    const dict = this.activeDictionary();
    return dict[key] || DICTIONARIES['fr'][key] || fallback || key;
  }

  /**
   * Synthèse vocale de la langue (Prononciation africaine & internationale)
   */
  speakGreeting(lang?: Language): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const targetLang = lang || this.currentLang();
    window.speechSynthesis.cancel(); // Stoppe toute voix en cours

    const utterance = new SpeechSynthesisUtterance(targetLang.greeting);
    
    // Configurer le code voix correspondant
    switch (targetLang.code) {
      case 'fr':
        utterance.lang = 'fr-FR';
        break;
      case 'en':
        utterance.lang = 'en-US';
        break;
      case 'sw':
        utterance.lang = 'sw';
        break;
      case 'wo':
        // Pour le wolof, fallback avec prononciation phonétique claire
        utterance.lang = 'fr-SN';
        break;
      default:
        utterance.lang = 'fr-FR';
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}
