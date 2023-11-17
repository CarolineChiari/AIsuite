import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  ngOnInit(): void {
    // Add initialization logic here
    console.log("UserComponent.ngOnInit()");
  }

}
