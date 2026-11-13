import { Injectable, NgZone, signal, computed, inject } from '@angular/core';

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
    'nav.view_site': 'Voir le site',
    'nav.overview': "Vue d'ensemble",
    'nav.applications': 'Candidatures',
    'nav.offers': 'Offres',
    'nav.tech_help': 'Entraide Tech',
    'nav.mentors': 'Mentors',
    'nav.courses': 'Formations',
    'nav.evaluations': 'Évaluations',
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
    'action.All': 'Tous',
    'action.reset': 'Réinitialiser',
    'action.details': 'Voir les détails',
    'action.close': 'Fermer',
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
    // Footer & Common UI
    'footer.mission': 'La première plateforme panafricaine certifiant la réputation, les projets réels et les compétences des développeurs africains.',
    'footer.mission_long': 'La première plateforme panafricaine certifiant la réputation, les projets réels et les compétences des développeurs africains auprès des pairs et des recruteurs du monde entier.',
    'footer.active_countries': 'Réseau actif dans 54 pays africains',
    'footer.rights': 'AfriDev Hub. Conçu avec fierté pour les développeurs africains 🌍',
    'footer.platform': 'Plateforme',
    'footer.showcase': 'Vitrine de Projets',
    'footer.jobs': 'Offres & Freelance',
    'footer.directory': 'Annuaire des Développeurs',
    'footer.peer_reviews': 'Évaluations par les Pairs',
    'footer.direct_messages': 'Messagerie Directe',
    'footer.trust_tech': 'Confiance & Tech',
    'footer.stay_connected': 'Restez Connecté',
    'footer.newsletter_desc': 'Recevez les meilleures opportunités Tech et collaborations open-source directement.',
    'footer.subtitle': 'Infrastructure de Réputation Panafricaine'
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
    'nav.view_site': 'View site',
    'nav.overview': 'Overview',
    'nav.applications': 'Applications',
    'nav.offers': 'Job Offers',
    'nav.tech_help': 'Tech Help',
    'nav.mentors': 'Mentors',
    'nav.courses': 'Courses',
    'nav.evaluations': 'Evaluations',
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
    'action.All': 'All',
    'action.reset': 'Reset',
    'action.details': 'View details',
    'action.close': 'Close',
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
    // Footer & Common UI
    'footer.mission': 'The premier pan-African platform certifying reputation, real-world projects and skills of African developers.',
    'footer.mission_long': 'The premier pan-African platform certifying reputation, real-world projects and skills of African developers with peers and recruiters worldwide.',
    'footer.active_countries': 'Active community across 54 African countries',
    'footer.rights': 'AfriDev Hub. Built with pride for African developers 🌍',
    'footer.platform': 'Platform',
    'footer.showcase': 'Project Showcase',
    'footer.jobs': 'Jobs & Freelance',
    'footer.directory': 'Developer Directory',
    'footer.peer_reviews': 'Peer Reviews',
    'footer.direct_messages': 'Direct Messaging',
    'footer.trust_tech': 'Trust & Tech',
    'footer.stay_connected': 'Stay Connected',
    'footer.newsletter_desc': 'Receive top tech opportunities and open-source collaborations directly.',
    'footer.subtitle': 'Pan-African Reputation Infrastructure'
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
    'nav.view_site': 'Xool dal bi',
    'nav.overview': 'Xool ci kaw',
    'nav.applications': ' Ñaan yi',
    'nav.offers': 'Liggéey yi',
    'nav.tech_help': 'Ndimbal Tech',
    'nav.mentors': 'Njiit yi',
    'nav.courses': 'Njàng yi',
    'nav.evaluations': 'Seetlu yi',
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
    'action.All': 'Yépp',
    'action.reset': 'Delloo na woon',
    'action.details': 'Xool li ci biir',
    'action.close': 'Tëj',
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
    // Footer & Common UI
    'footer.mission': 'Mboolo mu mag miy takk ndam ak wone xam-xamu liggéeykatu xarala yu Afrig.',
    'footer.mission_long': 'Mboolo mu mag miy takk ndam, sémb yu dëggu ak xam-xamu liggéeykatu xarala yu Afrig ci àddina bi.',
    'footer.active_countries': '54 réewi Afrig ñoo ci bokk',
    'footer.rights': 'AfriDev Hub. Defar nañ ko ak mbég ngir xaralay Afrig 🌍',
    'footer.platform': 'Dal bi',
    'footer.showcase': 'Wone Sémb yi',
    'footer.jobs': 'Liggéey & Freelance',
    'footer.directory': 'Limu Xarala yi',
    'footer.peer_reviews': 'Seetlu Moroom yi',
    'footer.direct_messages': 'Bataaxal Direct',
    'footer.trust_tech': 'Wóor & Xarala',
    'footer.stay_connected': 'Bokk ci xibaar yi',
    'footer.newsletter_desc': 'Jotal xéwal yu gëna baax ci Tech ak liggéeyu mboolo.',
    'footer.subtitle': 'Dalub Wóolu ci Afrig'
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
    'nav.view_site': 'Tazama tovuti',
    'nav.overview': 'Muhtasari',
    'nav.applications': 'Maombi',
    'nav.offers': 'Ofa za Kazi',
    'nav.tech_help': 'Msaada wa Tech',
    'nav.mentors': 'Washauri',
    'nav.courses': 'Mafunzo',
    'nav.evaluations': 'Tathmini',
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
    'action.All': 'Zote',
    'action.reset': 'Weka upya',
    'action.details': 'Tazama maelezo',
    'action.close': 'Funga',
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
    // Footer & Common UI
    'footer.mission': 'Jukwaa kuu la Afrika linalothibitisha sifa, miradi halisi na ujuzi wa watengenezaji programu wa Kiafrika.',
    'footer.mission_long': 'Jukwaa kuu la Afrika linalothibitisha sifa, miradi halisi na ujuzi wa watengenezaji programu wa Kiafrika kwa wenzao na waajiri kote duniani.',
    'footer.active_countries': 'Mtandao unaofanya kazi katika nchi 54 za Afrika',
    'footer.rights': 'AfriDev Hub. Imeundwa kwa fahari kwa ajili ya watengenezaji wa Kiafrika 🌍',
    'footer.platform': 'Jukwaa',
    'footer.showcase': 'Maonyesho ya Miradi',
    'footer.jobs': 'Ajira na Freelance',
    'footer.directory': 'Orodha ya Wasanidi',
    'footer.peer_reviews': 'Tathmini za Wenza',
    'footer.direct_messages': 'Ujumbe wa Moja kwa Moja',
    'footer.trust_tech': 'Uaminifu na Tech',
    'footer.stay_connected': 'Endelea Kuunganishwa',
    'footer.newsletter_desc': 'Pokea fursa bora za Tech na ushirikiano wa open-source moja kwa moja.',
    'footer.subtitle': 'Miundombinu ya Sifa ya Afrika Nzima'
  }
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'afridev_lang';
  private readonly ngZone = inject(NgZone);

  languages = SUPPORTED_LANGUAGES;
  currentLang = signal<Language>(SUPPORTED_LANGUAGES[0]);

  // Index inversé ultra-rapide O(1) permettant d'identifier toute phrase connue (FR, EN, WO, SW)
  private readonly phraseToKeyMap = new Map<string, string>();
  // Sauvegarde du texte français original de chaque noeud Text pour une restauration 0ms
  private readonly originalTextMap = new WeakMap<Text, string>();
  private readonly originalAttrMap = new WeakMap<Element, Record<string, string>>();
  private domObserver: MutationObserver | null = null;
  private rafPending = false;
  private comboRetryTimer: ReturnType<typeof setTimeout> | null = null;

  // Dictionnaire réactif pour la langue active
  activeDictionary = computed(() => {
    const code = this.currentLang().code;
    return DICTIONARIES[code] || DICTIONARIES['fr'];
  });

  constructor() {
    this.buildPhraseLookupIndex();
    this.initLanguage();
  }

  private normalizePhrase(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private buildPhraseLookupIndex(): void {
    for (const langCode of Object.keys(DICTIONARIES)) {
      const dict = DICTIONARIES[langCode];
      for (const [key, val] of Object.entries(dict)) {
        const norm = this.normalizePhrase(val);
        if (norm && !this.phraseToKeyMap.has(norm)) {
          this.phraseToKeyMap.set(norm, key);
        }
      }
    }
  }

  private initLanguage(): void {
    if (typeof window === 'undefined') return;
    const savedCode = localStorage.getItem(this.STORAGE_KEY);
    if (savedCode) {
      const match = this.languages.find(l => l.code === savedCode);
      if (match) {
        this.currentLang.set(match);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = match.code;
        }
        if (match.code !== 'fr') {
          this.scheduleInitialTranslation(match.code);
        } else {
          this.clearGoogTransCookies();
        }
      }
    }
  }

  private scheduleInitialTranslation(targetCode: string): void {
    if (typeof window === 'undefined') return;
    this.ngZone.runOutsideAngular(() => {
      this.setupDomObserver();
      const runPass = () => {
        this.applyInstantDomTranslation(targetCode);
        this.syncGoogleTranslateCombo(targetCode, 0);
      };
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', runPass, { once: true });
      } else {
        setTimeout(runPass, 0);
      }
    });
  }

  /**
   * Changement de langue instantané, fluide et sans rechargement de page
   * Compatible Chrome, Firefox, Edge et Safari (Mobile, Tablette, Desktop)
   */
  setLanguage(lang: Language): void {
    if (typeof window === 'undefined') return;

    this.currentLang.set(lang);
    try {
      localStorage.setItem(this.STORAGE_KEY, lang.code);
    } catch {}

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang.code;
    }

    // Appliquer immédiatement la traduction (Dictionnaire + DOM + Widget Google hors NgZone)
    this.triggerGoogleTranslate(lang.code);
  }

  /**
   * Purge tous les cookies googtrans sur tous les niveaux de domaine
   * (host, .host, domaine parent ex: .economestore.com) pour éviter tout blocage sur Chrome/Firefox/Edge
   */
  public clearGoogTransCookies(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const hostname = window.location.hostname || '';
    const parts = hostname.split('.');
    const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
    const domains = Array.from(new Set(['', hostname, `.${hostname}`, rootDomain, `.${rootDomain}`]));
    const exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';

    for (const d of domains) {
      if (d === '.' || !d && d !== '') continue;
      const domAttr = d ? `; domain=${d}` : '';
      document.cookie = `googtrans=; ${exp}${domAttr}; path=/`;
      document.cookie = `googtrans=; ${exp}${domAttr}`;
    }
  }

  /**
   * Déclenche la traduction instantanée du DOM sans jamais bloquer le navigateur ni recharger la page
   */
  public triggerGoogleTranslate(targetCode: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    if (this.comboRetryTimer) {
      clearTimeout(this.comboRetryTimer);
      this.comboRetryTimer = null;
    }

    // 1. Toujours purger d'abord les anciens cookies multi-domaines
    this.clearGoogTransCookies();

    // 2. Si une langue autre que le français est sélectionnée, poser un unique cookie propre
    if (targetCode !== 'fr') {
      const cookieValue = `/fr/${targetCode}`;
      document.cookie = `googtrans=${cookieValue}; path=/; SameSite=Lax`;
    }

    // 3. Exécuter les opérations DOM & Google Translate en dehors de NgZone pour 0 ralentissement
    this.ngZone.runOutsideAngular(() => {
      if (targetCode === 'fr') {
        this.disconnectDomObserver();
        this.restoreGoogleTranslateToFrench();
        this.unwrapGoogleFontNodes();
        this.applyInstantDomTranslation('fr');
      } else {
        this.unwrapGoogleFontNodes();
        this.applyInstantDomTranslation(targetCode);
        this.setupDomObserver();
        this.syncGoogleTranslateCombo(targetCode, 0);
      }
    });
  }

  /**
   * Pilote le sélecteur .goog-te-combo de Google Translate avec retry non-bloquant
   */
  private syncGoogleTranslateCombo(targetCode: string, attempt: number): void {
    if (typeof document === 'undefined') return;

    const select = document.querySelector('select.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      // S'assurer que l'option cible existe dans le select
      let hasOption = false;
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === targetCode) {
          hasOption = true;
          break;
        }
      }
      if (!hasOption && targetCode) {
        const opt = document.createElement('option');
        opt.value = targetCode;
        opt.text = targetCode;
        select.appendChild(opt);
      }

      if (select.value !== targetCode) {
        select.value = targetCode;
      }
      select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      return;
    }

    // Si element.js est encore en cours de chargement asynchrone, réessayer sans bloquer
    if (attempt < 15) {
      this.comboRetryTimer = setTimeout(() => {
        if (this.currentLang().code === targetCode) {
          this.syncGoogleTranslateCombo(targetCode, attempt + 1);
        }
      }, 160);
    }
  }

  /**
   * Restaure nativement Google Translate vers le Français sans recharger la page
   */
  private restoreGoogleTranslateToFrench(): void {
    if (typeof document === 'undefined') return;

    try {
      // 1. Cliquer sur le bouton de restauration interne des iframes Google Translate si présent
      const iframes = document.querySelectorAll<HTMLIFrameElement>(
        'iframe.goog-te-banner-frame, iframe.skiptranslate, iframe[id*=":1.container"], iframe[id*=":2.container"]'
      );
      iframes.forEach(iframe => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            const restoreBtn = doc.querySelector<HTMLElement>(
              '[id*=".restore"], button[id*=".restore"], a.goog-close-link, .goog-close-link'
            );
            if (restoreBtn) {
              restoreBtn.click();
            }
          }
        } catch {}
      });

      // 2. Réinitialiser le sélecteur .goog-te-combo
      const select = document.querySelector('select.goog-te-combo') as HTMLSelectElement | null;
      if (select) {
        select.value = '';
        select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      }

      // 3. Nettoyer les classes d'état Google Translate sur <html> et <body>
      document.documentElement.classList.remove('translated-ltr', 'translated-rtl');
      document.body?.classList.remove('translated-ltr', 'translated-rtl');
      if (document.body) {
        document.body.style.top = '0px';
      }
    } catch {}
  }

  /**
   * Désencapsule proprement les balises <font> injectées par Google Translate
   * pour éviter toute corruption DOM lors du passage d'une langue à une autre
   */
  private unwrapGoogleFontNodes(): void {
    if (typeof document === 'undefined' || !document.body) return;
    try {
      const fonts = document.body.querySelectorAll('font');
      // Parcourir de l'intérieur vers l'extérieur (ordre inverse)
      for (let i = fonts.length - 1; i >= 0; i--) {
        const fontEl = fonts[i];
        const parent = fontEl.parentNode;
        if (!parent) continue;
        while (fontEl.firstChild) {
          parent.insertBefore(fontEl.firstChild, fontEl);
        }
        parent.removeChild(fontEl);
      }
    } catch {}
  }

  /**
   * Traduit instantanément (< 2ms) tous les textes et attributs connus du DOM
   * et restaure immédiatement le français original quand targetCode === 'fr'
   */
  public applyInstantDomTranslation(targetCode: string, root: Node = document.body): void {
    if (typeof document === 'undefined' || !root) return;

    const targetDict = DICTIONARIES[targetCode] || DICTIONARIES['fr'];
    const frDict = DICTIONARIES['fr'];

    // 1. Traduction / Restauration des noeuds Text
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node: Node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'PRE' || tag === 'TEXTAREA') {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.closest('.lang-dropdown-container, .lang-dropdown-wrapper, #google_translate_element')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let currentNode = walker.nextNode() as Text | null;
    while (currentNode) {
      const raw = currentNode.nodeValue || '';
      const trimmed = this.normalizePhrase(raw);

      if (trimmed.length > 0) {
        if (targetCode === 'fr') {
          // Restauration immédiate du français original
          const savedOriginal = this.originalTextMap.get(currentNode);
          if (savedOriginal !== undefined && currentNode.nodeValue !== savedOriginal) {
            currentNode.nodeValue = savedOriginal;
          } else {
            const matchedKey = this.phraseToKeyMap.get(trimmed);
            if (matchedKey && frDict[matchedKey]) {
              currentNode.nodeValue = this.preserveWhitespace(raw, frDict[matchedKey]);
            }
          }
        } else {
          // Sauvegarder la référence française initiale si pas encore enregistrée
          const matchedKey = this.phraseToKeyMap.get(trimmed);
          if (matchedKey) {
            if (!this.originalTextMap.has(currentNode)) {
              this.originalTextMap.set(currentNode, this.preserveWhitespace(raw, frDict[matchedKey] || trimmed));
            }
            const translated = targetDict[matchedKey];
            if (translated) {
              const nextVal = this.preserveWhitespace(raw, translated);
              if (currentNode.nodeValue !== nextVal) {
                currentNode.nodeValue = nextVal;
              }
            }
          } else if (!this.originalTextMap.has(currentNode)) {
            this.originalTextMap.set(currentNode, raw);
          }
        }
      }
      currentNode = walker.nextNode() as Text | null;
    }

    // 2. Traduction / Restauration des attributs placeholder et title
    if (root instanceof Element || root instanceof Document) {
      const elements = (root as Element).querySelectorAll
        ? (root as Element).querySelectorAll('[placeholder], [title]')
        : [];
      elements.forEach(el => {
        if (el.closest('.lang-dropdown-container, .lang-dropdown-wrapper')) return;
        for (const attr of ['placeholder', 'title']) {
          const val = el.getAttribute(attr);
          if (!val) continue;
          const norm = this.normalizePhrase(val);
          const key = this.phraseToKeyMap.get(norm);
          if (!key) continue;

          let savedAttrs = this.originalAttrMap.get(el);
          if (!savedAttrs) {
            savedAttrs = {};
            this.originalAttrMap.set(el, savedAttrs);
          }
          if (!savedAttrs[attr]) {
            savedAttrs[attr] = frDict[key] || val;
          }

          const nextAttrVal = targetCode === 'fr' ? savedAttrs[attr] : (targetDict[key] || val);
          if (nextAttrVal && el.getAttribute(attr) !== nextAttrVal) {
            el.setAttribute(attr, nextAttrVal);
          }
        }
      });
    }
  }

  private preserveWhitespace(originalRaw: string, replacement: string): string {
    const leadingMatch = originalRaw.match(/^\s*/);
    const trailingMatch = originalRaw.match(/\s*$/);
    const leading = leadingMatch ? leadingMatch[0] : '';
    const trailing = trailingMatch ? trailingMatch[0] : '';
    return `${leading}${replacement}${trailing}`;
  }

  /**
   * Observe uniquement l'ajout de nouveaux éléments DOM (changement de page Angular)
   * hors NgZone et sans jamais observer les attributs/styles (0 boucle infinie, 0 lag)
   */
  private setupDomObserver(): void {
    if (typeof window === 'undefined' || typeof MutationObserver === 'undefined' || !document.body) return;
    if (this.domObserver) return;

    this.ngZone.runOutsideAngular(() => {
      this.domObserver = new MutationObserver(() => {
        const code = this.currentLang().code;
        if (code === 'fr' || this.rafPending) return;
        this.rafPending = true;
        requestAnimationFrame(() => {
          this.rafPending = false;
          const activeCode = this.currentLang().code;
          if (activeCode !== 'fr' && document.body) {
            this.applyInstantDomTranslation(activeCode, document.body);
          }
        });
      });

      this.domObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  private disconnectDomObserver(): void {
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }
    this.rafPending = false;
  }

  /**
   * Traduire une clé dans la langue active
   */
  t(key: string, fallback?: string): string {
    const dict = this.activeDictionary();
    return dict[key] || DICTIONARIES['fr'][key] || fallback || key;
  }

  /**
   * Synthèse vocale non-bloquante (Prononciation africaine & internationale)
   */
  speakGreeting(lang?: Language): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const targetLang = lang || this.currentLang();
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(targetLang.greeting);
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
              utterance.lang = 'fr-SN';
              break;
            default:
              utterance.lang = 'fr-FR';
          }
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch {}
      }, 15);
    });
  }
}
