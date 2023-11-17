import { Injectable } from '@angular/core';
import { timeStamp } from 'console';
import { Subject } from 'rxjs';
import { Microphone } from '../../models/microphone.interface';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor() {
    let mic = localStorage.getItem('defaultMic');
    if (mic) {
      this.defaultMic = mic;
    }
    let autoPlay = localStorage.getItem('autoPlayAudio');
    if (autoPlay) {
      this.autoPlayAudio = autoPlay === 'true';
    }
  }
  microphonesSubject = new Subject<Microphone[]>();
  defaultMic = 'default';

  autoPlayAudioSubject = new Subject<boolean>();
  autoPlayAudio = false;

  microphones: Microphone[] = [];
  getMicrophonesObservable() {
    return this.microphonesSubject.asObservable();
  }
  getMicrophones() {
    if (
      !navigator ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.enumerateDevices
    ) {
      console.log(
        `Unable to query for audio input devices. Default will be used.\r\n`
      );
      return;
    }
    this.microphones = [];
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      console.log(devices);
      devices.forEach((device) => {
        if (device.kind == 'audioinput')
          this.microphones.push({
            deviceId: device.deviceId,
            deviceName: device.label,
            default: device.deviceId == this.defaultMic ? true : false,
          });
      });
      this.microphonesSubject.next(this.microphones);
    });
    return;
  }
  setDefaultMic(deviceId: string) {
    let found = false;
    this.microphones.forEach((mic) => {
      if (mic.deviceId === deviceId) {
        mic.default = true;
        this.defaultMic = deviceId;
        localStorage.setItem('defaultMic', this.defaultMic);
        found = true;
      } else {
        mic.default = false;
      }
    });
    if (!found && deviceId !== 'default') {
      this.setDefaultMic('default');
    }
    this.microphonesSubject.next(this.microphones);
  }
  getDefaultMic() {
    return this.defaultMic;
  }
  getAutoPlayAudioObservable() {
    return this.autoPlayAudioSubject.asObservable();
  }
  setAutoPlayAudio(play: boolean) {
    this.autoPlayAudio = play;
    localStorage.setItem("autoPlayAudio",`${this.autoPlayAudio}`);
    this.autoPlayAudioSubject.next(this.autoPlayAudio);
  }
  getAutoPlayAudio(){
    return this.autoPlayAudio
  }
}
