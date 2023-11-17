import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Conversation } from '../models/conversation.interface';
import { BackendService } from '../services/backend.service';
import { MarkdownService } from 'ngx-markdown';
import { DomSanitizer } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { CopyToClipboardComponent } from '../copy-to-clipboard/copy-to-clipboard.component';
import { SpeechToTextService } from '../services/speech-to-text.service';
import { SettingsService } from '../services/settings/settings.service';
import { SpeechToTextStatus } from '../models/ttsStatus.enum';
import { fromEvent, throttleTime } from 'rxjs';

@Component({
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, AfterViewInit {
  constructor(
    private backend: BackendService,
    private mdService: MarkdownService,
    private renderer: Renderer2,
    private el: ElementRef,
    private viewContainer: ViewContainerRef, // private factoryResolver: ComponentFactoryResolver
    private sttService: SpeechToTextService,
    private sttSettingsService: SettingsService
  ) {}

  @ViewChild('chatContainer', { static: false, read: ElementRef })
  private chatContainer: ElementRef | undefined;
  @ViewChild('history')
  private historyContainer: ElementRef | undefined;

  message: string = '';
  conversation: Conversation = {
    id: '',
    messages: [],
  };
  waiting = false;
  hasMic = false;
  recordingInProgress = false;
  recordingStarted = false;
  recordingStopping = false;
  ngOnInit(): void {
    this.backend.getConversationObservable().subscribe((conversation) => {
      this.conversation = conversation;
      console.log(this.conversation);
      // if the last message is of 'role' 'user', erase the input field
      if (this.conversation.messages.length > 0) {
        if (
          this.conversation.messages[this.conversation.messages.length - 1]
            .role === 'user'
        ) {
          this.message = '';
        } else {
          this.waiting = false;
        }
      }
      this.scrollToBottom();
      this.addCopyClipboardComponents();
    });
    this.backend.startNewConversation();
    if (this.sttSettingsService.getDefaultMic()) {
      this.hasMic = true;
      // console.log("🚀 ~ file: chat.component.ts ~ line 86 ~ ChatComponent ~ ngOnInit ~ this.hasMic", this.sttSettingsService.getDefaultMic())
    }
  }
  ngAfterViewInit() {
    const scroll$ = fromEvent(this.historyContainer?.nativeElement, 'scroll');

    scroll$
      .pipe(
        throttleTime(1500) // 1.5 seconds
      )
      .subscribe(() => {
        console.log('scrolling');
        this.historyScroll();
      });
  }

  htmlize(message: string) {
    return message.replace(/\n/g, '<br/>');
  }

  sendKey(event: any) {
    if (event.keyCode === 13 && event.shiftKey === true) {
      this.sendMessage(event);
    }
  }
  hasMessage() {
    const msg = (document.querySelector('#chatInput') as HTMLTextAreaElement)
      .value;
    if (!msg) return false;
    return true;
  }
  sendMessage(message: any) {
    const msg = (document.querySelector('#chatInput') as HTMLTextAreaElement)
      .value;
    if (!msg) return;
    this.waiting = true;
    // console.log("🚀 ~ file: chat.component.ts:59 ~ ChatComponent ~ sendMessage ~ this.waiting:", this.waiting)
    this.backend.sendChatMessage(msg);
    this.conversation.messages.push({
      role: 'user',
      content: msg,
    });
    this.scrollToBottom();
    this.message = '';
  }
  refresh(){
    this.backend.sendChatMessage("",  "gpt-3.5-turbo-16k", true);
  }
  upgrade(){
    this.backend.sendChatMessage("",  "gpt-4", true);
  }
  startNewConversation() {
    this.backend.startNewConversation();
  }

  scrollToBottom(): void {
    if (this.chatContainer) {
      this.renderer.setProperty(
        this.chatContainer.nativeElement,
        'scrollTop',
        this.chatContainer.nativeElement.scrollHeight
      );
    }
  }

  private addCopyClipboardComponents() {
    // const factory = this.viewContainer.createComponent(CopyToClipboardComponent)
    // const factory = this.factoryResolver.resolveComponentFactory(
    //   CopyClipboardComponent
    // );

    setTimeout(() => {
      const codeElements = Array.from(
        this.el.nativeElement.querySelectorAll('code')
      ) as HTMLElement[];
      codeElements.forEach((codeElement: HTMLElement) => {
        if (
          codeElement.parentNode !== null &&
          Array.from(codeElement.classList).some((className) =>
            /^language-/.test(className)
          )
        ) {
          const componentRef = this.viewContainer.createComponent(
            CopyToClipboardComponent
          );
          codeElement.parentNode.appendChild(
            componentRef.location.nativeElement
            // codeElement.nextSibling
          );
        }
      });
    });
  }
  startStt() {
    if (this.recordingInProgress) {
      this.sttService.stopTranscription();
      this.recordingInProgress = false;
      return;
    }
    this.recordingInProgress = true;
    const OriginalValue = this.message; //document.getElementById('chatInput')?.innerText;
    this.sttService.getSpeechToTextStatusObservable().subscribe((status) => {
      switch (status) {
        case SpeechToTextStatus.GettingToken:
          console.log(
            '🚀 ~ file: chat.component.ts ~ line 127 ~ ChatComponent ~ this.sttService.getSpeechToTextStatusObservable ~ GettingToken'
          );
          // Handle "GettingToken" status
          break;
        case SpeechToTextStatus.Starting:
          console.log(
            '🚀 ~ file: chat.component.ts ~ line 131 ~ ChatComponent ~ this.sttService.getSpeechToTextStatusObservable ~ Starting'
          );
          // Handle "Starting" status
          this.recordingInProgress = true;
          this.recordingStopping = false;
          break;
        case SpeechToTextStatus.Started:
          console.log(
            '🚀 ~ file: chat.component.ts ~ line 136 ~ ChatComponent ~ this.sttService.getSpeechToTextStatusObservable ~ Started'
          );
          // Handle "Started" status
          this.recordingStarted = true;
          this.recordingStopping = false;
          break;
        case SpeechToTextStatus.Recognizing:
          // console.log("🚀 ~ file: chat.component.ts ~ line 140 ~ ChatComponent ~ this.sttService.getSpeechToTextStatusObservable ~ Recognizing")
          // Handle "Recognizing" status
          this.recordingStopping = false;
          break;
        case SpeechToTextStatus.Recognized:
          this.recordingStopping = false;
          break;
        case SpeechToTextStatus.NoSpeechDetected:
          this.recordingStopping = true;
          break;
        case SpeechToTextStatus.Stopping:
          console.log(
            '🚀 ~ file: chat.component.ts ~ line 144 ~ ChatComponent ~ this.sttService.getSpeechToTextStatusObservable ~ Stopping'
          );
          // Handle "Stopping" status

          break;
        case SpeechToTextStatus.Stopped:
          console.log(
            '🚀 ~ file: chat.component.ts ~ line 148 ~ ChatComponent ~ this.sttService.getSpeechToTextStatusObservable ~ Stopped'
          );
          this.recordingInProgress = false;
          this.recordingStarted = false;
          this.recordingStopping = false;
          // Handle "Stopped" status
          break;
        case SpeechToTextStatus.Canceling:
          console.log(
            '🚀 ~ file: chat.component.ts ~ line 153 ~ ChatComponent ~ this.sttService.getSpeechToTextStatusObservable ~ Cancelling'
          );
          this.recordingInProgress = false;
          this.recordingStarted = false;
          this.recordingStopping = false;
          // Handle "Cancelling" status
          break;
        case SpeechToTextStatus.Canceled:
          this.recordingInProgress = false;
          this.recordingStarted = false;
          this.recordingStopping = false;
          // Handle "Cancelled" status
          break;
        default:
          // Handle unknown status
          break;
      }
    });
    this.sttService.getTranscriptObservable().subscribe((transcript) => {
      // console.log("🚀 ~ file: chat.component.ts ~ line 165 ~ ChatComponent ~ this.sttService.getTranscriptObservable ~ transcript", transcript)
      this.message = OriginalValue + transcript;
    });

    this.sttService.startSpeechToText();
  }
  getRecordingStatusClass(): string {
    if (
      this.recordingInProgress &&
      !this.recordingStarted &&
      !this.recordingStopping
    ) {
      return '';
    } else if (
      this.recordingInProgress &&
      this.recordingStarted &&
      !this.recordingStopping
    ) {
      return 'started';
    } else if (
      this.recordingInProgress &&
      this.recordingStarted &&
      this.recordingStopping
    ) {
      return 'stopping';
    } else {
      return '';
    }
  }

  historyScroll() {
    const position = this.calculateScrollPositionPercentage();
    if (position > 75 && this.backend.getHistoryLength() >= 20) {
      this.backend.getHistory();
    }
  }
  calculateScrollPositionPercentage(): number {
    const scrollTop = this.historyContainer?.nativeElement.scrollTop;
    const scrollHeight = this.historyContainer?.nativeElement.scrollHeight;
    const containerHeight = this.historyContainer?.nativeElement.clientHeight;

    const totalScrollableDistance = scrollHeight - containerHeight;
    const scrollPositionPercentage =
      (scrollTop / totalScrollableDistance) * 100;

    return scrollPositionPercentage;
  }
}
