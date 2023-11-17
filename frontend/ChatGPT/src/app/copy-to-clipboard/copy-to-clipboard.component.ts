import { Component, ElementRef } from '@angular/core';

@Component({
  selector: '[copy-to-clipboard]',
  templateUrl: './copy-to-clipboard.component.html',
  styleUrls: ['./copy-to-clipboard.component.css']
})
export class CopyToClipboardComponent {
  constructor(
   private el: ElementRef
  ){};
  copied = false;
  copyToClipboard(){
      // console.log('copy to clipboard');
    const copyElement = this.el.nativeElement.parentNode.querySelectorAll('code')[0].innerText;
    // set the clipboard with copyElement
    navigator.clipboard.writeText(copyElement).then(
      () => {
        console.log('Text copied to clipboard');
      },
      err => {
        console.error('Error copying text to clipboard', err);
      }
    );
  }
}
