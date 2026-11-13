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
    'action.details_short': 'Détails',
    'action.discover': 'Découvrir',
    'action.view_profile': 'Voir le Profil',
    'action.close': 'Fermer',
    // Hero & Home
    'hero.badge': 'Le Premier Réseau Tech Panafricain Certifié',
    'hero.title_1': 'Connectez les Talents Tech Africains',
    'hero.title_2': 'Évaluez, Collaborez & Propulsez votre Carrière',
    'hero.subtitle': 'AfriDev Hub réunit les développeurs, ingénieurs et recruteurs du continent. Valorisez vos projets réels, certifiez votre réputation par vos pairs et accédez aux meilleures opportunités Tech.',
    'hero.join_free': 'Rejoindre la Communauté (Gratuit)',
    'hero.my_space': 'Accéder à mon Espace',
    'hero.discover_projects': 'Découvrir les Projets',
    'hero.interconnection': 'Interconnexion Afrique • 54 Pays',
    'hero.live_network': 'Réseau Live',
    'hero.stat_rep': 'Réputation Certifiée',
    'hero.stat_sync': 'Synchronisation Directe',
    'hero.stat_countries_num': '54 Pays',
    'hero.stat_pan': 'Réseau Panafricain',
    'hero.stat_verified': 'Vérifié',
    'hero.stat_momo_peers': 'Mobile Money & Pairs',
    // Home Pillars
    'home.why_badge': 'Pourquoi Choisir AfriDev Hub ?',
    'home.why_title': "Une Plateforme Conçue pour l'Écosystème Tech Africain",
    'home.why_desc': "L'essentiel pour prouver votre valeur et collaborer en confiance.",
    'home.p1_kicker': 'Confiance',
    'home.p1_lead': 'Un score technique audité par vos pairs.',
    'home.p1_pt1': 'Qualité de code & architecture',
    'home.p1_pt2': 'Collaboration & fiabilité prouvées',
    'home.p1_pt3': 'Au-delà des simples CV',
    'home.p2_kicker': 'Code & Stacks',
    'home.p2_title': 'GitHub Live & Stats',
    'home.p2_lead': "Vos contributions parlent d'elles-mêmes.",
    'home.p2_pt1': 'Activité des 12 derniers mois',
    'home.p2_pt2': 'Langages & étoiles valorisés',
    'home.p2_pt3': 'Synchronisation en 1 clic',
    'home.p3_kicker': 'Carrière',
    'home.p3_title': 'Opportunités Vérifiées',
    'home.p3_lead': 'Missions & emplois tech sans mauvaise surprise.',
    'home.p3_pt1': 'Offres CDI & freelance contrôlées',
    'home.p3_pt2': 'Profils Mobile Money vérifiés',
    'home.p3_pt3': 'Paiements & cessions sécurisés',
    'home.p4_title': 'Messagerie Instantanée',
    'home.p4_lead': 'Échangez en direct à travers tout le continent.',
    'home.p4_pt1': 'Chat direct devs & mentors',
    'home.p4_pt2': 'Lien direct avec les recruteurs',
    'home.p4_pt3': 'Citations & suivi fluide',
    // Home Metrics & Sections
    'home.metric_devs': 'Développeurs Inscrits',
    'home.metric_devs_sub': 'Talents certifiés et actifs',
    'home.metric_projs': 'Projets & Repos',
    'home.metric_projs_sub': 'Open Source et Vitrines SaaS',
    'home.metric_opps': 'Opportunités Tech',
    'home.metric_opps_sub': 'CDI, Freelance & Missions',
    'home.metric_countries': 'Pays Représentés',
    'home.metric_countries_sub': 'Couverture 100% continentale',
    'home.proj_title': 'Dernières Créations de la Communauté',
    'home.proj_sub': 'Explorez les projets phares, applications open-source et SaaS conçus par les développeurs africains.',
    'home.proj_all': 'Voir tous les projets',
    'home.proj_publish': 'Publier un Projet',
    'home.members_badge': 'Annuaire & Réseau',
    'home.members_title': "Rencontrez les Développeurs d'Élite",
    'home.members_sub': "Connectez-vous avec les talents tech les plus actifs, vérifiés et recommandés à travers toute l'Afrique.",
    'home.members_all': "Explorer l'Annuaire complet",
    'home.comm_badge': 'Collectifs & Écosystème',
    'home.comm_title': 'Communautés Tech Panafricaines',
    'home.comm_sub': "Rejoignez des collectifs de développeurs par technologie, pays ou centre d'intérêt. Partagez vos savoirs et entraidez-vous au quotidien.",
    'home.comm_all': 'Explorer toutes les communautés',
    'home.steps_badge': 'Parcours Simple & Rapide',
    'home.steps_title': 'Comment Fonctionne AfriDev Hub ?',
    'home.steps_sub': 'Trois étapes simples pour passer de votre profil GitHub aux meilleures opportunités du continent.',
    'home.step1_title': 'Créez votre Profil',
    'home.step1_desc': 'Ajoutez vos compétences, votre pays et synchronisez GitHub en quelques secondes.',
    'home.step1_act_1': 'Compléter mon profil',
    'home.step1_act_2': 'Créer un profil',
    'home.step2_title': 'Publiez & Certifiez',
    'home.step2_desc': 'Exposez vos projets réels et obtenez des évaluations vérifiées par vos pairs.',
    'home.step2_act': 'Découvrir la vitrine',
    'home.step3_title': 'Collaborez & Postulez',
    'home.step3_desc': 'Discutez en direct par messagerie et décrochez les meilleures missions Tech.',
    'home.step3_act': 'Explorer les offres',
    'home.cta_title': 'Prêt à Propulser votre Carrière Tech en Afrique ?',
    'home.cta_desc': 'Rejoignez gratuitement la communauté AfriDev Hub et faites reconnaître votre valeur technique à sa juste mesure.',
    'home.cta_btn_dash': 'Accéder à mon Tableau de Bord',
    'home.cta_btn_reg': 'Créer un Compte Gratuitement',
    'home.cta_btn_opp': 'Consulter les Opportunités',
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
    'action.details_short': 'Details',
    'action.discover': 'Discover',
    'action.view_profile': 'View Profile',
    'action.close': 'Close',
    // Hero & Home
    'hero.badge': 'The First Certified Pan-African Tech Network',
    'hero.title_1': 'Connect African Tech Talents',
    'hero.title_2': 'Evaluate, Collaborate & Propel Your Career',
    'hero.subtitle': 'AfriDev Hub brings together developers, engineers and recruiters across the continent. Showcase your real projects, certify your reputation with peers and access top Tech opportunities.',
    'hero.join_free': 'Join the Community (Free)',
    'hero.my_space': 'Access My Space',
    'hero.discover_projects': 'Discover Projects',
    'hero.interconnection': 'Africa Interconnection • 54 Countries',
    'hero.live_network': 'Live Network',
    'hero.stat_rep': 'Certified Reputation',
    'hero.stat_sync': 'Direct Synchronization',
    'hero.stat_countries_num': '54 Countries',
    'hero.stat_pan': 'Pan-African Network',
    'hero.stat_verified': 'Verified',
    'hero.stat_momo_peers': 'Mobile Money & Peers',
    // Home Pillars
    'home.why_badge': 'Why Choose AfriDev Hub?',
    'home.why_title': 'A Platform Designed for the African Tech Ecosystem',
    'home.why_desc': 'Everything you need to prove your skills and collaborate with confidence.',
    'home.p1_kicker': 'Trust',
    'home.p1_lead': 'A technical score audited by your peers.',
    'home.p1_pt1': 'Code quality & architecture',
    'home.p1_pt2': 'Proven collaboration & reliability',
    'home.p1_pt3': 'Beyond traditional resumes',
    'home.p2_kicker': 'Code & Stacks',
    'home.p2_title': 'GitHub Live & Stats',
    'home.p2_lead': 'Your contributions speak for themselves.',
    'home.p2_pt1': 'Last 12 months activity',
    'home.p2_pt2': 'Highlighted languages & stars',
    'home.p2_pt3': '1-click synchronization',
    'home.p3_kicker': 'Career',
    'home.p3_title': 'Verified Opportunities',
    'home.p3_lead': 'Tech missions & jobs with zero surprises.',
    'home.p3_pt1': 'Vetted full-time & freelance offers',
    'home.p3_pt2': 'Verified Mobile Money profiles',
    'home.p3_pt3': 'Secure payments & transfers',
    'home.p4_title': 'Instant Messaging',
    'home.p4_lead': 'Chat live across the entire continent.',
    'home.p4_pt1': 'Direct chat with devs & mentors',
    'home.p4_pt2': 'Direct link with recruiters',
    'home.p4_pt3': 'Smooth replies & tracking',
    // Home Metrics & Sections
    'home.metric_devs': 'Registered Developers',
    'home.metric_devs_sub': 'Certified and active talents',
    'home.metric_projs': 'Projects & Repos',
    'home.metric_projs_sub': 'Open Source and SaaS Showcases',
    'home.metric_opps': 'Tech Opportunities',
    'home.metric_opps_sub': 'Full-time, Freelance & Missions',
    'home.metric_countries': 'Countries Represented',
    'home.metric_countries_sub': '100% continental coverage',
    'home.proj_title': 'Latest Community Creations',
    'home.proj_sub': 'Explore flagship projects, open-source apps and SaaS built by African developers.',
    'home.proj_all': 'View all projects',
    'home.proj_publish': 'Publish a Project',
    'home.members_badge': 'Directory & Network',
    'home.members_title': 'Meet Elite Developers',
    'home.members_sub': 'Connect with the most active, verified and recommended tech talents across Africa.',
    'home.members_all': 'Explore full Directory',
    'home.comm_badge': 'Collectives & Ecosystem',
    'home.comm_title': 'Pan-African Tech Communities',
    'home.comm_sub': 'Join developer collectives by technology, country or interest. Share knowledge and help each other daily.',
    'home.comm_all': 'Explore all communities',
    'home.steps_badge': 'Simple & Fast Journey',
    'home.steps_title': 'How Does AfriDev Hub Work?',
    'home.steps_sub': 'Three simple steps to go from your GitHub profile to the best opportunities on the continent.',
    'home.step1_title': 'Create Your Profile',
    'home.step1_desc': 'Add your skills, country and sync GitHub in seconds.',
    'home.step1_act_1': 'Complete my profile',
    'home.step1_act_2': 'Create a profile',
    'home.step2_title': 'Publish & Certify',
    'home.step2_desc': 'Showcase your real projects and get verified peer reviews.',
    'home.step2_act': 'Discover the showcase',
    'home.step3_title': 'Collaborate & Apply',
    'home.step3_desc': 'Chat live via messaging and land the best Tech missions.',
    'home.step3_act': 'Explore job offers',
    'home.cta_title': 'Ready to Propel Your Tech Career in Africa?',
    'home.cta_desc': 'Join the AfriDev Hub community for free and get your technical skills recognized.',
    'home.cta_btn_dash': 'Access My Dashboard',
    'home.cta_btn_reg': 'Create a Free Account',
    'home.cta_btn_opp': 'Browse Opportunities',
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
    'nav.applications': 'Ñaan yi',
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
    'action.details_short': 'Li ci biir',
    'action.discover': 'Xoolal',
    'action.view_profile': 'Xool Jëmm ji',
    'action.close': 'Tëj',
    // Hero & Home
    'hero.badge': 'Mboolo Tech bu Njëkk ci Afrig bu Wóor',
    'hero.title_1': 'Lëkkale Xaralay Afrig yi',
    'hero.title_2': 'Seetlu, Liggéeyandoo & Yëkkati sa Liggéey',
    'hero.subtitle': 'AfriDev Hub dajale na liggéeykati xarala ak ñiy wut liggéeykat ci Afrig. Wonel sa sémb yu dëggu te am xéwal yu baax.',
    'hero.join_free': 'Bokk ci Mboolo mi (Amul fay)',
    'hero.my_space': 'Duggu ci sama Palaas',
    'hero.discover_projects': 'Xool Sémb yi',
    'hero.interconnection': 'Lëkkaloo Afrig • 54 Réew',
    'hero.live_network': 'Mboolo Live',
    'hero.stat_rep': 'Wóolu bu Wér',
    'hero.stat_sync': 'Lëkkaloo Direct',
    'hero.stat_countries_num': '54 Réew',
    'hero.stat_pan': 'Mboolo Afrig',
    'hero.stat_verified': 'Wér na',
    'hero.stat_momo_peers': 'Mobile Money & Moroom',
    // Home Pillars
    'home.why_badge': 'Lu tax ngay tànn AfriDev Hub ?',
    'home.why_title': 'Dal buñ Defar ngir Xaralay Afrig',
    'home.why_desc': 'Lépp loo soxla ngir wone sa xam-xam ak liggéey ci wóolu.',
    'home.p1_kicker': 'Wóolu',
    'home.p1_lead': 'Seetlu xam-xam bu say moroom dëggal.',
    'home.p1_pt1': 'Baaxaayu kod ak tabax',
    'home.p1_pt2': 'Liggéeyandoo ak wóolu bu leer',
    'home.p1_pt3': 'Raw ay kayitu CV rekk',
    'home.p2_kicker': 'Kod & Xarala',
    'home.p2_title': 'GitHub Live & Lim yi',
    'home.p2_lead': 'Sa liggéey mooy wax ci yaw.',
    'home.p2_pt1': 'Liggéeyu 12 weer yi weesu',
    'home.p2_pt2': 'Làkk yi ak biddéew yi',
    'home.p2_pt3': 'Lëkkaloo ci benn bës',
    'home.p3_kicker': 'Liggéey',
    'home.p3_title': 'Xéwal yu Wér',
    'home.p3_lead': 'Liggéeyu Tech yu amul njaxlaf.',
    'home.p3_pt1': 'Xéwal CDI ak freelance yuñ seetlu',
    'home.p3_pt2': 'Jëmm Mobile Money yu wér',
    'home.p3_pt3': 'Fay ak jëflante yu wóor',
    'home.p4_title': 'Bataaxal bu Gaaw',
    'home.p4_lead': 'Waxtaanal direct ci biir Afrig gépp.',
    'home.p4_pt1': 'Waxtaan direct ak xarala yi',
    'home.p4_pt2': 'Lëkkaloo direct ak ñiy jël liggéey',
    'home.p4_pt3': 'Toppato bu yomb te gaaw',
    // Home Metrics & Sections
    'home.metric_devs': 'Xarala yu Bindu',
    'home.metric_devs_sub': 'Xam-xam yu wér te dox',
    'home.metric_projs': 'Sémb & Repos',
    'home.metric_projs_sub': 'Open Source ak SaaS',
    'home.metric_opps': 'Xéwali Tech',
    'home.metric_opps_sub': 'CDI, Freelance & Liggéey',
    'home.metric_countries': 'Réew yi ci Bokk',
    'home.metric_countries_sub': 'Afrig gépp 100%',
    'home.proj_title': 'Sémb yu Bees yu Mboolo mi',
    'home.proj_sub': 'Xoolal sémb yu mag yi, aplicaciones open-source ak SaaS yu xaralay Afrig defar.',
    'home.proj_all': 'Xool sémb yépp',
    'home.proj_publish': 'Duggal Sémb',
    'home.members_badge': 'Limu Xarala & Mboolo',
    'home.members_title': 'Taalif Xarala yu Mag yi',
    'home.members_sub': 'Lëkkalool ak xarala yi gëna sawar te wér ci biir Afrig gépp.',
    'home.members_all': 'Xool Lim bi yépp',
    'home.comm_badge': 'Mbooloo & Xarala',
    'home.comm_title': 'Mbooloo Tech yu Afrig',
    'home.comm_sub': 'Bokkal ci mbooloo xarala yi ci sa réew walla sa xam-xam ngir dimbalante bés bu nekk.',
    'home.comm_all': 'Xool mbooloo yépp',
    'home.steps_badge': 'Yoon wu Yomb te Gaaw',
    'home.steps_title': 'Naka la AfriDev Hub di Doxe ?',
    'home.steps_sub': 'Ñetti jéego yu yomb ngir jóge ci sa GitHub dem ci xéwal yi gëna baax ci Afrig.',
    'home.step1_title': 'Sos sa Jëmm',
    'home.step1_desc': 'Duggalal sa xam-xam, sa réew te lëkkale ko ak GitHub ci saa si.',
    'home.step1_act_1': 'Mottali sama jëmm',
    'home.step1_act_2': 'Sos sama jëmm',
    'home.step2_title': 'Wonel & Wóoral',
    'home.step2_desc': 'Wonel sa sémb yu dëggu te am seetlu yu wér ci say moroom.',
    'home.step2_act': 'Xool wone gi',
    'home.step3_title': 'Liggéeyandoo & Ñaan',
    'home.step3_desc': 'Waxtaanal direct ci bataaxal te am liggéey Tech yi gëna baax.',
    'home.step3_act': 'Xool xéwal yi',
    'home.cta_title': 'Ndax Pare nga ngir Yëkkati sa Liggéeyu Tech ci Afrig ?',
    'home.cta_desc': 'Bokkal ci AfriDev Hub amul fay ngir ñu xam sa xam-xam bu dëggu.',
    'home.cta_btn_dash': 'Duggu ci sama Palaas',
    'home.cta_btn_reg': 'Sos Kont bu Amul Fay',
    'home.cta_btn_opp': 'Xool Xéwal yi',
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
    'action.details_short': 'Maelezo',
    'action.discover': 'Gundua',
    'action.view_profile': 'Tazama Wasifu',
    'action.close': 'Funga',
    // Hero & Home
    'hero.badge': 'Mtandao wa Kwanza wa Tech Ulioidhinishwa Afrika',
    'hero.title_1': 'Unganisha Vipaji vya Tech vya Afrika',
    'hero.title_2': 'Tathmini, Shirikiana na Kuza Kipaji Chako',
    'hero.subtitle': 'AfriDev Hub inawaunganisha wasanidi programu, wahandisi na waajiri kote barani. Onyesha miradi yako halisi, thibitisha sifa yako na upate fursa bora za Tech.',
    'hero.join_free': 'Jiunge na Jumuiya (Bure)',
    'hero.my_space': 'Ingia Kwenye Akaunti Yangu',
    'hero.discover_projects': 'Gundua Miradi',
    'hero.interconnection': 'Muunganisho wa Afrika • Nchi 54',
    'hero.live_network': 'Mtandao Mubashara',
    'hero.stat_rep': 'Sifa Iliyothibitishwa',
    'hero.stat_sync': 'Usawazishaji wa Moja kwa Moja',
    'hero.stat_countries_num': 'Nchi 54',
    'hero.stat_pan': 'Mtandao wa Afrika Nzima',
    'hero.stat_verified': 'Imethibitishwa',
    'hero.stat_momo_peers': 'Mobile Money na Wenza',
    // Home Pillars
    'home.why_badge': 'Kwa Nini Uchague AfriDev Hub?',
    'home.why_title': 'Jukwaa Lililoundwa kwa Mfumo wa Tech wa Afrika',
    'home.why_desc': 'Kila kitu unachohitaji ili kuthibitisha thamani yako na kushirikiana kwa uaminifu.',
    'home.p1_kicker': 'Uaminifu',
    'home.p1_lead': 'Alama ya kiufundi iliyokaguliwa na wenzako.',
    'home.p1_pt1': 'Ubora wa msimbo na usanifu',
    'home.p1_pt2': 'Ushirikiano na uaminifu uliothibitishwa',
    'home.p1_pt3': 'Zaidi ya CV za kawaida',
    'home.p2_kicker': 'Msimbo na Teknolojia',
    'home.p2_title': 'GitHub Mubashara na Takwimu',
    'home.p2_lead': 'Michango yako inajieleza yenyewe.',
    'home.p2_pt1': 'Shughuli za miezi 12 iliyopita',
    'home.p2_pt2': 'Lugha na nyota zilizopewa kipaumbele',
    'home.p2_pt3': 'Usawazishaji kwa kubofya mara 1',
    'home.p3_kicker': 'Kazi na Ajira',
    'home.p3_title': 'Fursa Zilizothibitishwa',
    'home.p3_lead': 'Kazi na miradi ya tech bila usumbufu.',
    'home.p3_pt1': 'Ajira za kudumu na freelance zilizohakikiwa',
    'home.p3_pt2': 'Wasifu wa Mobile Money uliothibitishwa',
    'home.p3_pt3': 'Malipo na mauzo salama',
    'home.p4_title': 'Ujumbe wa Papo Hapo',
    'home.p4_lead': 'Wasiliana moja kwa moja kote barani Afrika.',
    'home.p4_pt1': 'Mazungumzo ya moja kwa moja na washauri',
    'home.p4_pt2': 'Mawasiliano ya moja kwa moja na waajiri',
    'home.p4_pt3': 'Majibu na ufuatiliaji wa haraka',
    // Home Metrics & Sections
    'home.metric_devs': 'Wasanidi Waliosajiliwa',
    'home.metric_devs_sub': 'Vipaji vilivyothibitishwa na hai',
    'home.metric_projs': 'Miradi na Repos',
    'home.metric_projs_sub': 'Open Source na Maonyesho ya SaaS',
    'home.metric_opps': 'Fursa za Tech',
    'home.metric_opps_sub': 'Ajira, Freelance na Miradi',
    'home.metric_countries': 'Nchi Zinazowakilishwa',
    'home.metric_countries_sub': 'Mtandao wa Afrika nzima 100%',
    'home.proj_title': 'Miradi Mipya ya Jumuiya',
    'home.proj_sub': 'Chunguza miradi mikuu, programu za open-source na SaaS zilizoundwa na wasanidi wa Kiafrika.',
    'home.proj_all': 'Tazama miradi yote',
    'home.proj_publish': 'Chapisha Mradi',
    'home.members_badge': 'Orodha na Mtandao',
    'home.members_title': 'Kutana na Wasanidi Bora',
    'home.members_sub': 'Ungana na vipaji vya tech vinavyofanya kazi kwa bidii na vilivyothibitishwa kote Afrika.',
    'home.members_all': 'Chunguza Orodha kamili',
    'home.comm_badge': 'Vikundi na Mfumo',
    'home.comm_title': 'Jumuiya za Tech za Afrika Nzima',
    'home.comm_sub': 'Jiunge na vikundi vya wasanidi kulingana na teknolojia, nchi au mada. Shiriki maarifa kila siku.',
    'home.comm_all': 'Chunguza jumuiya zote',
    'home.steps_badge': 'Hatua Rahisi na Haraka',
    'home.steps_title': 'AfriDev Hub Inafanyaje Kazi?',
    'home.steps_sub': 'Hatua tatu rahisi kutoka kwenye wasifu wako wa GitHub hadi fursa bora za bara la Afrika.',
    'home.step1_title': 'Unda Wasifu Wako',
    'home.step1_desc': 'Ongeza ujuzi wako, nchi yako na uunganishe GitHub kwa sekunde chache.',
    'home.step1_act_1': 'Kamilisha wasifu wangu',
    'home.step1_act_2': 'Unda wasifu',
    'home.step2_title': 'Chapisha na Thibitisha',
    'home.step2_desc': 'Onyesha miradi yako halisi na upate tathmini zilizothibitishwa na wenzako.',
    'home.step2_act': 'Gundua maonyesho',
    'home.step3_title': 'Shirikiana na Omba Kazi',
    'home.step3_desc': 'Zungumza moja kwa moja kwa ujumbe na upate kazi bora za Tech.',
    'home.step3_act': 'Chunguza ofa za kazi',
    'home.cta_title': 'Je, Uko Tayari Kukuza Kazi Yako ya Tech Afrika?',
    'home.cta_desc': 'Jiunge na jumuiya ya AfriDev Hub bure na utambulike kwa uwezo wako wa kiufundi.',
    'home.cta_btn_dash': 'Ingia Kwenye Dashibodi Yangu',
    'home.cta_btn_reg': 'Fungua Akaunti Bure',
    'home.cta_btn_opp': 'Tazama Fursa za Kazi',
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
  private readonly CACHE_STORAGE_KEY = 'afridev_i18n_cache_v4';
  private readonly ngZone = inject(NgZone);

  languages = SUPPORTED_LANGUAGES;
  currentLang = signal<Language>(SUPPORTED_LANGUAGES[0]);

  private readonly phraseToKeyMap = new Map<string, string>();
  private readonly originalTextMap = new WeakMap<Text, string>();
  private readonly originalAttrMap = new WeakMap<Element, Record<string, string>>();
  private readonly dynamicCache: Record<string, Map<string, string>> = {
    en: new Map<string, string>(),
    wo: new Map<string, string>(),
    sw: new Map<string, string>()
  };

  private domObserver: MutationObserver | null = null;
  private observerTimer: ReturnType<typeof setTimeout> | null = null;
  private activeAbortControllers: AbortController[] = [];
  private activeRunId = 0;

  activeDictionary = computed(() => {
    const code = this.currentLang().code;
    return DICTIONARIES[code] || DICTIONARIES['fr'];
  });

  constructor() {
    this.buildPhraseLookupIndex();
    this.loadPersistentCache();
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
    const frDict = DICTIONARIES['fr'];
    for (const targetCode of ['en', 'wo', 'sw']) {
      const targetDict = DICTIONARIES[targetCode];
      const map = this.dynamicCache[targetCode];
      for (const [key, frVal] of Object.entries(frDict)) {
        const normFr = this.normalizePhrase(frVal);
        if (normFr && targetDict[key]) {
          map.set(normFr, targetDict[key]);
        }
      }
    }
  }

  private loadPersistentCache(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.CACHE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, Record<string, string>>;
      for (const code of ['en', 'wo', 'sw']) {
        const entries = parsed[code];
        if (entries && typeof entries === 'object') {
          const map = this.dynamicCache[code];
          for (const [k, v] of Object.entries(entries)) {
            if (k && v) map.set(k, v);
          }
        }
      }
    } catch {}
  }

  private savePersistentCache(): void {
    if (typeof window === 'undefined') return;
    try {
      const serialized: Record<string, Record<string, string>> = { en: {}, wo: {}, sw: {} };
      for (const code of ['en', 'wo', 'sw']) {
        const map = this.dynamicCache[code];
        let count = 0;
        for (const [k, v] of map.entries()) {
          serialized[code][k] = v;
          if (++count >= 800) break;
        }
      }
      localStorage.setItem(this.CACHE_STORAGE_KEY, JSON.stringify(serialized));
    } catch {}
  }

  private initLanguage(): void {
    if (typeof window === 'undefined') return;
    this.clearGoogTransCookies();

    const savedCode = localStorage.getItem(this.STORAGE_KEY);
    if (savedCode) {
      const match = this.languages.find(l => l.code === savedCode);
      if (match) {
        this.currentLang.set(match);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = match.code;
        }
        this.setupDomObserver();
        if (match.code !== 'fr') {
          this.scheduleInitialTranslation(match.code);
        }
        return;
      }
    }
    this.setupDomObserver();
  }

  private scheduleInitialTranslation(targetCode: string): void {
    if (typeof window === 'undefined') return;
    this.ngZone.runOutsideAngular(() => {
      const runPass = () => {
        this.triggerGoogleTranslate(targetCode);
      };
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => setTimeout(runPass, 30), { once: true });
      } else {
        setTimeout(runPass, 30);
      }
    });
  }

  setLanguage(lang: Language): void {
    if (typeof window === 'undefined') return;

    this.currentLang.set(lang);
    try {
      localStorage.setItem(this.STORAGE_KEY, lang.code);
    } catch {}

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang.code;
    }

    this.triggerGoogleTranslate(lang.code);
  }

  public clearGoogTransCookies(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    try {
      const hostname = window.location.hostname || '';
      const parts = hostname.split('.');
      const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
      const domains = Array.from(new Set(['', hostname, `.${hostname}`, rootDomain, `.${rootDomain}`]));
      const exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';

      for (const d of domains) {
        if (d === '.') continue;
        const domAttr = d ? `; domain=${d}` : '';
        document.cookie = `googtrans=; ${exp}${domAttr}; path=/`;
        document.cookie = `googtrans=; ${exp}${domAttr}`;
      }
    } catch {}
  }

  private abortAllInFlight(): void {
    for (const c of this.activeAbortControllers) {
      try {
        c.abort();
      } catch {}
    }
    this.activeAbortControllers = [];
  }

  public triggerGoogleTranslate(targetCode: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    this.activeRunId++;
    const runId = this.activeRunId;
    this.abortAllInFlight();

    this.ngZone.runOutsideAngular(() => {
      if (document.body) {
        this.applyInstantDomTranslation(targetCode, document.body, runId);
      }
    });
  }

  private isTranslatableText(norm: string): boolean {
    if (!norm || norm.length < 2) return false;
    if (!/[a-zA-ZÀ-ÿ]/.test(norm)) return false;
    if (
      norm.startsWith('http://') ||
      norm.startsWith('https://') ||
      norm.startsWith('git commit') ||
      norm.startsWith('const ') ||
      norm.startsWith('docker ') ||
      norm.startsWith('<FullStack') ||
      norm.startsWith('peerReview.') ||
      norm.startsWith('//')
    ) {
      return false;
    }
    return true;
  }

  public applyInstantDomTranslation(
    targetCode: string,
    root: Node = document.body,
    runId: number = this.activeRunId
  ): void {
    if (typeof document === 'undefined' || !root) return;

    const frDict = DICTIONARIES['fr'];
    const targetDict = DICTIONARIES[targetCode] || frDict;
    const langCache = this.dynamicCache[targetCode];

    const pendingNodesByPhrase = new Map<string, Array<{ node: Text; rawFr: string }>>();

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node: Node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toUpperCase();
        if (
          tag === 'SCRIPT' ||
          tag === 'STYLE' ||
          tag === 'NOSCRIPT' ||
          tag === 'CODE' ||
          tag === 'PRE' ||
          tag === 'TEXTAREA' ||
          tag === 'SVG'
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        if (
          parent.closest(
            'svg, code, pre, .notranslate, [translate="no"], .lang-dropdown-container, .lang-dropdown-wrapper'
          )
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let currentNode = walker.nextNode() as Text | null;
    while (currentNode) {
      const currentRaw = currentNode.nodeValue || '';
      const currentNorm = this.normalizePhrase(currentRaw);

      if (currentNorm.length > 0) {
        let rawFr = this.originalTextMap.get(currentNode);
        if (rawFr === undefined) {
          const matchedKey = this.phraseToKeyMap.get(currentNorm);
          if (matchedKey && frDict[matchedKey]) {
            rawFr = this.preserveWhitespace(currentRaw, frDict[matchedKey]);
          } else {
            rawFr = currentRaw;
          }
          this.originalTextMap.set(currentNode, rawFr);
        } else {
          const matchedKey = this.phraseToKeyMap.get(currentNorm);
          if (matchedKey && frDict[matchedKey]) {
            rawFr = this.preserveWhitespace(currentRaw, frDict[matchedKey]);
            this.originalTextMap.set(currentNode, rawFr);
          }
        }

        const normFr = this.normalizePhrase(rawFr);

        if (targetCode === 'fr') {
          if (currentNode.nodeValue !== rawFr) {
            currentNode.nodeValue = rawFr;
          }
        } else if (this.isTranslatableText(normFr)) {
          const matchedKey = this.phraseToKeyMap.get(normFr);
          const cachedTranslation =
            (matchedKey ? targetDict[matchedKey] : undefined) || langCache?.get(normFr);

          if (cachedTranslation) {
            const nextVal = this.preserveWhitespace(rawFr, cachedTranslation);
            if (currentNode.nodeValue !== nextVal) {
              currentNode.nodeValue = nextVal;
            }
          } else {
            // Remettre la base propre pendant la requête pour ne jamais laisser une ancienne langue affichée
            if (currentNode.nodeValue !== rawFr) {
              currentNode.nodeValue = rawFr;
            }
            let list = pendingNodesByPhrase.get(normFr);
            if (!list) {
              list = [];
              pendingNodesByPhrase.set(normFr, list);
            }
            list.push({ node: currentNode, rawFr });
          }
        }
      }

      currentNode = walker.nextNode() as Text | null;
    }

    if (root instanceof Element || root instanceof Document) {
      const elements = (root as Element).querySelectorAll
        ? (root as Element).querySelectorAll('[placeholder], [title]')
        : [];
      elements.forEach(el => {
        if (el.closest('.notranslate, [translate="no"], .lang-dropdown-container, .lang-dropdown-wrapper')) {
          return;
        }
        for (const attr of ['placeholder', 'title']) {
          const val = el.getAttribute(attr);
          if (!val) continue;

          let savedAttrs = this.originalAttrMap.get(el);
          if (!savedAttrs) {
            savedAttrs = {};
            this.originalAttrMap.set(el, savedAttrs);
          }
          if (!savedAttrs[attr]) {
            const norm = this.normalizePhrase(val);
            const key = this.phraseToKeyMap.get(norm);
            savedAttrs[attr] = (key && frDict[key]) ? frDict[key] : val;
          }

          const rawFrAttr = savedAttrs[attr];
          const normFrAttr = this.normalizePhrase(rawFrAttr);

          if (targetCode === 'fr') {
            if (el.getAttribute(attr) !== rawFrAttr) {
              el.setAttribute(attr, rawFrAttr);
            }
          } else {
            const key = this.phraseToKeyMap.get(normFrAttr);
            const translatedAttr = (key ? targetDict[key] : undefined) || langCache?.get(normFrAttr);
            if (translatedAttr && el.getAttribute(attr) !== translatedAttr) {
              el.setAttribute(attr, translatedAttr);
            }
          }
        }
      });
    }

    if (targetCode !== 'fr' && pendingNodesByPhrase.size > 0) {
      this.fetchDynamicTranslations(targetCode, pendingNodesByPhrase, runId);
    }
  }

  /**
   * Traduit chaque phrase dynamique non cachée via requêtes HTTP/2 parallèles (1 phrase = 1 réponse garantie)
   * Évite tout bug de fusion de lignes en Wolof / Swahili
   */
  private fetchDynamicTranslations(
    targetCode: string,
    pendingNodesByPhrase: Map<string, Array<{ node: Text; rawFr: string }>>,
    runId: number
  ): void {
    if (typeof fetch === 'undefined') return;

    const controller = new AbortController();
    this.activeAbortControllers.push(controller);
    const phrases = Array.from(pendingNodesByPhrase.keys());
    const langCache = this.dynamicCache[targetCode];
    if (!langCache) return;

    const concurrency = 8;
    let cursor = 0;

    const worker = async () => {
      while (cursor < phrases.length) {
        if (controller.signal.aborted || runId !== this.activeRunId || this.currentLang().code !== targetCode) {
          return;
        }
        const origNorm = phrases[cursor++];
        if (!origNorm) continue;

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${encodeURIComponent(
          targetCode
        )}&dt=t&q=${encodeURIComponent(origNorm)}`;

        try {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) continue;
          const data = await res.json();
          if (controller.signal.aborted || runId !== this.activeRunId || this.currentLang().code !== targetCode) {
            return;
          }
          if (!Array.isArray(data) || !Array.isArray(data[0])) continue;

          const transText = data[0]
            .map((seg: unknown[]) => (seg && seg[0] ? String(seg[0]) : ''))
            .join('')
            .trim();
          if (!transText) continue;

          langCache.set(origNorm, transText);
          const targets = pendingNodesByPhrase.get(origNorm);
          if (targets) {
            for (const item of targets) {
              if (item.node.isConnected) {
                item.node.nodeValue = this.preserveWhitespace(item.rawFr, transText);
              }
            }
          }
        } catch {}
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, phrases.length) }, () => worker());
    Promise.allSettled(workers).then(() => {
      if (runId === this.activeRunId) {
        this.savePersistentCache();
      }
    });
  }

  private preserveWhitespace(originalRaw: string, replacement: string): string {
    const leadingMatch = originalRaw.match(/^\s*/);
    const trailingMatch = originalRaw.match(/\s*$/);
    const leading = leadingMatch ? leadingMatch[0] : '';
    const trailing = trailingMatch ? trailingMatch[0] : '';
    return `${leading}${replacement}${trailing}`;
  }

  private setupDomObserver(): void {
    if (typeof window === 'undefined' || typeof MutationObserver === 'undefined' || !document.body) return;
    if (this.domObserver) return;

    this.ngZone.runOutsideAngular(() => {
      this.domObserver = new MutationObserver((mutations) => {
        const activeCode = this.currentLang().code;
        if (activeCode === 'fr') return;

        let hasRelevantAddedNodes = false;
        for (const m of mutations) {
          if (m.addedNodes.length > 0) {
            const targetEl = m.target as Element;
            if (targetEl && targetEl.closest && targetEl.closest('svg, .notranslate, [translate="no"]')) {
              continue;
            }
            hasRelevantAddedNodes = true;
            break;
          }
        }
        if (!hasRelevantAddedNodes) return;

        if (this.observerTimer) clearTimeout(this.observerTimer);
        this.observerTimer = setTimeout(() => {
          const code = this.currentLang().code;
          if (code !== 'fr' && document.body) {
            this.applyInstantDomTranslation(code, document.body, this.activeRunId);
          }
        }, 50);
      });

      this.domObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  t(key: string, fallback?: string): string {
    const dict = this.activeDictionary();
    return dict[key] || DICTIONARIES['fr'][key] || fallback || key;
  }

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
      }, 10);
    });
  }
}
