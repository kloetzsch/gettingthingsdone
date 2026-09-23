import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideApiConfiguration } from './core/api/api-configuration';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    // Leerer rootUrl: Requests gehen relativ als /api/... raus, genau wie
    // proxy.conf.json (Dev-Server) und nginx.conf (Container) es erwarten.
    provideApiConfiguration(''),
  ]
};
