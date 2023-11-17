import { Component, OnInit } from '@angular/core';
import { Conversation } from '../models/conversation.interface';
import { BackendService } from '../services/backend.service';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnInit {
  constructor(
    private backendService: BackendService,
    private authService: MsalService
  ) {}
  conversations: Conversation[] = [];
  reversedConversations: Conversation[] = [];
  deletions: string[] = [];
  ngOnInit(): void {
    this.backendService.getHistoryObservable().subscribe((conversations) => {
      this.conversations = conversations;
      this.reversedConversations = [...this.conversations].reverse();
      console.log(this.conversations);
    });
    // check if authenticated

    if (window.innerWidth > 500) {
      // console.log('getting history');
      this.backendService.getHistory();
    } else {
      setTimeout(() => {
        // console.log('getting history');
        this.backendService.getHistory();
      }, 20000);
    }
  }

  setConversation(id: string) {
    console.log(id);
    this.backendService.setConversation(id);
  }
  delete(id: string) {
    this.deletions.push(id);
    this.backendService.deleteConversation(id);
  }
  toBeDeleted(id: string) {
    if (this.deletions.find((del) => del === id)) {
      return 'delete';
    }
    return 'dummy';
  }

  checkDuplicates() {
    var duplicates = 0;
    this.conversations.forEach((conv) => {
      if (this.conversations.filter((c) => c.id === conv.id).length > 1) {
        duplicates++;
      }
    });
    return duplicates;
  }
}

