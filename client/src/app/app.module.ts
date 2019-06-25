import { BrowserModule } from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {ButtonModule} from 'primeng/button';
import {
  LocationStrategy,
  HashLocationStrategy
} from '@angular/common';
import {routing} from './app-routing.module';

import { AppComponent } from './app.component';
import { NoContentComponent } from './components/no-content/no-content';
import { PingComponent } from './components/ping/ping.component';
import { NameComponent } from './components/name/name.component';
import {ToastModule} from 'primeng/toast';
import {DialogModule} from 'primeng/dialog';
import {SpinnerModule} from 'primeng/spinner';
import {InputTextModule} from 'primeng/inputtext';
import {SidebarModule} from 'primeng/sidebar';
import {TooltipModule} from 'primeng/tooltip';
import { ConfirmDialogModule } from "primeng/confirmdialog";

@NgModule({
  declarations: [
    AppComponent,
    NoContentComponent,
    PingComponent,
    NameComponent

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    ToastModule,
    DialogModule,
    ButtonModule,
    SpinnerModule,
    InputTextModule,
    SidebarModule,
    ReactiveFormsModule,
    TooltipModule,
    ConfirmDialogModule,
    routing
  ],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
