import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, Project } from '../../../../core/services/project.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-projects.component.html',
  styleUrl: './dashboard-projects.component.css'
})
export class DashboardProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  
  projects = signal<Project[]>([]);
  filteredProjects = signal<Project[]>([]);
  
  isLoading = signal<boolean>(true);
  searchQuery = '';

  // Modals state
  showCreateModal = false;
  showEditModal = false;
  showDetailModal = false;
  showDeleteModal = false;

  selectedProject: Project | null = null;
  projectToDelete: Project | null = null;

  // Form Model
  projectForm = {
    title: '',
    description: '',
    stackInput: '',
    repoUrl: '',
    demoUrl: '',
    isOpenSource: false
  };

  isSubmitting = false;
  formErrorMessage = '';
  formSuccessMessage = '';

  ngOnInit(): void {
    this.loadMyProjects();
  }

  loadMyProjects(): void {
    this.isLoading.set(true);
    this.projectService.getMyProjects(0, 50).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const content = res.data.content || res.data;
          this.projects.set(content);
          this.applyFilter();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erreur chargement projets:', err);
      }
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredProjects.set(this.projects());
      return;
    }
    const filtered = this.projects().filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.stack && p.stack.some(s => s.toLowerCase().includes(q)))
    );
    this.filteredProjects.set(filtered);
  }

  // --- ACTIONS ---

  openCreateModal(): void {
    this.projectForm = {
      title: '',
      description: '',
      stackInput: '',
      repoUrl: '',
      demoUrl: '',
      isOpenSource: false
    };
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreate(): void {
    if (!this.projectForm.title.trim() || !this.projectForm.description.trim()) {
      this.formErrorMessage = 'Le titre et la description sont obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.formErrorMessage = '';

    const stack = this.projectForm.stackInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      title: this.projectForm.title.trim(),
      description: this.projectForm.description.trim(),
      stack: stack,
      repoUrl: this.projectForm.repoUrl.trim() || null,
      demoUrl: this.projectForm.demoUrl.trim() || null,
      isOpenSource: this.projectForm.isOpenSource
    };

    this.projectService.createProject(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.closeCreateModal();
          this.loadMyProjects();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formErrorMessage = err.error?.message || 'Erreur lors de la création du projet.';
      }
    });
  }

  openEditModal(project: Project): void {
    this.selectedProject = project;
    this.projectForm = {
      title: project.title,
      description: project.description,
      stackInput: project.stack ? project.stack.join(', ') : '',
      repoUrl: project.repoUrl || '',
      demoUrl: project.demoUrl || '',
      isOpenSource: project.isOpenSource || false
    };
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedProject = null;
  }

  submitEdit(): void {
    if (!this.selectedProject) return;
    if (!this.projectForm.title.trim() || !this.projectForm.description.trim()) {
      this.formErrorMessage = 'Le titre et la description sont obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.formErrorMessage = '';

    const stack = this.projectForm.stackInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      title: this.projectForm.title.trim(),
      description: this.projectForm.description.trim(),
      stack: stack,
      repoUrl: this.projectForm.repoUrl.trim() || null,
      demoUrl: this.projectForm.demoUrl.trim() || null,
      isOpenSource: this.projectForm.isOpenSource
    };

    this.projectService.updateProject(this.selectedProject.id, payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.closeEditModal();
          this.loadMyProjects();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formErrorMessage = err.error?.message || 'Erreur lors de la mise à jour du projet.';
      }
    });
  }

  openDetailModal(project: Project): void {
    this.selectedProject = project;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedProject = null;
  }

  toggleStatus(project: Project): void {
    this.projectService.toggleProjectStatus(project.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadMyProjects();
        }
      },
      error: (err) => {
        console.error('Erreur changement statut:', err);
      }
    });
  }

  confirmDelete(project: Project): void {
    this.projectToDelete = project;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.projectToDelete = null;
  }

  executeDelete(): void {
    if (!this.projectToDelete) return;

    this.projectService.deleteProject(this.projectToDelete.id).subscribe({
      next: (res) => {
        this.closeDeleteModal();
        this.loadMyProjects();
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.closeDeleteModal();
      }
    });
  }
}
