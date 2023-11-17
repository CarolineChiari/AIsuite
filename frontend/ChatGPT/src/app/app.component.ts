import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  Renderer2,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  MsalGuardConfiguration,
  MsalService,
  MSAL_GUARD_CONFIG,
} from '@azure/msal-angular';
import {
  InteractionType,
  PopupRequest,
  RedirectRequest,
  SilentRequest,
} from '@azure/msal-browser';
import { timeout } from 'rxjs';
import { BackendService } from './services/backend.service';
import { Settings } from './user/models/settings';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'ChatGPT';
  loggedIn = false;
  userName: string = '';
  isAlreadyLoggedIn = false;
  redirectHandled = false;
  loginInterval: any;
  account = '';

  constructor(
    private authService: MsalService,
    private backendService: BackendService,
    private renderer: Renderer2,
    private el: ElementRef,
    private router: Router,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration
  ) {
    this.authService.handleRedirectObservable().subscribe((res) => {
      this.redirectHandled = true;
      if (res) {
        console.log(
          '🚀 ~ file: app.component.ts:32 ~ AppComponent ~ this.authService.handleRedirectObservable ~ res',
          res
        );
        console.log(res);
      }
    });
  }

  ngOnInit(): void {
    this.loginInterval = setInterval(() => {
      if (this.redirectHandled) {
        const accounts = this.authService.instance.getAllAccounts();
        console.log(this.authService);
        this.loggedIn = accounts.length > 0;
        console.log(accounts);
        // console.log(this.loggedIn);
        if (!this.loggedIn) {
          // console.log("Logging in")
          setTimeout(() => {
            this.login();
          }, 10000);
          // this.login();
        } else {
          try {
            console.log('requesting new token');
            // Acquire token silently without forcing a refresh
            console.log(this.msalGuardConfig);
            this.authService
              .acquireTokenSilent({
                ...this.msalGuardConfig.authRequest,
                forceRefresh: false,
              } as SilentRequest)
              .subscribe({
                next: (res) => {
                  console.log('here');
                  console.log(res);
                  this.getSettings();
                },
                error: (err) => {
                  console.log(err);
                  if (err.errorCode === 'interaction_required') {
                    this.login();
                  }
                  if (err.errorCode === 'monitor_window_timeout') {
                    console.log('Timeout issue, trying to log back in');
                    this.login();
                  }
                },
              });
            // Token is not expired
            // return true;
          } catch (error: any) {
            console.log(error);
            // Check if the error is due to token expiration
            if (error.errorCode === 'interaction_required') {
              // Token is expired
              console.log('Token is expired');
              // return false;
            } else {
              // Other error occurred
              console.log('error');
              console.error(error);
              // throw error;
            }
          }
        }
        if (this.loginInterval) {
          clearInterval(this.loginInterval as number);
          if (this.loggedIn) {
            this.account = accounts[0].username;
            this.authService.instance.setActiveAccount(accounts[0]);
          }
        }
      } else {
      }
    }, 100);

    // this.router.navigate(['home']);
    // else ;
  }
  settings: Settings | undefined = undefined;
  getSettings() {
    this.backendService.getThemeObservable().subscribe((settings) => {
      this.settings = settings;
      if (this.settings) {
        console.log(this.settings);
        const themes = ['dark', 'light', 'lgbt', 'transgender'];
        const body = this.el.nativeElement.closest('body');
        themes.forEach((t) => {
          this.renderer.removeClass(body, t);
        });
        this.renderer.addClass(body, this.settings.theme);
      }
    });
    this.backendService.getSettings();
  }

  login() {
    console.log('running Login');
    try {
      if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
        if (this.msalGuardConfig.authRequest) {
          this.authService.loginPopup({
            ...this.msalGuardConfig.authRequest,
          } as PopupRequest);
        } else {
          this.authService.loginPopup();
        }
      } else {
        if (this.msalGuardConfig.authRequest) {
          this.authService.loginRedirect({
            ...this.msalGuardConfig.authRequest,
          } as RedirectRequest);
        } else {
          this.authService.loginRedirect();
        }
      }
    } catch (e) {
      console.log(
        '🚀 ~ file: app.component.ts:60 ~ AppComponent ~ login ~ e',
        e
      );
    }
  }
}
