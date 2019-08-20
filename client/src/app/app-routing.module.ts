import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {NoContentComponent} from './components/no-content/no-content';
import {PingComponent} from './components/ping/ping.component';
import {FrotzComponent} from './components/frotz/frotz.component';
import { BlogComponent } from './components/blog/blog.component';
import { CallbackComponent } from './components/callback/callback.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthGuard } from './shared/auth.guard';
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
  {
    path: 'blog',
    component: BlogComponent
  },
  {
    path: 'callback',
    component: CallbackComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
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
