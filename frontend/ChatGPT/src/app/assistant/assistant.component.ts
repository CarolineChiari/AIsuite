import { Component } from '@angular/core';
import { SpeechToTextService } from '../services/speech-to-text.service';

@Component({
  selector: 'app-assistant',
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.css']
})
export class AssistantComponent {

    constructor(private sttService: SpeechToTextService) { }
    transcript = ""
    ngOnInit(): void {
      this.sttService.getTranscriptObservable().subscribe((transcript) => {
        this.transcript
      })
      this.sttService.startKeywordRecognition();

    }
}
