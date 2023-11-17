import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  Renderer2,
} from '@angular/core';

@Component({
  selector: '[theme-toggler]',
  templateUrl: './theme-toggler.component.html',
  styleUrls: ['./theme-toggler.component.css'],
})
export class ThemeTogglerComponent {
  theme = 'dark';

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  @Output() clicked = new EventEmitter<void>();

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.clicked.emit();
    this.toggleTheme();
  }

  toggleTheme() {
    return
    const body = this.el.nativeElement.closest('body');
    if (this.theme === 'light') {
      this.renderer.removeClass(body, 'light');
      this.renderer.addClass(body, 'dark');
      this.theme = 'dark';
    } else {
      this.renderer.removeClass(body, 'dark');
      this.renderer.addClass(body, 'light');
      this.theme = 'light';
    }
  }
}
