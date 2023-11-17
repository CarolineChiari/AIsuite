import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { MarkdownModule, MarkdownService, MarkedOptions } from 'ngx-markdown';
import {
  MsalModule,
  MsalService,
  MsalGuard,
  MsalInterceptor,
  MsalBroadcastService,
} from '@azure/msal-angular';
import {
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  LogLevel,
} from '@azure/msal-browser';
import { environment } from 'src/environments/environment';
import { ChatComponent } from './chat/chat.component';
import { HistoryComponent } from './history/history.component';
import { BannerComponent } from './banner/banner.component';
import { ThemeTogglerComponent } from './theme-toggler/theme-toggler.component';
import { CopyToClipboardComponent } from './copy-to-clipboard/copy-to-clipboard.component';
import { AssistantComponent } from './assistant/assistant.component';
import { SpeechComponent } from './speech/speech.component';
import { ProfileComponent } from './profile/profile.component';

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    HistoryComponent,
    BannerComponent,
    ThemeTogglerComponent,
    CopyToClipboardComponent,
    AssistantComponent,
    SpeechComponent,
    ProfileComponent,
  ],

  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    MsalModule.forRoot(
      new PublicClientApplication({
        auth: {
          clientId: environment.msal_clientId,
          authority: environment.msal_authority,
          redirectUri: environment.msal_redirectURI,
        },
        cache: {
          cacheLocation: BrowserCacheLocation.LocalStorage,
          storeAuthStateInCookie: true,
        },
        system: {
          loggerOptions: {
            logLevel: LogLevel.Verbose,
            loggerCallback: (level, message, containsPii) => {
              // callback logic
              // console.log(message);
              // console.log(level)
            },
            piiLoggingEnabled: false,
          },
        },
      }),
      {
        interactionType: InteractionType.Redirect,
        authRequest: {
          scopes: [
            `api://${environment.msal_clientId}/user_impersonation`,
            'openid',
            'profile',
            'offline_access',
          ],
        },
      },
      {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map([
          [
            `${environment.backend}/api/*`,
            [`api://${environment.msal_clientId}/user_impersonation`],
          ],
        ]),
      }
    ),
    MarkdownModule.forRoot({
      markedOptions: {
        provide: MarkedOptions,
        useValue: {
          gfm: true,
          breaks: false,
          pedantic: false,
          smartLists: true,
          smartypants: false,
        },
      },
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    MarkdownService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
