import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

import * as speechSDK from 'microsoft-cognitiveservices-speech-sdk';
import {
  SpeechRecognizer,
  KeywordRecognitionModel,
} from 'microsoft-cognitiveservices-speech-sdk';
import { SettingsService } from './settings/settings.service';
import { SpeechToTextStatus } from '../models/ttsStatus.enum';

@Injectable({
  providedIn: 'root',
})
export class SpeechToTextService {
  constructor(
    private http: HttpClient,
    private settingsService: SettingsService
  ) {}
  active = false;
  speechToTextStatusObservable = new Subject<SpeechToTextStatus>();
  transcriptObservable = new Subject<string>();
  timeout = 5000;
  noRecognition = 0;
  recognitionIntervalId: any;
  speechRecognizer: SpeechRecognizer | null = null;
  transcription: string[] = [];
  recognizing = false;
  listening = false;
  currentRecognition = '';
  transcriptionService: { token: string; region: string } = {
    token: '',
    region: '',
  };
  recognitionStart: Date | null = null;
  currentUsageId = '';

  /**
   * Returns an observable that emits the current status of the speech-to-text service.
   * The observable will emit a new value whenever the status changes.
   * @returns An observable that emits SpeechToTextStatus values.
   */
  getSpeechToTextStatusObservable(): Observable<SpeechToTextStatus> {
    return this.speechToTextStatusObservable.asObservable();
  }
  /**
   * Returns an observable that emits the transcript of the speech-to-text service.
   * @returns An observable that emits the transcript of the speech-to-text service.
   */
  getTranscriptObservable(): Observable<string> {
    return this.transcriptObservable.asObservable();
  }
  // () {}
  startSpeechToText() {
    // get the api key
    this.speechToTextStatusObservable.next(SpeechToTextStatus.GettingToken);
    this.http
      .get<{ token: string; region: string; usageId: string }>(
        `${environment.backend}/api/speech`
      )
      .subscribe((res) => {
        console.log(res);
        this.currentUsageId = res.usageId;
        this.speechToTextStatusObservable.next(
          SpeechToTextStatus.TokenReceived
        );
        this.transcriptionService = res;
        // start the recording
        this.runTranscription();
      });
  }

  stopTranscription() {
    if (!this.speechRecognizer) return;
    this.speechRecognizer.stopContinuousRecognitionAsync();
    this.speechRecognizer.close();

    clearInterval(this.recognitionIntervalId);
    this.recognizing = false;
  }

  runTranscription() {
    this.noRecognition = 0;
    if (this.recognitionIntervalId) clearInterval(this.recognitionIntervalId);
    if (!this.transcriptionService.token || !this.transcriptionService.region) {
      this.speechToTextStatusObservable.next(SpeechToTextStatus.Error);
      return;
    }
    const speechConfig = speechSDK.SpeechConfig.fromAuthorizationToken(
      this.transcriptionService.token,
      this.transcriptionService.region
    );
    speechConfig.speechRecognitionLanguage = 'en-US';
    const audioConfig = speechSDK.AudioConfig.fromMicrophoneInput(
      this.settingsService.getDefaultMic()
    ); //.fromDefaultMicrophoneInput()
    // console.log(this.settingsService.getDefaultMic());
    // let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync("YourAudioFile.wav"));
    this.speechRecognizer = new speechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig
    );
    this.transcription = [];

    this.subscribeToRecognizerEvents();

    this.recognitionIntervalId = setInterval(() => {
      this.noRecognition += 100;
      if (this.noRecognition >= 2000) {
        this.speechToTextStatusObservable.next(
          SpeechToTextStatus.NoSpeechDetected
        );
      }
      if (this.noRecognition >= this.timeout) {
        if (this.speechRecognizer) {
          this.speechRecognizer.stopContinuousRecognitionAsync();
          this.speechRecognizer.close();
        }
        clearInterval(this.recognitionIntervalId);
        this.recognizing = false;
      }
    }, 100);
    // speechRecognizer.close();
    this.speechRecognizer.startContinuousRecognitionAsync();
    this.recognizing = true;
    // () => {
    //   result=
    //     switch (result.reason) {
    //         case speechSDK.ResultReason.RecognizedSpeech:
    //             console.log(`RECOGNIZED: Text=${result.text}`);
    //             break;
    //         case speechSDK.ResultReason.NoMatch:
    //             console.log("NOMATCH: Speech could not be recognized.");
    //             break;
    //         case speechSDK.ResultReason.Canceled:
    //             const cancellation = speechSDK.CancellationDetails.fromResult(result);
    //             console.log(`CANCELED: Reason=${cancellation.reason}`);

    //             if (cancellation.reason == speechSDK.CancellationReason.Error) {
    //                 console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
    //                 console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
    //                 console.log("CANCELED: Did you set the speech resource key and region values?");
    //             }
    //             break;
    //     }
    //     speechRecognizer.close();
    // });
  }
  private updateUsage() {}
  private subscribeToRecognizerEvents() {
    if (!this.speechRecognizer) return;
    this.speechRecognizer.sessionStarted = (sender, event) => {
      this.speechToTextStatusObservable.next(SpeechToTextStatus.Started);
      this.listening = true;
      this.noRecognition = 0;
      this.recognitionStart = new Date();
    };
    this.speechRecognizer.sessionStopped = (sender, event) => {
      this.speechToTextStatusObservable.next(SpeechToTextStatus.Stopped);
      this.listening = false;
      this.transcriptObservable.next(this.transcription.join(' '));
      if (this.recognitionStart) {
        const usageInMinutes =
          (new Date().getTime() - this.recognitionStart.getTime()) / 1000 / 60;
        const body = {
          id: this.currentUsageId,
          usage: usageInMinutes,
        };
        console.log(body);
        this.http
          .post(`${environment.backend}/api/speech`, body)
          .subscribe((res) => {
            console.log(res);
          });
      }
    };

    this.speechRecognizer.recognized = (sender, event) => {
      this.speechToTextStatusObservable.next(SpeechToTextStatus.Recognized);
      if (event.result.reason == speechSDK.ResultReason.RecognizedSpeech) {
        this.transcription.push(event.result.text);
        this.transcriptObservable.next(this.transcription.join(' '));
        this.currentRecognition = '';
        // console.log(this.transcription)
      }
    };
    this.speechRecognizer.recognizing = (sender, event) => {
      this.speechToTextStatusObservable.next(SpeechToTextStatus.Recognizing);
      if (event.result.reason == speechSDK.ResultReason.RecognizingSpeech) {
        this.currentRecognition = event.result.text;
        console.log(this.currentRecognition);
        this.transcriptObservable.next(
          this.transcription.join(' ') + this.currentRecognition
        );
        this.noRecognition = 0;
      }
    };
    this.speechRecognizer.canceled = (sender, event) => {
      this.speechToTextStatusObservable.next(SpeechToTextStatus.Canceled);
      console.log(event);
      if (event.reason == speechSDK.CancellationReason.Error) {
        console.log(event.errorDetails);
      }
    };
  }
  getNoSpeak() {
    if (this.noRecognition < 2000) return '';
    return Math.floor((this.timeout - this.noRecognition) / 1000);
  }


}
