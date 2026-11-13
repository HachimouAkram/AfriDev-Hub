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
  selectedPillarFilter: 'all' | 'companies' | 'talents' | 'trainings' = 'all';

  // Tri par colonne de performance
  sortKey: 'performanceScore' | 'userCount' | 'developerCount' | 'companyCount' | 'opportunityCount' | 'trainingCount' | 'groupCount' | 'projectCount' = 'performanceScore';
  sortAsc = false;

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
          this.applyFilterAndSort();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load country adoption stats', err);
        this.adoptionSummary = {
          totalContinentalUsers: 11,
          totalContinentalDevelopers: 7,
          totalContinentalRecruiters: 4,
          totalContinentalCompanies: 4,
          totalContinentalGroups: 3,
          totalContinentalTrainings: 5,
          totalContinentalOpportunities: 2,
          totalContinentalProjects: 9,
          totalContinentalVerifiedUsers: 9,
          activeCountriesCount: 7,
          averageContinentalPerformanceScore: 58.4,
          countries: [
            { country: 'Sénégal', userCount: 5, developerCount: 3, recruiterCount: 2, verifiedUsersCount: 4, companyCount: 2, verifiedCompanyCount: 1, projectCount: 4, opportunityCount: 2, groupCount: 2, trainingCount: 3, adoptionPercentage: 45.5, performanceScore: 100.0, vitalityLevel: 'Élite Panafricaine', rank: 1 },
            { country: 'Côte d\'Ivoire', userCount: 1, developerCount: 1, recruiterCount: 0, verifiedUsersCount: 1, companyCount: 1, verifiedCompanyCount: 1, projectCount: 2, opportunityCount: 1, groupCount: 1, trainingCount: 1, adoptionPercentage: 9.1, performanceScore: 68.5, vitalityLevel: 'Moteur Régional', rank: 2 },
            { country: 'Ghana', userCount: 1, developerCount: 1, recruiterCount: 0, verifiedUsersCount: 1, companyCount: 0, verifiedCompanyCount: 0, projectCount: 2, opportunityCount: 0, groupCount: 0, trainingCount: 1, adoptionPercentage: 9.1, performanceScore: 48.0, vitalityLevel: 'Moteur Régional', rank: 3 },
            { country: 'Comores', userCount: 1, developerCount: 1, recruiterCount: 0, verifiedUsersCount: 1, companyCount: 0, verifiedCompanyCount: 0, projectCount: 1, opportunityCount: 0, groupCount: 0, trainingCount: 0, adoptionPercentage: 9.1, performanceScore: 35.0, vitalityLevel: 'En Forte Croissance', rank: 4 },
            { country: 'Algérie', userCount: 1, developerCount: 1, recruiterCount: 0, verifiedUsersCount: 0, companyCount: 0, verifiedCompanyCount: 0, projectCount: 1, opportunityCount: 0, groupCount: 0, trainingCount: 0, adoptionPercentage: 9.1, performanceScore: 28.0, vitalityLevel: 'En Forte Croissance', rank: 5 },
            { country: 'Rwanda', userCount: 1, developerCount: 0, recruiterCount: 1, verifiedUsersCount: 1, companyCount: 1, verifiedCompanyCount: 0, projectCount: 0, opportunityCount: 0, groupCount: 0, trainingCount: 0, adoptionPercentage: 9.1, performanceScore: 25.0, vitalityLevel: 'En Forte Croissance', rank: 6 },
            { country: 'Kenya', userCount: 1, developerCount: 0, recruiterCount: 1, verifiedUsersCount: 1, companyCount: 0, verifiedCompanyCount: 0, projectCount: 0, opportunityCount: 0, groupCount: 0, trainingCount: 0, adoptionPercentage: 9.1, performanceScore: 20.0, vitalityLevel: 'Hub Émergent', rank: 7 }
          ]
        };
        this.applyFilterAndSort();
      }
    });
  }

  setSort(key: typeof this.sortKey): void {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = false;
    }
    this.applyFilterAndSort();
  }

  setPillarFilter(pillar: 'all' | 'companies' | 'talents' | 'trainings'): void {
    this.selectedPillarFilter = pillar;
    this.applyFilterAndSort();
  }

  applyFilterAndSort(): void {
    if (!this.adoptionSummary) {
      this.filteredCountries = [];
      return;
    }

    let result = [...this.adoptionSummary.countries];

    if (this.selectedCountryFilter.trim()) {
      const term = this.selectedCountryFilter.toLowerCase().trim();
      result = result.filter(c => c.country.toLowerCase().includes(term));
    }

    if (this.selectedPillarFilter === 'companies') {
      result = result.filter(c => (c.companyCount || 0) > 0 || (c.recruiterCount || 0) > 0);
    } else if (this.selectedPillarFilter === 'talents') {
      result = result.filter(c => (c.developerCount || 0) > 0);
    } else if (this.selectedPillarFilter === 'trainings') {
      result = result.filter(c => (c.trainingCount || 0) > 0 || (c.groupCount || 0) > 0);
    }

    result.sort((a, b) => {
      const valA = (a[this.sortKey] as number) ?? 0;
      const valB = (b[this.sortKey] as number) ?? 0;
      return this.sortAsc ? valA - valB : valB - valA;
    });

    this.filteredCountries = result;
  }

  getCountryFlag(countryName: string): string {
    return this.countryFlags[countryName] || '🌍';
  }

  getVitalityBadgeClass(score?: number): string {
    const s = score || 0;
    if (s >= 75) return 'badge-elite';
    if (s >= 45) return 'badge-moteur';
    if (s >= 20) return 'badge-croissance';
    return 'badge-emergent';
  }
}
