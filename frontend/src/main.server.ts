import 'zone.js/node';

import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

if (typeof import.meta.env.PROD !== 'undefined') {
  enableProdMode();
}

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;