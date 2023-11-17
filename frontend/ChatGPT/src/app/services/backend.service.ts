import { ElementRef, Inject, Injectable, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';

import {
  ChatError,
  Conversation,
  Message,
} from '../models/conversation.interface';
import {
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
  MsalService,
} from '@azure/msal-angular';
import {
  InteractionType,
  PopupRequest,
  RedirectRequest,
} from '@azure/msal-browser';
import { Settings } from '../user/models/settings';
// import { Title } from '@angular/platform-browser';
@Injectable({
  providedIn: 'root',
})
export class BackendService {
  constructor(
    private http: HttpClient,
    private authService: MsalService,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration
  ) {}

  conversationSubject = new Subject<Conversation>();

  private offset = 0;
  private processedOffset: number[] = [];

  private currentConversation: Conversation = {
    id: '',
    user: '',
    messages: [],
  };
  conversations: Conversation[] = [];

  getConversationObservable() {
    return this.conversationSubject.asObservable();
  }

  //  History observable
  historySubject = new Subject<Conversation[]>();
  getHistoryObservable() {
    return this.historySubject.asObservable();
  }

  // Usage observable
  usageSubject = new Subject<number>();
  getUsageObservable() {
    return this.usageSubject.asObservable();
  }

  // Embeddings observable
  embeddingsSubject = new Subject<{ text: string; embedding: Float32Array }>();
  getEmbeddingsObservable() {
    return this.embeddingsSubject.asObservable();
  }

  private DeepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  }

  startNewConversation() {
    // if there are no message, user or I in this.currentConversation, do nothing, otherwise create a blank conversation and push the current conversation to the conversationSubject
    // if (
    //   this.currentConversation.messages.length === 0 &&
    //   this.currentConversation.user === ''
    // ) {
    //   return;
    // } else {
    this.currentConversation = {
      id: '',
      user: '',
      title: '',
      messages: [
        {
          role: 'system',
          content:
            'You are a friendly assistant. all your outputs should be in the markdown format without the ``` at the beginning and end since it is already rendered as markdown. If you display a piece of code, you can use the ``` to display it as code, but make sure to add the language name next to it so it renders properly. If you do not know an answer for sure, do not imagine one unless specifically asked. If you make a mistake in a previous answer, ask the user if they would like you to correct it. if the question is short and simple give a short answer unless specifically asked otherwise.',
        },
      ],
    };
    console.log(this.currentConversation);
    console.log('here');
    this.conversationSubject.next(this.DeepCopy(this.currentConversation));
    // }
  }
  sendChatMessage(
    message: string,
    model: string = 'gpt-3.5-turbo-16k',
    rerun = false
  ) {
    if (this.currentConversation.user === '') {
      this.currentConversation.user =
        this.authService.instance.getAllAccounts()[0].homeAccountId;
    }
    if (rerun) {
      //delete last message
      this.currentConversation.messages.pop();
    } else {
      this.currentConversation.messages.push({
        role: 'user',
        content: message,
      });
    }
    console.log(this.currentConversation);
    console.log(`${environment.backend}/api/chat`);
    // this.conversationSubject.next(this.currentConversation);
    // https://carolinechatgpt-func.azurewebsites.net/api/chat?code=DwFV_ggSokJ7MQk_cW0VrQpm5dPnSoS26DGKdAqxKKOkAzFuwrtsLw==
    this.http
      .post<Message | ChatError>(`${environment.backend}/api/chat`, {
        messages: this.currentConversation.messages,
        model: model,
      })
      .subscribe((res) => {
        if (!res.hasOwnProperty('error')) {
          const result = res as Message;
          this.currentConversation.messages.push(result);
          if (
            this.currentConversation.title === '' ||
            this.currentConversation.title === undefined ||
            this.currentConversation.title === null ||
            this.currentConversation.hasOwnProperty('title') === false
          ) {
            this.getTitle(this.currentConversation);
          } else {
            console.log('here2');
            this.saveHistory(this.currentConversation);
          }
        } else {
          console.log(res);
        }
      });
  }
  saveHistory(conversation: Conversation) {
    console.log(conversation);
    // check if conversation is this.currentConversation
    let isCurrent = false;
    if (conversation.id === this.currentConversation.id) {
      isCurrent = true;
    }
    const user = this.authService.instance.getAllAccounts()[0].homeAccountId;
    this.http
      .post<Conversation>(
        `${environment.backend}/api/history/${user}`,
        conversation
      )
      .subscribe((res) => {
        this.currentConversation = res;
        console.log(res);
        this.getHistory(true);
        console.log('here');

        this.conversationSubject.next(this.DeepCopy(this.currentConversation));
        // this.historySubject.next(this.conversations);
      });
  }
  getTitle(conversation: Conversation) {
    console.log('Getting title');
    this.http
      .post<{ title: string }>(`${environment.backend}/api/title`, conversation)
      .subscribe((res) => {
        conversation.title = res.title;
        console.log(res.title);
        console.log('here2');
        this.saveHistory(conversation);
      });
  }
  getHistory(override = false) {
    console.log(this.offset);
    if (override) {
      const user = this.authService.instance.getAllAccounts()[0].homeAccountId;
      this.http
        .get<Conversation[]>(
          `${environment.backend}/api/history/${user}?offset=${0}&limit=${
            this.conversations.length + 1
          }`
        )
        .subscribe((res) => {
          this.conversations = res;
          this.conversations.forEach((c) => {
            // console.log(c);
            if (!c.title) {
              this.getTitle(c);
            }
          });
          this.offset = this.conversations.length;
          this.historySubject.next(this.conversations);
        });
    } else if (this.offset === 0) {
      const user = this.authService.instance.getAllAccounts()[0].homeAccountId;
      this.http
        .get<Conversation[]>(`${environment.backend}/api/history/${user}`)
        .subscribe((res) => {
          this.conversations = res;
          this.conversations.forEach((c) => {
            // console.log(c);
            if (!c.title) {
              this.getTitle(c);
            }
          });
          this.offset = this.conversations.length;
          this.historySubject.next(this.conversations);
        });
    } else if (this.offset) {
      if (this.processedOffset.find((o) => o === this.offset)) return;
      this.processedOffset.push(this.offset);
      // if (this.offset > 20) return;
      const user = this.authService.instance.getAllAccounts()[0].homeAccountId;
      this.http
        .get<Conversation[]>(
          `${environment.backend}/api/history/${user}?offset=${this.offset}`
        )
        .subscribe((res) => {
          this.conversations.push(...res);
          // sort by date
          this.conversations.sort((a, b) => {
            if (a.date === undefined) return 1;
            if (b.date === undefined) return -1;
            return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
          });
          this.conversations.forEach((c) => {
            // console.log(c);
            if (!c.title) {
              this.getTitle(c);
            }
          });
          this.offset = this.conversations.length;
          this.historySubject.next(this.conversations);
        });
    }
  }
  getHistoryLength() {
    return this.conversations.length;
  }

  setConversation(id: string) {
    console.log(this.conversations);
    const conv = this.conversations.find((c) => c.id === id);
    if (conv) {
      this.currentConversation = conv;
      console.log('here');
      this.conversationSubject.next(this.DeepCopy(this.currentConversation));
    }
  }

  deleteConversation(id: string) {
    console.log(`Deleting ${id}`);
    const user = this.authService.instance.getAllAccounts()[0].homeAccountId;
    this.http
      .delete<{ id: String; deleted: boolean; doc: any }>(
        `${environment.backend}/api/history/${user}/${id}`
      )
      .subscribe((res) => {
        console.log(res);
        if (res.deleted) {
          this.getHistory(true);
        }
      });
  }

  getUsage() {
    const user = this.authService.instance
      .getAllAccounts()[0]
      .homeAccountId.split('.')[0];
    console.log(user);
    this.http
      .get<{ resource: number; statusCode: number; headers: any }>(
        `${environment.backend}/api/usage/${user}`
      )
      .subscribe((res) => {
        this.usageSubject.next(res.resource);
      });
  }

  // todo: separate this function
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

  getEmbeddings(text: string) {
    //if the text is long enough otherwise return null
    if (text.split(' ').length < 4) {
      this.embeddingsSubject.next({
        text: text,
        embedding: new Float32Array(),
      });
      return;
    }
    console.log('getting embeddings');

    this.http
      .post<{ embedding: Float32Array }>(
        `${environment.backend}/api/embeddings`,
        {
          text: text,
        }
      )
      .subscribe((res) => {
        this.embeddingsSubject.next({ text: text, embedding: res.embedding });
      });
  }

  settingsSubject = new Subject<Settings|undefined>();
  getThemeObservable() {
    return this.settingsSubject.asObservable();
  }
  getSettings() {
    this.settingsSubject.next(undefined);
    const url = `${environment.backend}/api/profile?type=settings`;
    this.http.get<Settings>(url).subscribe((res) => {
      this.settingsSubject.next(res);

    });
  }
}
