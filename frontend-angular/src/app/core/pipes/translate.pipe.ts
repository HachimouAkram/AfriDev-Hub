import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'appTranslate',
  standalone: true,
  pure: false
})
export class AppTranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, fallback?: string): string {
    if (!key) return '';
    return this.translationService.t(key, fallback);
  }
}

