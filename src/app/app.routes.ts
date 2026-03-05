import { Routes } from '@angular/router';
import { PlannerComponent } from './components/planner.component';

export const routes: Routes = [
  { path: 'planner', component: PlannerComponent },
  { path: '', redirectTo: '', pathMatch: 'full' },
];
