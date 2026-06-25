import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { ChatBubbleComponent } from '../../shared/components/chat-bubble/chat-bubble.component';

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, ChatBubbleComponent],
  template: `
    <div class="h-screen bg-slate-50 flex overflow-hidden">
      <app-sidebar></app-sidebar>
      <div class="flex-1 flex flex-col xl:ml-[240px] ml-0 min-w-0">
        <app-header></app-header>
        <main class="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
      <app-chat-bubble></app-chat-bubble>
    </div>
  `
})
export class EmployeeLayoutComponent {}
