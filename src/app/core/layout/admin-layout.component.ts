import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { ChatBubbleComponent } from '../../shared/components/chat-bubble/chat-bubble.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, ChatBubbleComponent],
  template: `
    <div class="h-screen bg-slate-50 flex overflow-hidden">
      <app-sidebar></app-sidebar>
      <div class="flex-1 flex flex-col xl:ml-[240px] ml-0 min-w-0">
        <app-header></app-header>
        <main class="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-chat-bubble></app-chat-bubble>
    </div>
  `
})
export class AdminLayoutComponent {}
