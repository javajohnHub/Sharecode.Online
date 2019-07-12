import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {NoContentComponent} from './components/no-content/no-content';
import {PingComponent} from './components/ping/ping.component';
import {FrotzComponent} from './components/frotz/frotz.component';
const routes: Routes = [
  {
    path: '',
    component: PingComponent
  },
  {
    path: 'ping',
    component: PingComponent
  },
  {
    path: 'frotz',
    component: FrotzComponent
  },
  { path: '**',    component: NoContentComponent },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: []
})
export class FrontRoutingModule { }
