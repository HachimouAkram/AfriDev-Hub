import { Component, inject, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private elRef = inject(ElementRef);

  step = 1;
  isLoading = false;
  errorMessage = '';

  // Form Model
  role: 'DEVELOPER' | 'RECRUITER' = 'DEVELOPER';
  email = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  country = '';
  city = '';
  title = 'Développeur Full-Stack';
  companyName = '';
  bio = '';
  skillsInput = 'Angular, Spring Boot, PostgreSQL';

  setRole(selectedRole: 'DEVELOPER' | 'RECRUITER'): void {
    this.role = selectedRole;
    if (selectedRole === 'RECRUITER' && (!this.title || this.title === 'Développeur Full-Stack')) {
      this.title = 'Tech Recruiter';
    } else if (selectedRole === 'DEVELOPER' && (!this.title || this.title === 'Tech Recruiter')) {
      this.title = 'Développeur Full-Stack';
    }
  }

  // Password UI state
  showPassword = false;
  showConfirmPassword = false;

  // Password strength flags (updated on each keystroke)
  pwdHasMin = false;
  pwdHasUpper = false;
  pwdHasLower = false;
  pwdHasNumber = false;
  pwdHasSpecial = false;

  get pwdIsStrong(): boolean {
    return this.pwdHasMin && this.pwdHasUpper && this.pwdHasLower && this.pwdHasNumber && this.pwdHasSpecial;
  }

  onPasswordInput(): void {
    const p = this.password;
    this.pwdHasMin = p.length >= 8;
    this.pwdHasUpper = /[A-Z]/.test(p);
    this.pwdHasLower = /[a-z]/.test(p);
    this.pwdHasNumber = /[0-9]/.test(p);
    this.pwdHasSpecial = /[^A-Za-z0-9]/.test(p);
  }

  // ── Country dropdown state ──────────────────────────────────
  countrySearch = '';
  countryDropdownOpen = false;

  // ── City dropdown state ─────────────────────────────────────
  citySearch = '';
  cityDropdownOpen = false;

  // ── Pays africains avec villes principales ──────────────────
  citiesByCountry: Record<string, string[]> = {
    'Algérie': ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Djelfa', 'Tlemcen'],
    'Angola': ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe'],
    'Bénin': ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey', 'Kandi', 'Lokossa', 'Ouidah', 'Bohicon'],
    'Botswana': ['Gaborone', 'Francistown', 'Molepolole', 'Serowe', 'Kanye', 'Mahalapye', 'Maun'],
    'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Tenkodogo'],
    'Burundi': ['Bujumbura', 'Muyinga', 'Gitega', 'Rumonge', 'Ngozi', 'Makamba', 'Kayanza'],
    'Cameroun': ['Yaoundé', 'Douala', 'Garoua', 'Bafoussam', 'Bamenda', 'Maroua', 'Nkongsamba', 'Ngaoundéré'],
    'Cap-Vert': ['Praia', 'Mindelo', 'Santa Maria', 'Assomada', 'São Filipe', 'Pedra Badejo'],
    'République Centrafricaine': ['Bangui', 'Bimbo', 'Mbaïki', 'Berberati', 'Kaga-Bandoro', 'Bambari'],
    'Comores': ['Moroni', 'Mutsamudu', 'Domoni', 'Fomboni', 'Ouani', 'Sima'],
    'Congo (Brazzaville)': ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Impfondo', 'Ouesso'],
    'Congo (Kinshasa)': ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani', 'Goma', 'Bukavu', 'Bunia', 'Tshikapa'],
    'Côte d\'Ivoire': ['Abidjan', 'Bouaké', 'Daloa', 'San Pédro', 'Yamoussoukro', 'Korhogo', 'Man', 'Divo'],
    'Djibouti': ['Djibouti', 'Ali Sabieh', 'Dikhil', 'Tadjoura', 'Arta', 'Obock'],
    'Égypte': ['Le Caire', 'Alexandrie', 'Gizeh', 'Shubra El-Kheima', 'Port-Saïd', 'Suez', 'Louxor', 'Assouan'],
    'Érythrée': ['Asmara', 'Keren', 'Sawa', 'Barentu', 'Mendefera', 'Massawa'],
    'Eswatini': ['Mbabane', 'Manzini', 'Big Bend', 'Siteki', 'Nhlangano'],
    'Éthiopie': ['Addis-Abeba', 'Dire Dawa', 'Mekele', 'Gondar', 'Bahir Dar', 'Adama', 'Awasa', 'Dessie', 'Jimma'],
    'Gabon': ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné'],
    'Gambie': ['Banjul', 'Serekunda', 'Brikama', 'Bakau', 'Farafenni', 'Lamin'],
    'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Tema', 'Sunyani', 'Techiman'],
    'Guinée': ['Conakry', 'Nzérékoré', 'Kindia', 'Kankan', 'Labé', 'Mamou', 'Faranah'],
    'Guinée-Bissau': ['Bissau', 'Bafatá', 'Gabú', 'Bissorã', 'Bolama', 'Cacheu'],
    'Guinée Équatoriale': ['Malabo', 'Bata', 'Ebebiyin', 'Aconibe', 'Mongomo', 'Luba'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa'],
    'Lesotho': ['Maseru', 'Teyateyaneng', 'Mafeteng', 'Hlotse', 'Mohale\'s Hoek', 'Quthing'],
    'Libéria': ['Monrovia', 'Gbarnga', 'Kakata', 'Bensonville', 'Harper', 'Buchanan'],
    'Libye': ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al-Khums', 'Zawiya', 'Sabha', 'Derna'],
    'Madagascar': ['Antananarivo', 'Toamasina', 'Antsirabe', 'Fianarantsoa', 'Mahajanga', 'Toliara', 'Antsiranana'],
    'Malawi': ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi'],
    'Mali': ['Bamako', 'Sikasso', 'Mopti', 'Koulikoro', 'Tombouctou', 'Kayes', 'Gao', 'Ségou'],
    'Maroc': ['Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kenitra', 'Tétouan'],
    'Maurice': ['Port-Louis', 'Beau Bassin-Rose Hill', 'Vacoas-Phoenix', 'Curepipe', 'Quatre Bornes'],
    'Mauritanie': ['Nouakchott', 'Nouadhibou', 'Rosso', 'Zouerate', 'Kiffa', 'Kaédi'],
    'Mozambique': ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Nacala', 'Quelimane', 'Tete'],
    'Namibie': ['Windhoek', 'Rundu', 'Walvis Bay', 'Swakopmund', 'Oshakati', 'Katima Mulilo'],
    'Niger': ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Dosso', 'Diffa'],
    'Nigéria': ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna', 'Enugu', 'Zaria', 'Aba'],
    'Ouganda': ['Kampala', 'Gulu', 'Mbarara', 'Jinja', 'Entebbe', 'Mbale', 'Masaka'],
    'Rwanda': ['Kigali', 'Gisenyi', 'Butare', 'Gitarama', 'Muhanga', 'Byumba', 'Ruhengeri'],
    'São Tomé-et-Príncipe': ['São Tomé', 'Santo António', 'Neves', 'Santana', 'Trindade'],
    'Sénégal': ['Dakar', 'Thiès', 'Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Mbour', 'Diourbel', 'Tambacounda'],
    'Seychelles': ['Victoria', 'Anse Boileau', 'Beau Vallon', 'Cascade', 'Takamaka'],
    'Sierra Leone': ['Freetown', 'Bo', 'Kenema', 'Makeni', 'Koidu', 'Lunsar'],
    'Somalie': ['Mogadiscio', 'Hargeisa', 'Merca', 'Kismayo', 'Bosaso', 'Berbera', 'Garowe'],
    'Soudan': ['Khartoum', 'Omdurman', 'Port-Soudan', 'Kassala', 'Al-Obeid', 'Wad Madani'],
    'Soudan du Sud': ['Djouba', 'Malakal', 'Wau', 'Yei', 'Aweil', 'Torit'],
    'Tanzanie': ['Dar es Salaam', 'Dodoma', 'Mwanza', 'Arusha', 'Mbeya', 'Morogoro', 'Zanzibar', 'Tanga'],
    'Tchad': ["N'Djamena", 'Abéché', 'Moundou', 'Sarh', 'Am Timan', 'Mongo', 'Kelo'],
    'Togo': ['Lomé', 'Sokodé', 'Kpalimé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Aného'],
    'Tunisie': ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa'],
    'Zambie': ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chipata', 'Livingstone', 'Mufulira'],
    'Zimbabwe': ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo']
  };

  get africanCountries(): string[] {
    return Object.keys(this.citiesByCountry).sort((a, b) => a.localeCompare(b, 'fr'));
  }

  get filteredCountries(): string[] {
    const q = this.countrySearch.toLowerCase();
    return this.africanCountries.filter(c => c.toLowerCase().includes(q));
  }

  get availableCities(): string[] {
    return this.country ? this.citiesByCountry[this.country] ?? [] : [];
  }

  get filteredCities(): string[] {
    const q = this.citySearch.toLowerCase();
    return this.availableCities.filter(c => c.toLowerCase().includes(q));
  }

  // ── Country dropdown actions ────────────────────────────────
  openCountryDropdown(): void {
    this.countryDropdownOpen = true;
    this.countrySearch = '';
    setTimeout(() => {
      const el = this.elRef.nativeElement.querySelector('#country-search-input');
      el?.focus();
    }, 50);
  }

  selectCountry(c: string): void {
    this.country = c;
    this.city = '';
    this.citySearch = '';
    this.countryDropdownOpen = false;
    this.countrySearch = '';
  }

  // ── City dropdown actions ───────────────────────────────────
  openCityDropdown(): void {
    if (!this.country) return;
    this.cityDropdownOpen = true;
    this.citySearch = '';
    setTimeout(() => {
      const el = this.elRef.nativeElement.querySelector('#city-search-input');
      el?.focus();
    }, 50);
  }

  selectCity(c: string): void {
    this.city = c;
    this.cityDropdownOpen = false;
    this.citySearch = '';
  }

  // ── Close dropdowns on outside click ───────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.countryDropdownOpen = false;
      this.cityDropdownOpen = false;
    }
  }

  // ── Stepper ─────────────────────────────────────────────────
  goToStep2(): void {
    if (!this.email || !this.password || !this.fullName) {
      this.errorMessage = 'Veuillez remplir le nom, l\'email et le mot de passe.';
      return;
    }
    if (!this.pwdIsStrong) {
      this.errorMessage = 'Le mot de passe ne respecte pas les critères de sécurité.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.errorMessage = '';
    this.step = 2;
  }

  goToStep1(): void {
    this.step = 1;
    this.errorMessage = '';
    setTimeout(() => this.initGoogleSignIn(), 50);
  }

  onSubmitRegister(): void {
    if (!this.country || !this.city || !this.title) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires du profil.';
      return;
    }

    if (this.role === 'RECRUITER' && !this.companyName.trim()) {
      this.errorMessage = 'Veuillez renseigner le nom de votre entreprise ou startup.';
      return;
    }

    const skills = this.role === 'DEVELOPER'
      ? this.skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const payload = {
      role: this.role,
      email: this.email,
      password: this.password,
      fullName: this.fullName,
      country: this.country,
      city: this.city,
      title: this.title,
      companyName: this.role === 'RECRUITER' ? this.companyName.trim() : undefined,
      bio: this.bio,
      skills: skills
    };

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data.requiresEmailVerification) {
          // Rediriger vers la vérification OTP
          this.router.navigate(['/verify-otp'], { queryParams: { email: this.email, mode: 'register' } });
        } else if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Erreur lors de l\'inscription. Vérifiez les informations.';
      }
    });
  }

  private readonly githubClientId = 'Ov23liThxmOjc0n7p0W3';

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  onRegisterWithGithub(): void {
    const redirectUri = `${window.location.origin}/login`;
    const state = `register_${this.role}`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${this.githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user%20user:email&state=${encodeURIComponent(state)}`;
    window.location.href = githubAuthUrl;
  }

  private initGoogleSignIn(): void {
    const checkGoogle = () => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: '496829118154-ifg5amooc56vptf4oorlfs3u77t51rem.apps.googleusercontent.com',
            callback: (response: any) => this.handleGoogleCredential(response)
          });

          const btnElement = document.getElementById('google-btn-register');
          if (btnElement) {
            btnElement.innerHTML = '';
            google.accounts.id.renderButton(btnElement, {
              type: 'icon',
              theme: 'outline',
              size: 'large',
              shape: 'circle'
            });
          }
        } catch (e) {
          console.warn('Google Identity initialization error', e);
        }
      } else {
        setTimeout(checkGoogle, 300);
      }
    };
    checkGoogle();
  }

  handleGoogleCredential(response: any): void {
    if (response?.credential) {
      this.isLoading = true;
      this.errorMessage = '';
      this.authService.loginWithGoogle(response.credential, this.role).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            const userRole = res.data?.user?.role || this.role;
            if (userRole === 'RECRUITER') {
              this.router.navigate(['/dashboard/recruiter']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error?.message || 'Erreur lors de la connexion avec Google.';
        }
      });
    }
  }
}

