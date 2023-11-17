import { Component } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { BackendService } from '../services/backend.service';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css'],
})
export class BannerComponent {
  constructor(
    private backendService: BackendService,
    private authService: MsalService
  ) {}

  loggedIn = false;
  account = '';
  expired = true;
  usage = 0;
  cost = 0.03 / 1000;

  ngOnInit(): void {
    //keep checking account status
    setInterval(() => {
      const accounts = this.authService.instance.getAllAccounts();
      const prevLoggedIn = this.loggedIn;
      this.loggedIn = accounts.length > 0;
      if (this.loggedIn && !prevLoggedIn) {
        this.backendService.getUsage();
      }
      // console.log(accounts);
      if (this.loggedIn) {
        this.account = accounts[0].name
          ? accounts[0].name
          : accounts[0].username;
        let expiration = accounts[0].idTokenClaims?.exp;
        if (expiration) this.expired = this.isTokenExpired(expiration);
        if (this.expired) this.backendService.login();
      }
      console.log(this.expired)
    }, 1000);
    this.backendService.getUsageObservable().subscribe((usage) => {
      this.usage = Math.round(usage * 100) / 100;
    });
  }
  isTokenExpired(exp: number): boolean {
    // Convert the exp value to a Date object
    const expirationDate = new Date(exp * 1000);

    // Get the current date
    const currentDate = new Date();

    // Check if the expiration date is past the current date
    return expirationDate <= currentDate;
  }
}
