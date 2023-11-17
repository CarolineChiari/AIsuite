import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Settings } from '../models/settings';
import { Context } from 'microsoft-cognitiveservices-speech-sdk/distrib/lib/src/common.speech/RecognizerConfig';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }
  settingsSubject = new Subject<Settings>();
  settings: Settings = {
    theme: 'dark',
    chat: {
      default_prompt: 'You are a helpful assistant.',
    },
  }
  getSettingsObservable(){
    return this.settingsSubject.asObservable();
  }
  getSettings(){
    console.log('getSettings')
    const url = `${environment.backend}/api/profile?type=settings`;
    this.http.get<Settings>(url).subscribe(res => {
      console.log(res)
      this.settingsSubject.next(res);
    });
  }
  saveSettings(settings: Settings){
    const url = `${environment.backend}/api/profile?type=settings`;
    this.http.post(url, settings).subscribe(res => {
      this.settingsSubject.next(settings);
    });
  }
}
