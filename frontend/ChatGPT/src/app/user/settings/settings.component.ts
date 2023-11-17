import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { UserService } from '../services/user.service';
import { Settings } from '../models/settings';

@Component({
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  themes = ['dark', 'light'];
  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private userService: UserService
  ) {}
  settings: Settings | undefined = undefined;
  ngOnInit(): void {
    this.userService.getSettingsObservable().subscribe((settings) => {
      this.settings = settings;
    });
    this.userService.getSettings();
  }
  selectTheme(theme: string) {
    const body = this.el.nativeElement.closest('body');
    this.themes.forEach((t) => {
      this.renderer.removeClass(body, t);
    });
    this.renderer.addClass(body, theme);
    if (this.settings) {
      this.settings.theme = theme;
      this.userService.saveSettings(this.settings);
    }
  }

  getThemeName(theme: string) {
    var res = '';
    switch (theme) {
      case 'dark':
        res = 'Dark';
        break;
      case 'light':
        res = 'Light';
        break;
    }
    return res
  }
}
