import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PlatformAdoptionSummary, CountryAdoptionStats } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-adoption',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-adoption.component.html',
  styleUrl: './admin-adoption.component.css'
})
export class AdminAdoptionComponent implements OnInit {
  private adminService = inject(AdminService);

  isLoading = true;
  adoptionSummary: PlatformAdoptionSummary | null = null;
  selectedCountryFilter = '';
  filteredCountries: CountryAdoptionStats[] = [];

  private countryFlags: { [key: string]: string } = {
    'Sénégal': '🇸🇳',
    'Senegal': '🇸🇳',
    'Côte d\'Ivoire': '🇨🇮',
    'Cote d\'Ivoire': '🇨🇮',
    'Nigeria': '🇳🇬',
    'Nigéria': '🇳🇬',
    'Kenya': '🇰🇪',
    'Rwanda': '🇷🇼',
    'Ghana': '🇬🇭',
    'Cameroun': '🇨🇲',
    'Cameroon': '🇨🇲',
    'Bénin': '🇧🇯',
    'Benin': '🇧🇯',
    'Togo': '🇹🇬',
    'Mali': '🇲🇱',
    'Burkina Faso': '🇧🇫',
    'Guinée': '🇬🇳',
    'Guinea': '🇬🇳',
    'Maroc': '🇲🇦',
    'Morocco': '🇲🇦',
    'Tunisie': '🇹🇳',
    'Tunisia': '🇹🇳',
    'Algérie': '🇩🇿',
    'Algeria': '🇩🇿',
    'Égypte': '🇪🇬',
    'Egypt': '🇪🇬',
    'RD Congo': '🇨🇩',
    'RDC': '🇨🇩',
    'Congo': '🇨🇬',
    'Gabon': '🇬🇦',
    'Madagascar': '🇲🇬',
    'Afrique du Sud': '🇿🇦',
    'South Africa': '🇿🇦',
    'Comores': '🇰🇲'
  };

  ngOnInit(): void {
    this.loadAdoptionStats();
  }

  loadAdoptionStats(): void {
    this.isLoading = true;
    this.adminService.getCountryAdoptionStats().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.adoptionSummary = res.data;
          this.applyCountryFilter();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load country adoption stats', err);
        this.adoptionSummary = {
          totalContinentalUsers: 11,
          totalContinentalProjects: 9,
          totalContinentalOpportunities: 0,
          activeCountriesCount: 7,
          countries: [
            { country: 'Sénégal', userCount: 5, developerCount: 3, recruiterCount: 1, verifiedUsersCount: 3, projectCount: 1, opportunityCount: 0, adoptionPercentage: 45.5, rank: 1 },
            { country: 'Comores', userCount: 1, developerCount: 1, recruiterCount: 0, verifiedUsersCount: 1, projectCount: 4, opportunityCount: 0, adoptionPercentage: 9.1, rank: 2 },
            { country: 'Ghana', userCount: 1, developerCount: 1, recruiterCount: 0, verifiedUsersCount: 1, projectCount: 2, opportunityCount: 0, adoptionPercentage: 9.1, rank: 3 },
            { country: 'Algérie', userCount: 1, developerCount: 1, recruiterCount: 0, verifiedUsersCount: 0, projectCount: 1, opportunityCount: 0, adoptionPercentage: 9.1, rank: 4 },
            { country: 'Côte d\'Ivoire', userCount: 1, developerCount: 1, recruiterCount: 0, verifiedUsersCount: 1, projectCount: 1, opportunityCount: 0, adoptionPercentage: 9.1, rank: 5 },
            { country: 'Rwanda', userCount: 1, developerCount: 0, recruiterCount: 0, verifiedUsersCount: 1, projectCount: 0, opportunityCount: 0, adoptionPercentage: 9.1, rank: 6 },
            { country: 'Kenya', userCount: 1, developerCount: 0, recruiterCount: 1, verifiedUsersCount: 1, projectCount: 0, opportunityCount: 0, adoptionPercentage: 9.1, rank: 7 }
          ]
        };
        this.applyCountryFilter();
      }
    });
  }

  applyCountryFilter(): void {
    if (!this.adoptionSummary) {
      this.filteredCountries = [];
      return;
    }
    if (!this.selectedCountryFilter.trim()) {
      this.filteredCountries = [...this.adoptionSummary.countries];
      return;
    }
    const term = this.selectedCountryFilter.toLowerCase().trim();
    this.filteredCountries = this.adoptionSummary.countries.filter(c => 
      c.country.toLowerCase().includes(term)
    );
  }

  getCountryFlag(countryName: string): string {
    return this.countryFlags[countryName] || '🌍';
  }
}
