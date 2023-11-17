import { Component, OnInit } from '@angular/core';
import { Speech } from '../models/speech.interface';
import { SpeechToTextService } from '../services/speech-to-text.service';
import { TextToSpeechService } from '../services/text-to-speech.service';
import { BackendService } from '../services/backend.service';

@Component({
  selector: 'app-speech',
  templateUrl: './speech.component.html',
  styleUrls: ['./speech.component.css'],
})
export class SpeechComponent implements OnInit {
  speeches: Speech[] = [];
  constructor(
    private speechService: TextToSpeechService,
    private backendService: BackendService
  ) {}
  previousSpeeches: Speech[] = [];
  searchSpeeches: Speech[] = [];
  autoplay: boolean = false;
  gpt4: boolean = false;
  ngOnInit() {
    this.speechService.getTTSObservable().subscribe((res) => {
      this.previousSpeeches = [...res];
      this.searchSpeeches = [...res];
    });
    this.speechService.getAllPreviousTTS();
    this.backendService.getEmbeddingsObservable().subscribe((res) => {
      this.previousSpeeches.forEach((speech) => {
        // get the cosine of the angle between speech.embedding and res.embedding
        var dotProduct = 0;
        var speechMagnitude = 0;
        var resMagnitude = 0;
        for (var i = 0; i < speech.embedding.length; i++) {
          dotProduct += speech.embedding[i] * res.embedding[i];
          speechMagnitude += speech.embedding[i] * speech.embedding[i];
          resMagnitude += res.embedding[i] * res.embedding[i];
        }
        speechMagnitude = Math.sqrt(speechMagnitude);
        resMagnitude = Math.sqrt(resMagnitude);
        speech.cosine = dotProduct / (speechMagnitude * resMagnitude);
      });
      this.previousSpeeches.sort((a, b) => {
        if (a.cosine == undefined) return 1;
        if (b.cosine == undefined) return -1;
        if (a.cosine > b.cosine) return -1;
        if (a.cosine < b.cosine) return 1;
        return 0;
      });
      // select the top 10
      this.searchSpeeches = this.previousSpeeches.slice(0, 10);
    });
  }
  getSpeech(event: any) {
    const msg = (document.querySelector('#textInput') as HTMLTextAreaElement)
      .value;
    const punctuationKeys = [',', '.', '!', '?', ';', ':', ' '];

    if (event.keyCode === 13 && event.shiftKey === true || (msg.endsWith('. ') && this.autoplay)) {
      console.log(`Submitting: ${msg}`);
      this.submitTTSRequest(msg);
      (document.querySelector('#textInput') as HTMLTextAreaElement).value = '';
    } else if (punctuationKeys.includes(event.key)) {
      this.backendService.getEmbeddings(msg);
      // Or you can perform any other action based on the punctuation key press
    } else {
      if (msg == '') this.backendService.getEmbeddings(msg);
      this.searchExisting(msg);
    }
  }
  getMatches(speech: Speech, tokens: string[]) {
    var cleanedSpeech = speech.text
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toLowerCase();
    var speechTokens = cleanedSpeech.split(' ');
    var intersection = speechTokens.filter((token) => {
      return tokens.some((t) => {
        return token.includes(t);
      });
    });
    return intersection.length;
  }
  searchExisting(text: string) {
    return;
    var cleanedText = text.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
    var tokens = cleanedText.split(' ');

    this.searchSpeeches = this.previousSpeeches
      .filter((speech) => {
        return this.getMatches(speech, tokens) > 0;
      })
      .sort((a, b) => {
        if (
          this.getMatches(a, tokens) /
            a.text
              .replace(/[^a-zA-Z0-9\s]/g, '')
              .toLowerCase()
              .split(' ').length >
          this.getMatches(b, tokens) /
            a.text
              .replace(/[^a-zA-Z0-9\s]/g, '')
              .toLowerCase()
              .split(' ').length
        )
          return -1;
        if (
          this.getMatches(a, tokens) /
            a.text
              .replace(/[^a-zA-Z0-9\s]/g, '')
              .toLowerCase()
              .split(' ').length <
          this.getMatches(b, tokens) /
            a.text
              .replace(/[^a-zA-Z0-9\s]/g, '')
              .toLowerCase()
              .split(' ').length
        )
          return 1;
        return 0;
      });
  }
  submitTTSRequest(text: string) {
    if (this.gpt4) {
      this.speechService.startTextToSpeech(text,'gpt-4');
    } else {
      this.speechService.startTextToSpeech(text, 'gpt-3.5-turbo-16k');
    }
  }
  deleteTTS(id: string, language: string) {
    this.speechService.deleteTTS(id, language);
  }
}
