import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  step = 1;
  isLoading = false;
  errorMessage = '';

  // 54 Pays Africains
  africanCountries: string[] = [
    'Algérie', 'Angola', 'Bénin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroun', 'Cap-Vert',
    'République Centrafricaine', 'Comores', 'Congo (Brazzaville)', 'Congo (Kinshasa)', 'Côte d\'Ivoire',
    'Djibouti', 'Égypte', 'Érythrée', 'Eswatini', 'Éthiopie', 'Gabon', 'Gambie', 'Ghana', 'Guinée',
    'Guinée-Bissau', 'Guinée Équatoriale', 'Kenya', 'Lesotho', 'Libéria', 'Libye', 'Madagascar',
    'Malawi', 'Mali', 'Maroc', 'Maurice', 'Mauritanie', 'Mozambique', 'Namibie', 'Niger', 'Nigéria',
    'Ouganda', 'Rwanda', 'São Tomé-et-Príncipe', 'Sénégal', 'Seychelles', 'Sierra Leone', 'Somalie',
    'Soudan', 'Soudan du Sud', 'Tanzanie', 'Tchad', 'Togo', 'Tunisie', 'Zambie', 'Zimbabwe'
  ];

  // Form Model
  email = '';
  password = '';
  fullName = '';
  country = 'Sénégal';
  city = '';
  title = 'Développeur Full-Stack';
  bio = '';
  skillsInput = 'Angular, Spring Boot, PostgreSQL';

  goToStep2(): void {
    if (!this.email || !this.password || !this.fullName) {
      this.errorMessage = 'Veuillez remplir le nom, l\'email et le mot de passe.';
      return;
    }
    if (this.password.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    this.errorMessage = '';
    this.step = 2;
  }

  goToStep1(): void {
    this.step = 1;
    this.errorMessage = '';
  }

  onSubmitRegister(): void {
    if (!this.country || !this.city || !this.title) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires du profil.';
      return;
    }

    const skills = this.skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
      email: this.email,
      password: this.password,
      fullName: this.fullName,
      country: this.country,
      city: this.city,
      title: this.title,
      bio: this.bio,
      skills: skills
    };

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Erreur lors de l\'inscription. Vérifiez les informations.';
      }
    });
  }
}
